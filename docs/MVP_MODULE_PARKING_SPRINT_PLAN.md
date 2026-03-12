# EdForge MVP Module Parking - Sprint Plan

> **Last Updated:** 2026-02-20
> **Branch:** `feat/mvp-module-parking`
> **Review Status:** Reviewed and revised with architectural feedback incorporated

## Executive Summary

**Goal:** Prepare EdForge frontend for production MVP by parking four modules — removing them from the build, deployment pipeline, and UI — while keeping their source code intact for future development.

**Modules to KEEP (MVP):**
| Module | App Directory | Dev Port |
|--------|--------------|----------|
| Academics | `apps/academics` | 3002 |
| People & HR | `apps/people` | 3006 |
| Finance | `apps/finance` | 3003 |
| Shell / System Admin | `apps/shell` | 3000 |

**Modules to PARK (remove from build/deploy, keep source):**
| Module | App Directory | Dev Port |
|--------|--------------|----------|
| Special Programs | `apps/special-programs` | 3005 |
| Messages | `apps/messages` | 3007 |
| Analytics | `apps/analytics` | 3008 |
| State Reporting / Ed-Fi | `apps/edfi` | 3001 |

---

## Architecture Analysis

### Module Federation Architecture
EdForge uses Rsbuild + `@module-federation/enhanced` v0.8.0 in a **Shell + 7 Remotes** pattern. The shell host (`apps/shell`) lazy-loads remote modules via `loadRemote()` and renders them inside splat routes (`/academics/$`, `/finance/$`, etc.). Each remote module is a fully independent application with its own router, stores, and API services.

### Key Isolation Property
**No direct inter-module imports exist.** Modules communicate exclusively through:
1. Shell routing (splat routes delegate to remote routers)
2. Shared `@edforge/*` packages (auth, abac, ui, types, theme)
3. Backend API (no frontend cross-module API calls)

This clean isolation means parking modules is a **shell-only operation** — we only need to modify the shell and build infrastructure. No parked module source code is changed.

### Complete Touch Points Inventory

| # | File | What References Parked Modules | Sprint |
|---|------|-------------------------------|--------|
| 1 | `apps/shell/rsbuild.config.ts` | Module Federation `remotes` object (lines 102-109) | 1 |
| 2 | `scripts/build-deploy.sh` | `REMOTES` array (line 26) and `pnpm turbo build` (line 17) | 1 |
| 3 | `vercel.json` | `buildCommand` calls unfiltered build (line 2) | 1 |
| 4 | `package.json` (root) | Build/dev scripts need MVP-filtered variants | 1 |
| 5 | `apps/shell/src/router.tsx` | Lazy imports (lines 51-85), route defs (lines 490-566), route tree (lines 601-604) | 2 |
| 6 | `apps/shell/src/config/sidebar-modules.ts` | Home nav items, module configs, registry, `SidebarModule` type, `detectModuleFromPath()` | 2 |
| 7 | `apps/shell/src/pages/HomePage.tsx` | `<ComplianceAlertsWidget>` (Special Programs), `<DataHealthWidget>` (Ed-Fi) | 3 |
| 8 | `apps/shell/src/components/dynamic-page/widgets/QuickActionsWidget.tsx` | Links to `/messages`, `/analytics` in role-specific actions | 3 |
| 9 | `apps/shell/src/components/dynamic-page/widgets/WelcomeTipWidget.tsx` | `WELCOME_TIPS` (line 50: `/messages`) and `MODULE_TIPS` (lines 202-223: `analytics`, `messages`) | 3 |
| 10 | `apps/shell/src/components/dynamic-page/widgets/CarouselWidget.tsx` | Mock data with `/messages`, `/analytics` (lines 464, 506) | 3 |
| 11 | `apps/shell/src/hooks/useRecentlyVisited.ts` | Page metadata for `/messages`, `/analytics` (lines 79-97) | 3 |
| 12 | `apps/shell/src/components/layout/Breadcrumbs.tsx` | `ROUTE_LABELS` for parked modules (lines 37-43) | 3 |
| 13 | `apps/shell/src/components/home/UpcomingEventsSection.tsx` | Link to `/messages/` (line 328) | 3 |
| 14 | `apps/shell/src/components/home/RecentlyVisitedCarousel.tsx` | Mock data with `/analytics` (lines 67-72) | 3 |
| 15 | `apps/shell/src/federation/tenant-resolver.ts` | `edfi` in TenantConfig interface, dev fallbacks, env vars (lines 13-77) | 3 |
| 16 | `apps/shell/src/pages/settings/organization.tsx` | Button navigating to `/settings/organization/edfi-preview` (line 572) | 3 |
| 17 | `docker/docker-compose.dev.yml` | `edfi` service, missing `people` service | 4 |
| 18 | `docker/nginx/nginx.conf` | `edfi` upstream/location, missing `people` upstream/location | 4 |

---

## Commenting & Marking Strategy

All commented-out code uses a consistent marker pattern for easy identification and future re-enablement:

```typescript
// [MVP-PARKED] Module: {module-name} — Will be re-enabled post-MVP
// ... commented code ...
// [/MVP-PARKED]
```

This pattern is grep-able: `grep -r "MVP-PARKED" apps/shell/ scripts/ docker/` instantly finds all parking points.

**Note on approach:** For build-time configs (`rsbuild.config.ts`, `build-deploy.sh`, `docker-compose.yml`, `nginx.conf`) we use `[MVP-PARKED]` comments since these files cannot be driven at runtime. For TypeScript source files (sidebar, router, widgets), we also use `[MVP-PARKED]` comments to keep the approach consistent and simple. A runtime `isModuleEnabled()` filtering approach was considered but adds complexity for a temporary parking — the comment approach is pragmatic given these modules will be re-enabled in subsequent releases.

---

## Sprint 1: Build Pipeline Isolation

**Goal:** Parked modules are excluded from production build and Module Federation resolution. Shell builds and starts successfully without parked remote dev servers running.

**Demo Criteria:** `pnpm build:deploy` succeeds. `output/remotes/` only contains `academics/`, `finance/`, `people/`. Shell dev server starts without errors when only MVP remote dev servers are running.

---

### Ticket 1.1: Create feature branch and add module registry config

**Description:** Create the working branch and add a centralized `modules.config.ts` file that documents which modules are enabled for the current release. This serves as the single source of truth and reference document for module availability.

**File:** `apps/shell/src/config/modules.config.ts` (new file)

