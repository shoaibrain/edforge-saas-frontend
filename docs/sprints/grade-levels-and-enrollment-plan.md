# EdForge — Unblock Saraswati: Local Grade Levels, Enrollment Wizard Fix & Curriculum Enablement

## Context

EdForge's first pilot school, **Shree Saraswati Secondary English Boarding School** (Nepal, EMIS `170840012`, locale `ne-NP`, Bikram Sambat calendar), is blocked from adopting the platform by two problems:

1. **Grade-level taxonomy mismatch.** Saraswati's real academic structure has fine-grained early-childhood levels — **PG (Playgroup), Nursery, LKG, UKG** — plus Grades 1–10. EdForge models early childhood only as the Ed-Fi descriptors `EarlyChildhoodDevelopment` (ECD) and `PrePrimaryClass` (PPC). The school cannot create curriculum/courses because its actual class levels don't exist in the system. Every grade-level constant is centralized in the **external `@aibrains/shared-types`** package (`GRADE_LEVEL_OPTIONS`, `ORDERED_GRADES`, `GRADE_RANGE_TO_DESCRIPTOR`, `computeGradeLevels`, `SCHOOL_GRADE_LEVEL_DESCRIPTORS`); the frontend only re-exports it. Flattening PG/Nursery/LKG/UKG into ECD/PPC would lose real distinctions and corrupt downstream curriculum, sections, fees, and reporting.

2. **Enrollment wizard "heisenbug."** In the multi-step student enrollment form, the **Academic Year** `SelectField` shows the chosen value, but clicking **Continue** intermittently fails validation with "Please select an academic year." Root cause confirmed (see below): a two-sources-of-truth race between react-hook-form (live values) and the wizard's `formDataRef` (the validated copy).

### Chosen direction (confirmed with stakeholder)
- **Two-layer grade model**: keep Ed-Fi descriptors as the canonical *reporting* taxonomy; introduce a school-configurable **local grade level** (name, order, Ed-Fi mapping). Courses / sections / enrollment / fees reference local levels; reporting derives the Ed-Fi descriptor.
- **Full-stack** changes allowed (we own `@aibrains/shared-types` + backend).
- Scope = **both issues + verifying Saraswati can create curriculum end-to-end.**

### Intended outcome
Saraswati can configure PG/Nursery/LKG/UKG + Grades 1–10, build curriculum/courses against them, and enroll students through a wizard that never blocks a validly-selected field — all while staying Ed-Fi/EMIS-reportable.

### Deferred decision (recorded, not missed)
Saraswati's booklist groups some grades ("Class 6-7", "9/10", "1/2/3", "4/5"). These are **shared teaching-material groupings, not merged grade levels** — the school still runs distinct Grade 1, 2, 3 etc. We therefore model individual local levels and treat booklist/material grouping as a separate future concern. Documented here so it is an explicit decision, not an oversight.

---

## Heisenbug — confirmed root cause & fix design

**Mechanism (verified in code):**
- `SelectField` (`packages/forms/src/fields/SelectField.tsx`) is **controlled by react-hook-form** via `register()`; RHF holds the live value.
- `useWizardForm` (`apps/academics/src/hooks/useWizardForm.ts:58-83`) syncs RHF → wizard via an **async `form.watch` subscription** calling `updateData`.
- `updateData` (`packages/wizard/src/WizardContext.tsx:150-178`) writes `formDataRef.current` **inside the deferred `setFormData` updater** (line 175) — not synchronously.
- `validateStep` (`WizardContext.tsx:95-116`) validates `formDataRef.current`. `Continue` (`RegistrationFooter` in `RegistrationWizard.tsx`) lives **outside** the step's `FormProvider`, so it only reads the lagging ref.
- **Race**: select → `watch` fires → `setFormData` queued → click Continue → `validateStep` reads stale `formDataRef` (`""`) → false error. Intermittent: depends on whether React flushed the queued update before the click handler ran. Aggravated by `EnrollmentStep` auto-select (`EnrollmentStep.tsx:88-95`) using `form.setValue` without flush options.

