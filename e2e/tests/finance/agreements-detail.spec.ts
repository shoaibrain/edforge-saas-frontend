// Family-billing agreement detail (FB-2.8): versions crash-regression,
// activate lifecycle (happy / 409 conflict listing / terminal overlap), and
// the cancel body contract ({ version, reason }).

import { test, expect } from '../../fixtures/test'
import { mockFinanceApi, agreement, SCHOOL_ID } from '../../fixtures/finance'

const NOW = '2026-06-01T00:00:00.000Z'

const draft = () =>
  agreement({
    id: 'agr-2',
    title: 'Thapa Brothers 2082',
    status: 'draft',
    version: 2,
    studentIds: ['stu-chandra'],
    terms: {
      agreementType: 'fixed_total',
      totalAmount: 19000,
      allocation: [{ studentId: 'stu-chandra', amount: 19000 }],
    },
  })

test.describe('Agreement detail', () => {
  test.use({ role: 'Accountant' })

  test.beforeEach(() => {
    // Dev-mode MF remotes compile on first hit — allow for the cold start.
    test.setTimeout(60_000)
  })

  test('renders with the WRAPPED versions envelope — no iteration crash', async ({ page }) => {
    await mockFinanceApi(page, {
      agreements: [draft()],
      // The fixture serves versions as { items: [...] } — the exact envelope
      // that once crashed the page ("t is not iterable") when the FE spread it.
      agreementVersions: [
        agreement({ id: 'agr-2', version: 1, status: 'superseded' }),
        draft(),
      ],
    })
    await page.goto('/finance/agreements/agr-2')

    await expect(page.getByRole('heading', { name: 'Thapa Brothers 2082' })).toBeVisible()
    // Version list rendered from the unwrapped items — newest first, current
    // tagged. Scoped to the versions aside (the header meta also says
    // "Version 2").
    const versionsCard = page.locator('aside', { hasText: 'Versions' })
    await expect(versionsCard.getByText('Version 2')).toBeVisible()
    await expect(versionsCard.getByText('Version 1')).toBeVisible()
    await expect(versionsCard.getByText('Current', { exact: true })).toBeVisible()
    // Neither the finance error boundary nor the not-found state fired.
    await expect(page.getByText('Something went wrong')).toHaveCount(0)
    await expect(page.getByText('Agreement not found in this school.')).toHaveCount(0)
  })

  test('activate happy path posts { version, acknowledgeOpenInvoices } and closes', async ({ page }) => {
    const captured = await mockFinanceApi(page, { agreements: [draft()] })
    await page.goto('/finance/agreements/agr-2')

    await page.getByRole('button', { name: 'Activate', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Activate agreement')).toBeVisible()
    await dialog.getByRole('button', { name: 'Activate', exact: true }).click()

    await expect(page.getByText('Agreement activated')).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)

    const write = captured.writes.find((w) => w.url.includes('/agreements/agr-2/activate'))
    expect(write).toBeTruthy()
    expect(write!.body).toMatchObject({ version: 2, acknowledgeOpenInvoices: false })
  })

  test('activate 409 CONFLICTING_OPEN_INVOICES lists every conflict; acknowledge retries with the flag', async ({ page }) => {
    const conflicts = [
      { invoiceId: 'inv-c1', invoiceNumber: 'INV-2082-0007', grandTotal: 12000, matchedFeeTypes: ['tuition'] },
      { invoiceId: 'inv-c2', invoiceNumber: 'INV-2082-0011', grandTotal: 3500, matchedFeeTypes: ['exam'] },
    ]
    const captured = await mockFinanceApi(page, {
      agreements: [draft()],
      activateResponse: 'conflict',
      activateConflicts: conflicts,
    })
    await page.goto('/finance/agreements/agr-2')

    await page.getByRole('button', { name: 'Activate', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Activate', exact: true }).click()

    // Banner count == conflicts.length, and each invoice number is listed.
    // (Copy tolerant of the singular/plural i18n form; the COUNT is the pin.)
    await expect(dialog.getByText(/This activation conflicts with 2 open invoice/)).toBeVisible()
    await expect(dialog.getByText('INV-2082-0007')).toBeVisible()
    await expect(dialog.getByText('INV-2082-0011')).toBeVisible()

    // Acknowledge → retry carries acknowledgeOpenInvoices: true → succeeds.
    await dialog.getByRole('button', { name: 'Acknowledge and activate' }).click()
    await expect(page.getByText('Agreement activated')).toBeVisible()

    const activates = captured.writes.filter((w) => w.url.includes('/activate'))
    expect(activates).toHaveLength(2)
    expect((activates[0].body as Record<string, unknown>).acknowledgeOpenInvoices).toBe(false)
    expect((activates[1].body as Record<string, unknown>).acknowledgeOpenInvoices).toBe(true)
  })

  test('activate 409 AGREEMENT_OVERLAP is terminal — no acknowledge action', async ({ page }) => {
    await mockFinanceApi(page, { agreements: [draft()], activateResponse: 'overlap' })
    await page.goto('/finance/agreements/agr-2')

    await page.getByRole('button', { name: 'Activate', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Activate', exact: true }).click()

    await expect(
      dialog.getByText('Another active agreement already covers overlapping students or fee types.'),
    ).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Acknowledge and activate' })).toHaveCount(0)
    await expect(dialog.getByRole('button', { name: 'Activate', exact: true })).toHaveCount(0)
  })

  test('cancel posts { version, reason } to the cancel route', async ({ page }) => {
    const captured = await mockFinanceApi(page, {
      agreements: [
        agreement({ id: 'agr-1', status: 'active', version: 3, statusHistory: [{ from: 'draft', to: 'active', changedAt: NOW, changedBy: 'e2e' }] }),
      ],
    })
    await page.goto('/finance/agreements/agr-1')

    await page.getByRole('button', { name: 'Cancel agreement', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByPlaceholder('Why is this agreement being cancelled?').fill('Family left the school')
    await dialog.getByRole('button', { name: 'Cancel agreement', exact: true }).click()

    await expect(page.getByText('Agreement cancelled')).toBeVisible()

    const write = captured.writes.find((w) =>
      new URL(w.url).pathname.endsWith(`/finance/schools/${SCHOOL_ID}/agreements/agr-1/cancel`),
    )
    expect(write).toBeTruthy()
    expect(write!.body).toMatchObject({ version: 3, reason: 'Family left the school' })
  })
})
