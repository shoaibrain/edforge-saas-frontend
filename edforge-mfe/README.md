# EdForge MFE Architecture

> **Multi-tenant Micro-Frontend architecture for EdForge EMIS**

## 🚀 Quick Start

```bash
cd edforge-mfe
pnpm install          # Install dependencies
pnpm build:packages   # Build shared packages  
pnpm typecheck        # Verify types
pnpm dev              # Start all apps
```

**URLs:** Shell `:3000` | Ed-Fi `:3001` | Academics `:3002` | Finance `:3003`

📖 **Detailed developer documentation: [DEVELOPER.md](./DEVELOPER.md)**

---

Built with Rsbuild and `@module-federation/enhanced`.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser Runtime                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Shell (Host App)                          │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   │ │
│  │  │   Auth    │ │   Tenant  │ │   Global  │ │  Module   │   │ │
│  │  │  (OIDC)   │ │  Context  │ │    Nav    │ │ Registry  │   │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              ↓                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │  Ed-Fi   │ │Academics │ │ Finance  │ │ People   │ │ Portal │ │
│  │  Module  │ │  Module  │ │  Module  │ │ Module   │ │ Module │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Shared Packages                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │@edforge/ │ │@edforge/ │ │@edforge/ │ │@edforge/ │           │
│  │   ui     │ │   abac   │ │  types   │ │  theme   │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
edforge-mfe/
├── apps/
│   ├── shell/          # Host application (Auth, Nav, Context)
│   ├── edfi/           # Ed-Fi Certification Module
│   ├── academics/      # Academics Remote (Students, Teachers, etc.)
│   ├── finance/        # Finance Remote (Billing, Payroll, etc.)
│   ├── people/         # People Remote (Staff, Parents)
│   └── portal/         # Student & Parent Portal
├── packages/
│   ├── ui/             # @edforge/ui - Shared components
│   ├── abac/           # @edforge/abac - Permission engine
│   ├── types/          # @edforge/types - TypeScript definitions
│   ├── theme/          # @edforge/theme - CSS & Tailwind config
│   └── config/         # Shared build configs
├── docker/
│   ├── docker-compose.dev.yml
│   ├── Dockerfile.dev
│   └── nginx/
└── turbo.json
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose (for containerized development)

### Installation

```bash
# Install dependencies
pnpm install

# Build shared packages
pnpm build:packages
```

### Development

**Option 1: Local Development (Turborepo)**

```bash
# Start all apps in development mode
pnpm dev

# Start specific app
pnpm dev:shell
pnpm dev:edfi
```

**Option 2: Docker Development**

```bash
# Start all services with Docker
pnpm docker:dev

# Access the app at http://localhost:8080
```

### Port Assignments

| App       | Port | URL                      |
|-----------|------|--------------------------|
| Shell     | 3000 | http://localhost:3000    |
| Ed-Fi     | 3001 | http://localhost:3001    |
| Academics | 3002 | http://localhost:3002    |
| Finance   | 3003 | http://localhost:3003    |
| Nginx     | 8080 | http://localhost:8080    |

## Module Federation

Each remote module exposes components that can be dynamically loaded by the Shell:

```typescript
// Shell loading Ed-Fi Connection Wizard
const ConnectionWizard = React.lazy(() => import('edfi/ConnectionWizard'))
```

### Shared Dependencies

The following dependencies are configured as singletons across all modules:

- `react` / `react-dom` (^19.0.0)
- `@tanstack/react-query`
- `@tanstack/react-router`
- `zustand`
- `@edforge/ui`
- `@edforge/abac`
- `@edforge/theme`
- `@edforge/types`

## Ed-Fi Certification Components

### Connection Wizard
Step-by-step ODS API key configuration with real-time validation.

### Descriptor Mapping Studio
Split-view interface for mapping local codes to Ed-Fi descriptors.

### Sync Health Dashboard
Real-time progress monitoring with SSE/WebSocket updates.

### Error Aggregator
Intelligent grouping of errors into actionable insights.

## Multi-Tenancy

Tenant resolution supports both subdomain and path-based routing:

- **Subdomain**: `tenant1.edforge.app`
- **Path-based**: `edforge.app/tenant/tenant1`

The Shell's `tenant-resolver` runtime plugin handles dynamic module URL resolution based on tenant configuration.

## ABAC (Attribute-Based Access Control)

The `@edforge/abac` package provides:

- Role-based permission definitions
- React hooks for permission checking
- Object-level access control

```typescript
import { usePermission, useCanAccess } from '@edforge/abac'

// Check specific action
const canEdit = usePermission('edit', 'students')

// Check resource access
const canViewGrades = useCanAccess('gradebook')
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in dev mode |
| `pnpm build` | Build all apps and packages |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type-check all packages |
| `pnpm clean` | Clean all build artifacts |
| `pnpm docker:dev` | Start Docker development environment |

## License

Proprietary - EdForge Inc.