**Fix (Sprint 1) — designed to close the race on *all* paths:**
1. `updateData`: compute the deep-merge against `formDataRef.current` and assign the ref **synchronously**, then `setFormData(merged)`.
2. **Step data provider, single active per current step.** Wizard exposes `registerStepDataProvider(fn)`; `useWizardForm` registers `() => form.getValues()` and unregisters on unmount.
   - `validateStep` must, **synchronously at the top before any `await`**, call the provider and `updateData(provider())`, then pass the merged object **directly** into `schema.parseAsync(...)` — never re-read `formDataRef.current` after an await (avoids the navigation/unmount-timing race).
   - Only the **current** step has a live provider (only one `FormProvider` is mounted). `goToNext` flushes the current step before validating it. `submit` flushes the current step, then validates the accumulated ref across all steps — so earlier steps rely on values already merged when the user navigated forward (covered by a dedicated test, see T1.4).
3. Harden `EnrollmentStep` auto-select to `setValue(name, id, { shouldDirty: true })` and rely on flush-on-navigate.

---

## Tech stack & validation conventions (from repo)

- **Monorepo**: Turbo + pnpm workspaces. Apps `apps/*` (MFE via Rsbuild/Module Federation), shared libs `packages/*`.
- **Stack**: React 19, TanStack Router, TS 5.6, react-hook-form 7.54 + Zod 3.24, Zustand + TanStack Query, `@edforge/ui` (Tailwind), framer-motion, `@edforge/api-client` (axios). **ABAC** in `packages/abac` (already declares a `gradelevels` resource with `view/create/edit/delete/manage` under `settings:school`).
- **Tests**: Vitest 4 + Testing Library + MSW (`pnpm test`), Playwright e2e in `e2e/tests/`, setup/helpers in `test-utils/` (`expectSchemaValid/Invalid`, `renderWithProviders`).
- **Quality gates**: `pnpm typecheck`, `pnpm lint`, `pnpm build`. **No CI workflow exists** — Sprint 1 adds one.
- **Backend / shared-types are separate repos.** Tickets there are tagged **[shared-types]** / **[backend]**; this repo implements against published contracts, mocked via MSW until live (see contract-first ticket T2.6).

Each ticket is atomic and committable. "Validation" = automated test where sensible, else an explicit manual/script check. Each sprint ends runnable and demoable.

---

## Sprint 1 — Enrollment wizard reliability + CI guardrail
**Goal:** Wizards validate against live form state; a selected Academic Year always passes Continue. CI runs on every push.
**Demo:** Enroll a student, fast-select Academic Year, click Continue repeatedly — never blocks. `pnpm test` + CI green.

- **T1.1 — CI workflow.** Add `.github/workflows/ci.yml`: `pnpm install`, `typecheck`, `lint`, `test`, `build` on PR/push. *Validation:* workflow green on a no-op PR.
- **T1.2 — Regression test as `it.fails` (red→green contract).** Add a Vitest test in `packages/wizard/` simulating select-then-immediate-navigate (no awaited microtask) asserting validation passes; commit it as `it.fails(...)` so CI stays green while encoding the current broken behavior. Flipped to passing `it()` in T1.4. *Validation:* `it.fails` passes (i.e. the bug currently reproduces).
- **T1.3 — Synchronous ref update in `updateData`.** Refactor to assign `formDataRef.current` synchronously before `setFormData`. Add regression tests covering the **autosave-restore** and **`reset()`** paths (both set the ref directly) so the "ref always reflects latest" invariant holds. *Validation:* unit tests: update→read sync; restore→Continue; reset→empty.
- **T1.4 — Step data provider / flush-on-navigate.** Add `registerStepDataProvider` to wizard context + `packages/wizard/src/types.ts`. `validateStep` flushes `provider()` synchronously at the top and validates the merged object directly. `useWizardForm` registers `() => form.getValues()`, unregisters on unmount. Flip T1.2 to `it()`. *Validation:* T1.2 green; provider register/unregister unit test; **multi-step test** (edit step 1 → forward → submit) proving no stale slice.
- **T1.5 — Harden `EnrollmentStep` auto-select.** `setValue(..., { shouldDirty: true })`, guard re-runs, ensure single-active-year auto-select syncs. *Validation:* component test (MSW, one active year) → field populated, Continue passes.
- **T1.6 — Typed SelectField value contract.** Add a shared test util/assertion that every `SelectField` option `value` is a string and round-trips select → Review step (covers the academic-year `yearId` and reuses across pickers). *Validation:* component round-trip test reading the value back on Review.
- **T1.7 — E2E happy path.** Playwright: full enrollment incl. Academic Year + Continue + submit. *Validation:* e2e spec green.

