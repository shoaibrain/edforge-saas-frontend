# Shell — Settings

**Seed:** `e2e/tests/seed.spec.ts`

The `/settings` hierarchy (apps/shell/src/router.tsx) with the settings
sidebar module (apps/shell/src/config/sidebar-modules.ts `settingsModule`):
Overview, My Account, Preferences, Security, Workspace Settings,
Organization, RBAC Security, Auth Debug (TenantAdmin-only).

### 1. Navigation

#### 1.1 Settings overview renders with the settings sidebar @smoke
**Steps:**
1. Navigate to `/settings` as TenantAdmin
2. Verify the settings sidebar shows My Account, Preferences, Security,
   Workspace Settings, Organization, RBAC Security nav items

#### 1.2 Each settings tab renders without console errors
**Steps:**
1. As TenantAdmin, visit each of: `/settings`, `/settings/account`,
   `/settings/preferences`, `/settings/security`, `/settings/workspace`,
   `/settings/organization`, `/settings/security-policies`, `/settings/branding`
2. Verify each renders inside the authenticated shell (no /login bounce)
3. Verify no console errors on each route

### 2. Gating

#### 2.1 Auth Debug is TenantAdmin-only
**Steps:**
1. As TenantAdmin on `/settings`, verify the Auth Debug nav item is visible
2. As Teacher on `/settings`, verify the Auth Debug nav item is NOT visible