**Changes:**
```typescript
/**
 * Module availability configuration for the current release.
 *
 * Modules listed as `false` are parked for post-MVP development.
 * Their source code remains in apps/ but they are excluded from:
 * - Module Federation remotes (rsbuild.config.ts)
 * - Router route tree (router.tsx)
 * - Sidebar navigation (sidebar-modules.ts)
 * - Build/deploy pipeline (build-deploy.sh)
 *
 * To re-enable a module, set it to `true` and follow the
 * re-enablement checklist in docs/MODULE_PARKING.md
 */
export const MODULE_AVAILABILITY = {
  academics: true,
  finance: true,
  people: true,
  // [MVP-PARKED] — These modules will be re-enabled post-MVP
  'special-programs': false,
  messages: false,
  analytics: false,
  edfi: false,
  // [/MVP-PARKED]
} as const

export type ModuleId = keyof typeof MODULE_AVAILABILITY
export type EnabledModuleId = {
  [K in ModuleId]: typeof MODULE_AVAILABILITY[K] extends true ? K : never
}[ModuleId]

export function isModuleEnabled(moduleId: string): boolean {
  return MODULE_AVAILABILITY[moduleId as ModuleId] === true
}

/** List of all parked module path prefixes for guard routes */
export const PARKED_MODULE_PATHS = [
  '/messages',
  '/analytics',
  '/special-programs',
  '/edfi',
] as const
```

**Validation:**
- TypeScript compiles: `pnpm --filter @edforge/shell typecheck`
- Unit test: Create `apps/shell/src/config/__tests__/modules.config.test.ts`:
  - `isModuleEnabled('academics')` returns `true`
  - `isModuleEnabled('finance')` returns `true`
  - `isModuleEnabled('people')` returns `true`
  - `isModuleEnabled('messages')` returns `false`
  - `isModuleEnabled('analytics')` returns `false`
  - `isModuleEnabled('special-programs')` returns `false`
  - `isModuleEnabled('edfi')` returns `false`
  - `PARKED_MODULE_PATHS` has length 4

**Git:** Atomic commit on new branch `feat/mvp-module-parking`

---

### Ticket 1.2: Comment out parked module remotes from Module Federation config

**Description:** Remove parked module entries from the `remotes` object in the shell's rsbuild config. This prevents Module Federation from attempting to resolve `remoteEntry.js` for parked modules at build time and runtime.

**File:** `apps/shell/rsbuild.config.ts`

**Changes:** Comment out lines for `edfi`, `special-programs`, `messages`, `analytics` in the `remotes` object (lines 105-109):

```typescript
remotes: {
  academics:          remoteUrl('academics', 'academics', 3002),
  finance:            remoteUrl('finance', 'finance', 3003),
  people:             remoteUrl('people', 'people', 3006),
  // [MVP-PARKED] Modules parked for post-MVP release
  // edfi:               remoteUrl('edfi', 'edfi', 3001),
  // 'special-programs': remoteUrl('special-programs', 'special_programs', 3005),
  // messages:           remoteUrl('messages', 'messages', 3007),
  // analytics:          remoteUrl('analytics', 'analytics', 3008),
  // [/MVP-PARKED]
},
```

**Validation:**
- Shell builds: `pnpm --filter @edforge/shell build` succeeds
- No MFE resolution errors in build output
- `@mf-types/` directory (if present and committed) is regenerated without parked module types — verify with `pnpm --filter @edforge/shell typecheck`

**Git:** Atomic commit

---

### Ticket 1.3: Update build-deploy script for MVP-only builds

**Description:** Update the production build-deploy script in two ways: (1) use the filtered turbo build to avoid building parked modules, and (2) only copy MVP module outputs to the consolidated deployment directory.

**File:** `scripts/build-deploy.sh`

**Changes:**
1. Line 17: Replace `pnpm turbo build` with the filtered build command:
```bash
# Build only MVP modules and their dependencies
pnpm turbo build --filter=@edforge/shell --filter=@edforge/academics --filter=@edforge/finance --filter=@edforge/people --filter='./packages/*' --filter='./types/packages/*'
```

2. Line 26: Update `REMOTES` array:
```bash
REMOTES=(academics finance people)
# [MVP-PARKED] Parked modules excluded from deployment
# REMOTES_PARKED=(edfi special-programs messages analytics)
# [/MVP-PARKED]
```

**Validation:**
- `bash scripts/build-deploy.sh` succeeds
- `output/remotes/` contains ONLY: `academics/`, `finance/`, `people/`
- `output/remotes/` does NOT contain: `edfi/`, `special-programs/`, `messages/`, `analytics/`
- `output/remotes/academics/remoteEntry.js` exists and is non-empty
- `output/remotes/finance/remoteEntry.js` exists and is non-empty
- `output/remotes/people/remoteEntry.js` exists and is non-empty
- `output/index.html` exists (shell entry point)
- Automated check script (add to end of build-deploy.sh):
```bash
# Verify no parked modules in output
for parked in edfi special-programs messages analytics; do
  if [ -d "$OUTPUT_DIR/remotes/$parked" ]; then
    echo "  ERROR: Parked module found in output: $parked"
    exit 1
  fi
done
```

**Git:** Atomic commit

---

### Ticket 1.4: Add MVP-filtered build and dev scripts to package.json

**Description:** Add turbo-filtered convenience scripts for building and running only MVP modules. Keep original unfiltered scripts for future full-module development.

**File:** `package.json` (root)

**Changes:** Add new scripts:
```json
"build:mvp": "turbo build --filter=@edforge/shell --filter=@edforge/academics --filter=@edforge/finance --filter=@edforge/people --filter='./packages/*' --filter='./types/packages/*'",
"dev:mvp": "turbo dev --filter=@edforge/shell --filter=@edforge/academics --filter=@edforge/finance --filter=@edforge/people --filter='./packages/*' --concurrency 20"
```

Original `build`, `dev`, `build:deploy` scripts are unchanged (build:deploy already calls the updated build-deploy.sh from Ticket 1.3).

**Validation:**
- `pnpm build:mvp` builds only shell + 3 MVP modules + shared packages
- `pnpm dev:mvp` starts only 4 dev servers (shell:3000, academics:3002, finance:3003, people:3006)
- Original `pnpm build` and `pnpm dev` still work (builds everything, for future use)
- Build time of `pnpm build:mvp` is measurably faster than `pnpm build`

**Git:** Atomic commit

---

### Ticket 1.5: Sprint 1 integration verification

**Description:** End-to-end verification that the build pipeline changes work correctly together.

**Validation checklist (manual):**
- [ ] `pnpm build:mvp` completes without errors
- [ ] `pnpm build:deploy` completes without errors (uses filtered build via updated build-deploy.sh)
- [ ] `output/` directory structure is correct — only `academics/`, `finance/`, `people/` in `output/remotes/`
- [ ] No parked module directories exist in `output/remotes/`
- [ ] `pnpm dev:mvp` starts shell + 3 remotes (4 dev servers total)
- [ ] Shell dev server loads at `http://localhost:3000` (may show runtime errors for missing routes — expected, fixed in Sprint 2)
- [ ] No TypeScript errors: `pnpm typecheck --filter=@edforge/shell`
- [ ] Lint passes: `pnpm lint --filter=@edforge/shell`

**Git:** No new commit (verification only). Tag: `sprint-1-complete`

---

## Sprint 2: Router & Navigation Cleanup

**Goal:** All routes, lazy imports, and navigation items for parked modules are commented out. The shell renders a clean navigation with only MVP modules. No dead links exist in navigation.

