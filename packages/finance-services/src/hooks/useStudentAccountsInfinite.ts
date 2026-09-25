/**
 * useStudentAccountsInfinite — cursor-paginated student accounts list.
 */

import { useEffect, useState } from 'react'
import type { StudentAccount } from '@edforge/types'
import { getStudentAccounts } from '../services/invoices.service'
import type { StudentAccountListParams } from '../types/pagination'
import { paymentKeys } from './usePayments'
import {
  useFinancePaginatedQuery,
  type UseFinancePaginatedQueryResult,
} from './useFinancePaginatedQuery'

const DEFAULT_LIMIT = 50

/** Ceiling on the automatic drain: 20 pages x 50 = 1000 accounts. */
const MAX_DRAIN_PAGES = 20

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

export interface UseAllStudentAccountsResult
  extends UseFinancePaginatedQueryResult<StudentAccount> {
  /** Every account the server holds is loaded — aggregates over `items` are exact. */
  isComplete: boolean
  /** Further pages are still being pulled in automatically. */
  isDraining: boolean
}

/**
 * Exhaustive variant of {@link useStudentAccountsInfinite}. It shares the query
 * key, so the pages it pulls populate the one cache entry the list already
 * reads — school-wide aggregates cost no second fetch of page 1 and leave no
 * parallel copy of the rows to drift.
 *
 * `isComplete` is the only safe gate for "this number covers the whole school":
 * the drain stops at MAX_DRAIN_PAGES, and a failing page halts it part-way.
 */
export function useAllStudentAccounts(
  schoolId: string,
  filters?: Omit<StudentAccountListParams, 'limit' | 'cursor'>,
): UseAllStudentAccountsResult {
  const paginated = useStudentAccountsInfinite(schoolId, filters)
  const { hasMore, isLoading, isFetchingNextPage, loadMore, totalLoaded } = paginated

  const scope = `${schoolId}|${JSON.stringify(filters ?? {})}`
  const [drain, setDrain] = useState({ scope, pages: 0, requestedAt: -1 })

  useEffect(() => {
    if (drain.scope !== scope) {
      setDrain({ scope, pages: 0, requestedAt: -1 })
      return
    }
    if (isLoading || isFetchingNextPage || !hasMore) return
    if (drain.pages >= MAX_DRAIN_PAGES) return
    // Ask again only once the previous page actually landed, so a de-duplicated
    // or failed fetch cannot burn the cap without loading any rows.
    if (drain.requestedAt === totalLoaded) return
    setDrain({ scope, pages: drain.pages + 1, requestedAt: totalLoaded })
    loadMore()
  }, [scope, drain, isLoading, isFetchingNextPage, hasMore, totalLoaded, loadMore])

  return {
    ...paginated,
    isComplete: !isLoading && !hasMore,
    isDraining: hasMore && drain.scope === scope && drain.pages < MAX_DRAIN_PAGES,
  }
}
