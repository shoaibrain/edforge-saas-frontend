# Tenant Read-Surface Audit (Sprint A.6)

**Purpose:** enumerate every frontend call that reads tenant-scoped data and confirm the
backend enforces a guard. Used to prove Sprint A (Tenant Identity Visibility) does not
widen the read surface, and as input for Sprint B (per-field lock governance).

**Date:** 2026-04-20
**Branch:** `sprint/a-tenant-identity-visibility`
**Backend reference SHA:** main @ `0f9b6bd` (Midnight Lockin merged)

## Guard model (summary)

All tenant endpoints sit behind one of three guard combinations in
[tenants.controller.ts](../../../../server/application/microservices/identity/src/tenants/tenants.controller.ts):

| Guard combination | Meaning |
|---|---|
| `@UseGuards(JwtAuthGuard)` | Any authenticated user. JWT claims (`custom:tenantId`) drive a tenant-scoped DDB client; cross-tenant reads fail at the data layer via ABAC role policy. |
| `@UseGuards(JwtAuthGuard, GlobalRoleGuard)` + `@RequireGlobalRole('TenantAdmin')` | TenantAdmin-only. Non-admin users get 403. |
| No guard | Public endpoint (e.g. subdomain lookup on the login page). |

The ABAC tenant-scoping at the DDB layer is the primary isolation boundary —
the DynamoDB client uses JWT-derived credentials that only permit reads scoped
to `partitionKey = JWT.tenantId`. A user submitting a different `tenantId` in
the URL path will hit an access-denied error from DDB, not a service-layer check.

## Frontend read/write calls against tenant endpoints

Calls originating from [apps/shell/src/services/tenant.service.ts](../../apps/shell/src/services/tenant.service.ts)
and consumed via `shell-context.tsx` + page components.