**Demo Criteria:** App boots cleanly, user can navigate to Home -> Academics, Home -> Finance, Home -> People & HR, Home -> Settings. No parked module appears in any navigation menu. No console errors for missing module imports.

---

### Ticket 2.1: Comment out all parked module routes in router.tsx

**Description:** Comment out the lazy `React.lazy()` + `loadRemote()` imports, route definitions, and route tree entries for all four parked modules in a single atomic change. These three changes are interdependent — lazy imports are referenced by route definitions, which are referenced by the route tree — so they must land together to maintain TypeScript compilation.

**File:** `apps/shell/src/router.tsx`

**Changes:**
1. Comment out lazy imports (lines 61-85):
```typescript
// [MVP-PARKED] Parked module lazy imports
// const SpecialProgramsModule = React.lazy(async () => { ... })
// const MessagesModule = React.lazy(async () => { ... })
// const AnalyticsModule = React.lazy(async () => { ... })
// const EdFiModule = React.lazy(async () => { ... })
// [/MVP-PARKED]
```

2. Comment out route definitions (lines 490-566):
```typescript
// [MVP-PARKED] Parked module route definitions
// const messagesRoute = createRoute({ ... })
// const analyticsRoute = createRoute({ ... })
// const edfiRoute = createRoute({ ... })
// const specialProgramsRoute = createRoute({ ... })
// [/MVP-PARKED]
```

3. Remove from route tree (lines 601-604):
```typescript
protectedRoute.addChildren([
  homeRoute,
  settingsRoute.addChildren([ ... ]),
  academicsRoute,
  financeRoute,
  peopleRoute,
  // [MVP-PARKED] Parked module routes removed from tree
  // messagesRoute,
  // analyticsRoute,
  // edfiRoute,
  // specialProgramsRoute,
  // [/MVP-PARKED]
  studentPortalRoute,
  parentPortalRoute,
  authDebugRoute2,
]),
```

**Why these are combined:** Commenting out lazy imports while routes still reference them causes "variable not defined" TypeScript errors. Commenting out routes while the route tree still references them causes the same. All three must change atomically.

**Validation:**
- TypeScript compiles: `pnpm --filter @edforge/shell typecheck`
- Shell dev server starts without route errors
- Navigate to `/home` — no crash
- Navigate to `/academics` — loads correctly (or shows loading if remote not running)
- Navigate to `/finance` — loads correctly
- Navigate to `/people` — loads correctly
- Navigate to `/messages` — shows 404/NotFound (expected, Coming Soon added in Sprint 4)
- No console errors about missing modules or failed `loadRemote()` calls

**Git:** Atomic commit

---

### Ticket 2.2: Remove parked modules from home navigation in sidebar-modules.ts

**Description:** Comment out the navigation items for parked modules in the admin home module's main group. These are the primary entry points users see on the home sidebar.

**File:** `apps/shell/src/config/sidebar-modules.ts`

**Changes:** In `homeModule.groups[0].items` (lines 134-201), comment out:
- Special Programs nav item (lines 148-153)
- Messages nav item (lines 169-174)
- Analytics nav item (lines 176-181)
- State Reporting (EdFi) nav item (lines 183-190)

```typescript
items: [
  { id: 'academics', label: 'Academics', ... },
  // [MVP-PARKED] { id: 'special-programs', label: 'Special Programs', ... },
  { id: 'people', label: 'People & HR', ... },
  { id: 'finance', label: 'Finance', ... },
  // [MVP-PARKED] { id: 'messages', label: 'Messages', ... },
  // [MVP-PARKED] { id: 'analytics', label: 'Analytics', ... },
  // [MVP-PARKED] { id: 'edfi', label: 'State Reporting', ... },
  { id: 'settings', label: 'System Admin', ... },
],
```

**Validation:**
- TypeScript compiles
- In dev mode, home sidebar shows only: Academics, People & HR, Finance, System Admin
- No parked module appears in the home navigation

**Git:** Atomic commit

---

### Ticket 2.3: Comment out parked module sidebar configs, registry, and type

**Description:** Comment out the full `ModuleConfig` objects for parked modules, their entries in the `SIDEBAR_MODULES` registry, update the `SidebarModule` type union, and update `detectModuleFromPath()`. All changes in this ticket are interdependent — the type, configs, registry, and path detection must all change together for TypeScript to compile.

**File:** `apps/shell/src/config/sidebar-modules.ts`

**Changes (all atomic — cannot be committed separately):**
1. Comment out `analyticsModule` config (lines 716-795) with `[MVP-PARKED]` markers
2. Comment out `messagesModule` config (lines 970-1024)
3. Comment out `edfiModule` config (lines 1030-1084)
4. Comment out `specialProgramsModule` config (lines 1090-1191)
5. Remove entries from `SIDEBAR_MODULES` registry (lines 1205, 1206, 1209, 1210):
```typescript
export const SIDEBAR_MODULES: Record<SidebarModule, ModuleConfig> = {
  home: homeModule,
  'home-student': studentHomeModule,
  'home-parent': parentHomeModule,
  settings: settingsModule,
  academics: academicsModule,
  finance: financeModule,
  people: peopleModule,
  // [MVP-PARKED] messages: messagesModule,
  // [MVP-PARKED] analytics: analyticsModule,
  'student-portal': studentPortalModule,
  'parent-portal': parentPortalModule,
  // [MVP-PARKED] 'special-programs': specialProgramsModule,
  // [MVP-PARKED] edfi: edfiModule,
}
```
6. Update `SidebarModule` type (lines 113-127) — remove parked module IDs:
```typescript
export type SidebarModule =
  | 'home'
  | 'home-student'
  | 'home-parent'
  | 'settings'
  | 'academics'
  | 'finance'
  | 'people'
  // [MVP-PARKED] | 'messages'
  // [MVP-PARKED] | 'analytics'
  | 'parent-portal'
  | 'student-portal'
  // [MVP-PARKED] | 'special-programs'
  // [MVP-PARKED] | 'edfi'
```
7. Update `detectModuleFromPath()` (lines 1267-1279) — remove parked module checks:
```typescript
export function detectModuleFromPath(pathname: string): SidebarModule {
  if (pathname.startsWith('/settings')) return 'settings'
  if (pathname.startsWith('/academics')) return 'academics'
  if (pathname.startsWith('/finance')) return 'finance'
  if (pathname.startsWith('/people')) return 'people'
  // [MVP-PARKED] if (pathname.startsWith('/messages')) return 'messages'
  // [MVP-PARKED] if (pathname.startsWith('/analytics')) return 'analytics'
  if (pathname.startsWith('/student-portal')) return 'student-portal'
  if (pathname.startsWith('/parent-portal')) return 'parent-portal'
  // [MVP-PARKED] if (pathname.startsWith('/special-programs')) return 'special-programs'
  // [MVP-PARKED] if (pathname.startsWith('/edfi')) return 'edfi'
  return 'home'
}
```

**Validation:**
- TypeScript compiles with no errors
- No runtime references to removed `SidebarModule` values
- `detectModuleFromPath('/messages')` returns `'home'` (fallback)
- `detectModuleFromPath('/academics')` still returns `'academics'`
- `detectModuleFromPath('/people')` still returns `'people'`
- Unit test for `detectModuleFromPath` with parked paths returning `'home'`