## Sprint 2 — Local grade-level domain model (shared-types + backend)
**Goal:** Backend + shared-types support school-scoped, orderable local grade levels mapped to Ed-Fi descriptors, with templates incl. Nepal early-childhood, and existing data migrated.
**Demo:** Create/list/reorder grade levels for a school via API; Saraswati template seeds PG/Nursery/LKG/UKG + 1–10; existing schools backfilled.

- **T2.1 [shared-types] — Types & DTOs.** `SchoolGradeLevel`, `Create/UpdateSchoolGradeLevelDto`, responses. Fields: `code`, `name`, `shortName?`, `sortOrder`, `edfiGradeLevelDescriptor`, `localeLabels?`, `status`. *Validation:* type-guard unit tests; package builds.
- **T2.2 [shared-types] — Mapping + ordering + templates.** `mapLocalToEdfiGradeLevel()`, ordering helpers, `GRADE_LEVEL_TEMPLATES` incl. `NEPAL_PABSON` (PG/Nursery→ECD, LKG/UKG→PPC, Grades 1–10). *Validation:* mapping + template-integrity unit tests; publish version.
- **T2.3 [backend] — CRUD + referential integrity.** `/api/schools/:schoolId/grade-levels` list/create/update/delete/reorder. Rules: `code` unique per school, valid descriptor, contiguous `sortOrder`, **block delete/deactivate of a level referenced by a course/section/enrollment** (or cascade to soft state). *Validation:* integration tests incl. uniqueness, bad descriptor, referenced-delete rejection.
- **T2.4 [backend] — Seeding & school backfill.** On school create, seed from `gradeRange`/template; idempotent migration backfilling existing schools. *Validation:* migration test on fixture DB; dry-run reviewed.
- **T2.5 [backend] — Legacy record migration.** Map existing course/section/fee/`student.currentGradeLevel` values (Ed-Fi descriptor or legacy `GRADE_LEVEL_OPTIONS` code) → seeded local-level ids. *Validation:* migration test asserting all pre-existing records resolve to a local level; report of any unmapped values.
- **T2.6 [shared-types/frontend] — Contract-first MSW fixture.** Derive a canonical JSON fixture for the grade-level + school payloads from T2.1 types; this is the single fixture consumed by both T2.5's contract snapshot test (backend) and the frontend MSW handlers (Sprint 3+), so the mock cannot drift. *Validation:* fixture validates against shared-types schema in a test.

## Sprint 3 — Frontend grade-level service + school configuration UI
**Goal:** Schools view/manage local grade levels in settings (ABAC-gated); the school-create wizard seeds/previews them.
**Demo:** Create a school with the Nepal template; open Settings → Grade Levels; add/edit/reorder a level and set its Ed-Fi mapping; verify a non-admin cannot mutate.

