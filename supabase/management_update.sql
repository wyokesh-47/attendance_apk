-- Add account-management RPCs expected by the app.
-- Run after schema.sql. This does not change existing accounts or assignments.
begin;

create or replace function attendance_private.list_managed_accounts()
returns table(
  id uuid,
  name text,
  email text,
  role public.attendance_role,
  approval_status public.account_approval,
  class_assignments jsonb,
  department_assignments jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or attendance_private.current_role() is distinct from 'principal' then
    raise exception 'Principal access required';
  end if;

  return query
  select p.id, p.name, u.email::text, p.role, p.approval_status,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'class_id', c.id,
        'department_id', d.id,
        'department_code', d.code,
        'department_name', d.name,
        'study_year', c.study_year,
        'section', c.section,
        'is_active', sa.is_active
      ) order by d.code, c.study_year, c.section, c.id)
      from public.staff_assignments sa
      join public.classes c on c.id = sa.class_id
      join public.departments d on d.id = c.department_id
      where sa.staff_id = p.id
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'department_id', d.id,
        'department_code', d.code,
        'department_name', d.name,
        'is_active', ha.is_active
      ) order by d.code, d.id)
      from public.hod_assignments ha
      join public.departments d on d.id = ha.department_id
      where ha.profile_id = p.id
    ), '[]'::jsonb)
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.id <> auth.uid()
  order by p.approval_status, p.name, u.email;
end;
$$;

create or replace function public.list_managed_accounts()
returns table(
  id uuid,
  name text,
  email text,
  role public.attendance_role,
  approval_status public.account_approval,
  class_assignments jsonb,
  department_assignments jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from attendance_private.list_managed_accounts()
$$;

create or replace function attendance_private.approve_account_with_access(
  p_user uuid,
  p_role public.attendance_role,
  p_class uuid,
  p_department uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_account public.profiles;
begin
  if auth.uid() is null or attendance_private.current_role() is distinct from 'principal' then
    raise exception 'Principal access required';
  end if;
  if p_user is null or p_user = auth.uid() then raise exception 'Cannot approve this account'; end if;
  if p_role is null or p_role not in ('staff', 'hod') then raise exception 'Choose Staff or HOD'; end if;
  if p_role = 'staff' and (p_class is null or p_department is not null) then
    raise exception 'Assign one class to Staff';
  end if;
  if p_role = 'hod' and (p_department is null or p_class is not null) then
    raise exception 'Assign one department to HOD';
  end if;

  select * into v_account from public.profiles where id = p_user for update;
  if not found or v_account.approval_status <> 'pending' then
    raise exception 'Pending account not found';
  end if;

  perform attendance_private.manage_account(p_user, p_role, 'approved');
  perform attendance_private.assign_access(p_user, p_class, p_department, true);
end;
$$;

create or replace function public.approve_account_with_access(
  p_user uuid,
  p_role public.attendance_role,
  p_class uuid,
  p_department uuid
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select attendance_private.approve_account_with_access(p_user, p_role, p_class, p_department)
$$;

revoke all on function attendance_private.list_managed_accounts() from public, anon, authenticated;
revoke all on function public.list_managed_accounts() from public, anon, authenticated;
revoke all on function attendance_private.approve_account_with_access(uuid, public.attendance_role, uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.approve_account_with_access(uuid, public.attendance_role, uuid, uuid)
  from public, anon, authenticated;
grant execute on function attendance_private.list_managed_accounts() to authenticated;
grant execute on function public.list_managed_accounts() to authenticated;
grant execute on function attendance_private.approve_account_with_access(uuid, public.attendance_role, uuid, uuid)
  to authenticated;
grant execute on function public.approve_account_with_access(uuid, public.attendance_role, uuid, uuid)
  to authenticated;

notify pgrst, 'reload schema';
commit;
