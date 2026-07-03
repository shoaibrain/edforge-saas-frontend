# EdForge Design System

> **Source of truth for design going forward.** Read this file _in full_ before
> any UI task, then study the living visual references in
> [`design_references.html`](./design_references.html). Every screen, component,
> animation, and color decision in EdForge is measured against this document.
>
> The tokens below are not aspirational — they are transcribed from the shipping
> theme layer at
> [`packages/theme/src/base.css`](./packages/theme/src/base.css),
> [`packages/theme/src/landing-tokens.css`](./packages/theme/src/landing-tokens.css),
> [`packages/theme/src/icon-motion.css`](./packages/theme/src/icon-motion.css),
> and [`packages/theme/src/components.css`](./packages/theme/src/components.css).
> If code and this doc ever disagree, the code is canonical — fix the doc in the
> same PR.

---

## Section 1 — Philosophy

**EdForge is education _infrastructure_, not school-management SaaS.**

The people on the other side of the screen run schools — they are principals,
registrars, finance officers, teachers. Their day is already full. Our job is to
disappear into their work, not to decorate it. That single idea drives every
decision in this system.

- **Minimal, purposeful, alive.** We take Apple's clarity (nothing on screen
  that isn't earning its place) and Google's approachability (warm, legible,
  never intimidating), and we build our _own_ language on top — the warm
  off-white surfaces, the deep-green primary, the Fraunces display serif for
  human moments. We are not a clone of either.
- **No vendor bloat, no chrome for chrome's sake.** No gratuitous gradients on
  every surface, no drop-shadows that shout, no modal that needs three
  dismissal affordances. If a pixel doesn't help an administrator get to a
  decision faster, it doesn't ship.
- **Every animation serves the user.** Motion communicates state and continuity
  (where did this panel come from, what just changed) — it never performs.
  A 150 ms icon scale rewards a hover; it does not delay the click.
- **Calm under density.** These are operator dashboards: 255 students, 10
  sections, attendance sparklines, fee ledgers in NPR lakh, a Bikram Sambat
  date next to a Gregorian one. The design has to stay quiet while carrying a
  lot. Dense ≠ cluttered.
- **Two surfaces, one soul.** The marketing surface (`data-surface="landing"`,
  the "Breeze" palette — crimson, cream, Instrument Serif italic) is louder and
  more expressive on purpose. The authed operator portal is calmer and warmer.
  They share proportion, motion, and restraint even where the palette diverges.

If you are ever unsure whether something belongs, ask: **does this help the
person running the school, or does it just look like software?**

---

## Section 2 — Visual Language (Design Tokens)

These are the concrete tokens. Prefer the semantic CSS variables
(`--action-primary-bg`, `--text-secondary`, …) and the Tailwind aliases built on
them (`bg-action-primary`, `text-text-secondary`, `shadow-raised`) over raw hex
— they carry the light/dark switch for free.

### 2.1 Border radius

| Token | Value | Applies to |
|---|---|---|
| `--lp-radius-sm` | **8px** | Buttons, inputs, small controls, badges-with-corners |
| `--lp-radius` | **12px** | **Cards** (default), inputs (`.input` = 12px), panels |
| `--lp-radius-lg` | 18px | Elevated / feature cards |
| `--lp-radius-xl` | 24px | Marketing bento cards, hero surfaces |
| `--lp-radius-pill` | 999px | Pills, nav segments, status badges, avatars |

**Rule of thumb:** _12px on cards, 8px on buttons._ Standard operator cards use
12px; the larger 16–24px radii are reserved for marketing/hero surfaces and
should not leak into the dense portal.

### 2.2 Shadows / elevation

Soft and subtle — elevation reads as _lift_, never as a hard drop shadow. All
five are theme-aware (`shadow-raised`, `shadow-overlay`, `shadow-modal`, …).

