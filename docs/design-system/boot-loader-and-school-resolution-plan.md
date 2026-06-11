# Boot Experience & School Resolution — Presentation-Layer Plan

**Status:** proposed · **Owner:** frontend / design-system · **Type:** UX + correctness
**Scope:** the first-run boot experience (loaders) and the active-school resolution flow.
**Visual prototype:** [`prototypes/organic-loader.html`](prototypes/organic-loader.html) — open in a browser.

This plan covers two tightly-coupled presentation-layer problems that together create
the "slow and buggy" first impression:

1. **The loader is generic and off-brand** — an inline letter `E` in a green box with
   three bouncing dots, shown for boot, MFE loads, and school switches alike.
2. **School switching feels broken on first login** — the user's configured **Default
   School** is ignored, and a phantom "Switching school…" overlay flashes on what should
   be a clean first paint.

They are coupled because **the loader is the curtain that should cover the one-time school
resolve.** Fix the resolve to happen once, deterministically, behind a single elegant
loader, and the "slow/buggy" feeling disappears.

---

## Part A — The organic loader: "The Forge"

### A.1 What exists today (inventory)

| Loader | File | What it renders |
|---|---|---|
| Full-screen boot | `apps/shell/src/components/layout/LoadingScreen.tsx` | inline `<span>E</span>` (gradient text) in a rounded box + "Loading…" + 3 bouncing dots (framer-motion). Used as the Suspense fallback for **root, all MFE routes, OAuth callback, onboarding** (`router.tsx` — Suspense fallbacks ≈ lines 157, 422, 661, 672, 687; direct renders ≈ 179, 284, 322). |
| School switch | `apps/shell/src/components/layout/SchoolTransitionOverlay.tsx` | backdrop + 3 pulsing dots + "Switching school…", with an 8s stall state. |
| Switcher substatus | `apps/shell/src/components/layout/SchoolSwitcher.tsx:265` | header text flips to "Switching…". |
| Inline | `packages/ui/src/components/states/LoadingState.tsx` | a CSS `animate-spin` border spinner + label. |
| Skeletons | `packages/ui/src/components/Skeleton.tsx`, `data-table/DataTableSkeleton.tsx`, academics `ClassroomCardSkeleton.tsx` | `animate-pulse` placeholders. |

**Two problems with the boot loader specifically:** (1) the `E` is a *typed letter*, **not the
real EdForge mark** (`apps/shell/public/logo.svg`); (2) it uses the green `--action-primary`
color, while the actual logo mark is a **teal→cyan gradient** (`#005f73 → #0a9396`). See the
brand-color note in §A.5.

### A.2 Design concept

A single organic system, *"The Forge"* — a nod to **Ed·Forge** (forging education):

- **The crucible** — a soft **squircle blob** that *breathes* (gentle scale) and *morphs its
  corner radii* on a slow loop. Not a circle, not a hard rectangle — organic and alive.
- **The mark forges itself** — inside the crucible, the **actual EdForge "E" mark**
  (the exact path from `logo.svg`) draws on via `stroke-dashoffset`, then holds.
- **The ember sheen** — once forged, a bright highlight *sweeps across the stroke* like
  light on hot metal, then the cycle breathes and repeats.
- **No spinners. No bouncing dots.** The breathing + draw *is* the progress feeling — calm,
  premium, and unmistakably EdForge.

**Why this is the right call (design rationale):**
- *On-brand & memorable* — it animates the real logo, so every wait reinforces the brand
  instead of a generic letter.
- *Organic, per the brief* — squircle morphing + breathing reads "soft/blobby" without being
  juvenile; it suits a serious EMIS.
