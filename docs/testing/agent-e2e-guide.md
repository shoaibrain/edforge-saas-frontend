# Agent-driven E2E testing guide

How AI agents (Claude Code sessions, the Playwright test agents) explore,
plan, generate, and heal E2E tests for the EdForge MFE platform. This is the
canonical reference — read it before touching `e2e/`, `specs/`, or `.mcp.json`.

## Architecture in 60 seconds

- **Shell** (host, `apps/shell`, dev port **3000**) owns auth, tenant context,
  layout, `/settings/*`, `/home`, portals. **Academics** (:3002), **Finance**
  (:3003), **People** (:3006) are module-federation remotes lazy-loaded at
  `/academics/$`, `/finance/$`, `/people/$` (see `apps/shell/src/router.tsx`).
- **Trace rule — URL → component:** start at the URL, find the route in
  `apps/shell/src/router.tsx`; module routes hand off to the remote's
  `src/router.tsx` in `apps/<mfe>/`. A file whose *name* matches the page is
  NOT evidence it renders at that URL — always confirm the parent's render
  path. Testing a page you didn't trace is how wrong-file edits ship.
- All API calls are same-origin **`/api/*`** (`packages/api-client`); the dev
  server proxies them to `VITE_API_URL` (stripping `/api`).

## The auth-session model (read this twice)

Real auth is Cognito OAuth (`packages/auth` + `aws-amplify`). E2E sessions do
NOT log in — they seed the app's own persisted state:

1. Two non-httpOnly cookies, `edforge-auth` + `edforge-app`, hold the Zustand
   persist blobs (user identity / active school). Canonical builder:
   [`e2e/fixtures/role-data.mjs`](../../e2e/fixtures/role-data.mjs).
2. `sessionStorage['edforge-session-invalidated'] = 'true'` must be set before
   app scripts run. It is the auth store's "don't re-derive from Amplify"
   seam — without it, `initializeAuth()` finds no Cognito session after mount
   and **nulls the seeded user** (empty sidebar, no ABAC context).
3. A seeded session carries **no JWT** — any API call that reaches a real
   backend 401s, and the interceptor in `apps/shell/src/lib/api.ts` kills the
   session and bounces to /login. Therefore: **a seeded session is always
   paired with a mocked API.**

## Roles

10 personas, one fixture: `TenantAdmin` (global) + the 9 school roles
`Principal, VicePrincipal, Teacher, Accountant, Staff, Counselor, Nurse,
Student, Parent`. Student/Parent land on portal homes (`home-student` /
`home-parent` sidebar modules); everyone else gets the admin home. Expected
module visibility comes from the ABAC matrix
(`packages/abac/src/permissions.ts`) — compute it with `can()`, never guess
(see `e2e/tests/shell/rbac-sidebar.spec.ts`).

## Writing tests

```ts
import { test, expect } from '../../fixtures/test'

test.describe('teacher grading', () => {
  test.use({ role: 'Teacher' })
  test('sees classrooms', async ({ page, captured }) => {
    await page.goto('/academics/classrooms')
    // captured.writes  → assert the exact payloads the UI sent
    // captured.unmocked → API coverage gaps (empty when fully mocked)
  })
})
```

- **Always import `e2e/fixtures/test`** for authenticated surfaces — it seeds
  the role session and installs `mockShellApi` (shell boot + home + settings
  endpoints, plus a 200-`{}` catch-all so nothing 401s).
- Module suites layer their own `page.route` mocks on top (registered later →
  higher precedence). Follow the `e2e/fixtures/attendance.ts` pattern; return
  a capture object for write assertions.
- `test.use({ strictApi: true })` fails the test if any call fell through to
  the catch-all — turn it on once a suite's mock layer is complete.
- **Selectors:** `getByRole` with accessible names first (`exact: true` when
  labels overlap — 'Security' also substring-matches 'RBAC Security');
  `getByTestId` only when accessibility locators are ambiguous, named
  `<module>-<surface>-<element>`, added in the same PR.
- **Tags:** `@smoke` on ≤5 critical-path tests per module (they form the PR
  gate); the seed harness is `@seed` and excluded from smoke/full projects.

## Running

```bash
pnpm e2e:auth-states                  # regenerate e2e/.auth/<role>.json (10 files)
PLAYWRIGHT_START_SERVER=1 pnpm test:e2e:smoke   # PR gate (@smoke only)
PLAYWRIGHT_START_SERVER=1 pnpm test:e2e:full    # everything except @seed
pnpm test:e2e                         # default chromium project (legacy-compatible)
```

Env-gated legacy suites still opt in the old way (`ATTENDANCE_E2E=1`,
`VISUAL_REGRESSION=1`, `BULK_E2E=1`). `nepal-onboarding.spec.ts` requires a
locally running AdminWeb + live backend — it is a manual journey script, not
part of automated runs.

In sandboxed agent environments (pre-installed browsers, no downloads):
`PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium` and **never** run
`playwright install`.

**Running against a production preview (`build:mvp` + `preview`)?** A PROD
bundle throws at init if the `VITE_COGNITO_*` vars are missing (`@edforge/auth`)
— the app white-screens and every spec fails identically. E2E seeds cookies +
mocks the API, so real Cognito is never contacted; pass placeholder values at
**build** time (any non-empty string), e.g.
`VITE_COGNITO_USER_POOL_ID=us-west-2_e2e000 VITE_COGNITO_CLIENT_ID=e2e … pnpm build:mvp`
(full set in [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)). A
**dev** server (`PLAYWRIGHT_START_SERVER=1`, which runs `dev:mvp`) doesn't need
them — the auth config returns null instead of throwing outside PROD.

## Watching the browser

Three ways to *see* what a run does — pick by where you are.

