/**
 * Tests for invoices.service.ts
 *
 * Verifies getStudentAccounts correctly unwraps both paginated
 * { items, hasMore } and raw array API responses.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @edforge/api-client before importing the service
vi.mock('@edforge/api-client', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
}))

import { apiGet } from '@edforge/api-client'
import { getStudentAccounts } from '../services/invoices.service'

const mockApiGet = vi.mocked(apiGet)

describe('getStudentAccounts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('unwraps paginated response { items, hasMore }', async () => {
    const accounts = [
      { id: 'acc-1', studentId: 's-1', schoolId: 'sch-1', studentName: 'Alice', balance: 500, totalPaid: 1000, lastPaymentDate: '2026-03-16', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-03-16T00:00:00Z' },
      { id: 'acc-2', studentId: 's-2', schoolId: 'sch-1', studentName: 'Bob', balance: 0, totalPaid: 2000, lastPaymentDate: '2026-03-15', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-03-15T00:00:00Z' },
    ]
    mockApiGet.mockResolvedValue({ items: accounts, hasMore: false })

    const result = await getStudentAccounts('sch-1')

    expect(result).toEqual(accounts)
    expect(result).toHaveLength(2)
    expect(mockApiGet).toHaveBeenCalledWith('/finance/schools/sch-1/student-accounts', undefined)
  })

  it('returns raw array response as-is', async () => {
    const accounts = [
      { id: 'acc-1', studentId: 's-1', schoolId: 'sch-1', studentName: 'Alice', balance: 500, totalPaid: 1000, lastPaymentDate: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    ]
    mockApiGet.mockResolvedValue(accounts)

    const result = await getStudentAccounts('sch-1')

    expect(result).toEqual(accounts)
    expect(result).toHaveLength(1)
  })

  it('returns empty array for empty paginated response', async () => {
    mockApiGet.mockResolvedValue({ items: [], hasMore: false })

    const result = await getStudentAccounts('sch-1')

    expect(result).toEqual([])
    expect(result).toHaveLength(0)
  })

  it('returns empty array for undefined response', async () => {
    mockApiGet.mockResolvedValue(undefined)

    const result = await getStudentAccounts('sch-1')

    expect(result).toEqual([])
  })

  it('returns empty array for null response', async () => {
    mockApiGet.mockResolvedValue(null)

    const result = await getStudentAccounts('sch-1')

    expect(result).toEqual([])
  })

  it('passes studentId params to API', async () => {
    mockApiGet.mockResolvedValue({ items: [], hasMore: false })

    await getStudentAccounts('sch-1', { studentId: 's-1' })

    expect(mockApiGet).toHaveBeenCalledWith(
      '/finance/schools/sch-1/student-accounts',
      { studentId: 's-1' }
    )
  })
})