| Token | Light | Dark |
|---|---|---|
| `--elevation-flat` | `none` | `none` |
| `--elevation-raised` _(cards)_ | `0 1px 2px rgba(0,18,25,.08), 0 1px 3px rgba(0,18,25,.06)` | `0 1px 2px rgba(0,0,0,.18), 0 1px 3px rgba(233,216,166,.04)` |
| `--elevation-overlay` _(hover / dropdown)_ | `0 8px 24px rgba(0,18,25,.14)` | `0 10px 28px rgba(0,0,0,.32)` |
| `--elevation-popover` | `0 12px 32px rgba(0,18,25,.16)` | `0 14px 36px rgba(0,0,0,.34)` |
| `--elevation-modal` | `0 24px 64px rgba(0,18,25,.22)` | `0 28px 72px rgba(0,0,0,.42)` |

Cards rest at `raised` and lift to `overlay` on hover. Nothing on a normal
dashboard should exceed `overlay`; `modal`/`popover` are for portaled layers
only.

### 2.3 Motion — durations & easing

The knobs the whole platform re-tunes from:

| Token | Value | Use |
|---|---|---|
| `--motion-duration-instant` | **80ms** | Press feedback, active-state color flips |
| `--motion-duration-fast` | **150ms** | **Micro-interactions** — icon hover-scale, badge, tooltip, checkbox |
| `--motion-duration-base` | **220ms** | **Major transitions** — sidebar expand/collapse, tab swap, panel reveal |
| `--motion-duration-slow` | **320ms** | Large entrances, drawer, route-level transitions |

| Easing | Curve | Use |
|---|---|---|
| `--motion-easing-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default **ease-in-out** — both-ends transitions (expand/collapse, hover) |
| `--motion-easing-enter` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entering elements (decelerate in) |
| `--motion-easing-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Leaving elements (accelerate out) |

> **Design-intent mapping.** The house rule is _"~250ms for major transitions,
> 150ms for micro-interactions, ease-in-out."_ In tokens that is:
> **major → `base` (220ms)**, **micro → `fast` (150ms)**, and _ease-in-out_ is
> literally `--motion-easing-standard` (`cubic-bezier(0.4,0,0.2,1)`). Reach for a
> token name, not a raw `ms`.

Keyframe primitives (from the theme): `fade-in` (0.2s ease-out, 8px rise),
`slide-up` (0.3s, 16px), `slide-in-right` (0.3s, 16px).

### 2.4 Icons & the signature icon-motion engine

Icons are not static glyphs — EdForge ships an animated-icon engine
([`icon-motion.css`](./packages/theme/src/icon-motion.css)). Contract:

- An interactive ancestor carries `.ef-motion` (and `.is-active` when selected);
  tabs are wired automatically via `[role="tab"]` / `[aria-selected="true"]`.
- On hover / focus-visible / active the icon **adopts its module accent color**,
  a faint accent glow blooms behind it (`radial-gradient`, opacity ~.16), and
  the signature animation plays.
- Simple hover scale for non-engine icons: **150ms** scale (`fast`) with
  `--ease-out` `cubic-bezier(.22,.61,.36,1)`.
- Signature engine knobs: `--icon-dur: .52s`, `--icon-k: 1` (intensity),
  `--ease-spring: cubic-bezier(.34,1.56,.64,1)`.

Keep icon stroke weight consistent (Lucide-style, ~1.5–2px) and size on the
8px grid (16 / 20 / 24).

### 2.5 Color palette

#### Brand primitives — "Coolors" scale (portal)

Anchor values (each ships a full 50–900 scale in `base.css`):

| Name | Hex | Role |
|---|---|---|
| Ink | `#001219` | Primary dark / deepest ink |
| Teal | `#005f73` | **Primary brand** |
| Cyan | `#0a9396` | Secondary brand |
| Aqua | `#94d2bd` | Light accent / soft success |
| Vanilla | `#e9d8a6` | Warm neutral |
| Golden | `#ee9b00` | Primary CTA warmth |
| Caramel | `#ca6702` | Warning |
| Rust | `#ae2012` | Error / danger |

