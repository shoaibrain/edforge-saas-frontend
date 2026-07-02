/**
 * Writes Playwright storageState files for every E2E role into e2e/.auth/
 * (gitignored). The Playwright MCP server loads one of these via its
 * --storage-state flag (see .mcp.json) so agent exploration sessions start
 * authenticated.
 *
 *   pnpm e2e:auth-states                       # localhost:3000 (default)
 *   PLAYWRIGHT_BASE_URL=<url> pnpm e2e:auth-states
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { E2E_ROLES, roleSlug, storageStateForRole } from '../../e2e/fixtures/role-data.mjs'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const outDir = join(repoRoot, 'e2e', '.auth')
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

mkdirSync(outDir, { recursive: true })

for (const role of E2E_ROLES) {
  const file = join(outDir, `${roleSlug(role)}.json`)
  writeFileSync(file, JSON.stringify(storageStateForRole(role, baseURL), null, 2) + '\n')
  console.log(`wrote ${file}`)
}

console.log(`\n${E2E_ROLES.length} storage states for ${baseURL}`)
console.log('Default MCP role: tenant-admin.json (switch via .mcp.json --storage-state, or in-session via the role-switch snippet — see docs/testing/agent-e2e-guide.md)')
