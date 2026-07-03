// Regression guard for the login flash-of-wrong-content bug: a student whose
// assignments have not resolved yet must never see the admin quick actions
// ("Add Student") — the bootstrap gate holds a loading screen until
// /users/me assignments and the active school are resolved.

import { test, expect } from '../../fixtures/test'

test.describe('Bootstrap gate — login flash regression', () => {
  test.use({ role: 'Student' })

  test('student never sees admin quick actions while context resolves @smoke', async ({ page }) => {
    // Make the seeded session look like a real fresh login: the auth cookie
    // carries EMPTY assignments (initializeAuth's placeholder) and there is
    // no persisted school context — the exact window of the flash bug.
    // The standard fixture pre-seeds assignments, which would mask it.
    const cookies = await page.context().cookies()
    const authCookie = cookies.find((c) => c.name === 'edforge-auth')
    expect(authCookie).toBeDefined()
    const parsed = JSON.parse(decodeURIComponent(authCookie!.value))
    parsed.state.user.assignments = {}
    await page.context().clearCookies()
    await page.context().addCookies([
      {
        name: 'edforge-auth',
        value: encodeURIComponent(JSON.stringify(parsed)),
        domain: authCookie!.domain,
        path: authCookie!.path,
        sameSite: 'Lax',
        expires: authCookie!.expires,
      },
    ])

    // Widen the resolution window: delay /users/me (registered after the
    // fixture mock, so it runs first; fallback() then hits the mock).
    await page.route('**/api/users/me', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800))
      await route.fallback()
    })

    await page.goto('/home')

    // While context resolves, the branded loader is up and no role-specific
    // content — least of all admin actions — has painted.
    await expect(page.getByText('Add Student')).toHaveCount(0)

    // The student home eventually renders…
    const nav = page.getByRole('navigation', { name: 'Sidebar navigation' })
    await expect(nav.getByRole('link', { name: 'My Grades' })).toBeVisible({ timeout: 15_000 })

    // …and the admin actions still never appeared.
    await expect(page.getByText('Add Student')).toHaveCount(0)
  })
})