**Brand gradients** (primary/hero elements):
`brand-gradient` = `linear-gradient(135deg, #005f73 0%, #0a9396 100%)`;
`brand-gradient-warm` = `linear-gradient(135deg, #ee9b00 0%, #ca6702 100%)`.

#### Semantic — portal, **light** (default authed surface)

| Role | Value | Notes |
|---|---|---|
| `background-primary` | `#FAF7F2` | warm off-white (the app canvas) |
| `background-secondary` | `#FFFFFF` | cards |
| `background-tertiary` | `#F4EFE6` | elevated / warm fill |
| `text-primary` | `#1A1F2E` | |
| `text-secondary` | `#374151` | |
| `text-tertiary` / muted | `#585F6F` | AA on warm surfaces |
| `text-disabled` | `#B0B6C8` | |
| `border-default` | `#968F7E` | warm taupe |
| `border-strong` | `#787160` | |
| `border-focus` | `#1D9E75` | brand green focus ring |
| `action-primary-bg` | `#0F6E56` | **deep green** — primary buttons (hover `#0C5C48`, active `#094C3B`) |
| `action-danger-bg` | `#AE2012` | |

#### Semantic — portal, **dark**

| Role | Value |
|---|---|
| `background-primary` | `#0F1117` |
| `background-secondary` | `#161B27` (surface / cards) |
| `background-tertiary` | `#1E2436` |
| `background-elevated` | `#242D3E` |
| `text-primary` | `#E8EAF0` |
| `text-secondary` | `#C8CCD8` |
| `text-tertiary` | `#969CB2` |
| `action-primary-bg` | `#0F6E56` (hover `#148264`) |

> Dark borders are pure white at low opacity (`rgb(255 255 255 / α)`), not a
> fixed gray — they stay perceptible across elevated surfaces.

#### State colors

| State | Light fg / bg | Dark fg |
|---|---|---|
| Success | `#005F49` / `#E8F6F2` | `#6EE7B7` |
| Warning | `#7F4300` / `#FFECC9` | `#FDD04D` |
| Danger | `#69130B` / `#F9CAC6` | `#FCA5A5` |
| Info | `#005F73` / `#BDFAFB` | `#7DF4F7` |

#### Module accents (cards, icons, sparklines)

Theme-agnostic hues; use the `-text` variants for text/icons in light mode (they
are AA-tuned), the base for fills/tints.

| Module | Base | Light-mode text |
|---|---|---|
| Academics | `#378ADD` (blue) | `#1D70C4` |
| Finance | `#E24B4A` (red) | `#DB1F1E` |
| Attendance | `#EF9F27` (amber) | `#9E6208` |
| Enrollment | `#1D9E75` (green) | `#147E5C` |
| People / staff (coral) | `#D85A30` | `#C24820` |
| Reports | `#7F77DD` (purple) | `#675EDA` |
| Settings | `#5A6070` (slate) | — |

#### Landing surface — "Breeze" palette (marketing only, `data-surface="landing"`)

| Role | Value |
|---|---|
| Primary (crimson) | `#E63946` (hover `#C82B38`, soft `#FBE3E5`) |
| Background (cream) | `#F1FAEE` |
| Aqua (soft accent) | `#A8DADC` |
| Steel (secondary) | `#457B9D` |
| Navy (ink) | `#1D3557` |

Do **not** use Breeze tokens in the authed portal, and do not use portal tokens
on the landing surface. They are deliberately separate.

### 2.6 Typography