- *One vocabulary, many states* — boot, module-load, school-switch, and inline all share the
  same primitive, so the app feels coherent (a stated design-system principle: "MFE drift is
  a defect").
- *Quiet motion* — uses the existing motion tokens and fully honors `prefers-reduced-motion`
  (calm opacity breathe on a fully-formed mark).

### A.3 States (one component, `<BrandLoader>`)

| State | Size | Treatment | Replaces |
|---|---|---|---|
| `boot` | ~104px | full crucible + mark draw + sheen + "Setting up your workspace…" | `LoadingScreen` at root / OAuth / onboarding |
| `module` | ~84px | same, crucible takes the **module accent** (academics blue / finance red / people coral) + "Loading <Module>…" | `LoadingScreen` MFE fallbacks |
| `school-switch` | ~84px overlay | crucible + **names the destination school** ("Switching to <School>") | `SchoolTransitionOverlay` dots |
| `inline` | 22–40px | breathing crucible only, no text, no draw | `LoadingState` spinner + button spinners |
| `skeleton` | — | **keep** `animate-pulse`; optionally soften the white-rgba shimmer to a token | (unchanged) |

### A.4 Implementation spec

1. **New primitive** `packages/ui/src/components/BrandLoader.tsx` (exported from `@edforge/ui`):
   ```
   <BrandLoader variant="boot|module|school-switch|inline"
                size="sm|md|lg"
                accent={tokenName}      // module tint, optional
                label={string} />        // optional caption
   ```
   - Inlines the `logo.svg` path as an SVG; the crucible is a `<div>` with the morph/breathe
     animations; the sheen is a second `<path>` with a short dash that sweeps.
   - **Colors bind to tokens, not hex.** Crucible gradient = brand tokens; module variant =
     `--accent-*`. Add CSS custom props so the prototype's literals become token-driven.
2. **Keyframes** → add to `packages/theme/src/utilities.css` (next to the existing
   `shimmer`/`fade-in` keyframes): `blob-morph`, `breathe`, `aura-pulse`, `draw`, `sheen`.
   All wrapped in a `@media (prefers-reduced-motion: reduce)` override that disables morph/
   draw/sheen and leaves a gentle opacity breathe.
3. **Swap call-sites** (no behavior change, pure presentation):
   - `LoadingScreen.tsx` → render `<BrandLoader variant="boot" .../>` (keep the component name/
     API so `router.tsx` Suspense fallbacks are untouched; pass module name where known).
   - `SchoolTransitionOverlay.tsx` → `<BrandLoader variant="school-switch" label={...}/>`,
     keep the 8s stall escalation.
   - `LoadingState.tsx` → `<BrandLoader variant="inline" size=.../>`.
   - Button/Input spinners → inline variant.
4. **Module name plumbing** — the three MFE Suspense fallbacks in `router.tsx` already know
   which module they're guarding; pass `"Academics" | "Finance" | "People"` + accent so the
   module loader is wayfinding.
5. **Pre-React paint (optional polish)** — `index.html` shows a blank warm screen before the
   JS boots. Drop a static, CSS-only crucible into `index.html` so the brand appears
   *instantly* and the React `<BrandLoader>` cross-fades in — removes the "white flash".

### A.5 Brand-color reconciliation (decision needed)

There is a **real brand split** in the codebase:
- The **mark** (`logo.svg`, `favicon.svg`) is **teal→cyan** `#005f73 → #0a9396`.
- The **app** is **green-forward**: `--action-primary-bg #0F6E56`, brand-green focus `#1D9E75`.

The prototype shows **both** color stories:
- **A — Brand gradient** (teal→cyan): literal logo fidelity.
- **B — Forge ember** (molten green→amber `#0F6E56 → #EF9F27`): matches the operator app's
  warm/green identity and the "forge" metaphor best.

**Recommendation:** ship **B (Forge ember)** for the in-app loader so the boot moment matches
the app's actual palette, **and** open a separate tiny task to align the logo/favicon to the
green system (or consciously keep teal as the "mark only" color). This is a brand call for the
owner — flagging it, not deciding it unilaterally.

---

## Part B — Deterministic school resolution

### B.1 Root cause (why the default is ignored & the phantom switch flashes)

Traced end-to-end (`apps/shell/src/lib/shell-context.tsx`, `stores/app.store.ts`,
`services/users.service.ts`):

1. **The `defaultSchoolId` preference is never fetched at login.** It is written by
   `settings/preferences.tsx` and stored server-side (`users.service.ts` `getPreferences()`),
   but **nothing reads it during bootstrap.** The auto-select effect
   (`shell-context.tsx:289-300`) only checks `localStorage` (last-used) → else
   `availableSchools[0]`. **The Default School setting is cosmetic.**
2. **`availableSchools[0]` is non-deterministic** — "first school" is whatever order the API
   returns (`shell-context.tsx:298`), so even the fallback is unpredictable.
3. **Three competing sources of "active school"** race on cold load:
   - Zustand `persist` **cookie** `edforge-app` (hydrates `activeSchoolId` early, **non-null**),
   - the per-user `localStorage` key `edforge-active-school-<userId>`,
   - the `availableSchools[0]` fallback.
   When the hydrated value isn't in the freshly-loaded `availableSchools`, the effect
   re-selects with `prev !== null` → `setActiveSchoolId` flips `isSchoolTransitioning = true`
   (`app.store.ts:47`) → the **phantom "Switching school…" overlay** on first paint.
4. **The cookie is not user-scoped.** `edforge-app` persists `activeSchoolId` globally, so a
   *different* user logging in on the same browser hydrates the *previous* user's school
   (non-null, not in their list) → guaranteed phantom switch.
5. **The overlay clears on `useIsFetching() === 0`** (`shell-context.tsx:358-362`), tying a
   *context* indicator to *all* query activity — noisy and imprecise.

### B.2 Target model (world-class)

**Resolve the active school exactly once, deterministically, behind the boot loader, before
the dashboard paints. The "Switching school…" overlay is reserved strictly for deliberate
user switches.**

**Mental model for the user:** *"My Default School is where I start my day. The app remembers
where I was during a session, but a fresh login always lands me on my default."*

**Resolution priority** (a single pure function, unit-tested):
1. **Deep-link** — a valid, permitted `?schoolId=` in the URL (shared links win).
2. **Default School preference** (`defaultSchoolId`) if set, valid, and permitted — *this is
   the fix for the core complaint.*
3. **Last-used** (per-user) if valid & permitted — only when **no default is configured**.
4. **Deterministic first** — schools sorted by a stable key (name, then id), pick `[0]`.
5. **Single-school user** — auto-select silently, no chrome ever.
6. **Zero schools** — route to onboarding / empty-state, not a spinner.

> *Decision to confirm with the owner:* should **Default** beat **Last-used** on every cold
> boot (recommended — makes the setting meaningful), or should **Last-used** win with Default
> as only the initial seed? The plan implements the former; it's a one-line swap if you prefer
> the latter.

### B.3 Implementation spec

1. **Fetch preferences during bootstrap.** Add a `userPreferences` query (`getPreferences()`)
   to the shell-context provider, alongside the existing `userProfile` + `schools` queries, so
   `defaultSchoolId` is available before resolution.
2. **One pure resolver** — `resolveActiveSchool({ urlSchoolId, defaultSchoolId, lastUsedId,
   schools, can })` returns a single id using the priority in §B.2, filtering by validity +
   ABAC permission and applying the deterministic sort. Lives in `apps/shell/src/lib/` with a
   focused unit test for each branch + edge cases (default no longer permitted, single school,
   zero schools, stale cookie).
3. **A boot gate.** Replace the imperative auto-select effect (`shell-context.tsx:289-300`)
   with a one-shot resolve: while `bootStatus === 'resolving'` (auth ready, but profile/
   schools/preferences/active-school not yet settled), render `<BrandLoader variant="boot"/>`;
   set the active school **once** from the resolver; prefetch its context (academic year,
   config); then flip `bootStatus = 'ready'` and paint the dashboard already-correct. **No
   re-select effect afterward.**
4. **Separate "boot resolve" from "user switch".**
   - The resolver **never** sets `isSchoolTransitioning`.
   - A new explicit `switchSchool(id)` action (called only from `SchoolSwitcher`) is the **only**
     thing that sets `isSchoolTransitioning = true` → so the overlay can never appear on first
     paint.
5. **User-scope the persistence.** Stop persisting `activeSchoolId` in a global cookie keyed
   only by `edforge-app`. Either (a) key it by user, or (b) treat the cookie as *current-session
   sync for MFEs only* and make the **resolver** the single authority on cold boot (preferred).
   Keep `localStorage edforge-active-school-<userId>` as the "last-used" signal; the resolver is
   its only reader.
6. **Tighten the overlay clear.** Clear `isSchoolTransitioning` when the **new school's context
   queries** settle (scope the `useIsFetching` predicate to school-scoped keys), not all fetches.
7. **Deterministic sort** of `availableSchools` for the fallback and for the switcher list.

### B.5 Implementation notes (verified against source — read before building B2)

A code review against `shell-context.tsx` / `app.store.ts` / `users.service.ts` / `abac`
confirmed the root cause and surfaced these must-handle details:

- **`availableSchools` is already assignment-filtered** (`shell-context.tsx:243-256`:
  TenantAdmin → all; others → schools in `user.assignments`). So the resolver's real job is
  **validity + deterministic priority**, *not* permission filtering. The `can` parameter is
  optional — only needed for finer "view this school" gating; if used, call
  `can(user, { action: 'view', resource: <school-scoped resource>, schoolId })` (ABAC `can` is
  a pure importable function, `@edforge/abac`, not a hook).
- **There is no `bootStatus` today.** `ShellProvider` computes `isLoading` inline
  (`shell-context.tsx:377`) and **always renders `children`** — active-school selection happens
  in a post-render `useEffect`, never as a gate. The boot gate therefore **changes the provider
  contract**: add `bootStatus: 'resolving' | 'ready'` (to `app.store.ts` or provider-local),
  and have `ShellProvider` return `<BrandLoader variant="boot"/>` instead of `children` while
  resolving, so no consumer mounts against an unresolved school.
- **Override the synchronously-hydrated cookie on cold boot.** The zustand `persist` cookie
  (`edforge-app`) hydrates `activeSchoolId` *before* React mounts, and the current early-return
  (`shell-context.tsx:291` — "if activeSchoolId is valid, return") would **accept a stale-but-
  valid cookie and silently skip resolution**, defeating the default-school fix. The resolver
  must run on cold boot **regardless** of the hydrated value (treat the cookie as session-sync
  for MFEs, not as "already resolved").
- **Coexist with the cache-invalidation effect** (`shell-context.tsx:320-353`). The
  `prevSchoolIdRef` guard (line 327) already skips the very first set, so a single synchronous
  boot-set won't trigger a spurious cancel/invalidate — keep that property (resolve once, set
  once).
