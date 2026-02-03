# EdForge MFE Architecture

> Multi-tenant micro-frontend architecture for EdForge EMIS.

## System Overview

EdForge uses a **Shell + Remotes** micro-frontend pattern powered by Rsbuild (Rspack) and `@module-federation/enhanced`.

```
Browser
┌──────────────────────────────────────────────────────────────────┐
│                           Shell (Host)                            │
│  Auth (Cognito) • Tenant Context • Global Layout • Routing         │
│                         ⬇ Module Federation                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  Ed-Fi   │ │Academics │ │ Finance  │ │ People   │ │ Special  │  │
│  │  :3001   │ │  :3002   │ │  :3003   │ │  :3006   │ │ Programs │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐                                        │
│  │ Messages │ │ Analytics│                                        │
│  │  :3007   │ │  :3008   │                                        │
│  └──────────┘ └──────────┘                                        │
└──────────────────────────────────────────────────────────────────┘
                        Shared Packages (workspace)
```

## Monorepo Structure

- `apps/` — federated apps (Shell + remotes)
- `packages/` — shared libraries (`ui`, `abac`, `auth`, `types`, `theme`, `forms`, `wizard`)
- `types/packages/` — generated/shared API types (Ed-Fi models)
- `docker/` — dev containers and Nginx reverse proxy config

## Runtime Composition

1. **Shell bootstraps** the app and initializes Cognito via `@edforge/auth` (`apps/shell/src/main.tsx`).
2. **ShellProvider** loads user/tenant/school context and exposes ABAC context to all remotes (`apps/shell/src/lib/shell-context.tsx`).
3. **Routing** uses TanStack Router; remote modules are loaded lazily for splat routes like `/academics/*` (`apps/shell/src/router.tsx`).
4. **Remotes** mount their own internal routes/UI, but share state and auth tokens with the Shell via singleton dependencies.

## Module Federation Configuration

### Host (Shell)
`apps/shell/rsbuild.config.ts` defines remotes for local development:

- `edfi` → `http://localhost:3001/remoteEntry.js`
- `academics` → `http://localhost:3002/remoteEntry.js`
- `finance` → `http://localhost:3003/remoteEntry.js`
- `special-programs` → `http://localhost:3005/remoteEntry.js` (remote name: `special_programs`)
- `people` → `http://localhost:3006/remoteEntry.js`
- `messages` → `http://localhost:3007/remoteEntry.js`
- `analytics` → `http://localhost:3008/remoteEntry.js`

### Remotes
Each remote exposes its module entry points (e.g., `./AcademicsModule`) in `apps/*/rsbuild.config.ts` with `publicPath: 'auto'` for runtime asset resolution. The People remote explicitly sets `publicPath` to `http://localhost:3006/` for dev.

### Shared Singletons
Critical libraries are singleton/eager to avoid version splits:

- `react`, `react-dom`
- `aws-amplify`, `@edforge/auth`
- `@tanstack/react-query`, `@tanstack/react-router`
- `zustand`
- `@edforge/ui`, `@edforge/abac`, `@edforge/types`, `@edforge/theme`
- `react-hook-form`, `@hookform/resolvers`, `zod`
- `framer-motion`, `@react-spring/web`

## Remotes and Exposed Modules

### Ed-Fi (`apps/edfi`)
Exposes: `ConnectionWizard`, `DescriptorMapper`, `SyncDashboard`, `ErrorAggregator`, `EdFiModule`.

### Academics (`apps/academics`)
Exposes: `StudentsModule`, `AttendanceModule`, `GradebookModule`, `EnrollmentModule`, `AcademicsModule`.

### Finance (`apps/finance`)
Exposes: `BillingModule`, `PayrollModule`, `TuitionModule`, `ExpensesModule`, `FinanceModule`.

### Special Programs (`apps/special-programs`)
Exposes: `SpecialProgramsModule`, `IEPsModule`, `504PlansModule`, `AccommodationsModule`,
`AccessibilityModule`, `CounselingModule`, `InterventionsModule`.

### People (`apps/people`)
Exposes: `PeopleModule`.

### Messages (`apps/messages`)
Exposes: `MessagesModule`.

### Analytics (`apps/analytics`)
Exposes: `AnalyticsModule`.

## Multi-Tenancy

The Shell owns tenant state and passes it to remotes through context (`ShellProvider`):

- Tenant and school data fetched through `tenantService` (`apps/shell/src/services/tenant.service.ts`)
- Active school selection stored in Shell state and shared with remotes

### Tenant-Aware Remote Resolution

`apps/shell/src/federation/tenant-resolver.ts` defines a runtime plugin that resolves remote URLs by:

1. `window.__EDFORGE_CONFIG__` (runtime injection for production or container deployments)
2. Local dev defaults (static localhost ports)
3. Build-time `VITE_*` URLs (CI/legacy fallback)

This plugin is available to register with the Module Federation runtime when tenant-specific remotes are required.

## Authentication & Authorization

- Auth is initialized in the Shell using `@edforge/auth` (Cognito via Amplify).
- Auth state is centralized in `useAuthStore` and enforced by router guards in `apps/shell/src/router.tsx`.
- ABAC checks are implemented via `@edforge/abac` using the Shell’s context.

## API Access & Proxying

During development, the Shell proxies `/api` calls to `VITE_API_URL` (defaulting to the AWS API Gateway URL) using Rsbuild’s dev proxy in `apps/shell/rsbuild.config.ts`. The proxy preserves headers for tenant-aware backend requests.

## Docker & Nginx

`docker/docker-compose.dev.yml` + `docker/nginx/nginx.conf` provide a dev reverse proxy:

- `http://localhost:8080` → Shell
- `/remotes/{module}/` routes to module services

## Key Files

- `apps/shell/rsbuild.config.ts` — host Module Federation config
- `apps/*/rsbuild.config.ts` — remote Module Federation configs
- `apps/shell/src/router.tsx` — route composition and lazy remote loading
- `apps/shell/src/lib/shell-context.tsx` — shared Shell context & ABAC
- `apps/shell/src/federation/tenant-resolver.ts` — tenant-aware remote resolution
- `docker/nginx/nginx.conf` — dev proxy for shell/remotes

## Notes & Conventions

- Route segments for remotes use splat routes (`/academics/*`, `/finance/*`) to allow internal routing.
- Shared packages are workspace dependencies to keep runtime types and UI aligned across remotes.
- Module federation shared versions are pinned to avoid runtime mismatch errors.
