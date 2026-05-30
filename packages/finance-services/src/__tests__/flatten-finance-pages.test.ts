import { describe, it, expect } from 'vitest'
import type { InfiniteData } from '@tanstack/react-query'
import { flattenFinancePages } from '../utils/flatten-finance-pages'
import type { FinancePaginatedResponse } from '../types/pagination'

describe('flattenFinancePages', () => {
  it('flattens two mock pages into one item array', () => {
    const data: InfiniteData<FinancePaginatedResponse<{ id: string }>> = {
      pages: [
        {
          items: [{ id: 'a' }, { id: 'b' }],
          hasMore: true,
          lastEvaluatedKey: 'lek-1',
        },
        {
          items: [{ id: 'c' }],
          hasMore: false,
        },
      ],
      pageParams: [undefined, 'lek-1'],
    }

    expect(flattenFinancePages(data)).toEqual([{ id: 'a' }, { id: 'b' }, { id: 'c' }])
  })

  it('returns empty array for undefined data', () => {
    expect(flattenFinancePages(undefined)).toEqual([])
  })
})