- **T3.1 — Service + query hooks.** `gradeLevels.service.ts` + `useSchoolGradeLevels`, `useCreate/Update/Delete/ReorderGradeLevel`. MSW handlers from the T2.6 fixture. Mutating hooks gated via `packages/abac` (`gradelevels` create/edit/delete). *Validation:* hook tests against MSW; ABAC denial test.
- **T3.2 — Zod form schema.** Grade-level create/edit schema, friendly messages. *Validation:* `expectSchemaValid/Invalid` cases.
- **T3.3a — Grade Levels page (read-only).** ABAC-gated (`gradelevels:view`) settings list of configured levels with Ed-Fi mapping shown. *Validation:* component render test + ABAC gate test.
- **T3.3b — Add/edit level.** Modal + Zod wiring + `useCreate/UpdateGradeLevel`. *Validation:* component tests (add, edit, validation error).
- **T3.3c — Drag-reorder.** Keyboard-operable reorder + `aria-live` + optimistic `useReorderGradeLevel`. *Validation:* component test (mouse + keyboard reorder) and axe a11y assertion.
- **T3.3d — Activate/deactivate.** Toggle status; surface backend referential-integrity rejection (T2.3) as an inline error. *Validation:* component test incl. blocked-deactivate path.
- **T3.4 — School-create wizard integration.** In `school-wizard` (`BasicInfoStep`/`EdFiComplianceStep`): pick template, preview seeded local levels, edit before submit. *Validation:* wizard test asserting Nepal template yields PG/Nursery/LKG/UKG.
- **T3.5 — Wizard→DTO mapping.** Extend `transformWizardDataToDto` (`school-wizard.utils.ts`) to send the local-level seed payload. Update `school-wizard.grade-levels.test.ts`. *Validation:* DTO transform unit test.

## Sprint 4 — Wire local grade levels through curriculum, enrollment & fees
**Goal:** Every grade-level picker uses the school's configured local levels (behind a feature flag, fallback to `GRADE_LEVEL_OPTIONS`); submissions persist local id + derived Ed-Fi descriptor; legacy/out-of-range values degrade gracefully.
**Demo:** Create a course for "Nursery"/"LKG"; enroll a student into "UKG"; set a fee for "Nursery"; an old course with a legacy code still renders.

- **T4.1 — Feature flag + read-path fallback.** Per-tenant flag selecting `useSchoolGradeLevels` vs static `GRADE_LEVEL_OPTIONS`; a shared resolver that maps an unknown stored code → display-only "legacy" option (reusing the `extraOpt` pattern in `EnrollExistingStudentModal.tsx`/`EditStudentModal.tsx`). *Validation:* unit tests for flag on/off and legacy-code resolution.
- **T4.2 — Course form & grade tab.** `CourseForm.tsx` + `GradeLevelsTab.tsx` consume the resolver from T4.1 (keep out-of-range handling). *Validation:* component tests with custom levels + a legacy value.
- **T4.3 — Course storage schema.** `gradeLevels` stores local codes/ids. *Validation:* schema test.
- **T4.4 — Course submit → derived descriptor.** Transform maps local id → Ed-Fi descriptor via `mapLocalToEdfiGradeLevel()` on submit. *Validation:* transform test (the highest-risk mapping gets its own test).
- **T4.5 — Enrollment grade fields.** `EnrollmentStep` entry-grade + `student.form` `currentGradeLevel` from local levels; `ReviewStep` labels via local levels. *Validation:* component tests (reuses Sprint 1 wizard).
- **T4.6 — Existing-student & edit modals.** `EnrollExistingStudentModal.tsx`, `EditStudentModal.tsx` → resolver. *Validation:* component tests.
- **T4.7 — Fee structures.** `finance/.../fee-structures.tsx`: replace local `ORDERED_GRADES` with school levels via resolver. *Validation:* component test targeting a custom level.
- **T4.8 — Label/sort utils.** `packages/types/src/academics-utils.ts` (`GRADE_ORDER`, `formatGradeLabel`, `gradeSort`) and `useAcademicsOverview.ts` handle custom codes/order. *Validation:* unit tests incl. PG/Nursery/LKG/UKG ordering.

