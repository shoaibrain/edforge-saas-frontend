# AdminWeb Audit — Tenant Creation & Management

**Date:** 2026-03-22
**Scope:** `/Users/shoaibrain/edforge/client/AdminWeb/src/`
**Purpose:** Read-only audit of the SaaS Provider Console tenant creation flow, API layer, provisioning automation, and admin invitation email.

---

## 1. Directory Structure

```
AdminWeb/src/
├── index.tsx                          # Entry point
├── App.tsx                            # Routing (react-router-dom)
├── auth/
│   └── AuthConfig.ts                  # OIDC config (Cognito)
├── components/
│   ├── Auth/AuthCallback.tsx          # OAuth callback handler
│   ├── DeleteTenantDialog.tsx         # Delete confirmation
│   ├── Layout/
│   │   ├── Layout.tsx                 # Main layout wrapper
│   │   ├── components/AppHeader.tsx
│   │   ├── components/DrawerContent.tsx
│   │   ├── constants.ts
│   │   ├── hooks/useLayout.ts
│   │   └── types.ts
│   └── common/ConfirmDialog.tsx
├── config/
│   └── environment.ts                 # Env vars: apiUrl, clientId, issuer
├── constants/
│   ├── pricing.ts                     # BASIC=$29, ADVANCED=$99, PREMIUM=$299
│   ├── styles.ts
│   └── tenant.ts                      # DEFAULT_TIER='basic', REGISTRATION_STATUS='In progress'
├── contexts/
│   └── AuthContext.tsx                # OIDC auth context (react-oidc-context)
├── hooks/
│   └── useTenants.ts                  # Tenant list state (pagination, delete)
├── models/
│   └── tenant.ts                      # TypeScript interfaces
├── pages/
│   ├── Auth/AuthInfo.tsx              # Debug page
│   ├── Dashboard/Dashboard.tsx
│   └── Tenants/
│       ├── TenantList.tsx             # Paginated tenant cards
│       ├── TenantCreate.tsx           # "Onboard New Tenant" form
│       └── TenantDetail.tsx           # Read-only detail + delete
├── services/
│   ├── api.ts                         # Axios instance with Bearer token interceptor
│   └── tenantService.ts              # Tenant API calls
├── styles/                            # CSS files
├── types/
│   └── errors.ts                      # handleApiError utility
└── utils/
    └── jwtUtils.ts
```

### Routes (App.tsx)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | Redirect → `/tenants` | Default landing |
| `/dashboard` | Dashboard | Dashboard page |
| `/tenants` | TenantList | Paginated tenant list |
| `/tenants/create` | TenantCreate | Onboard New Tenant form |
| `/tenants/:id` | TenantDetail | Tenant registration detail |
| `/callback`, `/signin-oidc` | AuthCallback | OAuth redirect handler |
| `/auth/info` | AuthInfo | Debug/auth info page |

---

## 2. Tenant Creation Flow

### A. Form Submission

**File:** `pages/Tenants/TenantCreate.tsx`

**Form fields collected:**

