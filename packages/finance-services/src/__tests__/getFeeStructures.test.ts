import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@edforge/api-client', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}))

import { apiGet } from '@edforge/api-client'
import { getFeeStructures } from '../services/fee-structures.service'

const mockApiGet = vi.mocked(apiGet)

describe('getFeeStructures', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns full paginated response', async () => {
    mockApiGet.mockResolvedValue({
      items: [{ id: 'fee-1', name: 'Tuition' }],
      hasMore: true,
      lastEvaluatedKey: 'fs-cursor',
    })

    const result = await getFeeStructures('sch-1', { limit: 50 })

    expect(result.lastEvaluatedKey).toBe('fs-cursor')
    expect(result.hasMore).toBe(true)
  })
})
