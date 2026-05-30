/**
 * Tests for invoices.service.ts — student accounts list pagination.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

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

  it('returns paginated response with lastEvaluatedKey', async () => {
    const accounts = [
      {
        id: 'acc-1',
        studentId: 's-1',
        schoolId: 'sch-1',
        studentName: 'Alice',
        balance: 500,
        totalPaid: 1000,
        lastPaymentDate: '2026-03-16',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-03-16T00:00:00Z',
      },
    ]
    mockApiGet.mockResolvedValue({
      items: accounts,
      hasMore: true,
      lastEvaluatedKey: 'acc-cursor',
    })

    const result = await getStudentAccounts('sch-1')

    expect(result.items).toEqual(accounts)
    expect(result.hasMore).toBe(true)
    expect(result.lastEvaluatedKey).toBe('acc-cursor')
  })

  it('forwards cursor and searchTerm (not studentId — B-2)', async () => {
    mockApiGet.mockResolvedValue({ items: [], hasMore: false })

    await getStudentAccounts('sch-1', {
      searchTerm: 'Alice',
      cursor: 'acc-cursor',
      limit: 50,
    })

    expect(mockApiGet).toHaveBeenCalledWith('/finance/schools/sch-1/student-accounts', {
      searchTerm: 'Alice',
      cursor: 'acc-cursor',
      limit: 50,
    })
    expect(mockApiGet).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ studentId: expect.anything() }),
    )
  })

  it('unwraps legacy array response', async () => {
    const accounts = [
      {
        id: 'acc-1',
        studentId: 's-1',
        schoolId: 'sch-1',
        studentName: 'Alice',
        balance: 0,
        totalPaid: 0,
        lastPaymentDate: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ]
    mockApiGet.mockResolvedValue(accounts)

    const result = await getStudentAccounts('sch-1')

    expect(result.items).toEqual(accounts)
    expect(result.hasMore).toBe(false)
  })
})
