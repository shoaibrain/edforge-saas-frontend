/**
 * Extended Playwright test for agent-generated EdForge suites.
 *
 * Every test gets an authenticated, fully API-mocked session for a chosen
 * role before the page ever navigates:
 *
 *   import { test, expect } from '../../fixtures/test'
 *
 *   test.describe('teacher view', () => {
 *     test.use({ role: 'Teacher' })
 *     test('sees classrooms', async ({ page }) => { ... })
 *   })
 *
 * Fixtures:
 *   - role     option fixture, default 'TenantAdmin' (any of the 10 E2E roles)
 *   - strictApi option fixture, default false — when true, the test fails if
 *     any API call was only handled by the catch-all mock (coverage honesty)
 *   - captured  the CapturedTraffic recorder from mockShellApi (assert writes)
 *
 * Never import raw @playwright/test for authenticated surfaces — an unmocked
 * 401 invalidates the seeded session (apps/shell/src/lib/api.ts).
 */

import { test as base, expect } from '@playwright/test'
import { seedRoleSession } from './roles'
import { mockShellApi, type CapturedTraffic } from './network'
import type { E2ERole } from './role-data.mjs'

interface EdforgeFixtures {
  role: E2ERole
  strictApi: boolean
  captured: CapturedTraffic
}

export const test = base.extend<EdforgeFixtures>({
  role: ['TenantAdmin', { option: true }],
  strictApi: [false, { option: true }],

  // auto:true seeds the session + mocks for every test, even ones that never
  // read `captured` directly.
  captured: [
    async ({ page, role, strictApi }, use) => {
      await seedRoleSession(page, role)
      const captured = await mockShellApi(page, role)
      await use(captured)
      if (strictApi) {
        expect(
          captured.unmocked,
          `Unmocked API calls (add routes to e2e/fixtures/network.ts or the suite's own mock layer):\n${captured.unmocked.join('\n')}`,
        ).toEqual([])
      }
    },
    { auto: true },
  ],
})

export { expect }
export type { E2ERole, CapturedTraffic }
