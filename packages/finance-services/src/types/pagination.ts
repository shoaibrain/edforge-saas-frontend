/**
 * Shared cursor-pagination query params for finance list APIs.
 * Backend query param: `cursor` (base64 JSON). Response field: `lastEvaluatedKey`.
 */

/** Backend finance list pagination shape: { items, hasMore, lastEvaluatedKey? } */
export interface FinancePaginatedResponse<T> {
  items: T[]
  hasMore: boolean
  lastEvaluatedKey?: string
}

export interface FinanceListQueryParams {
  limit?: number
  cursor?: string
}

export interface StudentAccountListParams extends FinanceListQueryParams {
  /** Backend filters by student name (partial match). Not studentId — see B-2. */
  searchTerm?: string
  hasOutstandingBalance?: boolean
}