**Git:** Atomic commit

---

### Ticket 2.4: Clean up student and parent portal navigation references to Messages

**Description:** The student home, parent home, student portal, and parent portal sidebar configs contain links to `/messages` and `/messages/announcements`. These need to be commented out since the Messages module is parked.

**File:** `apps/shell/src/config/sidebar-modules.ts`

**Changes:**
1. In `studentHomeModule` -> `communication` group (lines 268-284): Comment out entire group with `[MVP-PARKED]`
2. In `parentHomeModule` -> `communication` group (lines 371-388): Comment out entire group with `[MVP-PARKED]`
3. In `studentPortalModule` -> `communication` group (lines 853-872): Comment out entire group with `[MVP-PARKED]`
4. In `parentPortalModule` -> `communication` group (lines 940-957): Comment out entire group with `[MVP-PARKED]`

**Validation:**
- TypeScript compiles
- Student home sidebar has no Messages or Announcements links
- Parent home sidebar has no Messages or Announcements links
- Student portal sidebar has no communication section
- Parent portal sidebar has no communication section

**Git:** Atomic commit

---

### Ticket 2.5: Remove unused icon imports from sidebar-modules.ts

**Description:** After commenting out parked module configs, some Lucide icon imports are unused. Remove them to prevent lint warnings.

**File:** `apps/shell/src/config/sidebar-modules.ts`

**Changes:** Identify and comment out icons that are ONLY used by parked modules. Check each carefully:
- `Video` — only used by Messages meetings -> comment out
- `LineChart` — only used by Analytics comparisons -> comment out
- `PieChart` — only used by Analytics custom reports -> comment out
- `Database` — used by EdFi module AND settings Import/Export item -> **keep**
- `TrendingUp` — used by Analytics AND Special Programs -> comment out (both are parked)
- `Mail` — used by Messages in student/parent portals -> comment out (those are now commented)
- `Megaphone` — used by Messages announcements in portals -> comment out (those are now commented)

**Validation:**
- `pnpm --filter @edforge/shell lint` passes with no unused import warnings
- TypeScript compiles
- No missing icon errors at runtime

**Git:** Atomic commit

---

### Ticket 2.6: Sprint 2 integration verification

**Description:** End-to-end navigation verification.

**Validation checklist (manual with `pnpm dev:mvp`):**
- [ ] Home sidebar shows: Academics, People & HR, Finance, System Admin (only)
- [ ] Click Academics -> navigates to `/academics`, sidebar switches to Academics module nav
- [ ] Click People & HR -> navigates to `/people`, sidebar switches to People module nav
- [ ] Click Finance -> navigates to `/finance`, sidebar switches to Finance module nav
- [ ] Click System Admin -> navigates to `/settings`, sidebar switches to Settings module nav
- [ ] Back button from each module returns to Home
- [ ] No console errors about missing modules or failed `loadRemote()` calls
- [ ] Student portal sidebar has no Messages/Communication links
- [ ] Parent portal sidebar has no Messages/Communication links
- [ ] Browser console is clean (no warnings about parked modules)
- [ ] TypeScript clean: `pnpm --filter @edforge/shell typecheck`
- [ ] Lint clean: `pnpm --filter @edforge/shell lint`

**Git:** No commit (verification only). Tag: `sprint-2-complete`

---

## Sprint 3: Widget, UI Reference & Auxiliary File Cleanup

**Goal:** All visual references to parked modules are removed from the home page, widgets, mock data, legacy components, breadcrumbs, and auxiliary config. The UI presents a clean MVP experience with no stale links.

**Demo Criteria:** Home page renders without Special Programs or Ed-Fi widgets. Quick actions, welcome tips, recently visited data, and breadcrumbs contain no references to parked modules. No broken links anywhere in the UI.

---

### Ticket 3.1: Comment out ComplianceAlertsWidget and DataHealthWidget from HomePage

**Description:** The ComplianceAlertsWidget shows IEP/504 plan compliance alerts (Special Programs) and the DataHealthWidget shows Ed-Fi sync status (State Reporting). Both reference parked modules and should be removed from the home page.

**File:** `apps/shell/src/pages/HomePage.tsx`

**Changes:** Comment out both widget JSX elements and their imports with `[MVP-PARKED]` markers:
```tsx
// [MVP-PARKED] import { ComplianceAlertsWidget, DataHealthWidget } from '../components/dynamic-page'

{/* [MVP-PARKED] <ComplianceAlertsWidget /> */}
{/* [MVP-PARKED] <DataHealthWidget /> */}
```

Update the import statement to remove `ComplianceAlertsWidget` and `DataHealthWidget` from the destructured imports.

**Validation:**
- Home page renders without compliance alerts section
- Home page renders without data health/Ed-Fi section
- No console errors
- TypeScript compiles (no unused import warnings)
- Home page layout looks balanced (no obvious gaps)

**Git:** Atomic commit

---

### Ticket 3.2: Clean up QuickActionsWidget references to parked modules

**Description:** The QuickActionsWidget contains role-specific quick action links that reference `/messages` and `/analytics`.

**File:** `apps/shell/src/components/dynamic-page/widgets/QuickActionsWidget.tsx`

**Changes:**
- Comment out admin action linking to `/messages/schedule` (schedule meeting)
- Comment out admin action linking to `/analytics` (view reports)
- Comment out teacher action linking to `/messages` (parent communication)
- Comment out student action linking to `/messages/announcements` (news)
- Comment out parent action linking to `/messages` (contact teachers)
- All with `[MVP-PARKED]` markers

**Validation:**
- Quick actions render without errors for all roles (admin, teacher, student, parent)
- No links to `/messages/*` or `/analytics/*` in quick actions
- TypeScript compiles

**Git:** Atomic commit

---

### Ticket 3.3: Clean up WelcomeTipWidget — both WELCOME_TIPS and MODULE_TIPS

**Description:** The WelcomeTipWidget contains TWO data structures referencing parked modules: (1) `WELCOME_TIPS` at line 50 with `/messages`, and (2) `MODULE_TIPS` at lines 202-223 with entries for `analytics` and `messages`. Both must be cleaned up.

**File:** `apps/shell/src/components/dynamic-page/widgets/WelcomeTipWidget.tsx`

**Changes:**
1. In `WELCOME_TIPS` array: Comment out the tip with `actionHref: '/messages'` (line 50)
2. In `MODULE_TIPS` object: Comment out the `analytics` entry (lines 202-212) and `messages` entry (lines 213-223)
3. All with `[MVP-PARKED]` markers

**Validation:**
- Welcome tips render without errors
- Module tips for MVP modules (academics, finance, people) still work
- No tips link to parked module routes
- TypeScript compiles

**Git:** Atomic commit

---

### Ticket 3.4: Clean up CarouselWidget and RecentlyVisitedCarousel mock data

