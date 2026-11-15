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

See [supabase/README.md](supabase/README.md) for the setup sequence. Fresh
projects run `schema.sql` once; only bootstrap a Principal if one is not already
approved. Then apply `management_update.sql` and the BCA Year 2 roster seed.
The connected project has `staff_bca_default_access_update.sql` applied and
verified; review and approve it before applying to another project. Never rerun
the initial schema on an existing database. Other phone-only
prototype records are not uploaded or treated as college records automatically.

## App flow

- Shared Supabase login loads the protected database role; no role selector at login.
- The original blue banner and department card grid are shared across dashboards.
  Every approved user can browse department names. Principal sees all class data;
  HOD sees data for assigned departments. Staff teaching assignments can span
  departments: an AIML staff member can be assigned BCA programming classes.
- Tap a department card, choose its year/class, then open its student members.
  Shared classes open cloud attendance. Once the approved Staff access migration
  is applied, BCA Second Year · Section A opens the original hour/student marking
  screen backed by cloud attendance; it cannot use device-only attendance.
  Unlinked classes elsewhere retain the saved roster preview; generated rosters
  are clearly labelled as samples. Staff can use the device-only marking, review
  and receipt flow for those other prototype rosters; these local submissions are
  not shared with management. Select a date/hour in a shared class. Counts show Students,
  Present, Absent, OD, Informed Leave and Unmarked for that exact session.
- Principal's dashboard shows the live date, active student headcount, and today's
  Present, Absent, OD and Informed Leave totals in a daily overview. Department
  cards show the same status totals across submitted class-hours; headcount is
  counted once from active enrollments. Use the date/hour controls inside a class
  to review a particular attendance session.
- Staff start today's attendance, mark individual students or All Present, and submit.
  Submission is blocked until everyone is marked. Drafts are saved on the server.
- Submitted records are locked for Staff. Principal/scoped HOD can correct them with
  a reason; database version checks prevent silently overwriting another edit.
- Principal's class/hour view shows the submitting Staff member's name, email,
  database submission time, and serial-numbered roster when those details exist.
- Staff may request corrections after submission. Management can correct submitted
  records directly; a dedicated request-review inbox is not yet provided in the UI.
- Permanent correction history appears in the class view. Dashboards and class views
  refresh on focus; Principal dashboards and class views refresh every 10 seconds
  while visible. Other dashboards/classes refresh every 30/20 seconds. There is no
  offline write queue.
- Principal sees account emails/roles and chooses Staff or HOD during approval.
  Staff approval automatically grants the existing BCA Second Year · Section A
  class after the approved migration; HOD approval still requires a department.
  Principal can reject a pending Staff/HOD account; this requires the separately
  reviewed `reject_pending_account_update.sql` migration, which is applied to the
  connected project.

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