| Family | Stack | Use |
|---|---|---|
| Sans (UI) | `Inter, system-ui, sans-serif` | All product UI, tables, forms |
| Display serif | `Fraunces, Georgia, 'Noto Serif Devanagari', serif` | Portal headings, hero greetings, GPA numbers — `.font-display` sets `"SOFT" 50, "opsz" 36` for softened, warm terminals |
| Landing serif | `'Instrument Serif', Georgia, serif` _italic_ | Marketing accent words ("_Well-run_", "_that idea_") |
| Devanagari | `'Noto Sans Devanagari', Inter, system-ui, sans-serif` | Applied on `html[lang="ne"]` |
| Mono | `'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace` | Student IDs (`#DPPSW-2026-00008`), codes |

**Sizing scale** (from `base.css`):

| Element | Size / line-height / weight |
|---|---|
| `h1` | 30px / 36px / 600 / `-0.025em` |
| `h2` | 24px / 32px / 600 / `-0.025em` |
| `h3` | 20px / 28px / 500 |
| body `p` | 16px / 1.625 |
| micro | `text-2xs` **11px**, `text-3xs` **10px**, `text-4xs` **9px** — dense data strips only |

Marketing display: `clamp(40px, 5.2vw, 72px)`, line-height ~1.02,
letter-spacing `-0.035em`, weight 700.

### 2.7 Spacing

