# EdForge Design System Sprint Plan — FINAL

**Date:** 2026-06-08  
**Scope:** presentation layer only  
**Execution model:** independently shippable work-streams; no calendar/week estimates  
**Pilot rule:** migrate **People** end-to-end before fan-out  
**Review rule:** one primitive per PR, one token batch per PR, one MFE page sweep per PR; target hard cap ~15 files per PR

## 0. Operating rules

1. No features, no route changes, no API/service/data-model changes.
2. No ground-up redesign. The EdForge palette stays; only semantic naming, consumption discipline, primitive states, density, accessibility, and motion change.
3. Do not touch `packages/theme/src/base.css` until a dedicated Plan-mode review approves the exact token diff.
4. Do not widen the `zod` pin (`~3.24.4`).
5. No big-bang sweep PRs.
6. Every PR includes:
   - what changed;
   - before/after screenshots;
   - contrast delta;
   - ESLint violation delta;
   - gate results;
   - visual-regression review notes.
7. If any gate fails, the PR pauses. Do not defer failures to the next PR.

## 1. Stop-the-line gates for every PR

| Gate | Required result |
|---|---|
| Typecheck | `pnpm turbo typecheck` clean |
| Lint | `pnpm turbo lint` clean; zero net-new warnings/errors |
| Unit tests | `pnpm vitest run` green |
| Contrast | WCAG token/component contrast test green for the supported matrix |
| Focus rings | Focus-ring test green for changed interactive primitives |
| Visual regression | Zero unexpected light-mode drift; dark-mode expected drift reviewed with screenshots |
| PABSON smoke | login → dashboard → one academic flow → one finance flow → settings; both themes; zero console errors |

## 2. Stream 0 — Pre-flight governance and proof

**Goal:** make later visual/token claims measurable before any design-system cleanup lands.

**Why first:** The audit found hundreds to thousands of violations. Without manifests, contrast tests, focus tests, and visual regression, every token or primitive PR is unverifiable.

**Google/Apple anchor:** Google Admin and ChromeOS Admin rely on stable table/detail layouts where regressions are costly. Apple HIG requires testing color/motion/accessibility variants rather than relying on static inspection.

### PR 0.1 — Visual regression harness

Files: existing `e2e/` area or approved Playwright config path.

Work:
- Add PABSON pilot fixtures/session setup.
- Capture baseline screenshots for:
  - shell dashboard;
  - People staff directory;
  - Academics representative page;
  - Finance representative page;
  - Settings representative page;
  - light and dark themes.
- Store baseline review instructions.

Acceptance:
- Playwright can run locally.
- Baselines are deterministic enough for review.
- No production UI code changes.

### PR 0.2 — WCAG contrast baseline test

Files:
- `packages/ui/src/components/__tests__/contrast.test.ts` or equivalent.

Work:
- Use `wcag-contrast`.
- Parse theme tokens.
- Encode the supported semantic pair matrix.
- Record current failing pairs as the to-fix baseline.

Acceptance:
- Test output clearly lists current failures.
- The baseline list matches the final audit: border tokens, accent/action foregrounds, contextual `text-tertiary` pair, dark focus/accent pair.

### PR 0.3 — Focus-ring baseline test

Files:
- `packages/ui/src/components/__tests__/focus-ring.test.tsx` or equivalent.

Work:
- Render every interactive primitive.
- Assert a `:focus-visible` outline/ring class or semantic focus style.
- Include Button, Dropdown, FilterTabs, Accordion, Table/DataTable rows, AttendanceHeatmap nav/grid cells, clickable Card/Tag patterns.

Acceptance:
- Missing focus coverage is visible as a baseline manifest.
- Future primitive PRs can turn entries green one at a time.

### PR 0.4 — ESLint design-system warning manifest

Files:
- `packages/config/eslint-design-system.js` or equivalent.
- `eslint.config.js`.

Work:
- Warn on hardcoded presentation colors in `apps/**` and `packages/ui/**`.
- Warn on arbitrary spacing/type utilities matching the audited regex.
- Support allow-comments with required justification.
- Emit/count current violations.

