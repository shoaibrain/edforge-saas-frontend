/**
 * Landing V2 FAQ e2e — exercises the Accordion primitive's open/close
 * semantics and keyboard support on the rendered page.
 */

import { test, expect } from '@playwright/test'

const PREVIEW_URL = '/_landing-preview'

test.describe('Landing V2 — FAQ', () => {
  test('first question is open by default', async ({ page }) => {
    await page.goto(PREVIEW_URL)
    const firstTrigger = page.locator('#faqs button[aria-expanded]').first()
    await expect(firstTrigger).toHaveAttribute('aria-expanded', 'true')
  })

  test('clicking a later question closes the first and opens the clicked one', async ({ page }) => {
    await page.goto(PREVIEW_URL)
    const triggers = page.locator('#faqs button[aria-expanded]')
    await triggers.nth(2).click()
    await expect(triggers.nth(0)).toHaveAttribute('aria-expanded', 'false')
    await expect(triggers.nth(2)).toHaveAttribute('aria-expanded', 'true')
  })

  test('keyboard: Space toggles focused trigger, Arrow keys move focus', async ({ page }) => {
    await page.goto(PREVIEW_URL)
    const triggers = page.locator('#faqs button[aria-expanded]')
    await triggers.nth(0).focus()
    // Close the initially-open first item with Space.
    await page.keyboard.press('Space')
    await expect(triggers.nth(0)).toHaveAttribute('aria-expanded', 'false')
    // Arrow down moves focus to the second trigger.
    await page.keyboard.press('ArrowDown')
    await expect(triggers.nth(1)).toBeFocused()
    // Open it with Enter.
    await page.keyboard.press('Enter')
    await expect(triggers.nth(1)).toHaveAttribute('aria-expanded', 'true')
  })
})
