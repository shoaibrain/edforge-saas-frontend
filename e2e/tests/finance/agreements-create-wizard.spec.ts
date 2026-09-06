// Family-billing agreement create wizard (FB-2.9) — the core contract spec.
// Pins the POSTed CreateAgreementDto against the backend ground truth:
//   - billingFrequency ∈ {one_time, monthly, quarterly, annual} — NEVER
//     'annually'/'termly' (shape-drift regression)
//   - coveredFeeTypes ⊆ backend feeTypeEnum, chip-selected (no freeform input)
//   - fixed_total: terms.allocation sums to terms.totalAmount
//   - per_student: terms.lines is the FULL (studentId × coveredFeeType)
//     matrix, each line carrying feeType (backend F1 completeness invariant)
//   - currency present on the body
// Plus: nestjs-zod 400s surface INLINE (not just a toast) and jump the wizard
// back to the offending step.

import type { Page } from '@playwright/test'
import { test, expect } from '../../fixtures/test'
import { mockFinanceApi, SCHOOL_ID } from '../../fixtures/finance'
import type { FinanceCapture } from '../../fixtures/finance'

const FEE_TYPE_ENUM = new Set([
  'tuition', 'admission', 'exam', 'transport', 'library',
  'lab', 'hostel', 'uniform', 'miscellaneous', 'custom',
])
const FREQUENCY_ENUM = new Set(['one_time', 'monthly', 'quarterly', 'annual'])

function labeledInput(page: Page, label: string) {
  return page.locator(`div:has(> label:text-is("${label}")) > input`)
}

async function addStudent(page: Page, search: string, fullName: string) {
  const input = page.getByPlaceholder('Add student')
  await input.fill(search)
  await page.getByRole('button', { name: new RegExp(fullName) }).click()
}

async function fillStep1(page: Page, students: Array<[string, string]>) {
  await page.getByPlaceholder('e.g. Sharma siblings 2083').fill('E2E Agreement')
  await page.getByPlaceholder('Primary contact for billing').fill('Ram Sharma')
  for (const [search, name] of students) {
    await addStudent(page, search, name)
  }
  await page.getByRole('button', { name: 'Next' }).click()
}

async function fillDates(page: Page) {
  await labeledInput(page, 'Effective from').fill('2026-04-14')
  await labeledInput(page, 'Effective to').fill('2027-04-13')
}

function createdAgreementWrite(captured: FinanceCapture) {
  const write = captured.writes.find(
    (w) => w.method === 'POST' && new URL(w.url).pathname.endsWith(`/finance/schools/${SCHOOL_ID}/agreements`),
  )
  expect(write, 'expected exactly one create-agreement POST').toBeTruthy()
  return write!.body as Record<string, any>
}

