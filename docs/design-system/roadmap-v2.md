# EdForge MFE Design-System — Review of PR #134 & Roadmap Epic v2

**Date:** 2026-06-08
**Author:** Engineering review (taking over from Cursor PR #134)
**Scope:** presentation layer only (`apps/`, `packages/ui`, `packages/theme`, `packages/forms`, `packages/wizard`)
**Inputs reviewed:** PR #133 (merged token + primitive foundation), PR #134 (open — form primitives + settings/onboarding migration), `docs/design-system-audit-FINAL.md`, `docs/design-system-sprint-plan-FINAL.md`
**North star:** Google-for-Education operator quality + Apple HIG restraint — calm, spacious, institutional-grade, intuitive. Not a redesign; a discipline-and-governance project.

---

## Part A — Where we are

The effort has two landed/proposed increments and one canonical plan they are supposed to follow.

| Artifact | What it delivered | Status |
|---|---|---|
| **`design-system-audit-FINAL.md`** | Re-audit of presentation debt: **327** hardcoded `white/black`, **400** `gray/slate-*`, **994** arbitrary Tailwind size/spacing values, **1,913** inline presentation `style={{}}` blocks, incomplete focus-ring coverage, 2 key WCAG token failures. Verdict: *discipline + governance project, not a rewrite.* | Reference |
| **`design-system-sprint-plan-FINAL.md`** | The canonical plan. Operating rules: no big-bang PRs, **~15 files/PR cap**, one primitive / one token batch / one MFE page sweep per PR, **People migrated end-to-end first** as the pilot, **stop-the-line gates on every PR** (typecheck, lint, vitest, contrast, focus, visual-regression, PABSON smoke). Streams 0→5. | Canonical plan |
| **PR #133 (merged)** | Token foundation in `base.css` (warm light canvas, ink/teal dark, full semantic families, elevation + motion scales), focus utilities, semantic cleanup of existing primitives, layout/typography primitives (Container/Stack/Inline/PageHeader/SectionCard/Heading/Text), contrast + focus-ring tests, design-system ESLint rules, visual-regression harness, docs. | ✅ Merged |
| **PR #134 (open)** | **New form primitives** (Field, Input, Textarea, Select, Combobox, Checkbox, RadioGroup, Switch), **state primitives** (InlineAlert, EmptyState, LoadingState, ErrorState), **Tabs/SegmentedControl**, **PageShell**, MFE page-scaffolding CLI + templates, expanded ESLint guardrails, docs (`forms.md`, `page-recipes.md`), and **migration of 4 screens** (workspace settings, school-wizard BasicInfo, onboarding Create-School + Academic-Year). 52 files, +3,757/−873, 15 commits. | 🟡 Open, reviewed here |

**One-line status:** the *primitive library* is now genuinely strong; the *governance/sequencing discipline* the plan demands has drifted, and the *migration surface* is barely dented (≈ 0.5% of the screens that need it).

---

## Part B — Technical review of PR #134

### B.1 What is genuinely good

The new primitives are the strongest work in the effort so far. Evidence:

- **Token discipline is excellent.** Every color in the 13 reviewed components is `rgb(var(--…))` — including alpha composites like `bg-[rgb(var(--state-info-bg)/0.35)]`. Zero hardcoded hex/named colors. Dark mode is safe *by construction* (no `dark:` overrides needed; everything resolves through theme variables).
- **Consistent architecture.** Every control follows the same `forwardRef` + `cva` variant + `Field`-context-resolution pattern, with `displayName`s and clean barrel exports (`forms/index.ts`, `layout/index.ts`, `states/index.ts`). API design is coherent.
- **`Field` is a proper anatomy primitive** (`forms/Field.tsx`): generated IDs via `useId`, correct `aria-describedby` precedence (error → helper), `role="alert"` on errors, required/optional/locked metadata, and three densities (`default`/`compact`/`inline`). This is the right backbone.
- **`Select`/`Combobox` are real listbox/combobox widgets** built on Headless UI — keyboard select, typeahead, clearable, loading/empty states, token-correct option highlighting (`data-[focus]`, `data-[selected]`). This is the key native-`<select>` replacement and it is well-built.
- **State + layout primitives** (`LoadingState` `role="status"`+`aria-live`, `ErrorState` `role="alert"`, `InlineAlert` severity→role switch, `PageShell` per-variant width map) are clean and correctly announced.
- **Tests exist** for happy-path interaction (selection, filtering, Field ARIA wiring, character count) across `forms.test.tsx`, `select-combobox.test.tsx`, `choice-controls.test.tsx`, `states-tabs-page-shell.test.tsx`.

**Primitive quality grade: B+ / A-.** A small number of real defects (below) hold it back from an A.

### B.2 Defects — ranked

| # | Severity | Location | Issue |
|---|---|---|---|
| 1 | **Bug (functional)** | `forms/Checkbox.tsx` | `indeterminate` is **cosmetic only** — it sets `aria-checked="mixed"` + a `Minus` icon but never sets the DOM `input.indeterminate` property (needs a ref effect). Native/AT semantics are wrong. Also a stale `resolvedChecked` second source of truth for uncontrolled use. |
| 2 | **Bug (latent)** | `BasicInfoStep.tsx:79` | `AnimatedSelect` declares `forwardRef<HTMLSelectElement>` then **`void ref`** — the forwarded ref is discarded. The type signature lies; any future RHF `register`/focus wiring silently no-ops. |
| 3 | **Bug (dead props)** | `forms/SelectField.tsx:79-81` | `prefix`, `icon`, `showSuccessState` are public props that are **discarded** (`void …`). Consumers get silent no-ops. Implement or remove from the type. |
| 4 | **A11y gap** | `Tabs.tsx` | Not a complete WAI-ARIA tabs widget — no roving `tabIndex`, no Arrow/Home/End keys, no `aria-controls`/panel association. `SegmentedControl` reuses `role="tab"`, which is semantically wrong for a segmented control. |
| 5 | **A11y gap** | `forms/RadioGroup.tsx` | `name` is optional; without it native radio grouping (arrow keys + DOM-level exclusivity) breaks. Auto-generate a `useId()` fallback name. |
| 6 | **A11y gap** | `forms/Switch.tsx` | `<label htmlFor>` targeting a `<button>` plus an internal `sr-only` label risks double-announcement / non-functional label clicks; `description` is not linked via `aria-describedby`. |
| 7 | **A11y nit** | Input / Textarea / Combobox | Loading/success/character-count states are visual-only — no `aria-busy`/`aria-live`/`aria-describedby`, so state changes are silent to AT. |
| 8 | **Hygiene** | `workspace.tsx:154`, `:535` | Dead commented `INPUT_CLASS` constant parked behind "COMING SOON" (the exact name-collision booby-trap to avoid); malformed className `…/0.18))0/10` stray suffix at `:535`. |

None of defects 1–7 are covered by the existing tests.

### B.3 Architectural concern — two parallel form systems

PR #134 ships a polished react-hook-form adapter layer (`@edforge/forms`: `TextField`/`SelectField`/`TextareaField`/`ToggleField`) **and simultaneously migrates the 4 flagship screens around it** — all four import the lower-level `Field`/`Input`/`Select` from `@edforge/ui` directly, and `BasicInfoStep` hand-rolls `AnimatedInput`/`AnimatedSelect` shims that re-introduce exactly the indirection the design system is trying to delete. `@edforge/forms` is imported in only ~24 files and the new screens don't grow that number.

The result is two competing "how do I build a form" answers with no documented rule for which to use when. `docs/design-system/forms.md` states the *intent* (`@edforge/forms` wraps `@edforge/ui`), but the migration didn't follow it. **This is the most important thing to resolve before fan-out** — otherwise every downstream MFE sweep inherits the ambiguity.

### B.4 Migration quality (the 4 screens)

- `workspace.tsx` — **Good.** All regional dropdowns → shared `Select` via a thin `WorkspaceSelect` wrapper; dual-date toggle → `Switch`; lock-guarding, sparse-diff save, archetype constraints preserved. (Carries the two hygiene nits in B.2 #8.)
- `CreateSchoolStep.tsx` — **Clean.** Fully primitive-based; skip/create logic preserved. Still uses raw `<h2>/<p>` with token classes instead of `Heading`/`Text`, and hardcodes US grade options (`PK,K,1–12`) rather than archetype-aware defaults; `schoolType as any` carried forward.
- `AcademicYearStep.tsx` — **Clean.** Fully primitive-based. Uses a different error treatment (`err instanceof Error`) than its sibling (`extractApiErrorMessage`) — unify.
- `BasicInfoStep.tsx` — **Half-migrated.** Controls are primitives but wrapped in `AnimatedInput`/`AnimatedSelect` shims (with the dropped-ref bug #2), and the Grade-Range row keeps a bespoke `<label>` + `text-rust-500` asterisk instead of `Field`'s required grammar.

### B.5 Governance gaps (the most consequential findings)

1. **No CI exists.** `.github/workflows/` is empty (only a PR template). The plan's seven "stop-the-line gates on every PR" are **entirely manual** — the only automated check on PR #134 is the Vercel preview build. There is no husky/lint-staged either. So none of typecheck/lint/vitest/contrast/focus/visual-regression actually gate anything.
2. **Form-migration lint rules are advisory.** `prefer-ui-select`, `prefer-ui-form-controls`, `no-local-form-style-constants`, `no-presentation-style-objects` are all `warn` (not `error`) — they will **not stop the next native `<select>` from landing**. (`no-hardcoded-colors` / `no-arbitrary-tailwind-values` *are* `error` on `apps/**`+`packages/ui/**`.) The root config header comment "design-system rules are errors now" is only true for the color/scale pair — mildly misleading.
3. **Lint glob holes.** `packages/date-utils` (which contains a native `<select>` in `BSDateInput.tsx`) is outside every design-system glob and entirely unlinted.
4. **PR is 52 files** — well over the plan's **~15-file cap** and bundles ~13 primitives + states + tabs + scaffolding + ESLint + docs + 4 migrations into one reviewable unit. This is the "big-bang sweep" Operating Rule #5 forbids.
5. **`/dev/design-system` route** is registered unconditionally under `protectedRoute`; the page self-gates with `if (!import.meta.env.DEV)` (so it renders nothing in prod), but the route + component are still bundled into the production shell. Minor.

### B.6 Remaining un-migrated surface (the scale problem)

| Metric | Count |
|---|---|
| Native `<select>` in `apps/` | **148 occurrences / 78 files** |
| Local form-style `const` declarations (`inputClass`/`selectClass`/…) | **54** |
| Shell-settings files (the PR's own stated zone) still on native `<select>` | **~15** — incl. `LEAForm.tsx`, `OrgNetworkForm.tsx`, every `edorg-form-sections/*ArraySection.tsx`, `GradingScaleEditor.tsx`, `SchoolAssignmentManager.tsx`, and **`EdFiComplianceStep.tsx` — a sibling step in the very wizard this PR touched** |
| Arbitrary Tailwind values / inline-style blocks (from audit) | **994 / 1,913** |

PR #134 migrated 4 of ~80+ form-bearing screens. The library is ready; the rollout has not started in earnest.

---

## Part C — Strategic assessment vs the plan & the design north star

### C.1 Where the effort drifted from `sprint-plan-FINAL.md`

| Plan rule | Reality in #133/#134 | Verdict |
|---|---|---|
| **People migrated end-to-end first** (pilot before fan-out) | #134 piloted **shell settings + onboarding**, not People | ⚠️ Pilot target changed without a recorded decision |
| **~15 files / one concern per PR** | #133 and #134 are both large multi-concern bundles (52 files in #134) | ⚠️ Big-bang pattern |
| **Stop-the-line gates on every PR** | No CI; gates are manual | ❌ Not enforced |
| No `base.css` edits without approved diff | Honored (tokens stable since #133) | ✅ |
| Build the primitive catalog | Substantially done and high quality | ✅ Ahead of plan here |

The drift is not fatal — the primitive work is good and largely *ahead* of where the plan expected to be — but the **sequencing and enforcement** halves of the plan have lapsed, which is precisely the risk the audit called out (this is a "discipline and governance project").

### C.2 Against the Apple/Google north star

The token system already encodes the right instincts — warm off-white canvas, restrained ink/teal dark mode, flat cards with thin borders + reserved elevation, short purposeful motion durations (80/150/220/320ms with standard/enter/exit easings). The primitives consume them faithfully. What is *not yet proven* is the thing the north star is actually about: **a whole operator screen that feels calm, spacious, and intuitive end-to-end.** We have a parts bin, not a finished room. The migrated settings/onboarding screens are a start but are interleaved with un-migrated siblings, so an operator walking the flow still hits inconsistent density, native dropdowns, and bespoke labels mid-journey. **Consistency across a full journey — not primitive count — is the metric that matters next.**

---

## Part D — Corrections needed before PR #134 merges

Tightly scoped; none require redesign.

**Must-fix (blockers):**
1. Fix `Checkbox` indeterminate (ref effect to set `input.indeterminate`). (B.2 #1)
2. Fix or remove the dropped ref in `AnimatedSelect` — better, **delete the shim** and use `Field`+`Select` directly to match `CreateSchoolStep`. (B.2 #2, B.4)
3. Either wire or remove the dead `SelectField` props. (B.2 #3)
4. Resolve the **two-form-systems** question and document the rule in `forms.md` (recommendation: `@edforge/forms` for any RHF-bound form; `@edforge/ui` primitives only for trivial local-state forms). (B.3)
5. Remove dead `INPUT_CLASS` + fix the malformed className in `workspace.tsx`. (B.2 #8)

**Should-fix (this PR or immediate follow-up):**
6. `RadioGroup` `useId()` fallback `name`; `Switch` label wiring; `Tabs` roving-tabindex + arrow keys (or rename roles). (B.2 #4–6)
7. Add `aria-busy`/`aria-live` to loading/count states. (B.2 #7)
8. Add `packages/date-utils` to the ESLint globs. (B.5 #3)

**Governance (separate, urgent PR — see Epic G):**
9. Stand up CI so the gates are real.

---

## Part E — Roadmap Epic v2

This restates the FINAL plan's intent with the actual post-#134 state baked in. **Re-sequenced so governance comes before fan-out** (you cannot safely fan out across 80 files with no CI). Epics are independently shippable; PR cap stays ~15 files.

### Epic G — Governance hardening (do this FIRST)
*Why first: the audit and plan both depend on enforceable gates, and none exist.*
- **G.1** Add `.github/workflows/ci.yml`: `pnpm turbo typecheck` + `pnpm turbo lint` + `pnpm vitest run` on every PR. This is the single highest-leverage change in the whole effort.
- **G.2** Add the visual-regression + contrast/focus tests to CI (PABSON fixture, light+dark, animations disabled). Wire `e2e/tests/design-system-visual-regression.spec.ts`.
- **G.3** Close the lint glob hole (`packages/date-utils`); decide the warn→error ratchet schedule for the four form rules (keep `warn` until the migration manifest is near-zero, then flip — Operating Rule mirrors `sprint-plan` §5.4).
- **G.4** Optional: husky + lint-staged for local fast-fail.
- *Exit:* a red PR cannot be merged; the seven stop-the-line gates run automatically.

### Epic P — Primitive completion & correctness
*Close the defects so downstream consumers build on solid ground.*
- **P.1** Land Part D must-fixes #1–#3, #6–#7 (Checkbox indeterminate, Tabs keyboard, RadioGroup name, Switch labels, aria states).
- **P.2** Resolve two-form-systems; codify in `forms.md`; delete shim patterns.
- **P.3** Fill the remaining catalog gaps the audit/plan name and the migration will need: **Modal/Drawer form-footer recipes**, **status-badge** primitive (state-token-backed, to replace ad-hoc emerald/red/gray), and a documented **GradeRangeField** recipe (composed dual-`Select` with shared error region).
- *Exit:* every primitive passes its own a11y test; one canonical form API.

### Epic S — People pilot (honor the plan's pilot rule)
*Prove the full-journey recipe on one MFE before fan-out — the step #134 skipped.*
- **S.1** People staff directory (table density, focus, toolbar) → **S.2** staff drawer/overview. ≤15 files each.
- *Exit:* a complete People journey is consistent end-to-end in both themes, zero console errors, ESLint violation count for People drops to ~0. This becomes the reference recipe.

### Epic T — Settings & onboarding completion
*Finish what #134 started so no operator journey is half-migrated.*
- **T.1** Shell settings native-`<select>` sweep, grouped ~15 files/PR: organization forms (`SEA/LEA/ESC/OrgNetwork`), `edorg-form-sections/*`, `EdFiComplianceStep` (the sibling left behind), `GradingScaleEditor`, `SchoolAssignmentManager`.
- **T.2** Replace the 54 local form-style constants in the same slices.
- **T.3** Archetype-correctness pass on onboarding (grade options should come from archetype/school config, not hardcoded `PK,K,1–12`).
- *Exit:* zero native `<select>` and zero local style constants in `apps/shell/src` settings + onboarding; flip the four form lint rules to `error` for that path.

### Epic F — Fan-out by MFE (plan Stream 3 order)
`academics` → `finance` → `messages`/`analytics`/`special-programs`/`edfi` → `shell` host last. One page-group sweep per PR using the People recipe. Known dedicated sweeps from the audit: finance inline tabs → `FilterTabs`; academics `StudentQuickProfile`; `AcademicSetupTab` (highest arbitrary-value file); status badges across MFEs.

### Epic M — Motion, elevation, third-party (plan Stream 4)
FullCalendar theme isolation; Modal/Drawer/Card/Dropdown elevation tokens; motion-token adoption with `prefers-reduced-motion`. After core fan-out stabilizes.

### Epic L — Governance lock-in (plan Stream 5)
Ratchet remaining warn→error once manifests are clear; remove deprecated token aliases after grep-zero; keep `forms.md`/`page-recipes.md`/`component-states.md` current; the `/dev/design-system` showcase doubles as the visual-regression fixture surface.

### Sequencing at a glance
```
G (CI/gates)  ──►  P (primitive fixes + one form API)  ──►  S (People pilot)
                                                              │
                          ┌───────────────────────────────────┘
                          ▼
              T (settings/onboarding finish)  ──►  F (MFE fan-out)  ──►  M (motion/elevation)  ──►  L (lock-in)
```

**The single most important correction:** stand up CI (Epic G) before any further migration. Everything else in the plan assumes the gates are real, and right now they are not.

---

## Appendix — evidence index
- Primitive token discipline / a11y defects: `packages/ui/src/components/forms/*`, `Tabs.tsx`, `states/*` (reviewed in full).
- Migration quality + remaining surface counts: `apps/shell/src/pages/settings/workspace.tsx`, `school-wizard/steps/BasicInfoStep.tsx`, `onboarding/steps/CreateSchoolStep.tsx`, `AcademicYearStep.tsx`; `packages/forms/src/fields/*`.
- Guardrails: `packages/config/eslint-design-system.js` (severities at `:299-318`), root `eslint.config.js`.
- Debt scale: `docs/design-system-audit-FINAL.md`.
- Canonical plan this v2 reconciles against: `docs/design-system-sprint-plan-FINAL.md`.