**Description:** Both the dynamic-page `CarouselWidget` and the legacy `RecentlyVisitedCarousel` component contain mock/seed data referencing `/messages` and `/analytics`.

**Files:**
- `apps/shell/src/components/dynamic-page/widgets/CarouselWidget.tsx` (lines 464, 506)
- `apps/shell/src/components/home/RecentlyVisitedCarousel.tsx` (lines 67-72, 117)

**Changes:**
- Remove or replace mock entries referencing `/messages` and `/analytics` in both files
- Replace with MVP module references (e.g., `/academics/students`, `/finance/billing`)
- Use `[MVP-PARKED]` markers for commented-out entries

**Validation:**
- Carousel renders correctly with updated mock data
- No references to parked module paths in either carousel component
- TypeScript compiles

**Git:** Atomic commit

---

### Ticket 3.5: Clean up useRecentlyVisited hook page metadata

**Description:** The `useRecentlyVisited` hook contains page metadata mappings for parked modules used to display icons and titles for recently visited pages.

**File:** `apps/shell/src/hooks/useRecentlyVisited.ts`

**Changes:**
- Comment out page metadata entries for `/messages` and `/analytics` (lines 79-97 area)
- Comment out mock data entries referencing parked modules (line 232 area)
- Add `[MVP-PARKED]` markers

**Note on localStorage:** Existing users may have `/messages` and `/analytics` entries persisted in localStorage under the `edforge-recently-visited` key. After this change, those entries will still render in the carousel but will navigate to the Coming Soon page (added in Sprint 4). This is acceptable degradation — the entries will naturally age out as users visit MVP pages instead.

**Validation:**
- Hook works correctly for MVP module pages
- No TypeScript errors
- Recently visited feature works for `/academics/*`, `/finance/*`, `/people/*`, `/settings/*`

**Git:** Atomic commit

---

### Ticket 3.6: Update Breadcrumbs route labels

**Description:** The Breadcrumbs component has a `ROUTE_LABELS` mapping that includes labels for all parked modules.

**File:** `apps/shell/src/components/layout/Breadcrumbs.tsx`

**Changes:** Comment out parked module labels (lines 37-43):
```typescript
const ROUTE_LABELS: Record<string, string> = {
  // ... kept modules ...
  // [MVP-PARKED]
  // 'special-programs': 'Special Programs',
  // edfi: 'State Reporting',
  // messages: 'Messages',
  // analytics: 'Analytics',
  // [/MVP-PARKED]
}
```

**Note:** Breadcrumbs for Coming Soon routes (Sprint 4) will fall back to the raw path segment, which is acceptable. If needed, we can add `'messages': 'Coming Soon'` etc. in Sprint 4.

**Validation:**
- Breadcrumbs render correctly for MVP module routes
- TypeScript compiles
- No visual regression on existing breadcrumb paths

**Git:** Atomic commit

---

### Ticket 3.7: Clean up legacy UpcomingEventsSection link to Messages

**Description:** The legacy `UpcomingEventsSection` component contains a hardcoded "View all" link to `/messages/`.

**File:** `apps/shell/src/components/home/UpcomingEventsSection.tsx`

**Changes:** Comment out or remove the link to `/messages/` (line 328):
```tsx
// [MVP-PARKED] <Link to={"/messages/" as any} className="...">View all</Link>
```

If this component is not currently mounted anywhere (superseded by `UpcomingEventsWidget`), add a comment noting it's a legacy component.

**Validation:**
- Component renders without broken links
- TypeScript compiles
- If component is mounted, verify no dead links appear

**Git:** Atomic commit

---

### Ticket 3.8: Clean up tenant-resolver.ts parked module references

**Description:** The tenant-aware federation resolver plugin contains references to `edfi` in its `TenantConfig` interface, dev fallback URLs, and environment variable mappings.

**File:** `apps/shell/src/federation/tenant-resolver.ts`

**Changes:** Comment out parked module references in:
1. `TenantConfig.remoteUrls` interface (lines 12-19): Comment out `edfi?` field
2. Dev fallback URLs (lines 54-61): Comment out `edfi: 'http://localhost:3001'`
3. Env var fallback (lines 71-77): Comment out `edfi:` entry

Note: This file also references `portal` and `integrations` which don't correspond to current remotes — leave those as-is since they're pre-existing and not related to this task.

**Validation:**
- TypeScript compiles
- If tenant resolver is loaded at runtime, no errors from missing properties (the `?` optional marker handles this)

**Git:** Atomic commit

---

### Ticket 3.9: Evaluate and handle EdFi Export Preview in Settings

**Description:** The shell's settings module contains an `EdFiExportPreviewPage` at `/settings/organization/edfi-preview`. This is a settings sub-page that lives in the shell (not the parked edfi remote), but it may reference Ed-Fi APIs or concepts. Evaluate whether it should remain in MVP or be parked.

**Files to evaluate:**
- `apps/shell/src/pages/settings/edfi-export-preview.tsx` — Read this file to determine if it calls Ed-Fi specific APIs
- `apps/shell/src/pages/settings/organization.tsx` line 572 — Button that navigates to the preview page
- `apps/shell/src/router.tsx` lines 392-396, 590 — Route definition and tree entry

**Decision criteria:**
- If the page calls Ed-Fi APIs or depends on Ed-Fi module functionality: **Park it** — comment out the route, route tree entry, and navigation button
- If the page is purely a data preview of the organization hierarchy with no Ed-Fi dependency: **Keep it**

**Changes (if parking):**
- Comment out `settingsEdFiExportPreviewRoute` in router.tsx (lines 392-396)
- Remove from route tree (line 590)
- Comment out or disable the navigation button in `organization.tsx` (line 572)
- Comment out `EdFiExportPreviewPage` import in `settings/index.ts` (line 25)
- All with `[MVP-PARKED]` markers

**Validation:**
- Settings > Organization page renders without errors
- If parked: No navigation button to EdFi preview
- If kept: Preview page loads and functions correctly
- TypeScript compiles

**Git:** Atomic commit

---

### Ticket 3.10: Sprint 3 integration verification

**Description:** Full UI verification that no parked module references remain visible.

**Validation checklist (manual with `pnpm dev:mvp`):**
- [ ] Home page loads cleanly — no ComplianceAlerts, no DataHealth widgets
- [ ] Quick actions contain no links to /messages or /analytics (test all roles)
- [ ] Welcome tips contain no references to parked modules
- [ ] Module tips don't render for parked module pages
- [ ] Recently visited carousel shows no parked module entries (fresh localStorage)
- [ ] Breadcrumbs don't show parked module labels
- [ ] Legacy UpcomingEventsSection has no /messages link
- [ ] Settings > Organization page works (EdFi preview handled per decision)
- [ ] No broken images, icons, or layout shifts from removed widgets
- [ ] Home page layout looks balanced and complete
- [ ] Browser console clean (no errors or warnings)
- [ ] Full grep scan: `grep -rn "'/messages\|'/analytics\|'/special-programs\|'/edfi" apps/shell/src/ --include="*.tsx" --include="*.ts"` — only results should be in `[MVP-PARKED]` comments, modules.config.ts, and Coming Soon route definitions (Sprint 4)