| Mode | Command | Where it works | Use it for |
|---|---|---|---|
| **UI mode** (time-travel: pick tests, watch each step with DOM before/after, network, console, source) | `PLAYWRIGHT_START_SERVER=1 pnpm test:e2e:ui` | Your laptop (has a display) | Authoring, debugging, understanding a flow |
| **Headed window** (real Chromium pops up; add `--slowmo=800` to slow it, or `--debug` for the Inspector step-through) | `PLAYWRIGHT_START_SERVER=1 pnpm test:e2e:headed` | Your laptop | Watching a specific spec run live |
| **After-the-fact** (trace viewer + video + HTML report) | `pnpm test:e2e:report`, or `pnpm exec playwright show-trace <trace.zip>` | **Anywhere — CI, remote sandbox, async sharing** | Reviewing/auditing a run you didn't watch |

The trace viewer is the auditable record: a DOM snapshot at **every** action,
plus network, console, and a screenshot timeline. Traces land in
`e2e/test-results/**/trace.zip` (on failure by default). To record **every**
run — pass or fail — set `E2E_CAPTURE=1`, which forces `trace`, `video`, and
`screenshot` to `on`:

```bash
E2E_CAPTURE=1 PLAYWRIGHT_START_SERVER=1 pnpm test:e2e:full e2e/tests/shell
pnpm test:e2e:report        # open the HTML report (traces + videos embedded)
```

**Watching the agent explore.** The `playwright` MCP server runs headless
(good for CI/sandbox). To watch the planner/generator agent drive the browser
*live* on your laptop, point your MCP client at the **`playwright-watch`**
server in [`.mcp.json`](../../.mcp.json) — identical config minus `--headless`,
so a real window opens. Either way, `--save-trace` records every autonomous
session to `e2e/.mcp-artifacts/` (gitignored) — open those with
`playwright show-trace` for the full audit trail.

## The agent pipeline (planner → generator → healer)

Agent definitions live in `.claude/agents/` (generated by
`pnpm exec playwright init-agents --loop=claude`, then customized — regenerate
on Playwright upgrades and re-apply the "EdForge conventions" sections).

1. **Planner** explores via the `playwright-test` MCP server, bootstrapping an
   authenticated page from `e2e/tests/seed.spec.ts`, and saves markdown plans
   to `specs/<module>/<surface>.md`.
2. **Generator** converts one plan scenario at a time into
   `e2e/tests/<module>/<scenario>.spec.ts`, executing each step live before
   writing it. Generated tests must import `e2e/fixtures/test`.
3. **Healer** runs failing tests, diagnoses via trace/snapshot, and repairs.
   A bounce-to-login failure means an unmocked 401 — fix the mock layer, not
   the timeout.

Both MCP servers are configured in [`.mcp.json`](../../.mcp.json):

| Server | Purpose | Auth mechanism |
|---|---|---|
| `playwright-test` | test-aware: seed-driven planner/generator/healer | seed spec's role fixture |
| `playwright` | free-form exploration (`@playwright/mcp`) | `--storage-state e2e/.auth/tenant-admin.json` + `--init-script scripts/e2e/mcp-init.js` |

Exploration traces land in `e2e/.mcp-artifacts/` (gitignored) — the audit
trail for autonomous sessions.

### Exploring as a different role (no server restart)

The cookies are JS-written, so an agent can swap personas in-session: run the
snippet from `roleSwitchSnippet('<Role>')` (`e2e/fixtures/role-data.mjs`) via
the `browser_evaluate` tool. It rewrites both cookies, keeps the
session-invalidated seam set, and navigates to /home.

### Live data during exploration

MCP browsing can't use `page.route`, so exploration gets deterministic data
from a real HTTP mock:

```bash
# once: apps/shell/.env.local → VITE_API_URL=http://localhost:4010/api
pnpm e2e:mock-api     # :4010, role via MOCK_API_ROLE=<Role>
pnpm dev:mvp          # shell + MFEs
```

## Mocked vs live mode

| | Mocked (default) | Live non-prod tenant |
|---|---|---|
| Used by | PR smoke, full suite, agent exploration | manual `deployed-frontend` job (opt-in) |
| Auth | seeded cookies | real Cognito test users |
| Finds | frontend regressions | integration bugs |
| Requires | nothing | operator-provisioned E2E tenant |

Live mode is scaffolded as a manually dispatched job in
`.github/workflows/e2e-nightly.yml` and activates when the operator sets the
repo variable `EDFORGE_E2E_LIVE=true` plus secrets
`EDFORGE_E2E_BASE_URL`, `EDFORGE_E2E_USER_<ROLE>`, `EDFORGE_E2E_PASS_<ROLE>`
(one Cognito user per school role in a dedicated non-prod tenant — provision
via the backend's tenant pipeline; see `edforge/CLAUDE.md` provisioning
section). A `e2e/fixtures/live-login.ts` helper (real login-form flow) gets
written as part of that activation — it does not exist yet.

## Hard rules

- **Never** run tests, exploration, or agents against production or any
  operator tenant. Localhost + the E2E tenant only.
- **Never** commit `e2e/.auth/` or `e2e/.mcp-artifacts/` (gitignored).
- **Never** import `msw` into Playwright specs — `page.route` is the e2e
  mocking layer; MSW is for vitest and the standalone mock server.
- **Never** `playwright install` in sandboxed agent environments.
- A generated test must pass twice consecutively before it is committed.
- School grade-level labels (PG/NUR/LKG/UKG/…) are operator-chosen — never
  "correct" them to canonical taxonomy in tests or fixtures.

## Module rollout

Shell is covered (specs + tests in `specs/shell/`, `e2e/tests/shell/`). The
ordered plan for academics → people → finance → portals lives in
[rollout-playbook.md](rollout-playbook.md).
