# People — Overview (`/people`)

The People module landing page. Federated remote (`people/PeopleModule`, loaded by
the shell at `/people/$`). Requires served remotes (see the academics specs
header). Gated on an active school — the `edforge-app` cookie seeded by
`seedRoleSession` carries `activeSchoolId`, so PeopleLayout's school gate passes.

## Load
- `GET /api/staff?limit=20&schoolId=<school>` → `{ items: StaffResponseDto[], hasMore, total }`.
  Single load call; KPI tiles + roster are computed from the loaded page (≤20).

## Cases
1. **Mounts inside the authenticated shell** (@smoke). Navigate to `/people`; the
   shell sidebar switches to the People sub-nav (Overview / Staff Directory) —
   its presence confirms the remote mounted (not the Suspense fallback, not
   `RemoteModuleError`). No console errors. Seeded staff (Anita Gurung) renders
   in the roster.
2. **Empty roster renders cleanly.** With an empty staff list the page still
   mounts (KPI tiles show zeros, roster empty state) and no seeded name appears.

## Stable chrome
- Sidebar nav: `link` "Staff Directory".
- KPI tiles: "Total Staff", "Active Teachers", "Support Staff", "System Access".
- Roster section: "Staff Roster"; header button "Add Staff Member".
- Names render as `firstName` + `lastSurname` (e.g. "Anita Gurung").
