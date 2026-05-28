/**
 * Shared cursor-pagination query params for finance list APIs.
 * Backend query param: `cursor` (base64 JSON). Response field: `lastEvaluatedKey`.
 */

export interface FinanceListQueryParams {
  limit?: number
  cursor?: string
}

export interface StudentAccountListParams extends FinanceListQueryParams {
  /** Backend filters by student name (partial match). Not studentId — see B-2. */
  searchTerm?: string
  hasOutstandingBalance?: boolean
}
