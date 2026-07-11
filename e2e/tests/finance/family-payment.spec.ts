// Family (multi-invoice) manual payment (FB-4.x). Pins:
//   - the student→family resolve request CARRIES ?schoolId= (backend 400s
//     without it — the fixture mirrors that, so a missing param fails loudly)
//   - allocations prefill from the server's suggestedAllocation
//   - a single positive allocation is blocked with the min-2 message
//     (backend applications.min(2)) and never POSTs
//   - over-allocation renders the inline exceeds-balance error
//   - the happy-path POST body: { familyId, applications[2..20], amount ===
//     sum(applications) }, NO top-level invoiceId, NO currency

import type { Page } from '@playwright/test'
import { test, expect } from '../../fixtures/test'
import { mockFinanceApi, SCHOOL_ID } from '../../fixtures/finance'

async function enterFamilyModeAndPickStudent(page: Page) {
  await page.goto('/finance/payments/record')
  await page
    .getByRole('group', { name: 'Payment mode' })
    .getByRole('button', { name: 'Family payment' })
    .click()
  await page.getByPlaceholder('Search student by name...').fill('aar')
  await page.getByRole('button', { name: /Aarav Sharma/ }).click()
}

test.describe('Family payment', () => {
  test.use({ role: 'Accountant' })

  test.beforeEach(() => {
    // Dev-mode MF remotes compile on first hit — allow for the cold start.
    test.setTimeout(60_000)
  })

  test('happy path — resolves family, prefills suggestions, posts the multi-application body @smoke', async ({ page }) => {
    const captured = await mockFinanceApi(page)

    const familyRequest = page.waitForRequest((req) =>
      /\/api\/academics\/students\/stu-aarav\/family/.test(req.url()),
    )
    await enterFamilyModeAndPickStudent(page)

    // REGRESSION: the family resolve MUST carry ?schoolId= (400 without it).
    const req = await familyRequest
    expect(new URL(req.url()).searchParams.get('schoolId')).toBe(SCHOOL_ID)

    // exact: true — the preview line also contains "Sharma Family · N invoices".
    await expect(page.getByText('Sharma Family', { exact: true })).toBeVisible()
    await expect(page.getByText('Primary contact: Ram Sharma')).toBeVisible()

    // Allocation list prefilled from suggestedAllocation.
    await expect(page.locator('#alloc-inv-fam-1')).toHaveValue('4000')
    await expect(page.locator('#alloc-inv-fam-2')).toHaveValue('2500')

    await page.getByRole('button', { name: 'Record Payment', exact: true }).click()

    // Success screen: receipt number + payment id surface. (Heading role —
    // getByText also matches the "Payment recorded successfully" toast.)
    await expect(
      page.getByRole('heading', { name: 'Payment Recorded' }),
    ).toBeVisible()
    await expect(page.getByText('RCT-2082-0042')).toBeVisible()

    const write = captured.writes.find((w) => w.url.includes('/payments/manual'))
    expect(write).toBeTruthy()
    const body = write!.body as Record<string, any>
    expect(body.familyId).toBe('fam-sharma-1')
    expect(body.applications).toEqual([
      { invoiceId: 'inv-fam-1', amount: 4000 },
      { invoiceId: 'inv-fam-2', amount: 2500 },
    ])
    expect(body.applications.length).toBeGreaterThanOrEqual(2)
    expect(body.applications.length).toBeLessThanOrEqual(20)
    for (const app of body.applications) expect(app.amount).toBeGreaterThan(0)
    expect(body.amount).toBe(6500) // amount === sum(applications)
    expect('invoiceId' in body).toBe(false) // family mode has NO top-level invoiceId
    expect('currency' in body).toBe(false) // currency inherited server-side — omitted
    expect(body.gateway).toBe('cash')
  })

  test('a single positive allocation is blocked with the min-2 message', async ({ page }) => {
    const captured = await mockFinanceApi(page)
    await enterFamilyModeAndPickStudent(page)
    await expect(page.locator('#alloc-inv-fam-1')).toHaveValue('4000')

    // Zero out the second invoice → only one positive application remains.
    await page.locator('#alloc-inv-fam-2').fill('0')
    await page.getByRole('button', { name: 'Record Payment', exact: true }).click()

    await expect(
      page.getByText('Family payment needs at least 2 invoices — use single-invoice mode to pay one.'),
    ).toBeVisible()
    expect(captured.writes.filter((w) => w.url.includes('/payments/manual'))).toHaveLength(0)
  })

  test('over-allocation shows the inline exceeds-balance error and blocks submit', async ({ page }) => {
    const captured = await mockFinanceApi(page)
    await enterFamilyModeAndPickStudent(page)
    await expect(page.locator('#alloc-inv-fam-1')).toHaveValue('4000')

    // inv-fam-1 is due 4000 — allocate more.
    await page.locator('#alloc-inv-fam-1').fill('5000')
    await expect(page.getByText(/Exceeds balance of/)).toBeVisible()
    await expect(page.locator('#alloc-inv-fam-1')).toHaveAttribute('aria-invalid', 'true')

    await page.getByRole('button', { name: 'Record Payment', exact: true }).click()
    await expect(page.getByText("An amount exceeds the invoice's balance due.")).toBeVisible()
    expect(captured.writes.filter((w) => w.url.includes('/payments/manual'))).toHaveLength(0)
  })
})
