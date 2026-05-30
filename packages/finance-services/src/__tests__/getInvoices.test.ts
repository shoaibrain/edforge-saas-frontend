import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@edforge/api-client', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
}))

import { apiGet } from '@edforge/api-client'
import { getInvoices } from '../services/invoices.service'

const mockApiGet = vi.mocked(apiGet)

describe('getInvoices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('preserves lastEvaluatedKey from paginated response', async () => {
    mockApiGet.mockResolvedValue({
      items: [{ id: 'inv-1' }],
      hasMore: true,
      lastEvaluatedKey: 'cursor-page-2',
    })

    const result = await getInvoices('sch-1', { status: 'issued' })

    expect(result.lastEvaluatedKey).toBe('cursor-page-2')
    expect(result.hasMore).toBe(true)
    expect(result.items).toHaveLength(1)
  })

  it('forwards cursor on second page request', async () => {
    mockApiGet.mockResolvedValue({ items: [], hasMore: false })

    await getInvoices('sch-1', { cursor: 'cursor-page-2', limit: 50 })

    expect(mockApiGet).toHaveBeenCalledWith('/finance/schools/sch-1/invoices', {
      cursor: 'cursor-page-2',
      limit: 50,
    })
  })

  it('unwraps legacy array to hasMore false', async () => {
    mockApiGet.mockResolvedValue([{ id: 'legacy-1' }])

    const result = await getInvoices('sch-1')

    expect(result).toEqual({
      items: [{ id: 'legacy-1' }],
      hasMore: false,
    })
    expect(result.lastEvaluatedKey).toBeUndefined()
  })
})
