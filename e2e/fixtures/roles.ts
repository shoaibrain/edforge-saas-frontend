/**
 * Role session fixture — seeds an authenticated EdForge session for any of the
 * 10 E2E roles (TenantAdmin + 9 school roles) via the proven cookie-seeding
 * mechanism (see pabson-tenant.ts / attendance.ts).
 *
 * Cookies are scoped to the run's target origin (PLAYWRIGHT_BASE_URL), so the
 * same fixture works against localhost dev servers and Vercel Previews.
 *
 * A seeded session only satisfies frontend UI-state trust — pair it with
 * `mockShellApi` (network.ts) so no real API call can 401 and invalidate the
 * session. Prefer importing the combined fixture from `e2e/fixtures/test.ts`.
 */

import type { Page } from '@playwright/test'
import { cookiesForRole, roleSlug, E2E_ROLES, E2E_TENANT, ROLE_USERS } from './role-data.mjs'
import type { E2ERole } from './role-data.mjs'

export { collectConsoleErrors, expectNoConsoleErrors } from './pabson-tenant'
export { E2E_ROLES, E2E_TENANT, ROLE_USERS, roleSlug }
export type { E2ERole }

const TARGET_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

export interface SeedSessionOptions {
  theme?: 'light' | 'dark'
}

export async function seedRoleSession(
  page: Page,
  role: E2ERole,
  opts: SeedSessionOptions = {},
): Promise<void> {
  await page.context().addCookies(cookiesForRole(role, TARGET_URL, opts))
  // Without a real Cognito session, the auth store's initializeAuth() would
  // re-derive auth from Amplify after mount and null out the seeded user
  // (clobbering the sidebar/ABAC context). The session-invalidated flag is the
  // store's own "don't re-derive" seam (auth.store.ts) — setting it preserves
  // the cookie-persisted state for the whole test. Nothing else reads the flag
  // except the login page (which clears it).
  await page.addInitScript(() => {
    sessionStorage.setItem('edforge-session-invalidated', 'true')
  })
}
