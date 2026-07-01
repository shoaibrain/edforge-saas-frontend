# EdForge MFE — agent session conventions

Loaded automatically by Claude Code sessions in this repo (the tenant-facing
frontend — a **separate git repository** nested inside the backend repo; see
the backend's `edforge/CLAUDE.md` for the two-repo git hygiene rules).

## Orientation

- Architecture, local dev, MFE patterns: [DEVELOPER.md](DEVELOPER.md),
  [QUICKSTART.md](QUICKSTART.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
- Monorepo: shell (:3000) + academics (:3002) + finance (:3003) + people
  (:3006), Rsbuild + Module Federation, TanStack Router, pnpm + turbo.

## The route→component trace (do not skip)

A file whose name looks like the page you want is NOT evidence it renders at
that URL. Before any UI edit or test assertion: URL →
`apps/shell/src/router.tsx` → (module routes) the remote's
`apps/<mfe>/src/router.tsx` → tab/step conditional → confirm the component
appears as a JSX tag in its parent's render. This trap has shipped wrong-file
edits before (backend CLAUDE.md, "Route → component, never file-name →
component").

## Testing

- Unit/component: vitest + MSW (`test-utils/`); `pnpm test`.
- E2E + AI-agent testing (Playwright MCP, planner/generator/healer agents,
  role fixtures, mock layers): **read
  [docs/testing/agent-e2e-guide.md](docs/testing/agent-e2e-guide.md)** — it is
  the canonical reference for `e2e/`, `specs/`, and `.mcp.json`.
- Module coverage rollout order:
  [docs/testing/rollout-playbook.md](docs/testing/rollout-playbook.md).
- Never test against production or an operator tenant. Never commit
  `e2e/.auth/` or `e2e/.mcp-artifacts/`.
- Sandboxed agent environments: browsers are pre-installed —
  `PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium`, never
  `playwright install`.

## Gates before any PR

```bash
pnpm turbo typecheck && pnpm turbo lint && pnpm vitest run
PLAYWRIGHT_START_SERVER=1 pnpm test:e2e:smoke
```