## Sprint 5 — Pilot verification, reporting & localization
**Goal:** Validate the full flow with Saraswati's real structure; Nepali labels; Ed-Fi/EMIS reporting derives correctly from local levels.
**Demo:** Configure Saraswati (PG, Nursery, LKG, UKG, 1–10) → create courses across all levels → enroll students → values display in `ne-NP` → run an Ed-Fi export and see ECD/PPC emitted.

- **T5.1 — Saraswati template/fixture.** Grade-level set matching their structure (individual PG/Nursery/LKG/UKG + Grades 1–10). *Validation:* seed script + assertion test.
- **T5.2 — `ne-NP` grade labels (i18n).** Nepali labels via `localeLabels`/i18next. *Validation:* i18n parity test (mirrors `i18n-init.test.ts`).
- **T5.3 — Ed-Fi/EMIS reporting verification.** In `apps/edfi`/`apps/analytics`, assert a report/export for Saraswati emits the correct Ed-Fi descriptor (ECD/PPC) when source data is PG/Nursery/LKG/UKG. *Validation:* test on the export path proving the two-layer derivation.
- **T5.4 — Full pilot E2E.** Playwright: configure school → curriculum across all levels → enroll. *Validation:* e2e spec green.
- **T5.5 — Verification report.** Script/checklist confirming every Saraswati level can host a course + enrollment, mirroring the real `schools/61a247a4…` payload. *Validation:* report artifact reviewed.
- **T5.6 — Admin docs.** Guide for configuring local grade levels + Ed-Fi mapping (`docs/`), linked from settings UI. *Validation:* doc reviewed.

---

## Critical files
- **Heisenbug:** `packages/wizard/src/WizardContext.tsx`, `packages/wizard/src/types.ts`, `apps/academics/src/hooks/useWizardForm.ts`, `apps/academics/src/components/students/registration/steps/EnrollmentStep.tsx`, `packages/forms/src/fields/SelectField.tsx`.
- **Grade levels (frontend):** `apps/academics/src/schemas/{course.form,student.form,edfi-descriptors}.ts`, `apps/academics/src/components/curriculum/{CourseForm,GradeLevelsTab}.tsx`, `apps/academics/src/components/enrollment/EnrollExistingStudentModal.tsx`, `apps/academics/src/components/students/EditStudentModal.tsx`, `apps/shell/src/components/settings/school-wizard/*`, `apps/finance/src/routes/configuration/fee-structures.tsx`, `packages/types/src/academics-utils.ts`, `packages/abac/src/{permissions,hooks}.ts`.
- **Reuse:** new `useSchoolGradeLevels` + T4.1 resolver as the single source for pickers; existing `extraOpt` legacy-option pattern; `@edforge/api-client`; `@edforge/forms`; `@edforge/wizard`; existing ABAC `gradelevels` resource; `test-utils` helpers.
- **External:** `@aibrains/shared-types` (types/templates/mapping), backend grade-level endpoints + migrations.

## Cross-cutting concerns (folded into tickets above)
- **Backward compat / migration:** T2.4 (schools), T2.5 (records), T4.1 (frontend legacy fallback).
- **Permissions:** existing ABAC `gradelevels` resource gates T3.1/T3.3a–d.
- **Rollout safety:** feature flag in T4.1 lets the local-level source be disabled per tenant.
- **Referential integrity:** T2.3 (backend) + T3.3d (frontend surfacing).
- **Reporting:** T5.3 proves Ed-Fi derivation end-to-end.
- **Accessibility:** T3.3c keyboard reorder + axe.

## Verification (end-to-end)
- Per ticket: `pnpm typecheck && pnpm lint && pnpm test` (+ relevant `e2e`), CI green (T1.1).
- Sprint 1: `pnpm dev:academics`/`dev:mvp`, enroll a student, fast-select Academic Year + Continue → no false error; Playwright happy path.
- Sprints 3–5: create a school with the Nepal template, configure PG/Nursery/LKG/UKG, create courses for each, enroll a student, run an Ed-Fi export, confirm `ne-NP` labels — mirroring the real `schools/61a247a4…` payload.
