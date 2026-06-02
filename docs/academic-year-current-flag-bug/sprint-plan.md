# Sprint Plan — Academic Year `isCurrent` Flag Drift Fix

**Status:** Proposed
**Repos affected:** `edforge` (backend NestJS + CDK), `edforge-saas-frontend` (shell + academics MFE)
**Frontend branch:** `fix/academic-year-current-flag-bug` (cut from `main`)
**Linked incident:** Espresso English Academy (school `4209e3d8-d2e2-4e0e-9961-790341c264f4`, tenant DPPSW) — 3 broken pages traced to one missing `isCurrent` flag, one unrelated field rename.

---

## 1. Context

Three concurrent production bugs on `https://edforge.app/academics/classrooms`:

| # | Symptom | Root cause |
|---|---|---|
| A | `GET /api/schools/{id}/academic-years/current` returns 404 `NO_CURRENT_AY` despite an "Active" AY visible in school settings | Backend: `updateAcademicYearStatus` never sets `isCurrent=true`. School activation gate only checks `status='active'`, not `isCurrent=true`. No UI to call `PUT /set-current`. |
| B | Attendance tab renders skeleton forever | Frontend: `AttendanceDashboard` computes `isLoading = queryLoading \|\| !queryEnabled`. With `academicYearId=""` (bug A's downstream), `queryEnabled=false` permanently → `isLoading=true` permanently. No entry-level gate. |
| C | Grading Policies tab crashes with `TypeError: Cannot read properties of undefined (reading 'map')` | Frontend-backend contract drift. Sprint D.1.1 (2026-05-22) renamed `gradingScale` → `letterGrades` in shared-types + backend mapper. `PolicyCard` still reads `policy.gradingScale.map(...)`. Independent of A/B but in the same fix-set. |

Also revealed:

- **D.** `apps/shell/src/services/tenant.service.ts:394-413` `mapApiAcademicYear` discards `apiYear.isCurrent` entirely (comment claims it maps to `isLocked`, doesn't).
- **E.** `apps/shell/src/pages/settings/school-academic-years.tsx:728` derives the "Current Academic Year" panel from `status === 'active'`, mislabeling AYs that aren't actually current.

## 2. Invariants the fix enforces

1. **Single-current.** For every school, at most one AY has `isCurrent=true` (already true via `clearCurrentYear`).
2. **Active implies current.** No school in `status='active'` can have zero `isCurrent=true` AYs. Enforced by both auto-promote-on-activate and a new activation-gate requirement.
3. **UI truthfulness.** The "Current" pill in school settings binds to `isCurrent`, never `status`. Drifted AYs (`status='active' && !isCurrent`) show a remediation pill.
4. **Schema-drift visibility.** Field renames in `@aibrains/shared-types` consumed by a frontend MFE fail a contract test before deploy.

## 3. Sprint sequencing — heal BEFORE gate

```
┌──────────────────────────────────────────────────────────────────────┐
│  SPRINT 1: FE hotfixes ─────────► stops visible bleeding (FE-only)  │
│  SPRINT 2: FE Set-as-Current ───► operator self-recovery (FE-only)  │
│  ────────────────────── DEPLOY GATE: 24-48h soak ──────────────────  │
│  SPRINT 3: BE data-heal ────────► historical drift wiped (one-shot) │
│  SPRINT 4: BE auto-promote + gate ► prevents new drift              │
│  SPRINT 5: Hardening (internal) ─► alarms + contracts + docs        │
└──────────────────────────────────────────────────────────────────────┘
```

**Why heal before gate:** Sprint 4's new `current_academic_year` activation requirement will block any school that's still in the drifted state from re-activation. Running the heal script first ensures no operator gets blocked by the new gate. (This is one of two structural changes from the v1 draft; see review notes.)

Sprints 1–2 land in the frontend repo. Sprints 3–5 land in the backend repo (plus contract test in `packages/shared-types` and one CLAUDE.md edit).

---

## SPRINT 1 — Frontend hotfixes (gates + Grading Policy field rename)

**Goal:** Tabs that depend on `currentYear` render a consistent empty state instead of crashing or skeleton-forever. Grading Policies tab renders correctly.
**Repo:** `edforge-saas-frontend` (branch `fix/academic-year-current-flag-bug`)
**Demoable artifact:** On Espresso English Academy → Classrooms, all four tabs (Overview/Gradebook/Grading Policies/Attendance) render without crash or infinite skeleton. Grading Policies — when an AY *is* current — shows the full policy cards with letter-grades and weights. PR can ship in a single review cycle.

### Ticket 1.1 — Create shared `NoCurrentAcademicYearEmptyState` component

**Files:** `apps/academics/src/components/common/NoCurrentAcademicYearEmptyState.tsx` (new)

**Spec:**
- Props: `{ message?: string; actionHref?: string; actionLabel?: string }`
- Defaults: message `"No Academic Year Configured"`, secondary `"Set up an academic year in school settings before recording grades."`, no action by default.
- Reuse the existing visual treatment from `routes/classrooms/index.tsx:358-366` so this is purely a DRY consolidation (caramel border, `GraduationCap` icon, centered layout).

**Validation:**
- RTL: renders default copy.
- RTL: renders custom message + action link when props supplied.
- No backend dep.

### Ticket 1.2 — Apply gate to `GradingPolicyList`

**File:** `apps/academics/src/components/grades/GradingPolicyList.tsx`

**Spec:**
- After `useActiveSchoolId()`, call `useCurrentAcademicYear(schoolId)`.
- Return loading skeleton when `yearLoading`.
- Return `<NoCurrentAcademicYearEmptyState/>` when `!currentYear?.yearId`.
- Do not touch `PolicyCard` here (covered by 1.6).

**Validation:**
- RTL: empty state when hook returns `{data: undefined}`.
- RTL: list renders when hook returns AY.
- Manual: visit `?tab=policies` on broken school → empty state, no crash.

### Ticket 1.3a — Entry-level guard on `AttendanceModule` ⚠ split from v1

**File:** `apps/academics/src/routes/attendance/index.tsx`

**Spec:**
- After `useCurrentAcademicYear(schoolId)` at line 252, add `if (!currentYear?.yearId) return <NoCurrentAcademicYearEmptyState/>` BEFORE any subsequent hooks.
- If hook-order issues surface, hoist all conditional hooks above the gate or restructure into two components. **Do not** flip the conditional inline.

**Validation:**
- RTL: empty state when no `currentYear`.
- RTL: dashboard renders when `currentYear` present.
- Build passes (rules-of-hooks lint).
- Manual: visit `?tab=attendance` on broken school → empty state in <1s.

### Ticket 1.3b — Drop now-dead defensive defaults in `AttendanceDashboard` ⚠ split from v1

**File:** `apps/academics/src/routes/attendance/dashboard.tsx`

**Spec:**
- Now that 1.3a guarantees `academicYearId` is non-empty at mount, simplify lines 1005-1016: `isLoading = queryLoading`.
- Remove the `academicYearId={currentYear?.yearId || ''}` falsy default at `index.tsx:459`; pass `currentYear.yearId` directly.
- This is a **behavior change in a child component** — separate commit so a regression doesn't simultaneously remove the guard AND the safety net.

**Validation:**
- RTL: dashboard renders normally with valid `academicYearId`.
- RTL: passing an empty string `academicYearId` (which should never happen post-1.3a) renders an explicit error, not an indefinite skeleton.
- Snapshot tests on the Today Summary strip remain stable.

### Ticket 1.4 — Replace inline Gradebook empty-state with shared component

**Files:**
- `apps/academics/src/routes/classrooms/index.tsx` (lines 358-366)
- `apps/academics/src/routes/classrooms/$sectionId.tsx` (lines 218-226)

**Spec:** Delete inline JSX, render `<NoCurrentAcademicYearEmptyState/>`.

**Validation:** Existing tests pass; DOM snapshot is byte-equivalent (proves refactor is pure).

### Ticket 1.5 — Gate the remaining `useCurrentAcademicYear` consumers

**Files (per grep):**
- `apps/academics/src/routes/rostering/index.tsx`
- `apps/academics/src/routes/curriculum/index.tsx`
- `apps/academics/src/routes/grades/index.tsx`
- `apps/academics/src/routes/grades/report-card.tsx`

**Spec:** For each, audit whether `currentYear` is gated; add the same entry-level guard if not. `curriculum/index.tsx` already passes `hasCurrentAY` to a child — verify the child renders an empty state; if not, refactor to use the shared component.

**Validation:** RTL spec per consumer (4 new specs). Plus a grep-check committed as a shell script under `scripts/check-currentyear-gates.sh` that `exit 1`s if any new untested consumer is added.

### Ticket 1.6 — Rename `policy.gradingScale` → `policy.letterGrades` in `PolicyCard`

**File:** `apps/academics/src/components/grades/GradingPolicyList.tsx` (lines 25-102, `PolicyCard` only)

**Spec:**
- Replace `policy.gradingScale.map(...)` at L62 with `policy.letterGrades.map(...)`.
- Type the component prop as `LetterGradeEntryDto[]` from `@aibrains/shared-types`. A future rename triggers a tsc error in this file.
- Letter-grade entries still expose `letter`, `minPercentage`, `maxPercentage` (`letterGradeEntrySchema` is unchanged) — display logic at L62-69 needs no other change.

**Validation:**
- RTL: renders 8 letter-grade pills against PABSON-archetype payload fixture committed at `__fixtures__/pabson-grading-policy.json`.
- tsc passes.
- DOM snapshot test.

### Ticket 1.7 — Rename `gradingScale` → `letterGrades` in `GradingPolicyForm`

**File:** `apps/academics/src/components/grades/GradingPolicyForm.tsx`

**Spec:** Rename at lines 65, 79, 111, 125, 233. Form payload to `useCreateGradingPolicy`/`useUpdateGradingPolicy` mutations must emit `letterGrades`. Verify open-on-existing-policy, add/remove letter-grade entries, submit.

**Validation:**
- RTL: open on existing policy with `letterGrades`, allow editing, submit mutation receives `letterGrades`.
- RTL: create-flow with 4 letter-grades + 3 categories.

### Ticket 1.8 — Grep-and-eliminate residual `gradingScale` references

**Spec:**
- `cd edforge-saas-frontend && grep -rn "gradingScale" apps/ packages/ --include='*.ts' --include='*.tsx'`
- Expect zero matches outside legacy compatibility test fixtures.

**Validation:** grep is empty; `npm run typecheck` in affected workspaces passes.

---

## SPRINT 2 — Frontend Set-as-Current UI + drift surfacing

**Goal:** Operators can self-recover from the bug with one click. Drifted AYs are visibly flagged.
**Repo:** `edforge-saas-frontend`
**Demoable artifact:** Settings → Organization → Schools → School Details → Academic Setup → Academic Years. The drifted AY shows a yellow "Active, not current" pill and a "Set as Current" button. Clicking flips the flag end-to-end against the existing live backend route.

### Ticket 2.1 — Decide and execute the `AcademicYear.isCurrent` type location ⚠ clarified from v1

**Decision (committed in this ticket):** Add `isCurrent: boolean` to the local `AcademicYear` interface in `apps/shell/src/pages/settings/school-academic-years.tsx`. Do NOT promote to a shared module in this PR — the field already exists in `@aibrains/shared-types` `AcademicYearResponseDto`. The shell's local interface is a deliberate UI-state aliasing of the DTO and should stay co-located until a broader cleanup. (One ticket should not propose two architectures.)

**File:** `apps/shell/src/services/tenant.service.ts`

**Spec:**
- Add `isCurrent: boolean` to the local `AcademicYear` type (also declare the field on the shell's `AcademicYear` interface in `school-academic-years.tsx`).
- Update `mapApiAcademicYear` line 394-413: `isCurrent: apiYear.isCurrent === true` (defensive default for legacy rows).
- Remove the misleading "Map isCurrent to isLocked for backward compatibility" comment at line 405 — `isLocked` is a separate concept. Replace with an accurate comment.

**Validation:**
- Vitest: `mapApiAcademicYear({isCurrent: true})` → `isCurrent: true`.
- Vitest: `mapApiAcademicYear({isCurrent: false})` → `isCurrent: false`.
- Vitest: `mapApiAcademicYear({})` → `isCurrent: false` (defensive).

### Ticket 2.2 — Add `setCurrentAcademicYear` to shell tenant.service

**File:** `apps/shell/src/services/tenant.service.ts`

**Spec:**
- Export `async function setCurrentAcademicYear(schoolId: string, academicYearId: string): Promise<AcademicYear>`.
- Calls `apiPut` to `/schools/:schoolId/academic-years/:academicYearId/set-current`.
- Returns mapped AY.
- Add to the default-export object at file bottom (consistent with siblings).

**Validation:**
- Vitest: mock `apiPut`, assert correct URL.
- Manual smoke after Sprint 4 ships: from devtools, call `setCurrentAcademicYear` on a dev tenant.

### Ticket 2.3 — Bind "Current Academic Year" panel to `isCurrent`

**File:** `apps/shell/src/pages/settings/school-academic-years.tsx`

**Spec:**
- L728: change `activeYear` derivation to `const currentYear = displayYears.find(y => y.isCurrent)`. Rename the variable throughout.
- Rename the panel section title remains "Current Academic Year"; the body now correctly binds to the truthful flag.
- When `!currentYear && someYearIsActive`, render a drift-warning callout in the panel: "Academic year `{X}` is active but no year is designated as current. Click 'Set as Current' below to designate one."

**Validation:**
- RTL: with one `isCurrent=true` AY, panel renders that AY.
- RTL: with one `status='active', isCurrent=false` AY, panel renders the warning callout.

### Ticket 2.4 — Add "Set as Current" row action

**File:** `apps/shell/src/pages/settings/school-academic-years.tsx`

**Spec:**
- For each AY row (in both "Upcoming" section and timeline), conditionally render a "Set as Current" button (icon: `Star` from lucide-react).
- Show only when `!year.isCurrent && year.status !== 'completed'` and the user has `settings:academic-year` edit permission.
- On click: confirm dialog ("Make `{year.name}` the current academic year? The current year (`{otherYear?.name}`) will be unset.") → `setCurrentAcademicYearMutation`.
- Mutation invalidates `['academicYears', schoolId]` and `['school', 'current-year', schoolId]`.

**Validation:**
- RTL: button rendered for non-current AY.
- RTL: button hidden for current AY, hidden for completed AY.
- RTL: click → confirm dialog → confirm → mutation fires → cache invalidated → toast.
- RTL: click → confirm dialog → cancel → no mutation.

### Ticket 2.5 — Drift-warning pill on `status='active' && !isCurrent`

**File:** `apps/shell/src/pages/settings/school-academic-years.tsx`

**Spec:**
- Render a yellow "Active, not current" pill (matching the `Drift` color palette: `bg-golden-500/10 text-golden-700`, `AlertCircle` icon) only when `year.status === 'active' && !year.isCurrent`.
- Tooltip on hover: "This year is active but no year is designated as current. Use 'Set as Current' to fix."

**Validation:**
- RTL: drift pill renders for active + !isCurrent.
- RTL: drift pill not rendered for active + isCurrent.
- RTL: drift pill not rendered for planning AYs (planning AYs not being current is normal).

### Ticket 2.6 — Update mock-data fallback

**File:** `apps/shell/src/pages/settings/school-academic-years.tsx` (lines 673-726)

**Spec:** Add `isCurrent: true` to `ay-1`, `isCurrent: false` to others. Mock data is dev-only fallback when the API errors.

**Validation:** Manual verification with API mocked to error.

---

## SPRINT 3 — Backend historical data heal (one-shot)

**Goal:** Every prod school currently in `status='active'` with zero `isCurrent=true` AYs is healed by a supervised script.
**Repo:** `edforge` (backend)
**Demoable artifact:** Run dry-run; see the list of affected schools. Run `--commit`; verify all heal correctly via the Sprint 3.3 smoke. Audit rows captured in DDB and snapshot JSON in S3.

### Ticket 3.1 — Cleanup script with per-tenant Query (NOT full Scan) ⚠ corrected from v1

**File:** `scripts/cleanup-orphans/promote-missing-current-ay.ts` (new, modeled on existing `orphan-school-configs.ts`)

**Spec:**
- CLI flags: `--profile <prod|dev>`, `--dry-run` (default true), `--commit`, `--tenant <id>` (optional filter), `--all-tenants` (mutually exclusive with `--tenant`), `--out <path>` (CSV report).
- **Algorithm (per-tenant Query, no table Scan):**
  1. Load tenant list from the control-plane DDB (TenantMetadata rows). For `--tenant <id>` mode, skip this step.
  2. For each tenant: `Query` the identity DDB on `gsi1pk = TENANT#{tid}` (or equivalent existing GSI for schools) and filter `entityType = SCHOOL`. **No table Scan.** Cite the GSI used.
  3. For each school: `Query` the SCHOOL#{schoolId}#YEAR# prefix; filter AYs in-memory.
  4. Affected = schools with `≥1 AY status='active'` AND `0 AYs isCurrent=true`.
  5. For each affected school: pick the lex-first AY with `status='active'` (deterministic). Capture pre-state.
- **Pre-write S3 snapshot (NEW from review):** Before any `--commit` write, upload a JSON snapshot of all affected schools' pre-state (schoolId, yearId, yearName, status, isCurrent, updatedAt) to `s3://<operator-audit-bucket>/cleanup/promote-missing-current-ay/<isoTimestamp>.json`. Print the S3 URL. **Refuse to proceed if the upload fails.** This survives the operator's shell dying or `/tmp` rotating.
- In `--commit`: write `isCurrent=true` via `updateItem` (preserving the same audit-emit path the service uses). Emit `action: 'auto_promote_current_backfill'` audit row with `actor: 'script:promote-missing-current-ay'` and a reference to the S3 snapshot URL.
- Idempotent: re-run after `--commit` shows zero affected schools.

**Validation:**
- Local fixture-DDB unit test (using `aws-sdk-client-mock`): plant broken school, run `--commit`, assert AY flipped + audit row + S3 upload.
- Local fixture-DDB unit test: idempotent (second run = no-op).
- Pre-commit dry-run output review with operator.

### Ticket 3.2 — Operator runbook

**File:** `docs/runbooks/promote-missing-current-ay.md` (new)

**Spec:**
- Prereqs (AWS creds, profile env var, DDB read+write IAM).
- Step 1: `--dry-run` in `--profile dev` first; review CSV.
- Step 2: `--dry-run` in `--profile prod`; review CSV; confirm S3 snapshot uploads.
- Step 3: get operator sign-off in writing.
- Step 4: `--commit --profile prod`.
- Step 5: run Sprint 3.3 smoke; confirm 0 failures.
- Rollback: each affected school's pre-state is in the S3 snapshot AND CSV. Reverse a single flip via `DescribeTable` lookup + targeted `UpdateItem`.

**Validation:** Operator dry-run walkthrough; runbook updated for any gaps.

### Ticket 3.3 — Post-heal smoke

**File:** `scripts/smoke-tests/academic-year-current.sh` (new)

**Spec:** For each tenant's active schools, hit `GET /api/schools/:id/academic-years/current` and assert 200. Aggregate failures to a CSV.

**Validation:**
- Pre-commit: smoke reports N failures (matches 3.1's affected count).
- Post-commit: smoke reports 0 failures.

---

## SPRINT 4 — Backend auto-promote + activation gate hardening

**Goal:** A school cannot land in `status='active'` without exactly one `isCurrent=true` AY. New activations auto-promote when nothing else is current.
**Repo:** `edforge`
**Demoable artifact:** On a dev tenant: create AY → activate → `/current` returns 200 immediately. Manually flip the AY's `isCurrent` to false via DDB, then attempt to re-activate the school → activation request fails with structured error listing `current_academic_year` as missing requirement.

### Ticket 4.1 — Auto-promote `isCurrent` on `planning→active` transition + race-safe write + kill switch ⚠ corrected from v1

**File:** `server/application/microservices/identity/src/academic-years/academic-years.service.ts` (`updateAcademicYearStatus`, lines 401-477)

**Spec:**
- Add an env-var kill switch `AY_AUTO_PROMOTE_ON_ACTIVATE` (default `'true'`). When `'false'`, skip the auto-promote branch entirely. Cheap rollback if a misfire is reported (single ECS task-def env change, no rebuild).
- When `updateDto.status === 'active' && year.status !== 'active' && AY_AUTO_PROMOTE_ON_ACTIVATE !== 'false'`:
  - `const existing = await this.listAcademicYears(schoolId, context, 100)`
  - `const hasAnyCurrent = existing.items.some(y => y.isCurrent === true && y.yearId !== yearId)`
  - If `!hasAnyCurrent`: include `SET isCurrent = :true` in the same atomic `updateItem` call AND apply a **conditional expression** `attribute_not_exists(isCurrent) OR isCurrent = :false` on the target row. This prevents last-write-wins on concurrent activations.
  - On `ConditionalCheckFailedException`: re-fetch and re-run the auto-promote check; if still no other current, retry once. After one retry: log a warning, do NOT block the status transition.
- Cite the Saraswati 2026-05-18 incident in a comment block, mirroring `createAcademicYear:140-171`.

**Validation:**
- Unit test: planning→active auto-promotes when no other current AY.
- Unit test: planning→active does NOT auto-promote when another is current.
- Unit test: active→completed does NOT touch `isCurrent`.
- Unit test: no-op transition (already active) does NOT touch `isCurrent`.
- Unit test: kill switch `=false` skips auto-promote.
- Unit test: ConditionalCheckFailedException triggers one retry then degrades gracefully.
- Audit-emit test: auto-promote emits dual-field audit row.

### Ticket 4.2a — Publish `@aibrains/shared-types` with new activation requirement key ⚠ split from v1

**Files:**
- `packages/shared-types/src/archetype/activation-requirements.ts`
- `packages/shared-types/src/archetype/types.ts` (or wherever `ActivationRequirementKey` lives)
- `packages/shared-types/CHANGELOG.md` (or release-notes equivalent) ⚠ NEW from review

**Spec:**
- Add `'current_academic_year'` to `ActivationRequirementKey`.
- Add `{ key: 'current_academic_year', label: 'Current academic year designated', minCount: 1 }` to all archetype configs (PABSON, GENERIC, reserved CBSE_IN, NAIS_US, GEMS_UAE).
- Bump shared-types minor version, publish to npm.
- Update CHANGELOG with: "Add `current_academic_year` activation requirement. Consumers must support this key when calling `evaluateActivationRequirements`." Reference this sprint plan's PR.

**Validation:**
- Unit test on the archetype configs: each archetype has the new requirement.
- `npm publish --dry-run` validates the package.
- Verify CHANGELOG entry committed.

### Ticket 4.2b — Backend consume new requirement in `countRequirementResource` ⚠ split from v1

**Files:**
- `server/application/microservices/identity/src/schools/schools.service.ts` (`countRequirementResource`, lines 1048-1100)
- `server/application/package.json` (shared-types pin bump)
- `server/package.json` (shared-types pin bump)
- Root `package-lock.json` refresh

**Spec:**
- Bump `@aibrains/shared-types` pin in both package.jsons; `npm install` at repo root.
- Add `case 'current_academic_year'` in `countRequirementResource`: query the SCHOOL#{schoolId}#YEAR# prefix with FilterExpression `entityType = :et AND isCurrent = :isCurrent` and `:isCurrent = true`. Return `result.items.length`.
- Update the existing `'academic_year_active'` label/comment if needed for clarity ("Academic year activated", lifecycle stage — distinct from the new requirement).

**Validation:**
- Unit test on `countRequirementResource('current_academic_year', ...)`: 1 for school with current AY, 0 without.
- Unit test on `evaluateActivationRequirements` for PABSON: returns 5 requirements.
- Integration test: school with one `status='active', isCurrent=false` → `transitionStatus('active')` throws `BadRequestException ACTIVATION_REQUIREMENTS_NOT_MET` listing `current_academic_year` missing.
- Integration test: same school after `set-current` → activation succeeds.

### Ticket 4.2c — AdminWeb shared-types pin handling ⚠ NEW from review

**File:** `client/AdminWeb/package.json`

**Spec:**
- Determine whether AdminWeb consumes any of the new shared-types exports (`current_academic_year`, `ActivationRequirementKey`). Per the grep, AdminWeb does NOT touch activation requirements UI.
- **Decision:** Leave AdminWeb's pin **intentionally stale**. Document this in the PR description with the rationale: "AdminWeb does not consume the new exports added in 4.2a. Pin remains at current version. No controlplane-stack redeploy required."
- Add a comment in `client/AdminWeb/package.json` near the shared-types pin: `// Intentionally stale; bump only when AdminWeb consumes new exports.`
- If AdminWeb DOES consume them (audit reveals an import I missed), then: bump pin + redeploy `controlplane-stack` per CLAUDE.md change-matrix. This becomes a sub-ticket of 4.2c.

**Validation:**
- Grep: confirm AdminWeb has no import of `current_academic_year` or `ActivationRequirementKey`.
- PR description has explicit decision recorded.

### Ticket 4.3 — Frontend setup checklist wiring (verification, not new code)

**File:** `apps/shell/src/pages/settings/school-academic-setup.tsx` (and child step components)

**Spec:**
- Verify the existing checklist reads requirements from the API response data-driven, not hardcoded. If hardcoded labels exist, replace with API-driven rendering.
- Confirm the new "Current academic year designated" step renders in the checklist post-Sprint-4 deploy.

**Validation:**
- Manual: open `/settings/organization/schools/:id?tab=academic-setup` on dev tenant after Sprint 4 BE deploy. The 4-step checklist is now 5 steps. Sprint 2's "Set as Current" button satisfies the new step.

### Ticket 4.4 — Tighten activation-event audit

**File:** `server/application/microservices/identity/src/academic-years/academic-years.service.ts`

**Spec:**
- In `updateAcademicYearStatus` audit-emit (lines 439-461), if `isCurrent` was auto-promoted in the same call, include a second change entry `{ field: 'isCurrent', oldValue: false, newValue: true }`.
- CloudWatch `AUDIT { action: 'ACADEMIC_YEAR_STATUS_CHANGED', ... }` log line gains an `isCurrentAutoPromoted: boolean` field.

**Validation:**
- Unit test: auto-promote branch emits dual-field audit row.
- Unit test: no-promote branch emits only status change.
- Manual: tail prod logs after Sprint 4 deploy, observe `isCurrentAutoPromoted: true` events.

### Ticket 4.5 — Verify API GW + nginx route presence

**Files:** `server/lib/tenant-api-prod.json`, `server/application/reverseproxy/nginx.template`

**Spec:** Confirm `/schools/{schoolId}/academic-years/{yearId}/set-current` is registered in API GW (it is at L2440) and nginx rproxy (under existing `/schools/` prefix block). Run `scripts/check-route-drift.ts`.

**Validation:** Route-drift linter passes; no edits needed unless drift surfaces.

---

## SPRINT 5 — Hardening (internal-quality, non-demoable to stakeholders) ⚠ relabeled from v1

**Goal:** Regression prevention. Operators get a paging alarm if any new school drifts. Contract test prevents silent shared-types renames. Doc captures the lesson.
**Repos:** `edforge` (BE) + `packages/shared-types` (monorepo workspace)
**Stakeholder demo:** None — this is internal-quality work. Engineering walkthrough is the appropriate review forum.

### Ticket 5.1 — Cloudwatch alarm filtered to actual invariant violations ⚠ corrected from v1

**File:** `server/lib/tenant-template/identity-service.ts` (or wherever identity-service alarms are defined)

**Spec:**
- Metric filter on the identity service log group matching the pattern that captures `NO_CURRENT_AY` errorCode **AND** school status `active` in the same request — NOT just any `NO_CURRENT_AY` 404. (An unactivated school in setup is *expected* to lack a current AY; an active school is the invariant violation.)
- Concrete approach: extend the existing error log line to include the school's `status` field, then filter on `errorCode = "NO_CURRENT_AY" AND schoolStatus = "active"`.
- `MetricAlarm`: `>0` matches in any 5-minute window → fire SNS to operator topic.
- Severity: warning (not pager). Should be rare post-fix; investigate when it fires.

**Validation:**
- CDK synth shows expected alarm.
- Manual: with the alarm deployed, simulate by flipping a dev tenant's `isCurrent` to false on an active school's AY; alarm enters ALARM within 5min. Re-flip; alarm returns OK.
- Manual: hit `/current` on a setup-status school; alarm does NOT fire (correctly filtered out).

### Ticket 5.2 — Shared-types contract test for `GradingPolicyResponseDto`

**File:** `packages/shared-types/src/schemas/academics/__tests__/grading-policy-contract.test.ts` (new)

**Spec:**
- Vitest test parses a committed real backend payload through `gradingPolicyResponseSchema`.
- Type-level assertion (`expectTypeOf<keyof GradingPolicyResponseDto>().not.toEqualTypeOf<'gradingScale'>()`) — `gradingScale` must NOT be in the type's keys.
- Field assertion: `letterGrades` exists.

**Validation:**
- Test passes today.
- Mutation: rename `letterGrades` → anything else in the schema → test fails → CI blocks.

### Ticket 5.3 — CLAUDE.md doc note: `status` vs `isCurrent`

**File:** `CLAUDE.md`

**Spec:** Add a subsection under "Common edit traps" titled **`AcademicYear.status` and `AcademicYear.isCurrent` are independent**. Rule: "Setting `status='active'` does NOT imply `isCurrent=true`. They're orthogonal. The activation gate enforces both as of Sprint 4." Reference this plan's PR.

**Validation:** Doc edit; reviewed.

### Ticket 5.4 — AY lifecycle round-trip smoke

**File:** `scripts/smoke-tests/ay-lifecycle.sh` (new)

**Spec:** End-to-end script:
1. Create AY → `/current` returns it (auto-promote).
2. Create second AY with `setAsCurrent: true` → `/current` returns it; first's `isCurrent=false`.
3. `PUT /set-current` first → `/current` returns first.
4. Activate second (`PUT /status` active) → no-op on `isCurrent` (first remains current).
5. Cleanup.
- Exit 0 on success, non-zero with descriptive stdout on failure.
- Run as post-deploy verification step.

**Validation:** Script passes against dev tenant post-Sprint-4 deploy.

---

## 4. Deferred / explicit non-goals

- **Renaming `S1Test-2026-05-` test AY** — operator data, not engineering scope.
- **"Merge two AYs" UI** — model intentionally forbids AY deletion.
- **Reviewing `setAsCurrent: true` clear-other behavior** — current behavior is correct; revisit only if operators report confusion.
- **Migrating to a discriminated union of AY status** — 200-LOC refactor, not justified by this incident.
- **Custom ESLint rule for `useCurrentAcademicYear` gating** — dropped per review (over-engineered for one incident; the grep gate in 1.5 is sufficient).

## 5. Rollout order

1. **Sprint 1** — frontend PR. ~4-6h work. Defensive only; safe to ship without backend coordination. Stops the visible bleeding.
2. **Sprint 2** — frontend PR. ~4-6h. Calls the existing live `PUT /set-current` route; no backend dep. Operators can self-recover from broken state.
3. **24-48h soak** — verify no regressions, gather operator usage data.
4. **Sprint 3** — backend operator-led script run, no service deploy. Heal historical drift. ~1h with review.
5. **Sprint 4** — backend PR. Shared-types publish (4.2a) → backend pin bump (4.2b) → ECS roll. ~6-8h work + deploy windows. **MUST come after Sprint 3** to avoid blocking activation on healable schools.
6. **Sprint 5** — incremental small PRs over 1-2 weeks. Each ticket is independently shippable.

Total wall-clock estimate: ~4 working days for a single engineer (Sprints 1+2 in day 1, Sprint 3 in day 2 AM, Sprint 4 in day 2 PM + day 3, Sprint 5 trickle).

## 6. Risk register

| Risk | Mitigation |
|---|---|
| Sprint 4 ships before Sprint 1+2 → existing crash continues | Sprint 1+2 ship first per §5 order. Committed, not "either/or." |
| Sprint 3 script picks "wrong" AY when multiple are active | Deterministic lex-first; CSV + S3 snapshot enables surgical correction post-hoc. |
| Auto-promote (4.1) surprises an operator who intentionally activated a future-planning year | Auto-promote only fires when NO other AY is current. Operator's expressed intent (activate this year) is preserved. |
| Sprint 4 activation gate blocks legitimate prod activations during the post-deploy window | Sprint 3 ran first (per §5). Plus the kill switch in 4.1 (`AY_AUTO_PROMOTE_ON_ACTIVATE=false`) gives a fast disable without redeploy. |
| Alarm (5.1) too noisy | Filter explicitly excludes setup-status schools (corrected from v1). Tune to `>0/15min` if 5min proves noisy. |
| Race: two operators activate two different AYs concurrently | 4.1 conditional write + retry. Last-write-wins replaced with explicit failure-then-retry. |
| Shared-types publish broken (per CLAUDE.md zod pin discipline) | 4.2a explicitly bumps minor, not jumping to 4.x. Run `npm publish --dry-run`. Run jsdom AdminWeb bundle sim if pin discipline rule applies (per CLAUDE.md "silent browser-bundle failures"). |

## 7. Review feedback addressed

Incorporated all 14 actionable items from the subagent critique:

1. ✅ Sprint sequencing inverted: heal (Sprint 3) BEFORE gate (Sprint 4).
2. ✅ Sprints 1 + 2 from v1 consolidated into Sprint 1.
3. ✅ Ticket 1.3 split into 1.3a (guard) and 1.3b (cleanup defensive defaults).
4. ✅ Ticket 4.1 adds conditional write + retry for race safety.
5. ✅ Ticket 4.2 split into 4.2a (shared-types publish + CHANGELOG) and 4.2b (backend consumption + pin bumps).
6. ✅ Ticket 4.2c addresses AdminWeb pin explicitly.
7. ✅ Ticket 3.1 uses per-tenant Query, never table Scan.
8. ✅ Ticket 3.1 adds pre-write S3 snapshot.
9. ✅ Ticket 5.1 alarm filtered to active-status schools only.
10. ✅ Old Ticket 6.4 (ESLint rule) dropped.
11. ✅ Ticket 4.2a adds CHANGELOG entry.
12. ✅ Sprint 5 explicitly labeled "internal-quality, non-demoable."
13. ✅ Ticket 2.1 picks ONE location for the type, doesn't leave choice mid-ticket.
14. ✅ Ticket 4.1 adds env-var kill switch.
