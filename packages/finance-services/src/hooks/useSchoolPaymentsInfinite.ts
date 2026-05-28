/**
 * useSchoolPaymentsInfinite — cursor-paginated school payments list.
 */

import { getSchoolPayments } from '../services/payments.service'
import type { SchoolPaymentListParams } from '../services/payments.service'
import { paymentKeys } from './usePayments'
import { useFinancePaginatedQuery } from './useFinancePaginatedQuery'

const DEFAULT_LIMIT = 50

interface UseSchoolPaymentsInfiniteOptions {
  limit?: number
}

export function useSchoolPaymentsInfinite(
  schoolId: string,
  filters?: { status?: string; gateway?: string },
  options: UseSchoolPaymentsInfiniteOptions = {},
) {
  const { limit = DEFAULT_LIMIT } = options

  return useFinancePaginatedQuery({
    queryKey: paymentKeys.schoolPayments(schoolId, filters),
    queryFn: (params) => getSchoolPayments(schoolId, params as SchoolPaymentListParams),
    filters: filters ?? {},
    limit,
    enabled: !!schoolId,
  })
}