8px base grid. Stay on it.

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64` (px) — Tailwind `1 / 2 / 3 / 4 / 6 / 8 / 12 / 16`.
Card padding is typically **16–24px**; gaps between cards **16–24px**; marketing
sections `72–112px` vertical. Avoid arbitrary `px` values in `apps/**` — the
`no-arbitrary-tailwind-values` lint forbids `text-[Npx]`/`p-[Npx]`; use scale
tokens (including `text-2xs/3xs/4xs`) instead.

---

## Section 3 — Component Patterns

### Cards
12px radius, `shadow-raised` at rest, `shadow-overlay` on hover with a
`transition: box-shadow 220ms ease-standard`. Background `background-secondary`
(`#FFFFFF` light / `#161B27` dark), 1px `border-default`. Consistent internal
padding (16–24px). Stat cards may carry a **colored top accent line** in the
module accent (see the dashboard's red/amber-topped KPI cards). Student-list
rows are cards: avatar + name + mono ID + grade badge + attendance sparkline +
guardian + status pill. See **Reference A**.

### Buttons
- **Primary** — deep-green solid `action-primary-bg` (`#0F6E56`) with white text,
  8px radius, `hover:#0C5C48`, 80–150ms feedback. In forms, primary buttons go
  **full-width**. Hero/brand CTAs may use `brand-gradient` (teal→cyan).
- **Secondary** — outlined: transparent/`background-tertiary` fill, 1px
  `border-default`, `text-secondary`. Used for "Enroll Student", "Govt. Reports".
- **Danger** — `action-danger-bg` (`#AE2012`), reserved for destructive intent.
- **Pill / nav** — fully rounded (`999px`), used for navigation segments and
  filter chips; active state is filled, inactive is quiet. See **Reference H**.
- Disabled buttons drop to `text-disabled` and lose elevation; never just lower
  opacity on the whole thing. See **Reference D**.

### Modals
Centered on screen. Backdrop is a dimmed overlay **with backdrop-blur**
(`backdrop-filter: blur(12px)`, see `.glass`). The dialog itself uses
`shadow-modal`, 12–16px radius, and **minimal chrome** — one quiet close affordance
(top-right `×`), a clear title, generous padding. Enter with `fade-in` +
`slide-up`; no bounce. See **Reference E**.

### Form inputs
`.input` = 12px radius, 1px `border-default`, `background-primary` fill,
`padding: 0.625rem 1rem`.
- **Focus:** border → `#0a9396` (cyan) + `0 0 0 3px rgb(10 147 150 / .2)` ring,
  transition 200ms. (Nav/`.ef-motion` focus uses the accent-tinted ring.)
- **Error:** red accent — `border-strong` → danger, helper text in danger fg,
  optional `state-danger-bg` tint.
- **Disabled:** visually distinct — muted fill, `text-disabled`, no focus ring.
Labels sit above the field; error/help text sits below. See **Reference G**.

### Badges & pills
Fully rounded (`999px`), `text-xs`/`2xs`, 500 weight, tinted background + matching
foreground (`badge-success`, `badge-warning`, `badge-danger`, `badge-primary`).
Status ("Active"), grade level (`ECD`, `3`, `8`), and "20 critical" all use this
pattern.

### Sidebar / navigation
Fixed-width rail. Expand/collapse animates **width over 220ms `ease-standard`**;
labels fade with a short `fast` (150ms) opacity step so text never "smears".
Active item = filled accent pill (green in the portal home) with the icon
adopting its module accent. Icons run the signature engine on hover/active. See
**Reference B** (sidebar) and **Reference C** (icon motion).

### Sparklines & data strips
Attendance trends render as inline sparklines colored by direction — green
(stable/up), amber (watch), red (declining). Keep them on the micro-type scale
and never let them add row height beyond the 44px compact / 60px comfortable
row tokens (`--dt-row-h-*`).

---

## Section 4 — Design Iteration Protocol

When you pick up a design task, follow this, in order:

1. **Read this entire `DESIGN_SYSTEM.md`.** Not a skim — the tokens are the
   contract.
2. **Open [`design_references.html`](./design_references.html) and study the
   references.** They are living, interactive examples of every pattern (A–H).
   Match what you see there.
3. **Trace the route → component before touching a file.** A filename that looks
   like the page is _not_ proof it renders there (URL → `apps/shell/src/router.tsx`
   → remote router → tab/step conditional → confirm the JSX tag renders). This is
   an explicit repo trap; do not skip it.
4. **Apply EdForge's language consistently.** Match border radius (12/8), motion
   tokens (`base`/`fast` + `ease-standard`), color usage (semantic vars, not raw
   hex), and 8px spacing to the references.
5. **When in doubt, ask: _"does this match the feel of Reference [X]?"_** If you
   can't point to the reference it matches, you're inventing — stop and align.
6. **Prefer semantic tokens over literals** so light/dark comes for free. Never
   hard-code `#0F6E56` where `bg-action-primary` exists.
7. **Generate a preview and flag every deviation.** If you departed from the
   system (a new color, a non-token duration, a one-off radius), call it out
   explicitly with the _why_ — don't bury it. Preview visually (`pnpm dev:<app>`),
   because typecheck and tests catch contracts, not "wrong component edited".
8. **Never assume.** If a detail (a color, a spacing step, an animation curve)
   isn't specified, **err toward consistency with an existing reference**, not
   toward a new invention.

---

## Section 5 — Anti-Patterns (what EdForge design is NOT)

- **Not generic SaaS UI.** No sterile, flat, all-gray minimalism that could be
  any B2B tool. Our warmth (off-white canvas, deep green, the display serif for
  human moments) is deliberate — don't sand it off into "clean and forgettable".
- **Not skeuomorphic or heavy.** No aggressive drop shadows, no glossy bevels,
  no faux-3D. Elevation is a whisper (`raised`/`overlay`), never a thud.
- **Not inconsistent in motion or spacing.** No off-grid `13px` gaps, no
  one-off `300ms` where `base`/`slow` exist, no easing invented per component.
  Everything comes from the token scale.
- **Not clarity sacrificed for style.** A prettier chart that's harder to read
  loses. An animation that delays the operator's next click loses. Style serves
  the work, never the reverse.
- **Not palette-mixing across surfaces.** Breeze (crimson/cream) stays on the
  landing surface; the Coolors portal palette stays in the authed app. Don't
  bleed one into the other.
- **Not raw-hex sprawl.** Literal colors scattered through components instead of
  semantic tokens is how light/dark rots. Use the variables.

---

_Living document. Update the tokens here and the swatches in
`design_references.html` in the same PR whenever the theme layer changes._
