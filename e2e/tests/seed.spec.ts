/**
 * Environment seed for the Playwright test agents (planner/generator/healer).
 *
 * `planner_setup_page` / `generator_setup_page` execute this test to hand the
 * agent an authenticated, fully API-mocked page on /home — TenantAdmin by
 * default. Copy this file into a module suite and `test.use({ role: '...' })`
 * to seed a different persona.
 *
 * Tagged @seed and excluded from the smoke/full projects (playwright.config.ts
 * grepInvert) — it is a harness, not coverage.
 */

import { test, expect } from '../fixtures/test'

test.describe('EdForge seed', () => {
  test('seed @seed', async ({ page }) => {
    await page.goto('/home')
    await expect(page.getByRole('navigation', { name: 'Sidebar navigation' })).toBeVisible()
  })
})