**Git:** No commit (verification only). Tag: `sprint-3-complete`

---

## Sprint 4: Infrastructure, Guards & DevOps

**Goal:** Development infrastructure is cleaned up. Graceful "Coming Soon" pages exist for direct URL access to parked module paths. Docker and Nginx configs are updated with People module support.

**Demo Criteria:** Docker dev environment works with only MVP modules (including People). Direct browser navigation to `/messages` shows a friendly "Coming Soon" page instead of a crash. Production build deploys cleanly.

---

### Ticket 4.1: Add "Coming Soon" catch-all routes for parked module paths

**Description:** Users might bookmark or share URLs like `/messages/inbox` or `/analytics/overview`. Instead of showing a 404, add friendly "Coming Soon" placeholder routes that inform users the module is planned for a future release.

**File:** `apps/shell/src/router.tsx`

**Changes:** Add a `ComingSoonPage` component and catch-all routes after the parked route comment block:

```typescript
// [MVP-PARKED] Coming Soon guard routes for parked module paths
function ComingSoonPage() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Coming Soon
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mt-2 text-center max-w-md">
        This module is planned for a future release. Stay tuned!
      </p>
      <button
        onClick={() => navigate({ to: '/home' })}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Back to Home
      </button>
    </div>
  )
}

const messagesComingSoonRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/messages/$',
  component: ComingSoonPage,
})
const analyticsComingSoonRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/analytics/$',
  component: ComingSoonPage,
})
const specialProgramsComingSoonRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/special-programs/$',
  component: ComingSoonPage,
})
const edfiComingSoonRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/edfi/$',
  component: ComingSoonPage,
})
// [/MVP-PARKED]
```

Add these to the route tree in the protected children where the original routes were.

**Validation:**
- Navigate to `/messages` -> shows "Coming Soon" page
- Navigate to `/messages/inbox` -> shows "Coming Soon" page
- Navigate to `/analytics/overview` -> shows "Coming Soon" page
- Navigate to `/special-programs/ieps` -> shows "Coming Soon" page
- Navigate to `/edfi/sync-dashboard` -> shows "Coming Soon" page
- "Back to Home" button navigates to `/home` on each
- These routes are protected (unauthenticated users redirected to login)
- TypeScript compiles
- Automated test: Render `ComingSoonPage`, assert heading text "Coming Soon" and button existence

**Git:** Atomic commit

---

### Ticket 4.2: Add People service to Docker Compose

**Description:** The Docker Compose dev config is missing a `people` service definition. Since People & HR is a core MVP module, it must be added for Docker-based development to work.

**File:** `docker/docker-compose.dev.yml`

**Changes:** Add `people` service:
```yaml
  # People & HR Module
  people:
    build:
      context: ..
      dockerfile: docker/Dockerfile.dev
      args:
        APP_NAME: people
        APP_PORT: 3006
    ports:
      - "3006:3006"
    volumes:
      - ../apps/people/src:/app/apps/people/src
      - ../packages:/app/packages
      - /app/node_modules
    networks:
      - edforge-network
```

Update shell's `depends_on` to include `people`.

**Validation:**
- `docker-compose -f docker/docker-compose.dev.yml config` validates without errors
- People service can start alongside other MVP services

**Git:** Atomic commit

---

### Ticket 4.3: Comment out EdFi service from Docker Compose and update shell dependencies

**Description:** Remove the parked EdFi service from Docker Compose and clean up shell's dependency list.

**File:** `docker/docker-compose.dev.yml`

**Changes:**
- Comment out the `edfi` service definition (lines 29-44) with `# [MVP-PARKED]`
- Remove `edfi` from shell's `depends_on` list
- Remove `VITE_EDFI_URL` from shell's environment
- Update shell's `depends_on` to: `academics`, `finance`, `people`
- Remove `edfi` from nginx's `depends_on`

**Validation:**
- `docker-compose -f docker/docker-compose.dev.yml config` validates without errors
- `pnpm docker:dev` starts successfully with MVP services only
- Shell, academics, finance, people containers start and are healthy

**Git:** Atomic commit

---

### Ticket 4.4: Update Nginx config — add People, remove EdFi

**Description:** Add People module upstream and location blocks, remove EdFi upstream and location blocks from the Nginx dev proxy config.

**File:** `docker/nginx/nginx.conf`

**Changes:**
1. Add `upstream people` block:
```nginx
upstream people {
    server people:3006;
}
```

2. Add `location /remotes/people/` block:
```nginx
# People Module Remote Entry
location /remotes/people/ {
    proxy_pass http://people/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

3. Comment out `upstream edfi` block with `# [MVP-PARKED]`
4. Comment out `location /remotes/edfi/` block with `# [MVP-PARKED]`

**Validation:**
- Nginx config syntax valid (test via docker or `nginx -t`)
- Docker dev environment routes correctly through nginx
- `/remotes/academics/remoteEntry.js` resolves
- `/remotes/finance/remoteEntry.js` resolves
- `/remotes/people/remoteEntry.js` resolves

**Git:** Atomic commit

---

### Ticket 4.5: Add convenience dev scripts for individual modules

**Description:** Add convenience scripts for running individual MVP modules alongside the shell.

**File:** `package.json` (root)

**Changes:** Add scripts:
```json
"dev:academics": "turbo dev --filter=@edforge/academics",
"dev:finance": "turbo dev --filter=@edforge/finance",
"dev:people": "turbo dev --filter=@edforge/people"
```

**Validation:**
- Each script starts the respective dev server on its expected port
- `pnpm dev:mvp` starts all four MVP apps simultaneously

**Git:** Atomic commit

---

### Ticket 4.6: Sprint 4 integration verification

**Description:** Full infrastructure and guard verification.

**Validation checklist:**
- [ ] `pnpm dev:mvp` starts 4 dev servers (ports 3000, 3002, 3003, 3006)
- [ ] Navigate to `/messages` -> "Coming Soon" page
- [ ] Navigate to `/messages/inbox` -> "Coming Soon" page
- [ ] Navigate to `/analytics` -> "Coming Soon" page
- [ ] Navigate to `/special-programs` -> "Coming Soon" page
- [ ] Navigate to `/edfi` -> "Coming Soon" page
- [ ] Navigate to `/academics` -> Academics module loads
- [ ] Navigate to `/finance` -> Finance module loads
- [ ] Navigate to `/people` -> People module loads
- [ ] "Back to Home" works on all Coming Soon pages
- [ ] Docker dev environment starts with MVP services (if Docker available)
- [ ] Production build: `pnpm build:deploy` succeeds
- [ ] Production output contains only MVP module remotes
- [ ] Unauthenticated access to `/messages` redirects to login (not Coming Soon)

**Git:** No commit (verification only). Tag: `sprint-4-complete`

---

## Sprint 5: Validation, Testing, QA & Documentation

**Goal:** Full production-readiness validation. Automated smoke tests. Comprehensive QA. Documentation for the parking strategy and re-enablement process.

