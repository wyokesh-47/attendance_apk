-- Run only after schema.sql, as postgres, if no approved Principal exists.
-- This does not create an Auth user or change an existing Principal.
begin;

do $$
declare
  v_email text := 'principal@example.invalid';
  v_user uuid;
begin
  perform pg_advisory_xact_lock(hashtext('attendance_bootstrap_principal'));
  if exists (
    select 1 from public.profiles
    where role = 'principal' and approval_status = 'approved'
  ) then
    raise exception 'An approved Principal already exists; no account was changed';
  end if;

  select id into v_user
  from auth.users
  where lower(email) = lower(btrim(v_email))
    and email_confirmed_at is not null;
  if v_user is null then raise exception 'Confirm this Auth user before bootstrapping Principal'; end if;

  update public.profiles
  set role = 'principal', approval_status = 'approved',
      approved_by = v_user, approved_at = now()
  where id = v_user;
  if not found then raise exception 'Attendance profile missing; apply schema.sql first'; end if;
end;
$$;

commit;
