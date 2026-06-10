# UI/UX Final Sprint — Inline-Style → Class Conversion (presentation-debt sweep)

**Status:** planned · **Owner:** frontend · **Type:** cleanliness ratchet (no intended visual change)

## 1. Context — where the UI/UX epic stands

The platform-wide UI/UX hardening is essentially complete:

- **Design-system migration** — academics + finance MFEs fully on `@edforge/ui`
  primitives (forms, tables, `StatusBadge`, avatars); native `<select>`/`<input>`
  and hand-rolled chips retired.
- **Theme unification** — the dual teal/`--v2-*` palette was collapsed onto one
  canonical, **WCAG-AA-tuned, warm/neutral** theme (`packages/theme`); the
  `[data-v2]` override + `home-v2-tokens.css` were deleted.
- **Correctness fixes** — the malformed `]0` invisible-button class, the
  grading-period `periodId`/`termId` contract bug, unbounded gradebook table.
- **Dead code** — prototype MFEs removed; analytics parked.

**This sprint closes the last presentation-layer debt:** the inline `style={{…}}`
objects left over from the "V2 prototype" era. They are flagged by the
`edforge-design-system/no-presentation-style-objects` ESLint rule (currently a
**warning**, not a build breaker). The colors are already correct (semantic
tokens after the v2 sweep) — this is about moving presentation from inline
`style` to Tailwind classes so the rule can be flipped to **`error`** and the
ratchet closed.

## 2. Objective & exit criteria

- Drive `no-presentation-style-objects` from **~1,628 → 0** on operator-facing
  surfaces (landing/marketing is a lower-priority tail — see tiers).
- **Zero visual regressions** — this is a no-visual-change refactor; every PR is
  preview-QA'd.
