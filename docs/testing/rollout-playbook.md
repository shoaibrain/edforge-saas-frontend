# Agent E2E rollout playbook — module by module

The ordered plan for extending agent-driven E2E coverage from the Shell
(done) across the platform. Each module section is a self-contained work
order for a future agent session: run the planner against the routes, review
the plan, generate specs, heal, tag smoke tests, open a PR.

Per-module checklist (repeat for each):

1. `pnpm e2e:auth-states && pnpm e2e:mock-api & pnpm dev:mvp` — explore the
   module's routes with the planner agent, per relevant role.
2. Review/commit plans to `specs/<module>/*.md` (one per operator surface).
3. Build the module's mock layer (`e2e/fixtures/<module>-api.ts`) on top of
   `mockShellApi`, following the `attendance.ts` capture pattern.
4. Generate specs into `e2e/tests/<module>/` with the generator agent;
   `test.use({ strictApi: true })` once the mock layer is complete.
5. Heal until green twice; tag ≤5 critical paths `@smoke`.
6. Un-`fixme()` any issue-#237 bulk-op placeholders the new fixtures unblock.

## 1. Shell — DONE (this PR)

Plans: `specs/shell/` (landing, auth-session, home-dashboard, settings,
rbac-sidebar). Tests: `e2e/tests/shell/` incl. the computed 10-role RBAC
sidebar matrix. Foundation: role fixtures, network mock layer, MCP config,
agent definitions, CI smoke + nightly.

## 2. Academics — IN PROGRESS (first module remote)

Plans: `specs/academics/` (overview, students, classrooms, curriculum, exams).
Tests: `e2e/tests/academics/` (matching specs; `@smoke` on overview + students
+ classrooms). Mock layer: `e2e/fixtures/academics.ts` (`mockAcademicsApi`,
reuses the E2E tenant/AY constants; layered on `mockShellApi`).

**Key difference from Shell — academics is a federated REMOTE** (`/academics/$*`
lazy-loads `academics/AcademicsModule`). A shell-only preview can't load it, so
these specs need served remotes:
- **Local:** `PLAYWRIGHT_START_SERVER=1 pnpm test:e2e:full e2e/tests/academics`
  (runs `dev:mvp` — shell :3000 + academics :3002 + …; dev mode needs no Cognito
  env). This is the mechanism `attendance.spec.ts` already uses successfully —
  proof the remote renders under the seeded-cookie + mock approach.
- **CI:** `scripts/build-deploy.sh` (consolidated `output/` = shell + `/remotes/*`)
  served by `scripts/e2e/serve-output.mjs` (SPA fallback + static remotes). The
  e2e-smoke + nightly jobs were switched to this so remote routes load.
- The academics remote reads the active school from the `edforge-app` cookie
  (seeded by `seedRoleSession`) — no extra wiring needed.

Current specs assert the remote **mounts and renders cleanly** (sidebar present,
no `RemoteModuleError`, no console errors) + a light chrome check per page
(seeded roster/course visible, classrooms 4-tab ARIA tablist).

