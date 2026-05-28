/**
 * useStudentLedgerInfinite — cursor-paginated ledger entries for one account.
 */

import { getStudentLedger } from '../services/invoices.service'
import { paymentKeys } from './usePayments'
import { useFinancePaginatedQuery } from './useFinancePaginatedQuery'

const DEFAULT_LIMIT = 50

export function useStudentLedgerInfinite(schoolId: string, accountId: string) {
  return useFinancePaginatedQuery({
    queryKey: [...paymentKeys.ledger(schoolId, accountId), 'infinite'] as const,
    queryFn: (params) => getStudentLedger(schoolId, accountId, params),
    filters: {},
    limit: DEFAULT_LIMIT,
    enabled: !!schoolId && !!accountId,
  })
}
