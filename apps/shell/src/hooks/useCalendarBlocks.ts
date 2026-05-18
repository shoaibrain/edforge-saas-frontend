/**
 * useCalendarBlocks — React Query hooks for Sprint C4 multi-day blocks.
 *
 * Mirrors `useCalendar.ts` patterns. The cache-invalidation rule below
 * is critical and load-bearing — it's what makes "create Dashain" cause
 * the calendar grid to immediately reflect the 9 dates as break-shaded.
 *
 * ## Cache-invalidation rule
 *
 * Every block mutation must invalidate the calendar-dates cache.
 * Block writes mutate child CalendarDate rows server-side:
 *   - create: deletes N SYSTEM rows, writes N new child rows with
 *     `blockId/blockName/blockDescriptor/subEventName`
 *   - update: rewrites block-level fields on N child rows (per-day
 *     overrides survive — see C4.4)
 *   - delete: cascades, deletes block + all N child rows
 *
 * Without invalidating `calendarKeys.all`, the grid would still show
 * Mon-Fri as instructional for the Dashain range until refetch.
 * `calendarKeys.all` is the umbrella; `useGenerateCalendar` uses the
 * same approach (`useCalendar.ts:192`).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { extractApiErrorMessage } from '@edforge/api-client'
import type {
  CalendarBlockResponseDto,
  CalendarBlockListResponseDto,
  CreateCalendarBlockDto,
  UpdateCalendarBlockDto,
  CalendarBlockDescriptor,
} from '@aibrains/shared-types'
import {
  listCalendarBlocks,
  getCalendarBlock,
  createCalendarBlock,
  updateCalendarBlock,
  deleteCalendarBlock,
  type ListCalendarBlocksFilter,
} from '../services/calendar-block.service'
import { calendarKeys } from './useCalendar'

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

export const calendarBlockKeys = {
  all: ['calendar-blocks'] as const,
  list: (schoolId: string, academicYearId?: string, descriptor?: CalendarBlockDescriptor) =>
    [...calendarBlockKeys.all, 'list', schoolId, academicYearId, descriptor] as const,
  detail: (schoolId: string, blockId: string) =>
    [...calendarBlockKeys.all, 'detail', schoolId, blockId] as const,
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * List blocks for a school + AY. Optionally filtered by descriptor.
 * Caches for 5 minutes (matches the rest of the calendar domain). Set
 * `enabled` to `false` to defer the query until prerequisites land.
 */
export function useCalendarBlocks(
  schoolId: string,
  academicYearId: string,
  options: {
    descriptor?: CalendarBlockDescriptor
    enabled?: boolean
  } = {},
) {
  const { descriptor, enabled = true } = options
  const filter: ListCalendarBlocksFilter = {
    schoolId,
    academicYearId,
    blockDescriptor: descriptor,
  }
  return useQuery<CalendarBlockListResponseDto, Error>({
    queryKey: calendarBlockKeys.list(schoolId, academicYearId, descriptor),
    queryFn: () => listCalendarBlocks(filter),
    enabled: enabled && !!schoolId && !!academicYearId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useCalendarBlock(schoolId: string, blockId: string, enabled = true) {
  return useQuery<CalendarBlockResponseDto, Error>({
    queryKey: calendarBlockKeys.detail(schoolId, blockId),
    queryFn: () => getCalendarBlock(schoolId, blockId),
    enabled: enabled && !!schoolId && !!blockId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Helper — invalidate everything affected by a block write.
 * `calendarBlockKeys.all` covers the block list + detail caches.
 * `calendarKeys.all` covers the dates / stats / sessions caches per the
 * cache-invalidation rule documented above.
 */
function invalidateBlockAndDateCaches(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({ queryKey: calendarBlockKeys.all })
  queryClient.invalidateQueries({ queryKey: calendarKeys.all })
}

export function useCreateCalendarBlock() {
  const queryClient = useQueryClient()
  return useMutation<CalendarBlockResponseDto, Error, CreateCalendarBlockDto>({
    mutationFn: (data) => createCalendarBlock(data),
    onSuccess: (result) => {
      invalidateBlockAndDateCaches(queryClient)
      toast.success(
        `Created "${result.blockName}" (${result.childDateCount} day${result.childDateCount === 1 ? '' : 's'})`,
      )
    },
    onError: (error) => {
      toast.error(extractApiErrorMessage(error))
    },
  })
}

export function useUpdateCalendarBlock(schoolId: string) {
  const queryClient = useQueryClient()
  return useMutation<
    CalendarBlockResponseDto,
    Error,
    { blockId: string; data: UpdateCalendarBlockDto }
  >({
    mutationFn: ({ blockId, data }) => updateCalendarBlock(schoolId, blockId, data),
    onSuccess: (result) => {
      invalidateBlockAndDateCaches(queryClient)
      toast.success(`Updated "${result.blockName}"`)
    },
    onError: (error) => {
      toast.error(extractApiErrorMessage(error))
    },
  })
}

export function useDeleteCalendarBlock(schoolId: string) {
  const queryClient = useQueryClient()
  return useMutation<
    { deletedChildren: number },
    Error,
    { blockId: string; blockName: string }
  >({
    mutationFn: ({ blockId }) => deleteCalendarBlock(schoolId, blockId),
    onSuccess: (result, vars) => {
      invalidateBlockAndDateCaches(queryClient)
      toast.success(
        `Deleted "${vars.blockName}". ${result.deletedChildren} calendar ` +
          `date${result.deletedChildren === 1 ? '' : 's'} reset.`,
      )
    },
    onError: (error) => {
      toast.error(extractApiErrorMessage(error))
    },
  })
}