test.describe('Agreement create wizard', () => {
  test.use({ role: 'Accountant' })

  test.beforeEach(() => {
    // Dev-mode MF remotes compile on first hit — allow for the cold start.
    test.setTimeout(60_000)
  })

  test('fixed_total happy path POSTs the exact backend contract @smoke', async ({ page }) => {
    const captured = await mockFinanceApi(page)
    await page.goto('/finance/agreements/create')

    await fillStep1(page, [['aar', 'Aarav Sharma'], ['bha', 'Bhavna Poudel']])

    // ── Step 2: covered fee types are chips over the backend enum — NO
    // freeform text entry is possible.
    const feeTypes = page.getByTestId('finance-wizard-feetypes')
    await expect(feeTypes).toBeVisible()
    await expect(feeTypes.locator('input')).toHaveCount(0)
    await expect(feeTypes.getByRole('button')).toHaveCount(FEE_TYPE_ENUM.size)
    await feeTypes.getByRole('button', { name: 'Tuition', exact: true }).click()
    await feeTypes.getByRole('button', { name: 'Examination', exact: true }).click()

    // ── Frequency select offers EXACTLY the 4 enum options.
    await page.getByRole('button', { name: 'Monthly', exact: true }).click()
    const options = page.getByRole('option')
    await expect(options).toHaveCount(4)
    for (const label of ['Monthly', 'Quarterly', 'Annual', 'One-time']) {
      await expect(page.getByRole('option', { name: label, exact: true })).toBeVisible()
    }
    await expect(page.getByRole('option', { name: /annually|termly/i })).toHaveCount(0)
    await page.getByRole('option', { name: 'Annual', exact: true }).click()

    // ── Allocation: total 60000 split 40000 + 20000.
    await labeledInput(page, 'Total amount').fill('60000')
    await page.locator('li', { hasText: 'Aarav Sharma' }).locator('input[type="number"]').fill('40000')
    await page.locator('li', { hasText: 'Bhavna Poudel' }).locator('input[type="number"]').fill('20000')
    await fillDates(page)
    await page.getByRole('button', { name: 'Next' }).click()

    // ── Step 3: review → create draft → detail navigation.
    await page.getByRole('button', { name: 'Create draft' }).click()
    await expect(page.getByText('Agreement created')).toBeVisible()

    // ── The POSTed body IS the backend contract.
    const body = createdAgreementWrite(captured)
    expect(body.billingFrequency).toBe('annual')
    expect(FREQUENCY_ENUM.has(body.billingFrequency)).toBe(true)
    expect(body.coveredFeeTypes).toEqual(['tuition', 'exam'])
    for (const ft of body.coveredFeeTypes) expect(FEE_TYPE_ENUM.has(ft)).toBe(true)
    expect(body.studentIds).toEqual(['stu-aarav', 'stu-bhavna'])
    expect(body.terms.agreementType).toBe('fixed_total')
    expect(body.terms.totalAmount).toBe(60000)
    const allocationSum = body.terms.allocation.reduce(
      (acc: number, a: { amount: number }) => acc + a.amount,
      0,
    )
    expect(allocationSum).toBe(body.terms.totalAmount)
    for (const a of body.terms.allocation) expect(a.amount).toBeGreaterThan(0)
    expect(typeof body.currency).toBe('string')
    expect(body.currency.length).toBeGreaterThan(0)
  })

  test('per_student mode renders the full matrix and POSTs every (student × feeType) line', async ({ page }) => {
    const captured = await mockFinanceApi(page)
    await page.goto('/finance/agreements/create')

    await fillStep1(page, [['aar', 'Aarav Sharma'], ['bha', 'Bhavna Poudel']])

    // Switch agreement type to per_student.
    await page.getByRole('button', { name: 'Fixed total', exact: true }).click()
    await page.getByRole('option', { name: 'Per student', exact: true }).click()

    const feeTypes = page.getByTestId('finance-wizard-feetypes')
    await feeTypes.getByRole('button', { name: 'Tuition', exact: true }).click()
    await feeTypes.getByRole('button', { name: 'Examination', exact: true }).click()

    // The editor is the full 2×2 (member × feeType) matrix.
    const cells: Array<[string, string]> = [
      ['Aarav Sharma — Tuition', '12000'],
      ['Aarav Sharma — Examination', '1500'],
      ['Bhavna Poudel — Tuition', '11000'],
      ['Bhavna Poudel — Examination', '1500'],
    ]
    for (const [label, value] of cells) {
      const cell = page.getByRole('spinbutton', { name: label })
      await expect(cell).toBeVisible()
      await cell.fill(value)
    }

    await fillDates(page)
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Create draft' }).click()
    await expect(page.getByText('Agreement created')).toBeVisible()

    const body = createdAgreementWrite(captured)
    expect(body.terms.agreementType).toBe('per_student')
    expect(body.terms.lines).toHaveLength(4)
    // F1 completeness: every (studentId × coveredFeeType) pair present, each
    // line carrying feeType and a strictly positive amount.
    for (const studentId of ['stu-aarav', 'stu-bhavna']) {
      for (const feeType of ['tuition', 'exam']) {
        const line = body.terms.lines.find(
          (l: { studentId: string; feeType?: string }) => l.studentId === studentId && l.feeType === feeType,
        )
        expect(line, `missing line for ${studentId} × ${feeType}`).toBeTruthy()
        expect(line.amount).toBeGreaterThan(0)
      }
    }
  })

  test('server 400 surfaces both validation messages inline and jumps to the offending step', async ({ page }) => {
    await mockFinanceApi(page, { createAgreementResponse: 'validation_error' })
    await page.goto('/finance/agreements/create')

    await fillStep1(page, [['aar', 'Aarav Sharma']])

    const feeTypes = page.getByTestId('finance-wizard-feetypes')
    await feeTypes.getByRole('button', { name: 'Tuition', exact: true }).click()
    await labeledInput(page, 'Total amount').fill('5000')
    await page.locator('li', { hasText: 'Aarav Sharma' }).locator('input[type="number"]').fill('5000')
    await fillDates(page)
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Create draft' }).click()

    // Backend-authored messages render INLINE in the page (not just a toast).
    await expect(page.getByText('The server rejected the submission:')).toBeVisible()
    await expect(
      page.getByText(/Covered fee type must be one of tuition, admission, exam/),
    ).toBeVisible()
    await expect(
      page.getByText(/Billing frequency must be one of one_time, monthly, quarterly, annual/),
    ).toBeVisible()

    // The wizard jumped back to the Terms step (both rejected paths live there):
    // Terms content is visible again and the review submit is gone.
    await expect(page.getByText('Covered fee types')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create draft' })).toHaveCount(0)
  })
})