**Demo Criteria:** Clean production build, automated tests pass, QA sign-off, documented re-enablement process, no console errors or broken functionality.

---

### Ticket 5.1: Add automated smoke tests for module parking

**Description:** Create automated tests that verify the module parking is correctly implemented and guard against regression.

**File:** `apps/shell/src/__tests__/module-parking.test.ts` (new file)

**Tests to implement:**
1. `isModuleEnabled()` returns correct values for all modules
2. `detectModuleFromPath()` returns `'home'` for all parked module paths
3. `detectModuleFromPath()` returns correct module for MVP module paths
4. `PARKED_MODULE_PATHS` matches the parked modules in `MODULE_AVAILABILITY`
5. Render `ComingSoonPage` — assert heading "Coming Soon" and "Back to Home" button exist

**Validation:**
- `pnpm test --filter=@edforge/shell` — all new tests pass
- Tests run in CI without failure

**Git:** Atomic commit

---

### Ticket 5.2: Add post-build output verification to build-deploy.sh

**Description:** Add an automated check at the end of the build-deploy script that verifies only MVP modules are in the output and no parked modules leaked through.

**File:** `scripts/build-deploy.sh`

**Changes:** Add at end of script:
```bash
echo "==> Verifying output integrity..."
EXPECTED_REMOTES=(academics finance people)
PARKED_REMOTES=(edfi special-programs messages analytics)

for remote in "${EXPECTED_REMOTES[@]}"; do
  if [ ! -f "$OUTPUT_DIR/remotes/$remote/remoteEntry.js" ]; then
    echo "  FATAL: Missing MVP remote: $remote"
    exit 1
  fi
done

for parked in "${PARKED_REMOTES[@]}"; do
  if [ -d "$OUTPUT_DIR/remotes/$parked" ]; then
    echo "  FATAL: Parked module leaked into output: $parked"
    exit 1
  fi
done

echo "==> Output integrity verified."
```

**Validation:**
- `pnpm build:deploy` succeeds and shows "Output integrity verified."
- Manually add a parked module to REMOTES, rebuild — script should fail with FATAL error (then revert)

**Git:** Atomic commit

---

### Ticket 5.3: Full production build and serve verification

**Description:** Run a complete production build and serve it locally to verify the app works end-to-end.

**Validation:**
- `pnpm build:deploy` succeeds (exit code 0)
- `output/index.html` exists and is valid HTML
- `output/static/js/` contains shell chunks
- `output/remotes/academics/remoteEntry.js` exists and is non-empty
- `output/remotes/finance/remoteEntry.js` exists and is non-empty
- `output/remotes/people/remoteEntry.js` exists and is non-empty
- No parked module directories in `output/remotes/`
- Serve with `npx serve output/` — app loads, login page shows
- Document total production bundle size as baseline

**Git:** No commit (verification only)

---

### Ticket 5.4: Comprehensive QA walkthrough

**Description:** Manual QA testing of all MVP flows to ensure nothing is broken by the module parking changes.

**QA Checklist:**
- [ ] **Auth Flow:** Login -> OAuth callback -> Home redirect works
- [ ] **Home Page (Admin):** Renders cleanly, greeting shows, quick actions work, no parked module widgets
- [ ] **Home Page (Student):** Student portal renders, no Messages section
- [ ] **Home Page (Parent):** Parent portal renders, no Messages section
- [ ] **Navigation (Admin):** Home shows Academics, People & HR, Finance, System Admin only
- [ ] **Navigation (Student):** Student portal shows grades, attendance, schedule, assignments (no Messages)
- [ ] **Navigation (Parent):** Parent portal shows children, payments, calendar (no Messages)
- [ ] **Academics Module:** Overview, Students, Attendance, Grades, Scheduling, Curriculum all load
- [ ] **Finance Module:** Overview, Ledger, Billing, Expenses all load
- [ ] **People Module:** Overview, Staff Directory, HR Admin all load
- [ ] **Settings Module:** All settings pages load (Account, Workspace, Organization, Billing, Integrations, etc.)
- [ ] **Deep Links:** Direct URL to `/academics/students` works after login
- [ ] **Coming Soon Pages:** `/messages`, `/analytics`, `/special-programs`, `/edfi` all show "Coming Soon"
- [ ] **Coming Soon Sub-paths:** `/messages/inbox`, `/analytics/overview` show "Coming Soon"
- [ ] **Coming Soon Auth Guard:** Unauthenticated access to `/messages` redirects to `/login`
- [ ] **Theme:** Dark mode toggle works across all pages including Coming Soon
- [ ] **Responsive:** App works at mobile, tablet, desktop breakpoints
- [ ] **Console:** No JavaScript errors or warnings in browser console
- [ ] **Network Tab:** No failed network requests for missing `remoteEntry.js` files
- [ ] **Breadcrumbs:** No parked module labels appear in breadcrumbs
- [ ] **Recently Visited:** New visits to MVP pages are tracked correctly

**Git:** No commit (verification only)

---

### Ticket 5.5: Write re-enablement documentation

**Description:** Create documentation that describes the module parking strategy, how to identify parked code, and step-by-step instructions to re-enable each module.

**File:** `docs/MODULE_PARKING.md` (new file)

**Content:**
1. **Overview:** Why modules were parked, which modules, when they were parked, what release they were parked in
2. **Marker Pattern:** How to find all parked code:
   ```bash
   grep -rn "MVP-PARKED" apps/shell/ scripts/ docker/ vercel.json package.json
   ```
3. **Module Registry:** Reference to `apps/shell/src/config/modules.config.ts`
4. **Re-enablement Checklist per Module:**
   - [ ] Set module to `true` in `modules.config.ts`
   - [ ] Uncomment remote in `apps/shell/rsbuild.config.ts`
   - [ ] Uncomment lazy import, route definition, and route tree entry in `apps/shell/src/router.tsx`
   - [ ] Remove the Coming Soon catch-all route for this module
   - [ ] Uncomment sidebar module config and registry entry in `sidebar-modules.ts`
   - [ ] Uncomment nav items in home module (and student/parent portals for Messages)
   - [ ] Re-enable widgets in `HomePage.tsx` if applicable (ComplianceAlerts for Special Programs, DataHealth for EdFi)
   - [ ] Uncomment QuickActions, WelcomeTips, CarouselWidget, and hook references
   - [ ] Uncomment Breadcrumbs route label
   - [ ] Add module back to `scripts/build-deploy.sh` REMOTES array
   - [ ] Update `package.json` `build:mvp` and `dev:mvp` scripts
   - [ ] Update `docker/docker-compose.dev.yml` (add service)
   - [ ] Update `docker/nginx/nginx.conf` (add upstream and location)
   - [ ] Restore icon imports if they were removed
   - [ ] Run full build: `pnpm build:deploy`
   - [ ] Run typecheck: `pnpm typecheck`
   - [ ] Run tests: `pnpm test`
   - [ ] Manual QA walkthrough of re-enabled module