| Frontend function | HTTP | Endpoint | Backend handler | Guards | Notes |
|---|---|---|---|---|---|
| `getCurrentUser()` | GET | `/users/me` | [user-profile.controller.ts](../../../../server/application/microservices/identity/src/user-profile/user-profile.controller.ts) | `JwtAuthGuard` | Returns user identity including tenantId + tenantName — scoped to JWT. |
| `getUserAssignments(userId)` | GET | `/users/:userId/assignments` | user-profile controller | `JwtAuthGuard` | User ID from URL must match JWT user, else 403 at service layer. |
| `getTenant(tenantId)` | GET | `/tenants/:tenantId` | `TenantsController.getTenant` ([L128](../../../../server/application/microservices/identity/src/tenants/tenants.controller.ts#L128)) | `JwtAuthGuard` | **Sprint A consumer.** Response now includes archetype + country (Midnight Lockin `ca8e254`). Any authenticated user can fetch their own tenant; cross-tenant blocked at DDB by ABAC. |
| `updateTenant(tenantId, data)` | PATCH | `/tenants/:tenantId` | `TenantsController.updateTenant` ([L143](../../../../server/application/microservices/identity/src/tenants/tenants.controller.ts#L143)) | `JwtAuthGuard` + `GlobalRoleGuard` + `RequireGlobalRole('TenantAdmin')` | Archetype + country stripped by Zod immutable-field governance — server does not silently persist. |
| `getWorkspaceSettings(tenantId)` | GET | `/tenants/:tenantId/settings` | `TenantsController.getWorkspaceSettings` ([L63](../../../../server/application/microservices/identity/src/tenants/tenants.controller.ts#L63)) | `JwtAuthGuard` + `RequireGlobalRole('TenantAdmin')` | TenantAdmin-only. Non-admin UI calls fall back to SYSTEM_DEFAULTS via `useResolvedSettings`. |
| `getMyWorkspaceSettings()` | GET | `/tenants/my/settings` | `TenantsController.getMyWorkspaceSettings` ([L49](../../../../server/application/microservices/identity/src/tenants/tenants.controller.ts#L49)) | `JwtAuthGuard` | Non-admin read path — used by Finance/Academics MFEs for regional display (currency, calendar, locale). Tenant scope from JWT. |
| `updateWorkspaceSettings(tenantId, data)` | PATCH | `/tenants/:tenantId/settings` | `TenantsController.updateWorkspaceSettings` ([L111](../../../../server/application/microservices/identity/src/tenants/tenants.controller.ts#L111)) | `JwtAuthGuard` + `RequireGlobalRole('TenantAdmin')` | Additional `isLocked` runtime check in service ([L296](../../../../server/application/microservices/identity/src/tenants/tenants.service.ts#L296)) — throws Forbidden when active academic year locks the workspace. |
| `confirmWorkspaceSettings(tenantId)` | PATCH | `/tenants/:tenantId/settings/confirm` | `TenantsController.confirmWorkspaceSettings` ([L79](../../../../server/application/microservices/identity/src/tenants/tenants.controller.ts#L79)) | `JwtAuthGuard` + `RequireGlobalRole('TenantAdmin')` | Sprint C consumer — not exercised in Sprint A. |
| `completeOnboarding(tenantId)` | POST | `/tenants/:tenantId/onboarding/complete` | `TenantsController.completeOnboarding` ([L95](../../../../server/application/microservices/identity/src/tenants/tenants.controller.ts#L95)) | `JwtAuthGuard` + `RequireGlobalRole('TenantAdmin')` | Sprint C consumer. |
| `lookupBySubdomain(subdomain)` (login page) | GET | `/tenants/lookup?subdomain=xxx` | `TenantsController.lookupBySubdomain` ([L34](../../../../server/application/microservices/identity/src/tenants/tenants.controller.ts#L34)) | **None (public)** | Intentional — uses `getSystemClient()` and returns only minimal lookup shape, never workspace settings. Verified no PII exposure. |

## Sprint A surface change

Sprint A adds **zero new endpoints** and **zero new guards**. The change is purely
display-layer: `archetype` + `country` fields — already returned by the existing
`GET /tenants/:tenantId` response since commit `ca8e254` — are now rendered on
the Workspace Settings page.

- `GET /tenants/:tenantId` is already behind `JwtAuthGuard` (any authenticated user may read their own tenant).
- Displaying archetype/country does not leak information: these are tenant-level identity attributes already visible to any authenticated session of that tenant.
- Cross-tenant reads remain blocked at the DDB ABAC policy layer.

### Design revision — header mount reverted

The sprint plan (MIDNIGHT_LOCKIN_POST_SHIP_PLAN §3, task A.3) prescribed mounting
the `<TenantBadge />` in the global shell header. After live review this was
walked back: a persistent header pill is visual noise because tenant identity is
only actionable on the Workspace Settings page. The `<TenantBadge />` component
still ships as a primitive in `@edforge/shell-components` for future contextual
uses (e.g. tenant-scoped breadcrumbs, admin views) but is not mounted globally.
Tenant identity now surfaces only through the `<TenantInfoCard />` on
`apps/shell/src/pages/settings/workspace.tsx`.

## Frontend-side permission layer (ABAC package)

In addition to backend guards, the frontend gates UI visibility with
`@edforge/abac` `can(user, { action, resource, schoolId? })`. For the Workspace
Settings page this resolves to `can(user, { action: 'view', resource: 'settings:tenant' })`
at [apps/shell/src/pages/settings/workspace.tsx:314](../../apps/shell/src/pages/settings/workspace.tsx#L314).

The frontend ABAC check is an ergonomic filter (hide UI when no permission) —
the backend `RequireGlobalRole('TenantAdmin')` is the authoritative boundary.

## Open items for Sprint B

1. **PATCH 400 lock-violation response shape.** The backend currently throws a
   generic `ForbiddenException` with a `lockReason` string. Sprint B.5 needs the
   shape to include `{ field, reason }` so the frontend can route the toast to
   the specific input. Expand the thrown error in
   [tenants.service.ts:296](../../../../server/application/microservices/identity/src/tenants/tenants.service.ts#L296).

2. **Archetype immutability PATCH contract test.** Sprint B.7 calls for a live
   UAT check that `PATCH /tenants/:tenantId { archetype: "GENERIC" }` returns
   400 with `"immutable"` in the error body. Today the Zod schema strips
   immutable fields silently (200 with unchanged value). Align these expectations
   before Sprint B.7 lands.

3. **`/tenants/my/settings` non-admin read surface.** `getMyWorkspaceSettings()`
   returns the full `WorkspaceSettingsResponseDto` shape today. Review whether
   non-admin users need the `isLocked`, `lockReason`, or `workspaceConfirmedAt`
   fields — consider a trimmed projection for this endpoint as Sprint F
   (Regional Display Primitives) matures.
