# Workspace Settings Sprint Plan — Sub-Agent Review (Revision 2)

**Date:** 2026-03-21
**Reviewer:** Claude (Opus 4.6) — Senior Product Engineer / Technical Lead
**Documents Reviewed:**
- `docs/workspace-settings-audit.md`
- `docs/workspace-settings-sprint.md` (Revised)
- `docs/workspace-settings-subagent-review.md` (previous review, Revision 1)
**Verdict:** APPROVED TO IMPLEMENT

---

## Flag Resolution Status

### FLAG 1: Sprint 4 missing files with `formatNPR` calls — RESOLVED

**Original issue:** Sprint 4 was missing 5+ files with `formatNPR` calls (accounts/index.tsx, BulkInvoiceForm, FeeStructureList, OverdueAlertBanner, AgingReportCard), which would cause build failures when the old functions are deleted.

**Resolution:** The revised plan adds explicit tasks for every missing file:
- Task 4a.6 — OverdueAlertBanner.tsx (2 occurrences)
- Task 4a.7 — AgingReportCard.tsx (3 occurrences)
- Task 4b.4 — accounts/index.tsx (13 occurrences)
- Task 4b.5 — BulkInvoiceForm.tsx (8 occurrences)
- Task 4b.6 — FeeStructureList.tsx (2 occurrences)

Additionally, Task 4c.1 adds a full grep audit step before deletion, which serves as a safety net if any call sites were still missed. The invoices/index.tsx and payments/index.tsx tasks (4b.1, 4b.3) now include explicit occurrence counts and "Grep confirms zero `formatNPR` calls remain" validation criteria.

**Verdict:** RESOLVED. All originally missing files are now covered with specific task numbers, occurrence counts, and validation criteria.

### FLAG 2: Duplicate `formatCurrency` — RESOLVED

**Original issue:** Task 2.1 proposed creating a new `packages/types/src/format-currency.ts`, duplicating the existing `formatCurrency` in `packages/shared-types/src/utils/currency.ts`.

**Resolution:** Task 2.1 is now titled "Extend existing formatCurrency in shared-types with compact/short modes" and explicitly targets `packages/shared-types/src/utils/currency.ts`. The plan adds `compact` and `short` display modes to the existing utility with clear abbreviation rules (L/Cr for south_asian, K/M/B for international). A re-export from `packages/types/src/payment.ts` is included for backward compatibility during migration.

**Verdict:** RESOLVED. No duplicate utility is created. The existing canonical location is extended.

### FLAG 3: Missing Zod schema update — RESOLVED

**Original issue:** The `regionalSettingsSchema` at `packages/shared-types/src/schemas/identity/tenant.schema.ts` only validated 5 fields. Without updating it, PATCH requests with new fields would be silently stripped.

**Resolution:** Task 0.2b is a dedicated task for updating the Zod schema. It includes the full schema definition with all 4 new fields (`defaultCurrency`, `defaultCalendarSystem`, `enableDualDateDisplay`, `defaultNumberFormat`) with correct Zod types and `.default()` values. Validation criteria explicitly tests that PATCH with new fields is not stripped and that existing payloads without new fields still pass (defaults kick in).

**Verdict:** RESOLVED. The Zod schema update is a first-class task with validation criteria covering both new and legacy payload shapes.

### FLAG 4: Shell context type boundary — RESOLVED

**Original issue:** The sprint plan did not clarify that `ShellContextValue` is a shell-internal type and MFEs should not import it.

**Resolution:** Task 1.1 now opens with a dedicated callout: "ShellContextValue is an exported interface. This extension is a shell-internal concern. MFEs must NOT import shell types -- they access settings via the school context channel (Task 1.4). The useWorkspaceSettings() hook is for shell-internal consumers only." Task 1.4 provides the MFE access path through `packages/config`, which is the correct shared package for cross-MFE contracts.

**Verdict:** RESOLVED. The boundary between shell-internal hooks and MFE-facing contracts is clearly articulated.

### FLAG 5: MFE backward compatibility — RESOLVED

**Original issue:** When Shell and MFEs are independently deployed, an older Finance build might receive `resolvedSettings: undefined` from the school context channel, or a newer Finance build might expect it from an older Shell.

**Resolution:** Multiple layers of defense:
1. Task 1.4 makes `resolvedSettings` optional in `SchoolContextPayload` (`resolvedSettings?: ResolvedSettings`)
2. `SYSTEM_DEFAULTS` is exported from `packages/config/src/defaults.ts` — a shared package, not shell-internal
3. `ResolvedSettings` type is exported from `packages/config/src/types.ts`
4. Task 4a.1 (Finance) explicitly uses `getSchoolContext().resolvedSettings ?? SYSTEM_DEFAULTS`
5. Task 5.1 (Academics) uses the same pattern
6. Task 4a.1 validation criteria includes: "When resolvedSettings is undefined, returns SYSTEM_DEFAULTS without errors"

**Verdict:** RESOLVED. The fallback is explicit, tested, and applied consistently in both consuming MFEs.

---

## Previous Suggestions — Adoption Status

| Suggestion | Status |
|-----------|--------|
| SUGGESTION 1: `useCurrency` convenience hook | Adopted — Task 2.4 creates the hook, Task 4a.1 pre-binds it in FinanceSettingsContext |
| SUGGESTION 2: Split Sprint 4 | Adopted — Sprint 4 is now 4a (overview), 4b (billing), 4c (cleanup) |
| SUGGESTION 3: Remove unrelated Auth Debug task | Adopted — removed from sprint, listed in Out of Scope as separate chore |
| SUGGESTION 4: Derive `numberFormat` from currency | Not adopted — `numberFormat` remains a stored field. Acceptable for MVP; derivation is a minor simplification and the explicit field gives admins control |
| SUGGESTION 5: Compact/short spec for existing utility | Adopted — Task 2.1 includes abbreviation rules for both south_asian and international grouping |

