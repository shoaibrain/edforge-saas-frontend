/**
 * useStudentAccountsInfinite — cursor-paginated student accounts list.
 */

import { getStudentAccounts } from '../services/invoices.service'
import type { StudentAccountListParams } from '../types/pagination'
import { paymentKeys } from './usePayments'
import { useFinancePaginatedQuery } from './useFinancePaginatedQuery'

const DEFAULT_LIMIT = 50

export function useStudentAccountsInfinite(
  schoolId: string,
  filters?: Omit<StudentAccountListParams, 'limit' | 'cursor'>,
) {
  return useFinancePaginatedQuery({
    queryKey: [...paymentKeys.studentAccounts(schoolId), 'infinite', filters] as const,
    queryFn: (params) => getStudentAccounts(schoolId, params as StudentAccountListParams),
    filters: filters ?? {},
    limit: DEFAULT_LIMIT,
    enabled: !!schoolId,
    staleTime: 60_000,
  })
}
