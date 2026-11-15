
# Supabase setup for BCA Year 2 attendance

The demo seed creates 55 synthetic students. Replace them with an approved
roster before using this setup for live attendance. The app supports shared Staff
attendance and Principal class review. Staff class access is granted
automatically by the dedicated migration below, without a class picker.

1. If this project has not been initialized, review and run the supplied
   `schema.sql` once as `postgres`. Do not rerun this initial schema on an
   existing project.
2. Replace the placeholder email in `bootstrap_principal.sql` with the approved
   Principal Auth email. If the project has no approved Principal, run
   [`bootstrap_principal.sql`](./bootstrap_principal.sql) as `postgres`. It
   targets the Principal account supplied for this setup and stops if another
   approved Principal already exists.
3. Run [`management_update.sql`](./management_update.sql) as `postgres`. It
   adds the account-list and account-approval RPCs used by the app.
4. Review the date assumptions at the top of
   [`seed_bca_second_year.sql`](./seed_bca_second_year.sql), then run it as
   `postgres`. It inserts/updates only the BCA Year 2 Section A roster and
   enrollments; it does not delete unrelated students or enrollments.
5. The connected project has this migration applied and verified. For another
   project, review and approve the scope before running
   [`staff_bca_default_access_update.sql`](./staff_bca_default_access_update.sql)
   as `postgres`. It grants existing approved Staff and future Staff approvals
   access to B.C.A · Year 2 · A without changing HOD assignments or RLS policies.
6. Sign in as Principal and approve a Staff account without choosing a class.
   The existing class access is granted automatically.
7. Sign in to that Staff account and open **B.C.A → Year 2 → Section A**.
   Staff uses the original hour/student marking screen; marks are saved to the
   shared cloud session. Principal can review the same date/hour and see the
   submitted Staff identity and attendance details.

The Principal dashboard also offers **Reject account** for pending Staff or HOD
accounts. It marks the account rejected and deactivates its access. The connected
project has the
[`reject_pending_account_update.sql`](./reject_pending_account_update.sql)
migration applied and verified; review and approve it before applying to another
live database.

The seed does not alter another academic year's `is_current` flag. The app
offers Principal assignments for classes whose academic dates include the
selected attendance date.