- Genuinely-dynamic styles are kept inline with an explicit
  `// allow-presentation-style: <reason>` marker (the rule's sanctioned escape).
- **Final step:** flip the rule `warn → error` in `eslint.config.*` once Tier 1+2
  are at 0, so new inline styles can't regress.

## 3. Scope (measured)

| App | Warnings | Notes |
|---|---:|---|
| `apps/academics` | ~715 | dashboards, overview-v2 cards, students/registration, reports, routes |
| `apps/shell` | ~741 | **operator:** home dashboards (158), auth/layout (102), portals (83+); **landing/marketing:** landing-v2 + galleries (~140) |
| `apps/finance` | ~172 | overview-v2 cards (billing health / collection / invoice-status), filter row |
| `apps/people` | 0 | already clean |

### Heaviest files (PR anchors)

`grades/overview.tsx` (91) · `attendance/dashboard.tsx` (85) · `students/CSVImport.tsx`
(77) · `reports/GovernmentReportsExport.tsx` (54) · `students/index.tsx` (40) ·
`overview-v2/BillingHealthCard.tsx` (37) · `overview-v2/AcademicsHealthCard.tsx`
(37) · `registration/RegistrationWizard.tsx` (34) · `ForgotPasswordPage.tsx` (38) ·
`LoginPage.tsx` (32) · `home/AttendanceBySectionCard.tsx` (33).

## 4. The playbook (apply consistently — this is the contract)

### 4.1 Decision rule per `style={{…}}`

- **Static** color / type / spacing / radius / border → convert to a Tailwind
  `className` using **semantic tokens**.
- **Dynamic** (computed widths `${pct}%`, SVG chart geometry, per-datum colors,
  animated/measured values, `gridTemplateColumns` from data) → **keep inline**
  and add `// allow-presentation-style: <reason>` on the line above. Charts
  (TrendChart SVG, donut rings, bar widths, heatmaps) are the canonical case.

### 4.2 Size / weight / spacing mapping

| Inline | Class | Inline | Class |
|---|---|---|---|
| `fontSize: 9` | `text-[9px]` | `fontWeight: 500` | `font-medium` |
| `fontSize: 10` | `text-[10px]` | `fontWeight: 600` | `font-semibold` |
| `fontSize: 11` | `text-[11px]` | `fontWeight: 700` | `font-bold` |
| `fontSize: 12` | `text-xs` | `padding: 16` | `p-4` |
| `fontSize: 13` | `text-[13px]` | `padding: '12px 16px'` | `px-4 py-3` |
| `fontSize: 14` | `text-sm` | `padding: '14px 16px'` | `px-4 py-3.5` |
| `fontSize: 20` | `text-xl` | `marginTop: 1` | `mt-px` |
| `textTransform: 'uppercase'` | `uppercase` | `letterSpacing: '0.5px'` | `tracking-[0.5px]` |
| `borderRadius: 10` | `rounded-[10px]` | `gap: 8` | `gap-2` |

### 4.3 Color mapping (semantic tokens only)

- Text: `--text-primary/secondary/tertiary/disabled` → `text-[rgb(var(--text-*))]`.
- Surfaces: `--background-secondary/tertiary` → `bg-[rgb(var(--background-*))]`.
- Borders: `--border-primary` (use `/0.35` for the subtle default) → `border-[rgb(var(--border-primary)/0.35)]`.
- **Status / attendance / grade accents** (present/paid → green, absent/overdue →
  red, late → amber, excused → blue) → canonical **`--state-*` tones**
  (`text-[rgb(var(--state-success-fg))]`, etc.). **Do not** put vivid prototype
  hex (`#378ADD`, `#EF9F27`, `#E24B4A`) in a `className` — `no-hardcoded-colors`
  forbids it, and the state tones are the unified, theme-aware choice.
- **Module accents** → the `--accent-*` palette in `packages/theme`
  (`bg-[rgb(var(--accent-academics)/0.12)]`, etc.).
- Only `#1D9E75` (green) and `#7F77DD` (purple) are accepted brand literals.

### 4.4 Bonus correctness wins (do these while in the file)

- Replace any residual hardcoded `rgba(255,255,255,0.0x)` / `rgba(0,0,0,0.0x)`
  (skeleton shimmers, dividers) with semantic tokens — these wash out in light
  mode and are real bugs, not just lint.
- Extract repeated card chrome into shared class-string consts
  (`const CARD = 'bg-… border … rounded-[10px] overflow-hidden'`) and apply via
  `className={CARD}` — kills many warnings at once and de-dupes.

## 5. Tickets (PR-sized, sequenced)

Each ticket = one reviewable PR, one cluster, independently mergeable. Order is
operator-impact first; landing/marketing last.

### Tier 1 — operator dashboards & cards (highest impact)
- **T1.1** `academics/routes/attendance/dashboard.tsx` (85) — charts stay inline + marker.
- **T1.2** `academics/routes/grades/overview.tsx` (91) — `GradeOverview` analytics.
- **T1.3** `academics/components/overview-v2/*` (AcademicsHealthCard 37 + AtRisk/Enrollment/Attendance cards).
- **T1.4** `finance/components/overview-v2/*` (BillingHealth 37, Collection 29, InvoiceStatus 21, Aging/Recent, FilterRow).
- **T1.5** `shell/components/home/*` (158 — AttendanceBySection 33, FinanceSummary 23, MySections, GettingStarted, AdminCommandCenter…).

### Tier 2 — operator flows & portals
- **T2.1** `academics/students/*` (CSVImport 77, StudentQuickProfile 18, students/index 40).
- **T2.2** `academics/students/registration/*` (RegistrationWizard 34, EnrollmentStep 22, MedicalStep, CollapsibleSection).
- **T2.3** `academics/reports/GovernmentReportsExport.tsx` (54).
- **T2.4** `academics` route shells (classrooms 27, enrollment 23, curriculum 22, overview).
- **T2.5** `shell/pages/portal-shared/*` (83) + `shell/pages/parent-portal/*` (61).
- **T2.6** `shell/components/layout/*` — **LoginPage (32) + ForgotPasswordPage (38)** (high-visibility auth).

### Tier 3 — landing / marketing / dev (lowest priority; can defer)
- **T3.1** `shell/components/landing-v2/*` (preview galleries, section visuals, district/teacher/student demo dashboards — ~140).
- **T3.2** `shell/components/landing/*` (Navbar 28, pages).

### Tier 4 — close the ratchet
- **T4.1** Flip `no-presentation-style-objects` to **`error`** in the ESLint flat
  config once Tier 1+2 are at 0 (Tier 3 either done or path-allowlisted). Add a
  one-line note to `CLAUDE.md`.

## 6. Cadence, risk & definition of done

- **One PR per ticket.** Keep diffs reviewable; a 90-warning file is one PR.
- **No-visual-change intent.** The conversion must be pixel-equivalent except the
  deliberate improvements in §4.4 (state-tone accents, fixed white-rgba).
- **Per-PR validation gate:**
  1. `pnpm --filter @edforge/<app> typecheck` clean.
  2. `vitest run` for the app green.
  3. `eslint <file/dir>` shows the target's `no-presentation-style` count at **0**
     (and no new errors) — paste the before/after delta in the PR.
  4. **Preview QA** (required — it's visual): the surface, **both light + dark**,
     looks identical; for chart tickets attach a before/after screenshot.
- **Done** when: Tier 1+2 at 0 warnings, the rule is flipped to `error`, and each
  surface has a preview QA sign-off.

## 7. Notes / gotchas

- Follow the **route → component** trace before editing (CLAUDE.md frontend trap)
  — several dashboards render differently-named components than their file.
- The shared `V2` object in some dashboards (`attendance/dashboard.tsx`) already
  maps to semantic tokens; its text/border members get inlined into classes, but
  its accent members (`success`/`info`/…) feed chart `stroke`/`fill` and stay
  (those are dynamic-viz inline, marker them).
- Two-repo hygiene + branch discipline per CLAUDE.md.