5. **Module-Specific Notes:**
   - **Messages:** Re-enabling also requires uncommenting student/parent portal communication groups
   - **Analytics:** No portal-specific changes needed
   - **Special Programs:** Re-enable ComplianceAlertsWidget on HomePage
   - **Ed-Fi:** Re-enable DataHealthWidget on HomePage; evaluate EdFi Export Preview page
6. **Verification Commands:**
   ```bash
   # Find all remaining parking markers
   grep -rn "MVP-PARKED" apps/shell/ scripts/ docker/

   # Verify no dead links in source
   grep -rn "'/messages\|'/analytics\|'/special-programs\|'/edfi" apps/shell/src/ --include="*.tsx" --include="*.ts" | grep -v "MVP-PARKED" | grep -v "modules.config" | grep -v "ComingSoon"
   ```

**Validation:**
- Document is complete, accurate, and follows the actual file structure
- Grep commands produce expected results
- Peer review by team member

**Git:** Atomic commit

---

### Ticket 5.6: Performance baseline

**Description:** Capture performance metrics for the MVP build as a baseline for future comparisons and to verify the parking changes haven't introduced regressions.

**Metrics to capture:**
- Production bundle sizes: shell, academics remote, finance remote, people remote (all in KB)
- Total `output/` directory size
- Build time for `pnpm build:mvp` (wall clock)
- Build time for `pnpm build:deploy` (wall clock)
- Number of JS chunks per module
- Initial page load time (Lighthouse Performance score on `/home`)

**Validation:**
- All metrics documented in a comment on the PR or in `docs/MVP_PERFORMANCE_BASELINE.md`
- Build times are reasonable (document absolute values)
- No unexpected size regressions

**Git:** Atomic commit with baseline doc. Tag: `mvp-module-parking-complete`

---

## Summary of All Changes by File

| File | Sprint | Tickets | Change Type |
|------|--------|---------|-------------|
| `apps/shell/src/config/modules.config.ts` | 1 | 1.1 | **New file** |
| `apps/shell/src/config/__tests__/modules.config.test.ts` | 1 | 1.1 | **New file** |
| `apps/shell/rsbuild.config.ts` | 1 | 1.2 | Comment out 4 remotes |
| `scripts/build-deploy.sh` | 1, 5 | 1.3, 5.2 | Filter build, update REMOTES, add verification |
| `package.json` (root) | 1, 4 | 1.4, 4.5 | Add mvp scripts |
| `apps/shell/src/router.tsx` | 2, 3, 4 | 2.1, 3.9, 4.1 | Comment routes, add Coming Soon |
| `apps/shell/src/config/sidebar-modules.ts` | 2 | 2.2, 2.3, 2.4, 2.5 | Comment configs, update type |
| `apps/shell/src/pages/HomePage.tsx` | 3 | 3.1 | Comment 2 widgets |
| `apps/shell/src/components/dynamic-page/widgets/QuickActionsWidget.tsx` | 3 | 3.2 | Comment parked links |
| `apps/shell/src/components/dynamic-page/widgets/WelcomeTipWidget.tsx` | 3 | 3.3 | Comment tips + module tips |
| `apps/shell/src/components/dynamic-page/widgets/CarouselWidget.tsx` | 3 | 3.4 | Update mock data |
| `apps/shell/src/components/home/RecentlyVisitedCarousel.tsx` | 3 | 3.4 | Update mock data |
| `apps/shell/src/hooks/useRecentlyVisited.ts` | 3 | 3.5 | Comment metadata |
| `apps/shell/src/components/layout/Breadcrumbs.tsx` | 3 | 3.6 | Comment labels |
| `apps/shell/src/components/home/UpcomingEventsSection.tsx` | 3 | 3.7 | Comment messages link |
| `apps/shell/src/federation/tenant-resolver.ts` | 3 | 3.8 | Comment edfi references |
| `apps/shell/src/pages/settings/edfi-export-preview.tsx` | 3 | 3.9 | Evaluate & possibly park |
| `apps/shell/src/pages/settings/organization.tsx` | 3 | 3.9 | Possibly comment button |
| `docker/docker-compose.dev.yml` | 4 | 4.2, 4.3 | Add people, comment edfi |
| `docker/nginx/nginx.conf` | 4 | 4.4 | Add people, comment edfi |
| `apps/shell/src/__tests__/module-parking.test.ts` | 5 | 5.1 | **New file** |
| `docs/MODULE_PARKING.md` | 5 | 5.5 | **New file** |

---

## What We Do NOT Touch

- `apps/academics/` — MVP module, source unchanged
- `apps/finance/` — MVP module, source unchanged
- `apps/people/` — MVP module, source unchanged
- `apps/messages/` — Parked module, source code left completely intact
- `apps/analytics/` — Parked module, source code left completely intact
- `apps/special-programs/` — Parked module, source code left completely intact
- `apps/edfi/` — Parked module, source code left completely intact
- `packages/*` — Shared packages, unchanged
- `types/packages/*` — Shared types, unchanged
- `pnpm-workspace.yaml` — Keep all apps in workspace (turbo --filter handles build scoping)
- `turbo.json` — No changes needed (filtering done via scripts)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Missing a reference to a parked module causes runtime error | Medium | High | Comprehensive touch points inventory + Sprint verification + `grep` scan in Ticket 3.10 |
| Student/Parent portal broken by Messages removal | Medium | Medium | Ticket 2.4 specifically addresses all 4 portal configs |
| `localStorage` persisted visits show parked module pages in carousel | High | Low | Acceptable degradation — links go to Coming Soon page, entries age out naturally |
| Re-enablement is difficult after codebase evolves | Medium | Medium | `[MVP-PARKED]` markers + comprehensive docs (Ticket 5.5) + modules.config.ts |
| Vercel build still builds all modules (wasted time) | High | Low | Ticket 1.3 updates build-deploy.sh to use filtered turbo build |
| EdFi Export Preview page in Settings has broken API calls | Low | Medium | Ticket 3.9 evaluates and handles this case |
| Docker dev environment missing People module | High | Medium | Ticket 4.2 adds People service before removing EdFi |
| Build time regression | Low | Low | Ticket 1.4 keeps original scripts as fallback; Ticket 5.6 captures baseline |

---

## Sprint Summary

| Sprint | Goal | Tickets | Key Deliverable |
|--------|------|---------|-----------------|
| **1** | Build Pipeline Isolation | 1.1-1.5 | Shell builds without parked modules |
| **2** | Router & Navigation Cleanup | 2.1-2.6 | Clean navigation with MVP modules only |
| **3** | Widget & UI Cleanup | 3.1-3.10 | No visual references to parked modules |
| **4** | Infrastructure & Guards | 4.1-4.6 | Coming Soon pages, Docker/Nginx updated |
| **5** | Validation, Testing & Docs | 5.1-5.6 | Automated tests, QA, re-enablement docs |

**Total tickets:** 27 (22 implementation + 5 verification)
**Total new files:** 4 (modules.config.ts, modules.config.test.ts, module-parking.test.ts, MODULE_PARKING.md)
**Total modified files:** ~18
**Parked module source files touched:** 0
