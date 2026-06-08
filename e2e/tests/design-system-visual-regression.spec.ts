/**
 * Design-system visual regression harness.
 *
 * Baselines are intentionally opt-in while Stream 0 is being introduced:
 *   VISUAL_REGRESSION=1 pnpm playwright test e2e/tests/design-system-visual-regression.spec.ts --update-snapshots
 *
 * Authenticated PABSON routes additionally require the local dev/API fixture
 * environment to honor the seeded visual-session cookies:
 *   PABSON_VISUAL_AUTH=1 VISUAL_REGRESSION=1 pnpm playwright test e2e/tests/design-system-visual-regression.spec.ts
 */

import { test, expect } from '@playwright/test'
import {
  PABSON_VISUAL_ROUTES,
  collectConsoleErrors,
  expectNoConsoleErrors,
  seedPabsonVisualSession,
  type VisualTheme,
} from '../fixtures/pabson-tenant'

const VISUAL_REGRESSION_ENABLED = process.env.VISUAL_REGRESSION === '1'
const PABSON_AUTH_VISUALS_ENABLED = process.env.PABSON_VISUAL_AUTH === '1'

test.describe('Design system visual baselines — public surfaces', () => {
  test.skip(!VISUAL_REGRESSION_ENABLED, 'Set VISUAL_REGRESSION=1 to capture/review screenshots.')

  test('landing preview hero — light', async ({ page }) => {
    const consoleErrors = await collectConsoleErrors(page)
    await page.goto('/_landing-preview')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page).toHaveScreenshot('landing-preview-hero-light.png', {
      fullPage: true,
      animations: 'disabled',
    })
    await expectNoConsoleErrors(consoleErrors)
  })

  test('landing preview hero — dark preference', async ({ page }) => {
    const consoleErrors = await collectConsoleErrors(page)
    await page.addInitScript(() => {
      window.localStorage.setItem('edforge-theme', JSON.stringify({ state: { theme: 'dark' }, version: 0 }))
      document.documentElement.classList.add('dark')
      document.documentElement.style.colorScheme = 'dark'
    })
    await page.goto('/_landing-preview')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page).toHaveScreenshot('landing-preview-hero-dark.png', {
      fullPage: true,
      animations: 'disabled',
    })
    await expectNoConsoleErrors(consoleErrors)
  })

  test('design-system form primitives — light', async ({ page }) => {
    const consoleErrors = await collectConsoleErrors(page)
    await page.goto('/dev/design-system')
    await expect(page.getByRole('heading', { name: 'Design System' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Form primitives' })).toBeVisible()
    await expect(page.getByRole('button', { name: /School type/ })).toBeVisible()
    await expect(page).toHaveScreenshot('design-system-form-primitives-light.png', {
      fullPage: true,
      animations: 'disabled',
    })
    await expectNoConsoleErrors(consoleErrors)
  })

  test('design-system form primitives — dark', async ({ page }) => {
    const consoleErrors = await collectConsoleErrors(page)
    await page.addInitScript(() => {
      window.localStorage.setItem('edforge-theme', JSON.stringify({ state: { theme: 'dark' }, version: 0 }))
      document.documentElement.classList.add('dark')
      document.documentElement.style.colorScheme = 'dark'
    })
    await page.goto('/dev/design-system')
    await expect(page.getByRole('heading', { name: 'Design System' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Form primitives' })).toBeVisible()
    await expect(page.getByRole('button', { name: /School type/ })).toBeVisible()
    await expect(page).toHaveScreenshot('design-system-form-primitives-dark.png', {
      fullPage: true,
      animations: 'disabled',
    })
    await expectNoConsoleErrors(consoleErrors)
  })
})

test.describe('Design system visual baselines — PABSON pilot tenant shell', () => {
  test.skip(
    !VISUAL_REGRESSION_ENABLED || !PABSON_AUTH_VISUALS_ENABLED,
    'Set VISUAL_REGRESSION=1 and PABSON_VISUAL_AUTH=1 to capture authenticated PABSON screenshots.'
  )

  for (const theme of ['light', 'dark'] as const satisfies readonly VisualTheme[]) {
    for (const route of PABSON_VISUAL_ROUTES) {
      test(`${route.name} — ${theme}`, async ({ page }) => {
        const consoleErrors = await collectConsoleErrors(page)
        await seedPabsonVisualSession(page, theme)
        await page.goto(route.path)
        await page.waitForLoadState('networkidle')
        await expect(page.locator('body')).toBeVisible()
        await expect(page).toHaveScreenshot(`${route.name}-${theme}.png`, {
          fullPage: true,
          animations: 'disabled',
        })
        await expectNoConsoleErrors(consoleErrors)
      })
    }
  }
})
