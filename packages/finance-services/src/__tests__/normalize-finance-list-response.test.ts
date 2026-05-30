import { describe, it, expect } from 'vitest'
import { normalizeFinanceListResponse } from '../utils/normalize-finance-list-response'

describe('normalizeFinanceListResponse', () => {
  it('preserves paginated shape with lastEvaluatedKey', () => {
    const result = normalizeFinanceListResponse({
      items: [{ id: '1' }],
      hasMore: true,
      lastEvaluatedKey: 'cursor-abc',
    })
    expect(result).toEqual({
      items: [{ id: '1' }],
      hasMore: true,
      lastEvaluatedKey: 'cursor-abc',
    })
  })

  it('unwraps legacy array', () => {
    const result = normalizeFinanceListResponse([{ id: 'a' }, { id: 'b' }])
    expect(result).toEqual({ items: [{ id: 'a' }, { id: 'b' }], hasMore: false })
  })

  it('handles empty paginated response', () => {
    expect(normalizeFinanceListResponse({ items: [], hasMore: false })).toEqual({
      items: [],
      hasMore: false,
    })
  })

  it('handles null and undefined', () => {
    expect(normalizeFinanceListResponse(null)).toEqual({ items: [], hasMore: false })
    expect(normalizeFinanceListResponse(undefined)).toEqual({ items: [], hasMore: false })
  })

  it('infers hasMore from lastEvaluatedKey when hasMore is omitted', () => {
    const result = normalizeFinanceListResponse({
      items: [{ id: '1' }],
      lastEvaluatedKey: 'cursor-abc',
    } as { items: { id: string }[]; lastEvaluatedKey: string })
    expect(result.hasMore).toBe(true)
    expect(result.lastEvaluatedKey).toBe('cursor-abc')
  })
})
