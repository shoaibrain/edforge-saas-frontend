// Invoice provenance disclosure (FB-5.4). Pins:
//   - the provenance fetch fires ONLY when the operator expands the
//     "How was this calculated?" disclosure — never on page load
//   - agreement-priced lines render source attribution (via-agreement caption,
//     suppressed catalog fees), catalog lines their fee-structure caption
//   - a CATALOG invoice with overrides[] renders the operator-override audit
//     block (the bypass trail must be reachable on catalog invoices too)

import { test, expect } from '../../fixtures/test'
import { mockFinanceApi, invoice, provenance } from '../../fixtures/finance'

test.describe('Invoice provenance', () => {
  test.use({ role: 'Accountant' })

  test.beforeEach(() => {
    // Dev-mode MF remotes compile on first hit — allow for the cold start.
    test.setTimeout(60_000)
  })

  test('fetch fires only on disclosure expand; agreement lines render attribution', async ({ page }) => {
    await mockFinanceApi(page, {
      invoiceDetail: invoice({ id: 'inv-1', feeOverrideMode: 'agreement', agreementId: 'agr-1', agreementVersion: 1 }),
    })

    // Count provenance requests; fall back to the fixture route for the response.
    let provenanceCalls = 0
    await page.route('**/api/finance/schools/*/invoices/*/provenance**', (route) => {
      provenanceCalls += 1
      return route.fallback()
    })

    await page.goto('/finance/invoices/inv-1')
    await expect(page.getByText('INV-2082-0001').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'How was this calculated?' })).toBeVisible()

    // Settle window: any wrongly-eager fetch would have fired by now.
    await page.waitForTimeout(500)
    expect(provenanceCalls, 'provenance must NOT be fetched before expand').toBe(0)

    await page.getByRole('button', { name: 'How was this calculated?' }).click()
    await expect(page.getByText('Tuition (agreement pricing)')).toBeVisible()
    expect(provenanceCalls).toBe(1)

    // Agreement-priced line: via-agreement caption + suppressed catalog fee.
    await expect(page.getByText('From agreement Sharma Family Agreement 2082 (v1)')).toBeVisible()
    await expect(page.getByText('1 catalog fee suppressed by this agreement')).toBeVisible()
    // Catalog-priced sibling line keeps its fee-structure caption + discount rule.
    await expect(page.getByText('From fee structure Transport Fee')).toBeVisible()
    // Custom line renders the custom source chip.
    await expect(page.getByText('Custom line')).toBeVisible()
  })

  test('catalog invoice with overrides[] renders the bypass audit block', async ({ page }) => {
    await mockFinanceApi(page, {
      invoiceDetail: invoice({
        id: 'inv-2',
        invoiceNumber: 'INV-2082-0002',
        feeOverrideMode: 'catalog',
      }),
      provenanceBody: provenance({
        invoiceId: 'inv-2',
        invoiceNumber: 'INV-2082-0002',
        feeOverrideMode: 'catalog',
        agreementId: undefined,
        agreementVersion: undefined,
        lines: [
          {
            lineId: 'line-1',
            description: 'Tuition Fee',
            source: 'fee_structure',
            feeStructureId: 'fee-tuition',
            feeStructureName: 'Tuition Fee',
          },
        ],
        overrides: [
          {
            agreementId: 'agr-1',
            agreementTitle: 'Sharma Family Agreement 2082',
            requestedFeeStructureIds: ['fee-tuition', 'fee-exam'],
            bypassedAt: '2026-06-01T10:00:00.000Z',
          },
        ],
      }),
    })

    await page.goto('/finance/invoices/inv-2')
    await page.getByRole('button', { name: 'How was this calculated?' }).click()

    await expect(page.getByText('Operator overrides')).toBeVisible()
    await expect(page.getByText('Sharma Family Agreement 2082')).toBeVisible()
    await expect(page.getByText('Requested fee structures: 2')).toBeVisible()
  })
})
