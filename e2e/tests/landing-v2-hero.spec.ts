/**
 * Landing V2 Hero e2e — exercises the scroll-driven parallax stage + video.
 *
 * Runs against `/_landing-preview` (always-on preview route) so it is not
 * gated on VITE_LANDING_V2 cutover state. Assumes the shell dev server is
 * running at http://localhost:3000.
 */

import { test, expect } from '@playwright/test'

const PREVIEW_URL = '/_landing-preview'

test.describe('Landing V2 — Hero', () => {
  test('renders the h1 + stage + video element', async ({ page }) => {
    await page.goto(PREVIEW_URL)

    // Heading
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toContainText(/One platform to power/i)
    await expect(h1).toContainText(/every school/i)

    // Stage anchor exists
    await expect(page.locator('#stage')).toBeVisible()

    // Hero video element (not poster fallback) — assumes non-reduced motion.
    const video = page.locator('#stage video').first()
    await expect(video).toHaveAttribute('src', /platform-overview\.mp4/)
    await expect(video).toHaveAttribute('muted', '')
    await expect(video).toHaveAttribute('playsinline', '')
  })

  test('video reaches readyState >= 2 (metadata loaded) within 5s', async ({ page }) => {
    await page.goto(PREVIEW_URL)
    const video = page.locator('#stage video').first()
    await expect
      .poll(
        async () =>
          video.evaluate((el) => (el as HTMLVideoElement).readyState),
        { timeout: 5000 }
      )
      .toBeGreaterThanOrEqual(2)
  })

  test('scroll hint link targets the stage anchor', async ({ page }) => {
    await page.goto(PREVIEW_URL)
    const chip = page.getByRole('link', { name: /Learn about Edforge/i })
    await expect(chip).toHaveAttribute('href', '#stage')
  })

  test('reduced-motion replaces the video with a static poster', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto(PREVIEW_URL)
    // No autoplay <video> inside the stage — poster div is rendered instead.
    await expect(page.locator('#stage video')).toHaveCount(0)
    await expect(
      page.getByRole('img', { name: /Edforge platform overview/i })
    ).toBeVisible()
    await context.close()
  })
})