| Field | Type | Required | Validation | Lines |
|-------|------|----------|------------|-------|
| Tenant Name | `<TextField>` | YES | `/^[a-z][a-z0-9-]*$/` — must start lowercase, only lowercase/numbers/hyphens | 228-237 |
| Administrator Email | `<TextField type="email">` | YES | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` — validated on blur | 264-275 |
| Tier | Card selection (BASIC/ADVANCED/PREMIUM) | YES | Must select one | 284-327 |
| Use Federation | `<Switch>` | NO | Enabled only for ADVANCED/PREMIUM | 334-359 |
| Use Reverse Proxy | `<Switch>` (default: true) | NO | Disabled for BASIC | 361-379 |
| Use EC2 | `<Switch>` | NO | Enabled only for PREMIUM | 381-399 |

**Fields for country, currency, calendarSystem, timezone, locale, numberFormat: NO. None exist.**

Evidence: The `FormData` interface (lines 29-36) contains exactly six fields:
```typescript
interface FormData {
  tenantName: string;
  email: string;
  tier: string;
  useFederation: boolean;
  useEc2: boolean;
  useRProxy: boolean;
}
```
No other form state exists. A commented-out "Institution Name" field exists at lines 240-256 but is unused.

**Create Tenant button handler:** `handleSubmit()` at lines 146-186.

Flow:
1. Checks authentication (`user.access_token`) — line 151
2. Validates form via `validateForm()` — line 156
3. Constructs `CreateTenantRequest` — lines 163-177
4. Calls `tenantService.createTenant(tenant)` — line 179
5. Navigates to `/tenants` on success — line 180

**Exact request payload shape:**
```typescript
{
  tenantId: uuid(),                           // Generated client-side
  tenantData: {
    tenantName: "string",
    email: "string",
    tier: "BASIC" | "ADVANCED" | "PREMIUM",
    prices: [],                               // Always empty array
    useFederation: "true" | "false",          // String, not boolean
    useEc2: "true" | "false",
    useRProxy: "true" | "false",
  },
  tenantRegistrationData: {
    registrationStatus: "In progress",        // From TENANT_DEFAULTS
  },
}
```

**API endpoint called:** `POST /tenant-registrations`
(tenantService.ts line 57: `apiService.post(this.tenantsApiUrl, tenant)`)

### B. API Layer

**Base URL:** `environment.apiUrl` = `process.env.REACT_APP_API_URL` (config/environment.ts line 6). Configurable per environment via build-time env vars.

**Authentication:** JWT Bearer token via Cognito OIDC.
- OIDC config in `auth/AuthConfig.ts`: Authority = Cognito issuer, response_type = 'code'
- Scopes: `openid profile email tenant/tenant_read tenant/tenant_write user/user_read user/user_write`
- API interceptor in `services/api.ts` (lines 26-42): Adds `Authorization: Bearer ${token}` header
- 401 responses trigger `window.location.reload()` (line 50)

**Service file:** `services/tenantService.ts`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `createTenant(tenant)` | `POST /tenant-registrations` | Create tenant + trigger provisioning |
| `fetchTenantsPage(nextToken?)` | `GET /tenants?limit=18&next_token=...` | Paginated tenant list |
| `fetchTenants()` | `GET /tenants?limit=100&next_token=...` (loops) | All tenants |
| `getTenant(id)` | `GET /tenant-registrations/{id}` | Single registration detail |
| `deleteTenant(tenant)` | `DELETE /tenant-registrations/{id}` | Mark tenant inactive |

Two base URLs:
- `tenantsApiUrl = ${apiUrl}/tenant-registrations` — for registration operations
- `tenantsMgmtApiUrl = ${apiUrl}/tenants` — for management/listing

### C. Post-Creation Flow

**After success:** `navigate("/tenants")` (line 180). Redirects to tenant list. No success toast, no dialog, no detail page redirect.

**Post-creation regional settings step:** NO. There is no step or redirect to configure regional settings after creation.

**Tenant detail/edit page:** `pages/Tenants/TenantDetail.tsx` — **read-only**. Displays:
- Tenant Name (from navigation state)
- Registration ID
- Registration Status (with status badge)
- Tenant ID (from URL param)

Actions: Delete button only (disabled if `sbtaws_active === false`).

**Can admin update regional settings from AdminWeb?** NO. There is no settings edit page, no regional settings form, no PATCH/PUT endpoint called for tenant configuration anywhere in AdminWeb.

### D. Tenant Listing & Management

**File:** `pages/Tenants/TenantList.tsx`

Data displayed per tenant card:
- Tenant Name (`tenantData.tenantName`)
- Email (`tenantData.email`)
- Tier (chip with color: basic→default, advanced→primary, premium→secondary)
- Registration Status (chip with color: complete→success, failed→error, in_progress→warning)
- Tenant ID (`tenantId`)

**Setup completeness:** The `registrationStatus` field serves as a provisioning progress indicator. Values observed in the status mapping (TenantDetail.tsx lines 63-128):
- Complete/Created/Active → success
- Failed/Error → error
- In Progress/Provisioning/Processing → info (spinning icon)
- Pending/Waiting → warning
- Deleted/Cancelled → error/default

No indication of *configuration* completeness (e.g., "regional settings not configured", "no schools created").

---

## 3. Provisioning Automation

### What happens on the backend when "Create Tenant" is called

The system uses **AWS SBT (SaaS Builder Toolkit)** with **CDK** for automated provisioning.

**Flow:**
1. `POST /tenant-registrations` hits the SBT Control Plane API
2. SBT triggers `ProvisioningScriptJob` which executes `provision-tenant.sh`
3. Script deploys tenant-specific CloudFormation stack via CDK
4. On success, SBT emits `sbt_aws_provisionSuccess` event to EventBridge
5. `TenantSeederLambda` listens for this event and seeds tenant metadata to DynamoDB

**File:** `server/lib/provision-scripts/provision-tenant.sh`

### Resources created ("Auto Provisioning"):

**1. DynamoDB Tables** (`server/lib/tenant-template/ecs-dynamodb.ts`)
- Tier-specific identity tables: `edforge-identity-basic`, `edforge-identity-premium`, `edforge-identity-advanced`
- Schema: PK = `tenantId` (STRING), SK = `entityKey` (STRING)
- GSIs: GSI1 (subdomain lookup), GSI2-GSI6 (academic/school data indexes)
- Billing: PAY_PER_REQUEST
- PITR: Enabled
- TTL: via `ttl` attribute (FERPA 2-year retention)

**2. Cognito User Pool** (`server/lib/tenant-template/identity-provider.ts`)
- Auto-verify: Email enabled
- Password policy: 8+ chars, uppercase, lowercase, digits, symbols
- Custom attributes: `tenantId`, `userRole`, `apiKey`, `tenantTier`, `tenantName` (all mutable)
- Self-signup: Configurable via `useFederation`
- Account recovery: EMAIL_ONLY

**3. ECS Services** (`server/lib/service-info.json`)
- Identity Service (port 3010)
- Academics Service (port 3011)
- Finance Service (port 3012)
- Reverse Proxy Service (rproxy)

**4. Tenant Metadata** (seeded by TenantSeederLambda, `server/lib/bootstrap-template/tenant-seeder-lambda.ts`)
```
{
  tenantId, entityKey: "METADATA", entityType: "TENANT",
  name, subdomain, tier, status: "active", contactEmail,
  features: { tier-specific feature JSON },
  schoolCount: 0, userCount: 0, studentCount: 0,
  cognitoUserPoolId, createdAt, createdBy: "SYSTEM", version: 1
}
```

**5. Tenant Routing Configuration** (`server/lib/tenant-template/tenant-template-stack.ts` lines 188-232)
- Record in shared `tenant-mapping-table`: tenantId, stackName, codeCommitId, waveNumber

### Tenant Features by Tier (seeded on provisioning)

| Feature | BASIC | PREMIUM | ADVANCED |
|---------|-------|---------|----------|
| maxSchools | 1 | 5 | 100 |
| maxUsersPerSchool | 50 | 200 | 1000 |
| maxStudentsPerSchool | 500 | 2000 | 10000 |
| Finance | DISABLED | ENABLED | ENABLED |
| Analytics | DISABLED | ENABLED | ENABLED |
| API Access | DISABLED | ENABLED | ENABLED |
| SSO | DISABLED | DISABLED | ENABLED |
| Multi-language | DISABLED | ENABLED | ENABLED |

### Workspace Settings Initialization

**File:** `server/application/microservices/identity/src/common/entities/workspace-settings.entity.ts`

Workspace settings are created **lazily on first access** via `createDefaultWorkspaceSettings()` (lines 60-95). They are NOT created during provisioning.

**Default values for a brand-new tenant:**

| Field | Default Value |
|-------|---------------|
| defaultTimezone | `America/New_York` |
| defaultLocale | `en-US` |
| defaultDateFormat | `MM/DD/YYYY` |
| defaultTimeFormat | `12h` |
| defaultWeekStartsOn | `sunday` |
| defaultCurrency | `USD` |
| defaultCalendarSystem | `gregorian` |
| enableDualDateDisplay | `false` |
| defaultNumberFormat | `international` |

**Critical finding:** These defaults are US-centric. A Nepal tenant created via AdminWeb will receive `USD` currency, `America/New_York` timezone, `gregorian` calendar, and `en-US` locale by default. The AdminWeb form has no way to set these at creation time.

---

## 4. Admin Invitation Email

**Service:** Amazon Cognito built-in email (uses SES under the hood)

**Trigger:** `provision-tenant.sh` runs `aws cognito-idp admin-create-user` with `--desired-delivery-mediums EMAIL` (lines 109-126)

**Email template** (configured at User Pool creation, `server/lib/tenant-template/identity-provider.ts` lines 59-73):

**Subject:** `Welcome to EdForge - Your Account is Ready`

**Body:**
```
Welcome to EdForge! Your account has been created.

