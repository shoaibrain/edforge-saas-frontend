// spec: specs/shell/auth-session.md

import { test as unauthedTest, expect as unauthedExpect } from '@playwright/test'
import { test, expect } from '../../fixtures/test'

// Scenarios 1–2 exercise the UNauthenticated boundary — plain @playwright/test,
// no seeded session, no API mocks needed (public surfaces + guard redirect).

unauthedTest.describe('Login surface', () => {
  unauthedTest('Login page renders the sign-in form', async ({ page }) => {
    await page.goto('/login')
    await unauthedExpect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    await unauthedExpect(page.getByLabel(/email/i)).toBeVisible()
    await unauthedExpect(page.getByLabel(/^password/i)).toBeVisible()
  })
})

unauthedTest.describe('Protected-route guard', () => {
  unauthedTest('Unauthenticated protected route redirects to /login', async ({ page }) => {
    await page.goto('/home')
    await page.waitForURL('**/login')
    await unauthedExpect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })
})

test.describe('Seeded session', () => {
  test('Seeded TenantAdmin session lands on the dashboard @smoke', async ({ page }) => {
    await page.goto('/home')
    await expect(page.getByRole('navigation', { name: 'Sidebar navigation' })).toBeVisible()
    expect(new URL(page.url()).pathname).toBe('/home')
  })
})
