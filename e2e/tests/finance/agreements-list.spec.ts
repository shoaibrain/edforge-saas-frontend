// Family-billing agreements list (FB-2.8).
// Remote route — requires served remotes (PLAYWRIGHT_START_SERVER=1 → dev:mvp).
// Pins: wrapped { items, hasMore } list envelope, KPI StatBand derived from
// the loaded page, status preset round-trips as a server-side ?status= query.

import { test, expect } from '../../fixtures/test'
import { mockFinanceApi } from '../../fixtures/finance'

test.describe('Finance agreements list', () => {
  test.use({ role: 'Accountant' })

  test.beforeEach(async ({ page }) => {
    // Dev-mode MF remotes compile on first hit — the earliest finance tests
    // on a fresh server can eat 30s+ of compile time before first paint.
    test.setTimeout(60_000)
    await mockFinanceApi(page)
  })

  test('renders rows + KPIs from the wrapped items envelope @smoke', async ({ page }) => {
    await page.goto('/finance/agreements')

    // Both seeded agreements render as rows.
    await expect(page.getByText('Sharma Family Agreement 2082')).toBeVisible()
    await expect(page.getByText('Thapa Brothers 2082')).toBeVisible()

    // KPI StatBand segments (role=status, name "<label>: <value>").
    // 2 agreements, 1 active, 1 draft, 3 distinct students covered.
    await expect(page.getByRole('status', { name: 'Agreements: 2' })).toBeVisible()
    await expect(page.getByRole('status', { name: 'Active: 1' })).toBeVisible()
    await expect(page.getByRole('status', { name: 'Draft: 1' })).toBeVisible()
    await expect(page.getByRole('status', { name: 'Students covered: 3' })).toBeVisible()

    // The module did not fall into the finance error boundary.
    await expect(page.getByText('Something went wrong')).toHaveCount(0)
  })

  test('status preset filter round-trips as a server-side status query', async ({ page }) => {
    await page.goto('/finance/agreements')
    await expect(page.getByText('Sharma Family Agreement 2082')).toBeVisible()

    const draftRequest = page.waitForRequest(
      (req) =>
        req.url().includes('/api/finance/schools/') &&
        req.url().includes('/agreements') &&
        new URL(req.url()).searchParams.get('status') === 'draft',
    )
    // Presets render collapsed as the toolbar "Status filter" listbox.
    await page.getByRole('button', { name: 'Status filter' }).click()
    await page.getByRole('option', { name: 'Draft', exact: true }).click()
    await draftRequest

    // Server-filtered list: only the draft agreement remains.
    await expect(page.getByText('Thapa Brothers 2082')).toBeVisible()
    await expect(page.getByText('Sharma Family Agreement 2082')).toHaveCount(0)
  })
})
