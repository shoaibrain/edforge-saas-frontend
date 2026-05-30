import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@edforge/api-client', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

import { apiGet } from '@edforge/api-client'
import { getSchoolPayments } from '../services/payments.service'

const mockApiGet = vi.mocked(apiGet)

describe('getSchoolPayments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('preserves lastEvaluatedKey', async () => {
    mockApiGet.mockResolvedValue({
      items: [{ id: 'pay-1' }],
      hasMore: true,
      lastEvaluatedKey: 'lek-2',
    })

    const result = await getSchoolPayments('sch-1')

    expect(result.lastEvaluatedKey).toBe('lek-2')
    expect(result.items).toHaveLength(1)
  })

  it('forwards cursor param', async () => {
    mockApiGet.mockResolvedValue({ items: [], hasMore: false })

    await getSchoolPayments('sch-1', { cursor: 'lek-2', limit: 50 })

    expect(mockApiGet).toHaveBeenCalledWith('/finance/schools/sch-1/payments', {
      cursor: 'lek-2',
      limit: 50,
    })
  })
})