Login to your EdForge account at {clientAppUrl} with:
Username: {username}
Temporary Password: {####}

Please change your password after your first login.

If you have any questions, please contact your administrator.
```

**SMS message:** `Welcome to EdForge! Login: {clientAppUrl}, username: {username}, temp password: {####}`

**Details:**
- `{clientAppUrl}` is set from `CDK_PARAM_NEXTJS_APP_URL` env var, passed through SharedInfraStack → TenantTemplateStack → IdentityProvider
- `{####}` is Cognito's temporary password placeholder (Cognito generates the password)
- Email is auto-verified at creation (`email_verified: True`)
- Template is hardcoded at CDK deployment time (not dynamic per tenant or locale)
- No onboarding checklist, no "set up your school" instructions, no regional settings prompt
- User must change password on first login (Cognito enforced, `CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED`)

---

## Summary of AdminWeb Capabilities

| Capability | Status |
|------------|--------|
| Create tenant with name, email, tier | YES |
| Set infrastructure options (federation, EC2, rproxy) | YES |
| Set regional settings at creation time | NO |
| Edit tenant settings after creation | NO |
| View tenant registration status | YES |
| Delete tenant | YES |
| View tenant list with pagination | YES |
| Set country/currency/timezone/calendar for tenant | NO — not in form, not in API payload, not on detail page |