Acceptance:
- Rules are warnings only.
- Existing debt is measurable.
- No rule is ratcheted to error yet.

### PR 0.5 — Repo-scoped Tailwind v4 alias PoC

Files:
- Prefer a disposable test fixture or documented build proof.
- No `packages/theme/src/base.css` edits unless separately approved.

Work:
- Prove one renamed token alias can be consumed via Tailwind v4 in the actual repo build path.
- Verify no consumer breaks.

Acceptance:
- Build proof exists.
- If PoC fails, Stream 2 token plan is rewritten before token work.

## 3. Stream 1 — People pilot primitives

**Goal:** prove the whole design-system migration path on one MFE before fan-out.

**Pilot:** `people`, starting with staff directory and staff detail/drawer surfaces.

**Google/Apple anchor:** People staff directory should follow Google Admin’s user-list rhythm: compact rows, thin dividers, filter-first toolbar, visible keyboard focus. Staff drawer/sections should use Apple-like restraint: calm grouped sections, purposeful transitions, semantic states.

### PR 1.1 — Shared focus utility

Files:
- `packages/ui/src/utils.ts` or a small dedicated utility.
- Minimal primitive touch only if needed.

Work:
- Add semantic focus-ring class helper backed by `--interactive-focus` / future `--border-focus`.
- Use ring offset tied to semantic surface.

Acceptance:
- No visual drift except focus states.
- Focus-ring test can consume helper.

### PR 1.2 — Button and Dropdown focus semantics

Files:
- `packages/ui/src/components/Button.tsx`
- `packages/ui/src/components/Dropdown.tsx`

Work:
- Replace hardcoded teal focus rings with semantic focus utility.
- Do not change variants beyond focus unless required for testability.

Acceptance:
- Focus-ring test passes for Button and Dropdown.
- Contrast test does not regress.

### PR 1.3 — FilterTabs primitive

Files:
- `packages/ui/src/components/FilterTabs.tsx`
- tests.

Work:
- Remove inline `background`/`color`.
- Add semantic active/default/hover/pressed/focus states.
- Preserve API.
- Add keyboard/focus semantics appropriate for tabs.

Acceptance:
- Existing consumer in parent portal still works.
- Finance inline tabs are not migrated until a later PR.

### PR 1.4 — Accordion primitive

Files:
- `packages/ui/src/components/Accordion.tsx`
- tests.

Work:
- Add semantic focus-visible state.
- Replace presentation inline styles where practical without changing APG behavior.
- Preserve keyboard behavior.

Acceptance:
- Existing tests remain green.
- Focus-ring test passes for Accordion.

### PR 1.5 — Table/DataTable interactive row states

Files:
- `packages/ui/src/components/Table.tsx`
- targeted `packages/ui/src/components/data-table/*` row/action files.

Work:
- Replace slate hardcodes with semantic surfaces/borders.
- Add focus-visible for clickable rows/actions.
- Keep pagination and server-pagination behavior unchanged.

Acceptance:
- Existing DataTable pagination tests pass.
- Row hover/focus/selected states visible in both themes.

### PR 1.6 — AttendanceHeatmap focus states

Files:
- `packages/ui/src/components/AttendanceHeatmap.tsx`
- tests.

Work:
- Add focus-visible styles to month nav buttons and focusable grid cells.
- Preserve status colors and ARIA labels.

Acceptance:
- Keyboard users can locate nav and grid focus.

### PR 1.7 — Layout primitives, one per PR

Separate PRs:
- `Container`
- `Stack`
- `Inline`
- `PageHeader`
- `SectionCard`
- `Heading`
- `Text`

Work:
- Add minimal primitives and exports.
- Document props inline.
- Do not sweep all apps yet.

Acceptance:
- Each primitive has a small story/test or usage fixture.
- No large consumer migration in primitive PRs.

### PR 1.8 — People staff directory pilot

Files:
- `apps/people/src/routes/staff.tsx`
- `apps/people/src/components/staff/StaffTable.tsx`
- supporting People-only staff components, under ~15 files.

