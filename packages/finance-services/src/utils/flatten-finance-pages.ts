import type { InfiniteData } from '@tanstack/react-query'
import type { FinancePaginatedResponse } from '../services/invoices.service'

/**
 * Flatten infinite-query pages into a single items array.
 * Mirrors flattenStudentPages from academics.
 */
export function flattenFinancePages<T>(
  data: InfiniteData<FinancePaginatedResponse<T>> | undefined,
): T[] {
  if (!data) return []
  return data.pages.flatMap((page) => page?.items ?? [])
}
