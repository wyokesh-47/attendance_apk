# Attendance

One Expo / React Native / TypeScript app for Staff, HOD and Principal.

## Start on Android

Use Node.js 24.3 or newer. In this directory:

```powershell
npm ci
npm run start:lan
```

Keep the phone and PC on the same Wi-Fi. Scan the terminal QR code with Expo Go.
Restart with `npm run start:lan -- --clear` after changing environment settings.

## Environment

The ignored local `.env` needs `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for the selected project. Never put a
personal access token, database password or service-role key in a public variable.

## Database setup

See [supabase/README.md](supabase/README.md). Fresh projects run `schema.sql`.
Projects with the earlier schema run `management_update.sql` once. Do not rerun
an initial schema on an existing database. Set up actual academic years, classes,
students and enrollments separately. Phone-only prototype records are not uploaded
or treated as college records automatically.

## App flow

- Shared Supabase login loads the protected database role; no role selector at login.
- The original blue banner and department card grid are shared across dashboards.
  Every approved user can browse department names. Principal sees all class data;
  HOD sees data for assigned departments. Staff teaching assignments can span
  departments: an AIML staff member can be assigned BCA programming classes.
- Tap a department card, choose its year/class, then open its student members.
  Shared classes open cloud attendance. Unlinked classes retain the old read-only
  roster preview, including the 55 provided BCA Second Year members. Generated
  rosters in other old classes are clearly labelled as samples. Staff can use the
  restored device-only marking, review and receipt flow from these saved rosters;
  these local submissions are not shared with management. Select a date/hour in a shared class. Counts show Students,
  Present, Absent, OD, Informed Leave and Unmarked for that exact session.
- Staff start today's attendance, mark individual students or All Present, and submit.
  Submission is blocked until everyone is marked. Drafts are saved on the server.
- Submitted records are locked for Staff. Principal/scoped HOD can correct them with
  a reason; database version checks prevent silently overwriting another edit.
- Staff may request corrections after submission. Management can correct submitted
  records directly; a dedicated request-review inbox is not yet provided in the UI.
- Permanent correction history appears in the class view. Dashboards and class views
  refresh on focus and periodically while visible; there is no offline write queue.
- Principal sees account emails/roles, chooses Staff or HOD during approval, and
  assigns an initial class/department in the same transaction. Additional assignments
  can be added for approved Staff/HOD accounts.

## Checks

```powershell
npm run typecheck
npm test
```

SQL must also be executed and verified in the target Supabase project, including
RLS and concurrent-write tests described in `supabase/README.md`.

## Source map

- `app/`: login, registration, profile, role dashboards and shared class attendance.
- `components/AttendanceDashboard.tsx`: department/class drill-down and account roles.
- `components/ApprovalSheet.tsx`: Staff/HOD approval and access assignment.
- `services/managementRepository.ts`: cloud reads, counts and attendance mutations.
- `services/cloud.ts`: authenticated Supabase HTTP transport and session persistence.
- `providers/`: authentication state; `supabase/`: SQL setup and updates.
- Local marking routes are available to approved Staff via the saved roster screen
  and clearly labelled device-only. Shared classes use the cloud marking/review flow.
