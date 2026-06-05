# AGENTS.md

## Cursor Cloud specific instructions

### Product overview

EdForge EMIS is a **pnpm + Turborepo** micro-frontend monorepo (React 19, Rsbuild, Module Federation). The **shell** host (`apps/shell`, port **3000**) loads remote apps: academics (**3002**), finance (**3003**), people (**3006**), analytics (**3008**). Backend is external (AWS API Gateway + Cognito), not in this repo.

### Prerequisites

- **Node.js** ≥ 22 (see `.nvmrc` and `engines` in root `package.json`)
- **pnpm** 10.x (`packageManager` pins `pnpm@10.33.0`)

### First-time / after pull

```bash
pnpm install
pnpm build:packages   # required before dev — shared packages must compile
```

### Environment variables (shell)

Copy `apps/shell/.env.example` → `apps/shell/.env.local`. **The shell dev server will not start without `VITE_API_URL`** (Rsbuild `/api` proxy needs a target). For UI-only work (e.g. `/_landing-preview`), a placeholder URL is enough; replace with the real API Gateway URL for authenticated/data flows. Cognito vars are required for login.

### Running services

| Goal | Command |
|------|---------|
| MVP stack (shell + academics + people + finance + packages) | `pnpm dev:mvp` |
| Shell only | `pnpm dev:shell` |
| All apps | `pnpm dev` |

See `README.md` and `DEVELOPER.md` for port map and architecture.

### Lint / test / build

| Task | Command | Notes |
|------|---------|-------|
| Lint | `pnpm lint` | ESLint warnings/errors vary by package |
| Typecheck | `pnpm typecheck` | `@edforge/shell` may have pre-existing TS errors on `main` |
| Unit tests | `pnpm test` | Vitest + MSW; no running services needed |
| Shell production build | `VITE_API_URL=<url> pnpm --filter @edforge/shell build` | Required env for prod build |
| MVP build | `pnpm build:mvp` | May fail on `@edforge/edfi-ts-models` if that package errors |

### Hello-world smoke (no auth)

1. Ensure `apps/shell/.env.local` has `VITE_API_URL` set.
2. `pnpm build:packages && pnpm dev:mvp` (or `pnpm dev:shell` for landing only).
3. Open `http://localhost:3000/_landing-preview` — public landing preview route, no Cognito.

### Gotchas

- `dev:mvp` does **not** start analytics (:3008); use `pnpm --filter @edforge/analytics dev` if testing `/analytics/*`.
- Remote MFE roots often return **404** when curled directly; they are loaded via Module Federation from the shell.
- Playwright E2E specs live in `e2e/tests/` but there is no root `test:e2e` script yet.
