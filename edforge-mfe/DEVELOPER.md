# EdForge Micro-Frontend (MFE) Developer Guide

> **Version:** 1.0.0  
> **Architecture:** Shell + Remotes (Module Federation)  
> **Build Tool:** Rsbuild + Rspack with `@module-federation/enhanced`

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Quick Start](#quick-start)
3. [Project Structure](#project-structure)
4. [Key Concepts](#key-concepts)
5. [Development Workflow](#development-workflow)
6. [Adding a New Module](#adding-a-new-module)
7. [Shared Packages](#shared-packages)
8. [Authentication & Authorization](#authentication--authorization)
9. [Multi-Tenancy](#multi-tenancy)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

EdForge uses a **"Shell & Remote"** micro-frontend pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                        SHELL (Host)                         │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│  │    Auth     │   Tenant    │   Global    │   Layout    │  │
│  │   (OIDC)    │   Context   │    State    │  (Sidebar)  │  │
│  └─────────────┴─────────────┴─────────────┴─────────────┘  │
│                            ↓                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Module Federation Runtime                  ││
│  └─────────────────────────────────────────────────────────┘│
│           ↓               ↓               ↓                 │
│   ┌───────────┐   ┌───────────┐   ┌───────────┐            │
│   │  Ed-Fi    │   │ Academics │   │  Finance  │    ...     │
│   │  :3001    │   │   :3002   │   │   :3003   │            │
│   └───────────┘   └───────────┘   └───────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### Key Benefits

| Feature | Description |
|---------|-------------|
| **Independent Deployment** | Each module can be built/deployed independently |
| **Shared Dependencies** | React, Zustand, etc. loaded once (singleton) |
| **Type Safety** | `mf dts` generates types across module boundaries |
| **Tenant Isolation** | Shell manages tenant context for all remotes |
| **ABAC** | Centralized permission checking via `@edforge/abac` |

---

## Quick Start

### Prerequisites

- **Node.js** ≥ 20.x
- **pnpm** ≥ 9.x (install via `npm install -g pnpm` or Corepack)
- **Docker** (optional, for containerized dev)

### Installation

```bash
# Navigate to the MFE directory
cd edforge-mfe

# Install all dependencies
pnpm install

# Build shared packages first
pnpm build:packages

# Run type checking
pnpm typecheck

# Start development (all apps)
pnpm dev
```

### Default Ports

| App | Port | URL |
|-----|------|-----|
| Shell (Host) | 3000 | http://localhost:3000 |
| Ed-Fi Module | 3001 | http://localhost:3001 |
| Academics Module | 3002 | http://localhost:3002 |
| Finance Module | 3003 | http://localhost:3003 |

---

## Project Structure

```
edforge-mfe/
├── apps/                    # Micro-frontend applications
│   ├── shell/               # Host application (entry point)
│   │   ├── src/
│   │   │   ├── App.tsx           # Main router + layout
│   │   │   ├── main.tsx          # React entry point
│   │   │   ├── stores/           # Zustand stores (auth, app)
│   │   │   ├── lib/              # Shell context, utilities
│   │   │   ├── federation/       # MF config, tenant resolver
│   │   │   └── components/       # Layout, sidebar, header
│   │   └── rsbuild.config.ts     # Module Federation host config
│   │
│   ├── edfi/                # Ed-Fi Alliance integration module
│   │   ├── src/
│   │   │   ├── EdFiModule.tsx    # Exposed module entry
│   │   │   ├── components/       # Connection, Mapping, Errors
│   │   │   └── stores/           # Module-specific state
│   │   └── rsbuild.config.ts     # Module Federation remote config
│   │
│   ├── academics/           # Students, Teachers, Attendance
│   └── finance/             # Billing, Payroll, Tuition
│
├── packages/                # Shared packages
│   ├── types/               # TypeScript type definitions
│   ├── ui/                  # React UI components (Button, Card, etc.)
│   ├── abac/                # Permission engine & hooks
│   ├── theme/               # Tailwind CSS + design tokens
│   └── config/              # ESLint, TypeScript base configs
│
├── docker/                  # Docker Compose for local dev
├── scripts/                 # Build & utility scripts
├── turbo.json               # Turborepo pipeline config
└── pnpm-workspace.yaml      # Monorepo workspace config
```

---

## Key Concepts

### 1. Module Federation

Each "remote" app exposes components that the "host" (Shell) can dynamically import:

**Remote Config (apps/edfi/rsbuild.config.ts):**
```typescript
new ModuleFederationPlugin({
  name: 'edfi',
  exposes: {
    './EdFiModule': './src/EdFiModule.tsx',
    './ConnectionWizard': './src/components/connection/ConnectionWizard.tsx',
  },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
    '@edforge/ui': { singleton: true },
    // ...
  },
})
```

**Host Config (apps/shell/rsbuild.config.ts):**
```typescript
new ModuleFederationPlugin({
  name: 'shell',
  remotes: {
    edfi: 'edfi@http://localhost:3001/mf-manifest.json',
    academics: 'academics@http://localhost:3002/mf-manifest.json',
  },
  shared: { /* same as remote */ },
})
```

### 2. Lazy Loading Remotes

In the Shell, remote modules are loaded on-demand:

```tsx
// apps/shell/src/routes/EdFiRoute.tsx
import { loadRemote } from '@module-federation/enhanced/runtime'
import { Suspense, lazy } from 'react'

const EdFiModule = lazy(() => loadRemote<{ default: ComponentType }>('edfi/EdFiModule'))

export function EdFiRoute() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <EdFiModule />
    </Suspense>
  )
}
```

### 3. Shared State

Critical state lives in the Shell and is passed via React Context:

```tsx
// Shell provides context
<ShellProvider user={user} tenant={tenant}>
  <RemoteModule />
</ShellProvider>

// Remote reads context
import { useShell } from 'shell/context' // type-safe import
const { user, tenant, activeSchoolId } = useShell()
```

---

## Development Workflow

### Running Individual Apps

```bash
# Shell only (requires remotes to be built/running)
pnpm --filter @edforge/shell dev

# Ed-Fi module only
pnpm --filter @edforge/edfi dev

# All apps in parallel
pnpm dev
```

### Building

```bash
# Build all packages first (types, ui, abac, theme)
pnpm build:packages

# Build all apps
pnpm build

# Build specific app
pnpm --filter @edforge/shell build
```

### Type Checking

```bash
pnpm typecheck   # All packages & apps
pnpm lint        # ESLint across monorepo
```

### Running with Docker

```bash
cd docker
docker-compose up
```

---

## Adding a New Module

### Step 1: Create the App

```bash
mkdir -p apps/people/src/{components,routes,stores,lib}
mkdir apps/people/public
```

### Step 2: Add package.json

```json
{
  "name": "@edforge/people",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "rsbuild dev",
    "build": "rsbuild build",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@edforge/ui": "workspace:*",
    "@edforge/types": "workspace:*",
    "@edforge/abac": "workspace:*",
    "@module-federation/enhanced": "^0.8.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

### Step 3: Configure Module Federation

```typescript
// apps/people/rsbuild.config.ts
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack'

export default defineConfig({
  server: { port: 3004 },
  tools: {
    rspack: (config, { appendPlugins }) => {
      appendPlugins([
        new ModuleFederationPlugin({
          name: 'people',
          filename: 'remoteEntry.js',
          exposes: {
            './PeopleModule': './src/PeopleModule.tsx',
          },
          shared: {
            react: { singleton: true },
            'react-dom': { singleton: true },
            '@edforge/ui': { singleton: true },
            '@edforge/types': { singleton: true },
            '@edforge/abac': { singleton: true },
          },
        }),
      ])
    },
  },
})
```

### Step 4: Register in Shell

```typescript
// apps/shell/rsbuild.config.ts - add to remotes
remotes: {
  people: 'people@http://localhost:3004/mf-manifest.json',
}

// apps/shell/src/routes.tsx - add route
const PeopleModule = lazy(() => loadRemote('people/PeopleModule'))
```

---

## Shared Packages

| Package | Purpose | Key Exports |
|---------|---------|-------------|
| `@edforge/types` | TypeScript types | `UserIdentity`, `TenantInfo`, `Student`, etc. |
| `@edforge/ui` | React components | `Button`, `Card`, `Avatar`, `Skeleton`, etc. |
| `@edforge/abac` | Permission engine | `can()`, `useCanAccess()`, `ROLE_PERMISSIONS` |
| `@edforge/theme` | CSS + design tokens | Tailwind base, CSS variables |
| `@edforge/config` | Build config | ESLint, TypeScript base configs |

### Using Shared Packages

```tsx
import { Button, Card } from '@edforge/ui'
import { useCanAccess } from '@edforge/abac'
import type { Student } from '@edforge/types'

function StudentCard({ student }: { student: Student }) {
  const canEdit = useCanAccess({ resource: 'students', action: 'edit' })
  return (
    <Card>
      <h3>{student.firstName} {student.lastName}</h3>
      {canEdit && <Button>Edit</Button>}
    </Card>
  )
}
```

---

## Authentication & Authorization

### Auth Flow (Shell-Managed)

1. Shell handles OIDC login/logout
2. Auth state stored in `useAuthStore` (Zustand + persist)
3. User identity includes `globalRole` and `schoolRoles`
4. Shell provides user context to all remotes

### ABAC Permission Check

```tsx
import { can, useCanAccess } from '@edforge/abac'

// Imperative check
if (can(user, { action: 'edit', resource: 'students', schoolId })) {
  // ...
}

// React hook
const canViewGrades = useCanAccess({ resource: 'grades', action: 'view' })
```

### Role Hierarchy

| Role | Scope | Access Level |
|------|-------|--------------|
| TenantAdmin | Tenant-wide | Full access to all schools |
| Principal | Per-school | Full access within school |
| Teacher | Per-school | Classes, students, grades |
| Accountant | Per-school | Finance, billing |
| Parent | Per-student | Read-only child data |
| Student | Self | Read-only own data |

---

## Multi-Tenancy

### Tenant Resolution

The Shell resolves tenant from URL subdomain or path:

```typescript
// alpha.edforge.app → tenantId: 'alpha'
// edforge.app/t/alpha → tenantId: 'alpha'
```

### Accessing Tenant Context

```tsx
import { useShell } from 'shell/context'

function MyComponent() {
  const { tenant, activeSchoolId } = useShell()
  // tenant.id, tenant.name, tenant.settings
}
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Module not found at runtime | Ensure remote is running; check `mf-manifest.json` URL |
| Type errors across modules | Run `pnpm build:packages` first |
| Shared dep version mismatch | Check `singleton: true` and version alignment |
| CSS not loading | Import `@edforge/theme` in app entry |

### Debug Module Federation

```bash
# Check remote manifest
curl http://localhost:3001/mf-manifest.json

# Verify exposed modules
# Look for "exposes" in the manifest
```

### Clearing Turbo Cache

```bash
pnpm turbo clean
pnpm install
pnpm build:packages
```

---

## Module Registry

Current modules in the system:

| Module | Port | Purpose |
|--------|------|---------|
| `@edforge/shell` | 3000 | Host application (orchestrates all modules) |
| `@edforge/edfi` | 3001 | Ed-Fi Alliance integration |
| `@edforge/academics` | 3002 | Academic management (Students, Classes, Curriculum, Assessment) |
| `@edforge/finance` | 3003 | Financial management (Accounting, Billing, Expenses) |
| `@edforge/special-programs` | 3005 | Special education (IEPs, 504 Plans, Accommodations) |

### Module Structure

**Academics Module:**
- Students (Directory, Enrollment, Profiles)
- Classes & Scheduling (Classrooms, Schedules, Timetables)
- Curriculum (Grade Levels, Courses, Standards)
- Assessment (Gradebooks, Assessments, Exams)
- Tracking (Student Attendance, Academic Calendar)

**Finance Module:**
- Accounting (General Ledger, Accounts Payable, Accounts Receivable)
- Billing (Tuition & Fees, Fee Structures, Collections)
- Expenses (Expense Tracking, Approvals, Budgets)
- Reports (Financial Reports, Audit Trail)

**People & HR Module:**
- Staff (Staff Directory, Profiles, Departments)
- Human Resources (Payroll, Contracts, Professional Development, Performance Reviews, Staff Attendance)
- Tasks & Duties (Staff Tasks, Duty Assignments)
- Parents & Guardians (Parent Directory, Guardian Profiles)

**Special Programs Module:**
- Special Education (IEPs, IEP Meetings, Goals & Objectives)
- Accommodations (504 Plans, Accommodations, Accessibility Services)
- Support Services (Counseling, Interventions)

## Navigation Architecture

The navigation system uses a module-based sidebar that dynamically changes based on the current route. Each module has its own navigation configuration in `apps/shell/src/config/sidebar-modules.ts`.

### Route Structure

Routes follow a hierarchical structure:
- `/academics/students/enrollment` - Nested under students
- `/people/hr/payroll` - HR functions under People module
- `/finance/accounting/general-ledger` - Accounting sub-modules
- `/special-programs/ieps/meetings` - Special programs with nested routes

### URL Naming Conventions

- Use kebab-case for all URLs: `/academics/grade-levels` not `/academics/gradelevels`
- Be RESTful: `/academics/students/:id` for detail views
- Avoid redundancy: `/finance/accounting` not `/finance/financials`
- Use nouns, not verbs: `/academics/enrollment` not `/academics/enroll`

## Next Steps

- [ ] Add `@edforge/people` module (currently handled in shell, may be extracted)
- [ ] Add `@edforge/portal` module (Parent/Student self-service)
- [ ] Implement OIDC authentication
- [ ] Set up CI/CD with independent module deploys
- [ ] Add E2E tests with Playwright

---

**Questions?** Check the `/docs` folder or reach out to the platform team.

