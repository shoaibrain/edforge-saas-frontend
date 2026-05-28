import type { FinancePaginatedResponse } from '../types/pagination'

/**
 * Unwrap finance list API responses: paginated object vs legacy bare array.
 */
export function normalizeFinanceListResponse<T>(
  response: FinancePaginatedResponse<T> | T[] | null | undefined,
): FinancePaginatedResponse<T> {
  if (response == null) {
    return { items: [], hasMore: false }
  }
  if (Array.isArray(response)) {
    return { items: response, hasMore: false }
  }
  return {
    items: response.items ?? [],
    hasMore: response.hasMore ?? response.lastEvaluatedKey != null,
    lastEvaluatedKey: response.lastEvaluatedKey,
  }
}