---

## Re-Verification: Product Correctness

**Does the plan close the "settings saved -> settings applied" gap end-to-end?**

YES. The pipeline is complete:
1. **Save path:** Workspace Settings UI (Sprint 3) -> PATCH API (Sprint 0 ensures fields exist + Zod passes) -> DynamoDB entity
2. **Read path:** Shell fetches settings on load (Task 1.1) -> resolves precedence (Task 1.3) -> broadcasts via school context channel (Task 1.4) -> MFEs consume (Tasks 4a.1, 5.1)
3. **Propagation on change:** Task 3.5 re-broadcasts resolved settings on save success, so MFEs pick up changes without full page reload
4. **Currency end-to-end:** `defaultCurrency` field -> `formatCurrency()` extension (Task 2.1) -> `useCurrency()` hook (Task 2.4) -> all 15 Finance files migrated (Sprints 4a/4b) -> old functions deleted (Sprint 4c)
5. **Date end-to-end:** `calendarSystem` + `enableDualDateDisplay` -> `formatDate()` utility (Task 2.2) -> Finance billing pages (Task 4b.8) + Academics (Task 5.2-5.3)

No dead-end branches. Settings flow from save to display in every consuming module.

## Re-Verification: Technical Correctness

**Single resolved settings context with precedence chain?**

YES.
- One `useResolvedSettings()` hook (Task 1.3) with a clearly defined 4-level precedence: School Config > School Entity > Tenant Settings > SYSTEM_DEFAULTS
- One broadcast mechanism (school context channel) for MFE access
- One set of shared formatting utilities in `packages/shared-types` and `packages/types`
- No module fetches settings independently; all go through the resolved context

**Shared utilities?**

YES.
- `formatCurrency` extended in existing `packages/shared-types/src/utils/currency.ts` (not duplicated)
- `formatDate` and `formatDateTime` created as new utilities (no existing equivalent; confirmed by audit)
- `useCurrency` convenience hook reduces boilerplate across 15+ files

## Re-Verification: MVP Scope Discipline

**Not over-engineered?**

YES. The plan adds exactly 4 new fields to the data model, extends one existing utility, creates two new formatting utilities, and wires them through an existing broadcast channel. It does not:
- Build a full localization framework
- Create school-level settings override UI
- Add multi-currency invoicing
- Touch People/HR or parent portal
- Rebuild table components (only modifies cell renderers)

The sprint count (0-6) is proportional to the scope. Sprint 4's split into 4a/4b/4c is good risk management for the largest migration surface.

---

## NEW Issues Found

### OBSERVATION 1: `packages/types/src/hooks/useCurrency.ts` location may cause import issues (NON-BLOCKING)

Task 2.4 places `useCurrency` in `packages/types/src/hooks/useCurrency.ts`. The `packages/types` package is typically pure types and utility functions, not React hooks. Putting a React hook here means `packages/types` would need a React dependency. Consider placing it in `packages/ui/src/hooks/` or alongside the Finance context in `apps/finance/src/hooks/` instead.

**Severity:** Non-blocking. The hook is thin (3 pre-bound functions) and can be relocated during implementation without affecting the plan's architecture.

### OBSERVATION 2: Task 4b.9 scope may be wider than described (NON-BLOCKING)

Task 4b.9 targets `formatRelativeDate()` in `packages/types/src/finance-utils.ts` (lines 100-130), but `finance-utils.ts` may contain other date/time formatting that also needs migration. During implementation, the developer should audit the full file, not just the specified function.

**Severity:** Non-blocking. Task 4c.1 (full grep audit) would catch any missed call sites before deletion.

### OBSERVATION 3: E2E test (Task 6.1) depends on test seed data for US school (NON-BLOCKING)

The E2E spec includes "Verify Westfield High (US school) with USD+Gregorian settings shows correctly." This assumes a Westfield High test fixture exists with USD configuration. The test setup should ensure this fixture is seeded, or the spec should create it as part of the test.

**Severity:** Non-blocking. Standard E2E test authoring concern.

---

## Summary

| # | Flag | Status |
|---|------|--------|
| 1 | Sprint 4 missing files with `formatNPR` calls | RESOLVED — Tasks 4a.6, 4a.7, 4b.4, 4b.5, 4b.6 added + grep audit in 4c.1 |
| 2 | Duplicate `formatCurrency` | RESOLVED — Task 2.1 extends existing `shared-types/utils/currency.ts` |
| 3 | Missing Zod schema update | RESOLVED — Task 0.2b added with full schema and validation criteria |
| 4 | Shell context type boundary | RESOLVED — Task 1.1 explicitly documents MFE boundary |
| 5 | MFE backward compatibility | RESOLVED — Optional field + `SYSTEM_DEFAULTS` export + `??` fallback in all consumers |

New issues found: 3 non-blocking observations (hook placement, finance-utils audit scope, E2E test fixtures).

---

## Final Verdict: APPROVED TO IMPLEMENT

All 5 blocking flags from the previous review have been addressed with concrete, verifiable changes. The revised plan:

- Closes the settings saved -> settings applied gap end-to-end
- Maintains a single resolved settings context with a clear precedence chain
- Extends existing shared utilities rather than duplicating them
- Respects MFE architecture boundaries with explicit backward compatibility
- Stays within MVP scope without over-engineering

The 3 non-blocking observations can be addressed during implementation without plan revision. Begin with Sprint 0.
