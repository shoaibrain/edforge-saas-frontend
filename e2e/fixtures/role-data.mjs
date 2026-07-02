/**
 * Canonical E2E role/tenant data — single source of truth for agent-driven
 * role-based testing.
 *
 * Plain ESM (no TypeScript, no imports) so it is consumable by BOTH:
 *   - Playwright fixtures (e2e/fixtures/roles.ts, network.ts)
 *   - Node scripts (scripts/e2e/write-auth-states.mjs, mock-api-server.mjs)
 *
 * The cookie payloads mirror the Zustand persist contracts:
 *   - `edforge-auth`  → apps/shell/src/stores/auth.store.ts (partialize:
 *     { user, isAuthenticated, tenantName, tenantTier })
 *   - `edforge-app`   → app store ({ activeSchoolId, activeSchoolStatus,
 *     sidebarCollapsed, theme })
 *
 * IMPORTANT: the seeded cookie only satisfies the frontend's UI-state trust.
 * Real API calls carry no Cognito JWT and would 401 (which invalidates the
 * session via apps/shell/src/lib/api.ts) — always pair a seeded session with
 * the mocked API layer (e2e/fixtures/network.ts or scripts/e2e/mock-api-server.mjs).
 */

export const E2E_TENANT = {
  tenantId: 'tenant-e2e',
  tenantName: 'EdForge E2E School',
  tenantTier: 'pilot',
  subdomain: 'e2e',
  archetype: 'PABSON',
  country: 'NPL',
  schoolId: 'school-e2e',
  schoolName: 'EdForge E2E Secondary School',
  academicYearId: 'ay-2082-2083',
  academicYearName: '2082-2083',
}

/** The 9 school-scoped roles (packages/types/src/auth.ts SchoolRole). */
export const SCHOOL_ROLES = [
  'Principal',
  'VicePrincipal',
  'Teacher',
  'Accountant',
  'Staff',
  'Counselor',
  'Nurse',
  'Student',
  'Parent',
]

/** All seedable E2E roles: the TenantAdmin global role + 9 school roles. */
export const E2E_ROLES = ['TenantAdmin', ...SCHOOL_ROLES]

const kebab = (role) => role.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()

/** Kebab-case file/service identifier for a role (VicePrincipal → vice-principal). */
export function roleSlug(role) {
  return kebab(role)
}

function buildUser(role) {
  const slug = kebab(role)
  const isTenantAdmin = role === 'TenantAdmin'
  return {
    id: `e2e-${slug}`,
    email: `e2e-${slug}@e2e.edforge.local`,
    name: `E2E ${role}`,
    displayName: `E2E ${role}`,
    firstName: 'E2E',
    lastName: role,
    tenantId: E2E_TENANT.tenantId,
    globalRole: isTenantAdmin ? 'TenantAdmin' : 'StandardUser',
    // TenantAdmin mirrors the existing pabson-tenant.ts fixture: global admin
    // with a Principal assignment at the E2E school.
    assignments: { [E2E_TENANT.schoolId]: isTenantAdmin ? 'Principal' : role },
    ...(role === 'Parent' ? { childrenIds: ['stu-aarav'] } : {}),
  }
}

/** role → UserIdentity-shaped object (matches packages/types/src/auth.ts). */
export const ROLE_USERS = Object.fromEntries(E2E_ROLES.map((r) => [r, buildUser(r)]))

/** Encoded `edforge-auth` cookie value for a role. */
export function buildAuthCookieValue(role) {
  const user = ROLE_USERS[role]
  if (!user) throw new Error(`Unknown E2E role: ${role}`)
  return encodeURIComponent(
    JSON.stringify({
      state: {
        user,
        isAuthenticated: true,
        tenantName: E2E_TENANT.tenantName,
        tenantTier: E2E_TENANT.tenantTier,
      },
      version: 0,
    }),
  )
}

/** Encoded `edforge-app` cookie value (active school + UI prefs). */
export function buildAppCookieValue({ theme = 'light' } = {}) {
  return encodeURIComponent(
    JSON.stringify({
      state: {
        activeSchoolId: E2E_TENANT.schoolId,
        activeSchoolStatus: 'active',
        sidebarCollapsed: false,
        theme,
      },
      version: 0,
    }),
  )
}

/**
 * Playwright `addCookies`-shaped cookie list for a role, scoped by target URL
 * (works for localhost dev servers AND Vercel Previews).
 */
export function cookiesForRole(role, baseURL, { theme = 'light' } = {}) {
  const expires = Math.floor(Date.now() / 1000) + 60 * 60
  return [
    { name: 'edforge-auth', value: buildAuthCookieValue(role), url: baseURL, sameSite: 'Lax', expires },
    { name: 'edforge-app', value: buildAppCookieValue({ theme }), url: baseURL, sameSite: 'Lax', expires },
  ]
}

/**
 * Playwright storageState JSON for a role — consumed by the Playwright MCP
 * server's --storage-state flag (see .mcp.json / scripts/e2e/write-auth-states.mjs).
 * storageState requires domain+path (unlike addCookies' url shorthand).
 */
export function storageStateForRole(role, baseURL = 'http://localhost:3000', { theme = 'light' } = {}) {
  const { hostname } = new URL(baseURL)
  const expires = Math.floor(Date.now() / 1000) + 24 * 60 * 60
  const common = { domain: hostname, path: '/', httpOnly: false, secure: false, sameSite: 'Lax', expires }
  return {
    cookies: [
      { name: 'edforge-auth', value: buildAuthCookieValue(role), ...common },
      { name: 'edforge-app', value: buildAppCookieValue({ theme }), ...common },
    ],
    origins: [],
  }
}

/**
 * Browser-side snippet that swaps the session to another role WITHOUT
 * restarting the MCP server. Paste-run via the MCP `browser_evaluate` tool,
 * then reload. Works because the auth cookies are JS-written (not httpOnly).
 *
 * Keeps the session-invalidated flag SET: it is the auth store's "don't
 * re-derive from Amplify" seam — without it, initializeAuth() nulls the
 * seeded user after mount (no real Cognito session exists in E2E).
 */
export function roleSwitchSnippet(role) {
  const auth = buildAuthCookieValue(role)
  const app = buildAppCookieValue({})
  return (
    `document.cookie = 'edforge-auth=${auth}; path=/; max-age=86400; SameSite=Lax'; ` +
    `document.cookie = 'edforge-app=${app}; path=/; max-age=86400; SameSite=Lax'; ` +
    `sessionStorage.setItem('edforge-session-invalidated', 'true'); location.href = '/home';`
  )
}
