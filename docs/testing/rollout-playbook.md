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

## 2. Academics — next (highest value, lowest marginal cost)

Why second: the biggest operator surface (students, classrooms, curriculum,
exams, enrollment) AND `e2e/fixtures/attendance.ts` already mocks 13+
academics endpoints — reuse its shapes in the module mock layer. Unblocks the
`sections-bulk-status` / `students-bulk-archive` fixme specs.

- Routes (`apps/academics/src/router.tsx`): `/academics`, `/students`,
  `/students/$studentId`, `/classrooms` (+ create/detail/edit/report-card),
  `/teachers`, `/enrollment`, `/curriculum`, `/exams`.
- Roles to cover: TenantAdmin/Principal (full), Teacher (grade/attendance
  entry), Staff (read-only), Counselor/Nurse (student view).
- Watch for: the classrooms tab consolidation (`?tab=attendance|grades`),
  academic-year gating (`/academic-years/current` drives module availability),
  BS calendar dates in forms (`BsDatePicker`).

## 3. People — fastest full-module win

Why third: smallest surface (overview + staff directory + wizard), exercises
the Teacher/Staff fixtures created in phase 2, and unblocks the
`users-bulk-change-role` / `users-bulk-suspend` fixme specs (RBAC mutations —
high-value coverage for the security-policies surface).

- Routes (`apps/people/src/router.tsx`): `/people`, `/staff`, `/staff/new`
  (wizard), `/staff/$staffId`, `/departments`, `/roles`, `/settings`,
  `/analytics`.
- Watch for: staff-creation wizard sub-steps (trace `activeStep` before
  editing/asserting), role-assignment writes (assert via `captured.writes`).

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
