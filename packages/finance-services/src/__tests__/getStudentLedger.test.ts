/**
 * Tests for getStudentLedger — Sprint C1.T1.
 *
 * Until 0.36.0 of the frontend bundle, getStudentLedger declared
 * Promise<StudentLedgerEntry[]> but the backend has always returned the
 * { items, hasMore } pagination shape. The component fell back to [] via an
 * Array.isArray() guard, so the Ledger tab silently rendered "No ledger
 * entries yet." — even though the API returned 3 entries.
 *
 * This test locks the unwrap behaviour to mirror getInvoices /
 * getStudentAccounts in the same module.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@edforge/api-client', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
}))

import { apiGet } from '@edforge/api-client'
import { getStudentLedger } from '../services/invoices.service'

const mockApiGet = vi.mocked(apiGet)

const SCHOOL_ID = '6d0a8f2f-c710-4992-97bb-a6bcb824ebab'
const ACCOUNT_ID = 'd9072568-80c0-41ba-b1d6-aa2f9eaf9ad7'

const ENTRY_FIXTURE = {
  id: '1a876588-7cba-4475-856e-15f46879bbf9',
  studentAccountId: ACCOUNT_ID,
  entryType: 'payment' as const,
  referenceId: '474c4b28-4f31-4fe3-a712-25bc590490ae',
  description: 'Payment RCP-6D0-2604-0004 via cheque',
  debit: 0,
  credit: 6000,
  balance: 4000,
  date: '2026-04-03',
  createdAt: '2026-04-03T00:05:14.657Z',
}

describe('getStudentLedger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('unwraps paginated response { items, hasMore } — the bug case', async () => {
    mockApiGet.mockResolvedValue({ items: [ENTRY_FIXTURE], hasMore: false })

    const result = await getStudentLedger(SCHOOL_ID, ACCOUNT_ID)

    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(ENTRY_FIXTURE)
    expect(mockApiGet).toHaveBeenCalledWith(
      `/finance/schools/${SCHOOL_ID}/student-accounts/${ACCOUNT_ID}/ledger`,
    )
  })

  it('returns the same 3-entry payload that prod returned for Lilia Rain (regression)', async () => {
    const liliaPayload = {
      items: [
        ENTRY_FIXTURE,
        { ...ENTRY_FIXTURE, id: 'f6f37114-5c75-4133-9861-cafae182137b', credit: 4000, balance: 0 },
        {
          id: 'inv-1',
          studentAccountId: ACCOUNT_ID,
          entryType: 'invoice' as const,
          referenceId: '74db7ac8-8495-494b-89ae-99434cf3ed52',
          description: 'Invoice INV-6D0-2604-0001 auto-issued on enrollment',
          debit: 10000,
          credit: 0,
          balance: 10000,
          date: '2026-04-02',
          createdAt: '2026-04-02T23:44:10.676Z',
        },
      ],
      hasMore: false,
    }
    mockApiGet.mockResolvedValue(liliaPayload)

    const result = await getStudentLedger(SCHOOL_ID, ACCOUNT_ID)

    expect(result).toHaveLength(3)
    expect(result.map((e) => e.entryType)).toEqual(['payment', 'payment', 'invoice'])
  })

  it('returns raw array response as-is (legacy / mock back-compat)', async () => {
    mockApiGet.mockResolvedValue([ENTRY_FIXTURE])

    const result = await getStudentLedger(SCHOOL_ID, ACCOUNT_ID)

    expect(result).toEqual([ENTRY_FIXTURE])
  })

  it('returns empty array for an empty paginated response', async () => {
    mockApiGet.mockResolvedValue({ items: [], hasMore: false })

    const result = await getStudentLedger(SCHOOL_ID, ACCOUNT_ID)

    expect(result).toEqual([])
  })

  it('returns empty array when response is null/undefined', async () => {
    mockApiGet.mockResolvedValue(null as unknown as { items: typeof ENTRY_FIXTURE[]; hasMore: boolean })

    const result = await getStudentLedger(SCHOOL_ID, ACCOUNT_ID)

    expect(result).toEqual([])
  })
})
