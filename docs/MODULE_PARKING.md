# Module Parking Guide

## Overview

For the MVP release, 4 modules have been parked (disabled from build/deployment):

| Module | Path | Status |
|--------|------|--------|
| Messages | `/messages` | Parked |
| Analytics | `/analytics` | Parked |
| Special Programs | `/special-programs` | Parked |
| State Reporting (Ed-Fi) | `/edfi` | Parked |

Active MVP modules: **Academics**, **Finance**, **People & HR**, **Shell/System Admin**

## How It Works

All parked code is marked with `[MVP-PARKED]` / `[/MVP-PARKED]` comment markers.
No code was deleted — only commented out or conditionally disabled.

### Quick grep to find all parked code:

```bash
grep -r "\[MVP-PARKED\]" apps/shell/src --include="*.ts" --include="*.tsx" -l
```

## Re-enabling a Module

To re-enable a parked module (e.g., `messages`), follow these steps in order:

### 1. Module Federation (rsbuild.config.ts)

Uncomment the remote in `apps/shell/rsbuild.config.ts`:

```ts
remotes: {
  academics: remoteUrl('academics', 'academics', 3002),
  finance: remoteUrl('finance', 'finance', 3003),
  people: remoteUrl('people', 'people', 3006),
  messages: remoteUrl('messages', 'messages', 3004), // ← uncomment
},
```

### 2. Router (router.tsx)

In `apps/shell/src/router.tsx`:
- Uncomment the lazy import for the module
- Uncomment the route definition
- Add the route back to the route tree
- Remove the corresponding Coming Soon catch-all route

### 3. Sidebar Navigation (sidebar-modules.ts)

In `apps/shell/src/config/sidebar-modules.ts`:
- Uncomment the module's nav items in `homeModule`
- Uncomment the full module config (e.g., `messagesModule`)
- Re-add to `SIDEBAR_MODULES` registry
- Re-add to `SidebarModule` type union
- Re-add path check in `detectModuleFromPath()`

### 4. Module Registry (modules.config.ts)

In `apps/shell/src/config/modules.config.ts`:
- Set the module to `true` in `MODULE_AVAILABILITY`
- Remove from `PARKED_MODULE_PATHS`

### 5. Build Scripts

- Update `scripts/build-deploy.sh`: add module to `REMOTES` array
- Update `package.json` root: add module to `build:mvp` and `dev:mvp` filter lists

### 6. Widgets & UI

Search for `[MVP-PARKED]` in these files and uncomment relevant sections:
- `QuickActionsWidget.tsx` — quick action cards
- `WelcomeTipWidget.tsx` — module tips and admin welcome tip
- `CarouselWidget.tsx` — mock recently visited data
- `useRecentlyVisited.ts` — page metadata and mock data
- `Breadcrumbs.tsx` — route label mappings
- `RecentlyVisitedCarousel.tsx` — mock data and color schemes
- `UpcomingEventsSection.tsx` — "View all" link target
- `HomePage.tsx` — widget imports/renders (for ComplianceAlerts/DataHealth)

### 7. Infrastructure

- `docker/docker-compose.dev.yml` — uncomment service, add to shell depends_on
- `docker/nginx/nginx.conf` — uncomment upstream and location block
- `apps/shell/src/federation/tenant-resolver.ts` — uncomment remote URL
- `apps/shell/src/lib/shell-context.tsx` — re-enable feature flags

### 8. Settings (Ed-Fi only)

- `apps/shell/src/pages/settings/index.ts` — uncomment EdFi export
- `apps/shell/src/pages/settings/organization.tsx` — uncomment Ed-Fi Preview button
- `apps/shell/src/router.tsx` — uncomment settingsEdFiExportPreviewRoute

### 9. Verify

```bash
# Build and verify
pnpm run build:mvp
pnpm test

# Check no stale parked markers remain for the re-enabled module
grep -r "MVP-PARKED.*messages" apps/shell/src --include="*.ts" --include="*.tsx"
```

## Files Modified

| File | Changes |
|------|---------|
| `apps/shell/rsbuild.config.ts` | Parked remotes commented out |
| `apps/shell/src/router.tsx` | Routes + Coming Soon catch-alls |
| `apps/shell/src/config/sidebar-modules.ts` | Nav items, configs, types, path detection |
| `apps/shell/src/config/modules.config.ts` | Module availability registry (NEW) |
| `apps/shell/src/pages/HomePage.tsx` | Widget imports/renders |
| `apps/shell/src/components/dynamic-page/widgets/QuickActionsWidget.tsx` | Parked quick actions |
| `apps/shell/src/components/dynamic-page/widgets/WelcomeTipWidget.tsx` | Admin tip + MODULE_TIPS |
| `apps/shell/src/components/dynamic-page/widgets/CarouselWidget.tsx` | Mock data |
| `apps/shell/src/hooks/useRecentlyVisited.ts` | Page metadata + mock data |
| `apps/shell/src/components/layout/Breadcrumbs.tsx` | Route labels |
| `apps/shell/src/components/home/UpcomingEventsSection.tsx` | View all link |
| `apps/shell/src/components/home/RecentlyVisitedCarousel.tsx` | Mock data + colors |
| `apps/shell/src/components/layout/pages/HomePage.tsx` | Legacy quick action |
| `apps/shell/src/federation/tenant-resolver.ts` | EdFi remote URLs |
| `apps/shell/src/lib/shell-context.tsx` | Feature flags |
| `apps/shell/src/pages/settings/organization.tsx` | EdFi Preview button |
| `apps/shell/src/pages/settings/index.ts` | EdFi export barrel |
| `apps/shell/src/components/layout/ComingSoon.tsx` | Coming Soon page (NEW) |
| `scripts/build-deploy.sh` | MVP-filtered build |
| `package.json` | MVP build/dev scripts |
| `docker/docker-compose.dev.yml` | People added, EdFi commented |
| `docker/nginx/nginx.conf` | People added, EdFi commented |
