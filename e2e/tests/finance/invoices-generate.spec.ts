// Single invoice generate vs active agreements (FB-3.10) + the FB-5.5
// billing-source facet. Pins:
//   - 409 AGREEMENT_ACTIVE opens the override dialog BOTH with and WITHOUT
//     existingInvoiceId (the optional-field regression — the dialog once
//     required it)
//   - the override retry body carries overrideAgreement: true (Accountant,
//     billing:manage)
//   - VicePrincipal (no billing:manage) sees the permission note, never the
//     override action
//   - the billingSource filter offers ONLY standard|agreement — 'mixed' is a
//     per-student bulk-preview classification, and the list endpoint 400s on it.

import type { Page } from '@playwright/test'
import { test, expect } from '../../fixtures/test'
import { mockFinanceApi, SCHOOL_ID } from '../../fixtures/finance'

async function submitSingleGenerate(page: Page) {
  // exact: true — "Bulk Generate Invoices" substring-matches otherwise.
  await page.getByRole('button', { name: 'Generate Invoice', exact: true }).click()
  const modal = page.getByRole('dialog', { name: 'Generate Invoice' })
  await expect(modal).toBeVisible()

  await modal.getByPlaceholder('Search by name or student number...').fill('aar')
  await modal.getByRole('button', { name: /Aarav Sharma/ }).click()
  await modal.getByText('Tuition Fee', { exact: true }).click()
  await modal.locator('input[type="date"]').fill('2026-08-01')
  await modal.getByRole('button', { name: 'Generate Invoice', exact: true }).click()
  return modal
}

test.describe('Invoice generate — AGREEMENT_ACTIVE override (Accountant)', () => {
  test.use({ role: 'Accountant' })

  test.beforeEach(() => {
    // Dev-mode MF remotes compile on first hit — allow for the cold start.
    test.setTimeout(60_000)
  })

  test('409 opens the override dialog; override retry posts overrideAgreement:true @smoke', async ({ page }) => {
    const captured = await mockFinanceApi(page, { generateResponse: 'agreement_active' })
    await page.goto('/finance/invoices')
    await submitSingleGenerate(page)

    const conflict = page.getByRole('dialog', { name: 'Override active agreement' })
    await expect(conflict).toBeVisible()
    // Read-time 409 carries existingInvoiceId → deep link renders.
    await expect(conflict.getByRole('link', { name: 'View existing invoice' })).toBeVisible()

    await conflict.getByRole('button', { name: 'Override & generate' }).click()
    await expect(page.getByText('Invoice generated with agreement overridden')).toBeVisible()

    const generates = captured.writes.filter(
      (w) => w.method === 'POST' && new URL(w.url).pathname.endsWith(`/finance/schools/${SCHOOL_ID}/invoices`),
    )
    expect(generates).toHaveLength(2)
    const first = generates[0].body as Record<string, unknown>
    const retry = generates[1].body as Record<string, unknown>
    expect(first.overrideAgreement).toBeUndefined()
    expect(retry.overrideAgreement).toBe(true)
    // The retry re-sends the same generate payload, not a mutated one.
    expect(retry.studentId).toBe(first.studentId)
    expect(retry.feeStructureIds).toEqual(first.feeStructureIds)
  })

  test('409 WITHOUT existingInvoiceId still opens the dialog (link hidden, override available)', async ({ page }) => {
    await mockFinanceApi(page, { generateResponse: 'agreement_active_no_existing' })
    await page.goto('/finance/invoices')
    await submitSingleGenerate(page)

    const conflict = page.getByRole('dialog', { name: 'Override active agreement' })
    await expect(conflict).toBeVisible()
    await expect(conflict.getByRole('link', { name: 'View existing invoice' })).toHaveCount(0)
    await expect(conflict.getByRole('button', { name: 'Override & generate' })).toBeVisible()
  })

  test('billingSource filter offers only standard and agreement — never mixed', async ({ page }) => {
    await mockFinanceApi(page)
    await page.goto('/finance/invoices')

    await page.getByRole('button', { name: 'All sources', exact: true }).click()
    const options = page.getByRole('option')
    await expect(options).toHaveCount(3)
    await expect(page.getByRole('option', { name: 'All sources', exact: true })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Standard', exact: true })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Agreement', exact: true })).toBeVisible()
    await expect(page.getByRole('option', { name: /mixed/i })).toHaveCount(0)
  })
})

test.describe('Invoice generate — override is gated to billing:manage', () => {
  test.use({ role: 'VicePrincipal' })

  test.beforeEach(() => {
    test.setTimeout(60_000)
  })

  test('VicePrincipal sees the permission note and no override action', async ({ page }) => {
    await mockFinanceApi(page, { generateResponse: 'agreement_active' })
    await page.goto('/finance/invoices')
    await submitSingleGenerate(page)

    const conflict = page.getByRole('dialog', { name: 'Override active agreement' })
    await expect(conflict).toBeVisible()
    await expect(
      conflict.getByText('You need billing manage permission to override an active agreement.'),
    ).toBeVisible()
    await expect(conflict.getByRole('button', { name: 'Override & generate' })).toHaveCount(0)
    // Escape hatch stays available.
    await expect(conflict.getByRole('button', { name: 'Keep agreement' })).toBeVisible()
  })
})