Work:
- Normalize StaffTable cell/action presentation.
- Preserve `TanstackDataTable` data, columns, actions, row click, and navigation behavior.
- Replace inline arbitrary gaps/font sizes/colors where the new primitives/tokens cover them.
- Use shared focus states.

Acceptance:
- PABSON staff directory smoke passes in both themes.
- ESLint violation count decreases.
- No HR workflow behavior change.

### PR 1.9 — People staff drawer/overview pilot

Files:
- `apps/people/src/components/staff/StaffDrawer.tsx`
- targeted People overview cards/pages.

Work:
- Replace local SectionCard/PageHeader-style patterns with shared primitives.
- Keep content and actions unchanged.

Acceptance:
- People pilot demonstrates the end-to-end migration recipe before fan-out.

## 4. Stream 2 — Token semantic layer and WCAG fixes

**Goal:** safely evolve token names/roles and fix WCAG failures.

**Hard gate:** Before any PR in this stream touches `packages/theme/src/base.css`, present the exact proposed token diff for review and receive approval.

**Google/Apple anchor:** Google Admin’s flat-card + thin-divider rhythm requires reliable border/default/subtle tokens. Apple HIG requires semantic colors with light/dark variants and tested contrast.

### PR 2.1 — Token alias batch 1

Files:
- `packages/theme/src/base.css` only after explicit approval.
- `packages/theme/tailwind.config.js`
- contrast tests.

Work:
- Add new semantic aliases while keeping existing names:
  - `background.*`
  - `text.*`
  - `border.*`
  - `action.*`
  - `state.*`
- Do not remove old names.

Acceptance:
- Repo build passes.
- Alias PoC assumptions hold in real repo.
- Existing consumers remain intact.

### PR 2.2 — WCAG border/focus/action fixes

Files:
- `packages/theme/src/base.css` after approval.
- contrast tests.

Work:
- Fix border tokens to meet 3:1 for UI boundaries in supported contexts.
- Add/fix focus token with distinct dark value.
- Fix action foreground contracts so white is not used on failing accent backgrounds.

Acceptance:
- Contrast test green for supported matrix.
- Visual regression reviewed; light-mode drift intentional and minimal.

### PR 2.3 — Motion/elevation tokens

Files:
- theme token files and Tailwind config.

Work:
- Add motion duration/easing tokens.
- Add elevation tokens for flat/raised/overlay/modal/popover.
- Ensure reduced-motion compatibility.

Acceptance:
- No component migration yet except tests/fixtures.

## 5. Stream 3 — Fan-out by MFE page sweeps

**Goal:** replicate the People migration recipe across apps in reviewable slices.

**Google/Apple anchor:** Follow Google Admin density for data tables and settings; borrow Apple restraint for cards, drawers, and motion.

Order:

1. `people` completion after pilot validation.
2. `academics`
3. `finance`
4. `messages`, `analytics`, `special-programs`, `edfi`
5. `shell` host last

### PR pattern for each MFE page sweep

Work:
- Take the ESLint warning manifest for one page or tightly related group.
- Replace hardcoded colors with semantic tokens.
- Replace arbitrary spacing/type values with scale/primitives.
- Replace duplicated PageHeader/SectionCard/Stack/Inline/Heading/Text patterns.
- Keep routes/data/actions unchanged.

Acceptance:
- PR stays around ~15 files.
- ESLint violation delta is documented.
- Visual regression reviewed.
- PABSON smoke covers affected area if relevant.

### Known dedicated sweeps

| Area | File(s) | Reason |
|---|---|---|
| Finance inline tabs | `apps/finance/src/routes/billing/accounts/index.tsx` | Replace inline `TabButton` with shared `FilterTabs` |
| Academics quick profile | `apps/academics/src/components/students/StudentQuickProfile.tsx` | High arbitrary-value density |
| Shell settings academic setup | `apps/shell/src/pages/settings/tabs/AcademicSetupTab.tsx` | Highest arbitrary-value count; shell last unless isolated safely |
| Module overview duplicates | `apps/{people,messages,analytics,special-programs}/src/components/ModuleOverviewPage.tsx`, shell overview | Promote/consume shared layout after People pilot |
| Status badges | Finance/people/academics status badge components | Replace ad-hoc emerald/red/gray status colors with state tokens |

