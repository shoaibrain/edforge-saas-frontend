/**
 * useInvoicesInfinite — cursor-paginated invoice list.
 */

import type { InvoiceFilterDto } from '@edforge/types'
import { getInvoices } from '../services/invoices.service'
import type { InvoiceListParams } from '../services/invoices.service'
import { paymentKeys } from './usePayments'
import { useFinancePaginatedQuery } from './useFinancePaginatedQuery'

const DEFAULT_LIMIT = 50

interface UseInvoicesInfiniteOptions {
  enabled?: boolean
  limit?: number
}

export function useInvoicesInfinite(
  schoolId: string,
  filters?: InvoiceFilterDto,
  options: UseInvoicesInfiniteOptions = {},
) {
  const { limit = DEFAULT_LIMIT, enabled: enabledOption } = options
  const studentIdGate = 'studentId' in (filters ?? {})
    ? !!filters?.studentId
    : true

  return useFinancePaginatedQuery({
    queryKey: paymentKeys.invoiceList(schoolId, filters),
    queryFn: (params) => getInvoices(schoolId, params as InvoiceListParams),
    filters: filters ?? {},
    limit,
    enabled: !!schoolId && studentIdGate && (enabledOption ?? true),
  })
}
