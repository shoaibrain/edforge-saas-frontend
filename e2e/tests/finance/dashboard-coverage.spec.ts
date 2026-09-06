// Finance overview — agreement-coverage tile (FB-5.5). Pins:
//   - the tile renders the agreementCoverage rollup numbers from
//     GET /finance/schools/:sid/dashboard/summary
//   - an ABSENT agreementCoverage (pre-agreements school) degrades to the
//     empty state — no crash, no error boundary

import { test, expect } from '../../fixtures/test'
import { mockFinanceApi, dashboardSummary } from '../../fixtures/finance'

test.describe('Finance overview — agreement coverage', () => {
  test.use({ role: 'Accountant' })

  test.beforeEach(() => {
    // Dev-mode MF remotes compile on first hit — allow for the cold start.
    test.setTimeout(60_000)
  })

  test('renders the coverage tile numbers from the dashboard summary', async ({ page }) => {
    await mockFinanceApi(page)
    await page.goto('/finance')

    await expect(page.getByText('Agreement coverage')).toBeVisible()
    const tile = page.getByTestId('finance-overview-coverage')
    await expect(tile).toBeVisible()

    await expect(tile.getByText('Students covered')).toBeVisible()
    await expect(tile.getByText('12', { exact: true })).toBeVisible()
    await expect(tile.getByText('Active agreements')).toBeVisible()
    await expect(tile.getByText('3', { exact: true })).toBeVisible()
    await expect(tile.getByText('Invoiced via agreement')).toBeVisible()
    await expect(tile.getByText('5 invoices')).toBeVisible()
  })

  test('absent agreementCoverage degrades to the empty state without crashing', async ({ page }) => {
    await mockFinanceApi(page, {
      dashboard: dashboardSummary({ agreementCoverage: undefined }),
    })
    await page.goto('/finance')

    await expect(page.getByText('Agreement coverage')).toBeVisible()
    await expect(
      page.getByTestId('finance-overview-coverage').getByText('No active agreements'),
    ).toBeVisible()
    // The overview did not fall into the finance error boundary.
    await expect(page.getByText('Something went wrong')).toHaveCount(0)
  })
})
