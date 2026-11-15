-- Idempotently load 55 synthetic BCA Second Year demo students into shared attendance.
-- Run after schema.sql and management_update.sql, as postgres in Supabase SQL Editor.
-- The supplied "2025-2028" period is mapped to 2025-06-01 through 2028-05-31.
-- Review those dates before running if the college uses different academic dates.
-- Existing students are updated by register number; unrelated enrollments are never deleted.
begin;

create temporary table bca_second_year_roster_import (
  register_number text primary key,
  name text not null
) on commit drop;

insert into bca_second_year_roster_import (register_number, name)
select
  'DEMO-BCA2-' || lpad(student_number::text, 3, '0'),
  'Demo Student ' || lpad(student_number::text, 3, '0')
from generate_series(1, 55) as students(student_number);

do $$
declare
  v_starts_on date := date '2025-06-01';
  v_ends_on date := date '2028-05-31';
  v_department_id uuid;
  v_academic_year_id uuid;
  v_class_id uuid;
begin
  if current_date not between v_starts_on and v_ends_on then
    raise exception 'The configured academic dates do not include today; review the date range first';
  end if;
  if (select count(*) from bca_second_year_roster_import) <> 55 then
    raise exception 'Expected exactly 55 unique roster rows';
  end if;

  insert into public.departments (code, name)
  values ('BCA', 'B.C.A')
  on conflict (code) do update set name = excluded.name
  returning id into v_department_id;

  insert into public.academic_years (name, starts_on, ends_on, is_current)
  values ('2025-2028', v_starts_on, v_ends_on, false)
  on conflict (name) do nothing;
  select id into v_academic_year_id
  from public.academic_years
  where name = '2025-2028' and starts_on = v_starts_on and ends_on = v_ends_on;
  if v_academic_year_id is null then
    raise exception 'Academic year 2025-2028 already exists with different dates';
  end if;

  insert into public.classes (department_id, academic_year_id, study_year, section)
  values (v_department_id, v_academic_year_id, 2, 'A')
  on conflict (department_id, academic_year_id, study_year, section) do nothing;
  select id into v_class_id
  from public.classes
  where department_id = v_department_id
    and academic_year_id = v_academic_year_id
    and study_year = 2
    and section = 'A';

  insert into public.students (register_number, name, is_active)
  select register_number, name, true
  from bca_second_year_roster_import
  on conflict (register_number) do update
    set name = excluded.name, is_active = true;

  insert into public.enrollments (student_id, class_id, joined_on)
  select s.id, v_class_id, v_starts_on
  from public.students s
  join bca_second_year_roster_import r using (register_number)
  on conflict (student_id, class_id) do update
    set left_on = null;

  if (
    select count(*)
    from public.enrollments e
    join public.students s on s.id = e.student_id
    join bca_second_year_roster_import r using (register_number)
    where e.class_id = v_class_id and e.left_on is null
  ) <> 55 then
    raise exception 'Could not verify all 55 active enrollments';
  end if;
end;
$$;

commit;
