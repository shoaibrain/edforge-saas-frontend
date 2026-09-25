/**
 * #501 (frontend half) — the idempotency key must be minted per FORM
 * SUBMISSION, not per ATTEMPT.
 *
 * The server-side guard only dedupes when the retry carries the SAME key.
 * The drawer used to call `crypto.randomUUID()` inside submit(), so the retry
 * a cashier makes after a network timeout — the one case idempotency exists
 * for — arrived with a different key and booked a second payment however
 * correct the server was. `recordPayment.isPending` only blocks the
 * double-click, which is a different failure.
 *
 * Both halves matter and the pair is the contract:
 *   1. stable across retries within one drawer-open, and
 *   2. regenerated on the next drawer-open,
 * because (1) alone also passes on a hardcoded constant, which would make
 * every subsequent payment on that invoice a silent no-op.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { Invoice, Payment, RecordManualPaymentDto } from '@edforge/types'

const recordedDtos: RecordManualPaymentDto[] = []
/** Queue of outcomes for successive mutateAsync calls; defaults to success. */
let outcomes: Array<'ok' | 'fail'> = []

const payment = {
  id: 'pay-1',
  receiptNumber: 'RCP-0001',
} as Payment

const mutateAsync = vi.fn(async (dto: RecordManualPaymentDto): Promise<Payment> => {
  recordedDtos.push(dto)
  if (outcomes[recordedDtos.length - 1] === 'fail') throw new Error('network timeout')
  return payment
})

vi.mock('@edforge/finance-services', () => ({
  useRecordManualPayment: () => ({ mutateAsync, isPending: false }),
}))

vi.mock('@tanstack/react-router', () => ({ useNavigate: () => vi.fn() }))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

vi.mock('@edforge/i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

vi.mock('@edforge/types/use-currency', () => ({
  useCurrency: () => ({ format: (n: number) => String(n), formatCompact: (n: number) => String(n) }),
}))

vi.mock('../../../../layouts/FinanceLayout', () => ({
  useFinanceSettings: () => ({
    currency: 'NPR',
    calendarSystem: 'gregorian',
    enableDualDateDisplay: false,
  }),
}))

vi.mock('../../../../hooks/useCurrentUserName', () => ({
  useCurrentUserName: () => null,
}))

import { RecordPaymentDrawer } from '../RecordPaymentDrawer'

const invoice = {
  id: 'inv-1',
  invoiceNumber: 'INV-0001',
  studentName: 'Test Student',
  currency: 'NPR',
  amountDue: 5000,
} as Invoice

function renderDrawer() {
  const view = render(
    <RecordPaymentDrawer open onClose={vi.fn()} invoice={invoice} schoolId="school-1" />
  )
  const setOpen = (open: boolean) =>
    view.rerender(
      <RecordPaymentDrawer
        open={open}
        onClose={vi.fn()}
        invoice={invoice}
        schoolId="school-1"
      />
    )
  return { setOpen }
}

async function submit() {
  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: 'recordPayment.drawer.recordAmount' })
    )
  })
}

const keys = () => recordedDtos.map((dto) => dto.idempotencyKey)

describe('RecordPaymentDrawer idempotency key (#501)', () => {
  beforeEach(() => {
    cleanup()
    recordedDtos.length = 0
    outcomes = []
    mutateAsync.mockClear()
  })

  it('reuses one key when the operator retries a failed submit in the same drawer-open', async () => {
    outcomes = ['fail', 'ok']
    renderDrawer()

    await submit()
    await submit()

    expect(recordedDtos).toHaveLength(2)
    expect(keys()[0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    expect(keys()[1]).toBe(keys()[0])
  })

  it('mints a fresh key on the next drawer-open so the second payment is not swallowed', async () => {
    const { setOpen } = renderDrawer()

    await submit()

    setOpen(false)
    setOpen(true)

    await submit()

    expect(recordedDtos).toHaveLength(2)
    expect(keys()[1]).toBeTruthy()
    expect(keys()[1]).not.toBe(keys()[0])
  })
})
