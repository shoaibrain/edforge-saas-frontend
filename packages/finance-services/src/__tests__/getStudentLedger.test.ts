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

  it('returns paginated response with lastEvaluatedKey', async () => {
    mockApiGet.mockResolvedValue({
      items: [ENTRY_FIXTURE],
      hasMore: true,
      lastEvaluatedKey: 'ledger-cursor',
    })

    const result = await getStudentLedger(SCHOOL_ID, ACCOUNT_ID)

    expect(result.items).toHaveLength(1)
    expect(result.lastEvaluatedKey).toBe('ledger-cursor')
    expect(result.hasMore).toBe(true)
  })

  it('forwards cursor param', async () => {
    mockApiGet.mockResolvedValue({ items: [], hasMore: false })

    await getStudentLedger(SCHOOL_ID, ACCOUNT_ID, { cursor: 'ledger-cursor', limit: 50 })

    expect(mockApiGet).toHaveBeenCalledWith(
      `/finance/schools/${SCHOOL_ID}/student-accounts/${ACCOUNT_ID}/ledger`,
      { cursor: 'ledger-cursor', limit: 50 },
    )
  })

  it('unwraps legacy array', async () => {
    mockApiGet.mockResolvedValue([ENTRY_FIXTURE])

    const result = await getStudentLedger(SCHOOL_ID, ACCOUNT_ID)

    expect(result.items).toEqual([ENTRY_FIXTURE])
    expect(result.hasMore).toBe(false)
  })
})
