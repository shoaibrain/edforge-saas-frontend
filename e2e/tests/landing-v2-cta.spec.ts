/**
 * Landing V2 Final CTA e2e — verifies the closing CTA points at the target
 * configured in landing.strings.ts (mailto: per ADR 001 §2). When the target
 * becomes a HubSpot form or internal /contact route, update this spec
 * alongside the strings change.
 */

import { test, expect } from '@playwright/test'

const PREVIEW_URL = '/_landing-preview'
const EXPECTED_MAILTO = 'mailto:hello@edforge.app'

test.describe('Landing V2 — Final CTA', () => {
  test('renders the closing heading + CTA pointing at the mailto target', async ({ page }) => {
    await page.goto(PREVIEW_URL)
    const section = page.locator('#demo')
    await expect(section).toBeVisible()

    const cta = section.getByRole('link', { name: /Talk to our team/i })
    await expect(cta).toHaveAttribute('href', EXPECTED_MAILTO)
  })

  test('aria-labelledby wires section to final-cta-heading', async ({ page }) => {
    await page.goto(PREVIEW_URL)
    const section = page.locator('#demo')
    await expect(section).toHaveAttribute('aria-labelledby', 'final-cta-heading')
    await expect(page.locator('#final-cta-heading')).toContainText(
      /forge something/i
    )
  })
})
