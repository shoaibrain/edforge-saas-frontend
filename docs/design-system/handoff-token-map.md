# Handoff Token Reconciliation Map

**Sprint:** S0 (Foundation) · **Ticket:** T0.1 · **Status:** decisions resolved

The design handoff prototype was authored against its own token names (`--mint`, `--critical`,
`--r-md`, …). This document maps every handoff token used by the three canonical surfaces
(PageHeader / StatBand / TableToolbar) onto **existing** `@edforge/theme` semantic roles defined in
`packages/theme/src/base.css`. Per the handoff rules, **no new tokens are invented** and **no hex is
imported**; where a value had no obvious token, the decision is recorded below.

> **Outcome: `packages/theme/src/base.css` is NOT modified in this project.** Every handoff value maps
> to a token that already exists (the repo already added the `--mint*` / `--dt-*` prototype aliases for
> the DataTable). If a future surface needs a value with no token, flag-and-stop and add it here first.

## Surface / semantic colors

| Handoff token | Meaning | Existing role used | Notes |
|---|---|---|---|
| `--bg` | page canvas | `--background-primary` | |
| `--surface` | card/table surface | `--background-secondary` | StatBand + tablecard surface |
| `--raised` / `--raised-2` | inset / elevated | `--background-tertiary` / `--background-elevated` | icon chips, segmented control track |
| `--border` | hairline | `--border-primary` (low opacity, e.g. `/0.35`) | matches existing table/card usage |
| `--border-strong` | emphasized | `--border-tertiary` (`--border-strong`) | |
| `--text` | primary | `--text-primary` | StatBand value |
| `--text-muted` | secondary | `--text-secondary` | |
| `--text-subtle` / `--text-faint` | low-emphasis | `--text-tertiary` / `--text-disabled` | labels, meter notch |
| `--critical*` | danger | `--state-danger-{bg,fg,border}` | at-risk metric, danger pill |
| `--warn*` | warning | `--state-warning-{bg,fg,border}` | attendance meter, "Action needed" pill |
| `--info*` | info | `--state-info-{bg,fg,border}` | Upcoming metric |
| `--mint*` | brand accent | `--mint` / `--mint-soft` / `--mint-border` (already in `base.css`) | live accent + pulse ring |

## Resolved decisions (previously flagged)

### 1. `--mint` is NOT `action.primary`
`--mint = color-aqua-600 (#61bd9e)` is an **aqua accent** (aliased to `--border-focus` via
`--mint-border`); `--action-primary-bg = #0F6E56` is the deep brand green CTA. **Decision:**
- The **primary CTA** (handoff's mint-filled "Enroll student" / "Create Exam" button) →
  **`action.primary.*`** (the app's established primary). Implement via the existing `Button`
  primitive, not raw mint.
- The **`live` / `good` accent** inside StatBand (pulsing "Live Now" ring, success ticks) → the
  existing **`--mint` / `--mint-soft` / `--border-focus`** aqua-green family. No recolor of the CTA.

### 2. Per-metric `--accent-*` signatures vs. calm-by-default
The current Students KPI cards color each tile by an always-on signature
(`--accent-enrollment` green, `--accent-finance` red, `--accent-attendance` amber,
`--accent-academics` blue). The handoff StatBand is **calm by default** — color appears *only* when a
metric's `state` needs attention. These conflict. **Decision:**
- **StatBand drops the per-metric signature accents.** A `normal`/`structure` metric renders neutral
  (value `--text-primary`, label `--text-tertiary`, icon chip `--background-tertiary`/`--text-tertiary`).
  Semantic color (`state.*` / mint) appears only for `good | warn | critical | info | live | muted`.
- The `--accent-*` family stays in `base.css` (still used by module cards / `ContextBarYear` pip); it
  is simply **not consumed by StatBand**.
- Interactive focus rings drop the old `focus:ring-[rgb(var(--accent-enrollment)/0.4)]` in favor of the
  shared `focusRing` helper (`--border-focus`).

### 3. Values with no dedicated token → reuse (no new tokens)

| Handoff detail | Decision |
|---|---|
| SABER meter track | `--background-tertiary` (reuse) |
| SABER meter fill | state color for the metric, or `--mint`/`--action-primary` for neutral progress |
| SABER target notch (2px line) | `--border-tertiary` / `--text-tertiary` (reuse) |
| readiness donut track | `rgb(var(--border-primary) / 0.35)` (same pattern as `GpaRing`/`AttendanceDonutRing`) |
| readiness donut progress | `--state-success-fg` / `--mint` |
| `data-state` accent tick | the metric's state color (reuse) |
| live-pulse ring | `--mint-soft` (reuse) |

## Radius / motion

| Handoff | Existing |
|---|---|
| `--r-md` (10) / `--r-lg` (14) / `--r-xl` (20) / `--r-2xl` (28) | Tailwind radius utilities `rounded-lg` / `rounded-xl` / `rounded-2xl` / `rounded-3xl` (no arbitrary values — satisfies `no-arbitrary-tailwind-values`) |
| entrance / pulse timing | `--motion-duration-*` / `--motion-easing-*`; all motion gated on `prefers-reduced-motion` |

## StatBand `state` → token resolution (implementation contract)

| `state` | value text | icon chip bg / fg | accent tick |
|---|---|---|---|
| `normal` | `--text-primary` | `--background-tertiary` / `--text-tertiary` | none |
| `muted` | `--text-tertiary` | `--background-tertiary` / `--text-tertiary` | none |
| `good` | `--text-primary` | `--state-success-bg` / `--state-success-fg` | `--state-success-border` |
| `info` | `--text-primary` | `--state-info-bg` / `--state-info-fg` | `--state-info-border` |
| `warn` | `--state-warning-fg` | `--state-warning-bg` / `--state-warning-fg` | `--state-warning-border` |
| `critical` | `--state-danger-fg` | `--state-danger-bg` / `--state-danger-fg` | `--state-danger-border` |
| `live` | `--text-primary` | `--mint-soft` / `rgb(var(--border-focus))` | `rgb(var(--border-focus))` + pulse |