- **Prefetch must be real.** "Prefetch the active school's context" (§B.3.3) means
  `queryClient.prefetchQuery` for the school-scoped keys (academic year, school config) and
  awaiting them before flipping `ready` — not merely relying on the existing
  `enabled: !!activeSchoolId` effects to fire after paint.

### B.4 The boot choreography (how A + B combine)

```
auth ready
   │  show <BrandLoader variant="boot"> "Setting up your workspace…"
   ├─ fetch in parallel: userProfile · schools · userPreferences
   ├─ resolveActiveSchool(...) → exactly one school, deterministically
   ├─ prefetch active school context (academic year, config)
   ▼
bootStatus = ready → single clean paint of the dashboard, correct school
   (loader cross-fades out — no "switching" flash, ever)
```

Result: first login lands on the **user's default school**, with **one** elegant brand
moment and **zero** phantom switches. Deliberate switches still show the named overlay.

---

## Sequencing & risk

| Step | Change | Risk | Gate |
|---|---|---|---|
| A1 | `BrandLoader` primitive + keyframes (additive) | low | typecheck · lint · vitest · prototype QA |
| A2 | Swap `LoadingScreen` / overlay / `LoadingState` to it | low (pure presentation) | visual QA light+dark, reduced-motion |
| B1 | Fetch preferences + pure `resolveActiveSchool` (+ unit tests) | low | unit tests per branch |
| B2 | Boot gate + `switchSchool` split + user-scoped persistence | **medium** (touches bootstrap state) | manual first-login QA: fresh login, returning, incognito, multi-user same browser, single-school, deep-link |
| A5 | brand-color decision + (optional) logo alignment | n/a | owner decision |

**Definition of done:** first login lands on the configured Default School with no phantom
switch; the loader is the organic brand moment in every state; `resolveActiveSchool` is unit-
tested; light/dark + reduced-motion verified; `eslint apps/ packages/ui` stays at 0 errors.

**Out of scope (flagged):** mobile/responsive redesign of the view layer (handled separately
via the Claude Design brief), and the parked Analytics MFE.