**Bulk-action coverage (#237) — DONE.** `e2e/tests/students-bulk-archive.spec.ts`
+ `e2e/tests/sections-bulk-status.spec.ts` are now real tests (no longer
`test.fixme`/`BULK_E2E`-gated): they drive the real modals and assert the exact
fan-out via `captureBulkWrites` (`e2e/fixtures/academics.ts`) — one
`DELETE /academics/students/:id` per archived student, one
`PATCH /academics/sections/:id {isActive}` per eligible section — plus
happy-path, partial-failure (409), skipped-already-active, and the
deactivate enrollment-warning paths. They run in the `full`/nightly suite (not
`@smoke`). Remaining follow-up: deeper Teacher/Staff/Counselor role coverage.

- Routes (`apps/academics/src/router.tsx`): `/academics`, `/students`
  (+ `/students/enrollment`, `/students/$studentId`), `/classrooms` (+ create/
  detail/edit/report-card), `/teachers`, `/curriculum`, `/exams`.
- Roles to cover next: Teacher (grade/attendance entry), Staff (read-only),
  Counselor/Nurse (student view).
- Watch for: classrooms tab consolidation (`?tab=overview|gradebook|policies|
  attendance`), academic-year gating (`/academic-years/current` drives module
  availability), BS calendar dates in forms (`BsDatePicker`), and that almost
  all labels are `academics`-namespace i18n keys (assert by role/aria-label).

## 3. People — IN PROGRESS (third module remote)

Plans: `specs/people/` (overview, staff-directory, staff-wizard). Tests:
`e2e/tests/people/` (`@smoke` on overview + staff-directory + staff-wizard
mount). Mock layer: `e2e/fixtures/people.ts` (`mockPeopleApi`, `staff()` factory,
`PEOPLE_STAFF` roster, `captureStaffWrites`; layered on `mockShellApi`).

**Key gating fact — People hard-gates on an active school** (not on an API call):
`PeopleLayout` reads `activeSchoolId` from the `edforge-app` cookie (seeded by
`seedRoleSession`) + the shared school-context-channel; with no active school it
renders a "No schools configured" card instead of the page. The seeded cookie
carries `school-e2e`, so the gate passes. Unlike academics there is **no**
`academic-year/current` or `/users/me` gate on these pages. Single load call for
both overview + directory: `GET /api/staff?limit=20&schoolId=…`.

Current specs assert the remote **mounts and renders cleanly** (sidebar People
sub-nav present, no `RemoteModuleError`, no console errors) + light chrome per
page (seeded roster visible, directory column headers, wizard step-1 + progress
stepper). Field-name traps captured in the fixture: staff name is
`firstName` + `lastSurname` (NOT `lastName`); row id is `staffId` (NOT `id`).

**Follow-up (not in this PR):** full staff-wizard create drive (fill all 5 steps
→ assert the `POST /staff` | `/staff/with-user` body + assignment fan-out via
`captureStaffWrites`, already in place). Deferred because each step gates
"Continue" on step-specific required fields. Then the `users-bulk-change-role` /
`users-bulk-suspend` fixme specs (RBAC mutations) once the users mock is fleshed
out.

- Routes (`apps/people/src/router.tsx`): `/people`, `/staff`, `/staff/new`
  (wizard), `/staff/$staffId`, `/departments`, `/roles`, `/settings`,
  `/analytics`.
- Watch for: staff-creation wizard sub-steps (`currentStep` is React state, no
  URL param — trace before editing/asserting); nav labels ("Back"/"Continue")
  are hardcoded English from `@edforge/wizard`, only the submit
  ("Create Staff Member") + step titles are `people`-namespace i18n;
  role-assignment writes (assert via `captureStaffWrites`).

## 4. Finance — richest data, hardest flows

Why fourth: `test-utils/mocks/handlers.ts` + `mocks/data.ts` already model the
whole finance domain (invoices, payments, accounts, fee structures, gateway
configs, NPR ledgers) — port those shapes into the module mock layer. The
flows are the platform's most complex (bulk invoice generation, payment
initiate/verify against eSewa/Khalti seams, receipts) and benefit from the
harness being battle-tested first. Unblocks the remaining 5 bulk-op fixmes.

- Routes (`apps/finance/src/router.tsx`): `/finance`, `/invoices`
  (+ detail/bulk-generate), `/payments` (+ record/receipt), `/accounts`,
  `/fee-structures`, `/payment-gateways`.
- Roles: Accountant (primary persona), Principal (approve), TenantAdmin.
- Watch for: payment-gateway callback (`/payments/callback`) needs the
  `VITE_MOCK_PAYMENTS` seam; never point tests at real gateway sandboxes in CI.

## 5. Portals — student, then parent

Why last: they reuse everything — academics data for grades/attendance/
schedule, finance mocks for parent fee payments — and need the Student/Parent
fixtures enriched (Parent `childrenIds` linkage, per-child data mocks).

- Student routes: `/student-portal/grades|attendance|schedule`.
- Parent routes: `/parent-portal` (+ grades/attendance/schedule/fees).
- Watch for: row-level security (a student sees only their own records —
  negative tests matter more than positives here), parent fee payment writes.

## After the sweep

- Flip `e2e-smoke` to a required PR check (after a week of green).
- Activate the nightly `live-tenant` job (operator provisions the E2E tenant;
  see agent-e2e-guide.md "Mocked vs live mode").
- Consider a healer-agent triage step on nightly failures (issue to file when
  the suite is big enough to flake).