## 6. Stream 4 — Third-party styles, motion, elevation

**Goal:** resolve specialized presentation risks after core primitives/tokens stabilize.

### PR 4.1 — FullCalendar theme isolation

Files:
- `apps/shell/src/styles/fullcalendar-theme.css`
- calendar helper docs/tests as needed.

Work:
- Replace hardcoded button/focus/event values where semantic state tokens support them.
- Preserve documented required `!important` rules.
- Keep print overrides stable.
- Do not change calendar data/event behavior.

Acceptance:
- Calendar visual regression reviewed in light/dark.
- Event taxonomy remains synced with `event-types.ts`.

### PR 4.2 — Modal/Drawer/Card/Dropdown elevation

Files:
- `packages/ui/src/components/Modal.tsx`
- `Drawer.tsx`
- `Card.tsx`
- `Dropdown.tsx`
- targeted inline `boxShadow` consumers.

Work:
- Replace `shadow-sm/md/xl` and inline shadows with elevation tokens.
- Keep hierarchy flat and restrained.

Acceptance:
- Dark mode shadows remain legible without heavy halos.

### PR 4.3 — Motion token adoption

Files:
- `Modal`, `Drawer`, popovers/dropdowns, optional `packages/ui/src/motion.ts`.

Work:
- Replace hardcoded durations/easings.
- Respect `prefers-reduced-motion`.
- Keep animation duration short and purposeful.

Acceptance:
- Reduced-motion path verified.
- No unexpected visual regression.

## 7. Stream 5 — Governance lock-in

**Goal:** make regressions expensive and correct usage cheap.

### PR 5.1 — Design-system docs

Files:
- `docs/design-system/README.md`
- `docs/design-system/component-states.md`

Work:
- Token reference.
- Primitive catalog.
- Density guidance.
- Motion guidance.
- Default/hover/active/focus/disabled/loading matrix.

Acceptance:
- New contributors can choose tokens/primitives without inspecting implementation.

### PR 5.2 — DEV-only showcase route

Files:
- `apps/shell/src/pages/dev/design-system.tsx`
- route registration only after route trace review.

Work:
- Showcase tokens, primitives, density, states, light/dark.
- Gated behind `import.meta.env.DEV`.

Acceptance:
- No production route exposure.
- Useful for visual regression fixtures.

### PR 5.3 — PR template

Files:
- `.github/PULL_REQUEST_TEMPLATE.md`

Work:
- Add checklist for hardcoded colors/arbitrary spacing.
- Require screenshots and gate results for presentation changes.

Acceptance:
- Template reinforces gates.

### PR 5.4 — ESLint ratchet

Files:
- design-system ESLint config.

Work:
- Move warn → error only after corresponding manifest is zero or approved threshold is reached.

Acceptance:
- CI blocks new hardcoded colors/arbitrary spacing.

### PR 5.5 — Deprecated alias removal

Files:
- `packages/theme/src/base.css` after explicit approval.

Work:
- Remove deprecated token aliases only after grep for old names is zero.

Acceptance:
- No old token consumers remain.
- Contrast and visual regression green.

## 8. PR sizing and branch guidance

Branch format per user brief:

```bash
feat/ds-<stream>-<primitive-or-page>
```

Examples:

- `feat/ds-0-contrast-baseline`
- `feat/ds-1-filter-tabs`
- `feat/ds-1-people-staff-table`
- `feat/ds-2-token-aliases`
- `feat/ds-3-finance-accounts-tabs`
- `feat/ds-4-fullcalendar-theme`
- `feat/ds-5-component-states-docs`

PR limits:

- One primitive per PR.
- One token rename/fix batch per PR.
- One MFE page sweep per PR.
- Target hard cap: ~15 files.

## 9. Approval checkpoint

This FINAL plan intentionally stops before production code changes. After review/approval, execution begins with **Stream 0 only**. Stream 2 token edits require a separate explicit review before `packages/theme/src/base.css` changes.
