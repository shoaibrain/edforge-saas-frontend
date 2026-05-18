/**
 * Calendar Block Service
 *
 * API service functions for `CalendarBlock` CRUD (Sprint C4 — Multi-Day
 * Event Blocks). A `CalendarBlock` is the operator's umbrella for a
 * multi-day event (Dashain, Tihar, Summer Vacation, exam window). On
 * create the backend writes 1 block row + N child `CalendarDate` rows
 * atomically; the child rows carry denormalized `blockId`, `blockName`,
 * `blockDescriptor`, and `subEventName` for read-side rendering.
 *
 * ------------------------------------------------------------------
 * Route shape is intentionally asymmetric to bell-schedules.
 * ------------------------------------------------------------------
 *
 * Calendar blocks are TOP-LEVEL:
 *     `/calendar-blocks?schoolId=...`
 *
 * Bell schedules are NESTED:
 *     `/schools/:schoolId/bell-schedules`
 *
 * The asymmetry is deliberate. A block's natural identity is
 * `(tenantId, blockId)` — schools are a *filter*, not a *parent*. List
 * queries often span schools (org-wide reporting), and nesting would
 * force separate calls per school. Bell-schedules ARE per-school by
 * design (each school can run a different schedule).
 *
 * Do NOT "fix" this asymmetry without coordinating ALL FOUR touch-points
 * together — they must move in lockstep:
 *   1. NestJS controller routes
 *      (server/.../calendar-blocks/calendar-block.controller.ts)
 *   2. API Gateway OpenAPI spec
 *      (server/lib/tenant-api-prod.json)
 *   3. NGINX reverse-proxy template
 *      (server/application/reverseproxy/nginx.template)
 *   4. The route-drift linter
 *      (scripts/check-route-drift.ts)
 *
 * See docs/pilot-greenlight/c4-fe-sprint-plan.md §0.1 for the rationale
 * and the full architectural review.
 */

import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api'
import type {
  CalendarBlockResponseDto,
  CalendarBlockListResponseDto,
  CreateCalendarBlockDto,
  UpdateCalendarBlockDto,
  CalendarBlockDescriptor,
} from '@aibrains/shared-types'

// ============================================================================
// FILTER / LIST PARAMS
// ============================================================================

export interface ListCalendarBlocksFilter {
  /** Required by the backend filter schema. */
  schoolId: string
  /** Limit to a single AY. Useful for the calendar-setup wizard. */
  academicYearId?: string
  /** Filter by descriptor for the UI's category chips. */
  blockDescriptor?: CalendarBlockDescriptor
  /** Inclusive window — returns blocks overlapping `[from, to]`. */
  from?: string
  to?: string
  /** Defaults server-side to 100; max 200. */
  limit?: number
  /** Opaque pagination cursor returned by the previous page. */
  cursor?: string
}

function buildQueryString(filter: ListCalendarBlocksFilter): string {
  const params = new URLSearchParams()
  params.append('schoolId', filter.schoolId)
  if (filter.academicYearId) params.append('academicYearId', filter.academicYearId)
  if (filter.blockDescriptor) params.append('blockDescriptor', filter.blockDescriptor)
  if (filter.from) params.append('from', filter.from)
  if (filter.to) params.append('to', filter.to)
  if (filter.limit !== undefined) params.append('limit', String(filter.limit))
  if (filter.cursor) params.append('cursor', filter.cursor)
  return params.toString()
}

// ============================================================================
// CALENDAR BLOCK CRUD
// ============================================================================

/**
 * List blocks for a school, optionally filtered by AY / descriptor /
 * date window. Returns a paginated envelope (`items` + `hasMore` +
 * optional `cursor`).
 */
export async function listCalendarBlocks(
  filter: ListCalendarBlocksFilter,
): Promise<CalendarBlockListResponseDto> {
  return apiGet<CalendarBlockListResponseDto>(`/calendar-blocks?${buildQueryString(filter)}`)
}

/** Get a single block by id. `schoolId` is required as a query param. */
export async function getCalendarBlock(
  schoolId: string,
  blockId: string,
): Promise<CalendarBlockResponseDto> {
  return apiGet<CalendarBlockResponseDto>(
    `/calendar-blocks/${blockId}?schoolId=${encodeURIComponent(schoolId)}`,
  )
}

/**
 * Create a block. `schoolId` and `academicYearId` are in the body per
 * the request schema, NOT in the URL.
 *
 * Backend behavior on success (Sprint C4-followup-2 merge-mode):
 *  - Deletes any SYSTEM-generated CalendarDate rows in the block range
 *    (Phase 1: `BatchWriteItems`).
 *  - Writes 1 block row + N new child CalendarDate rows atomically
 *    (Phase 2: `TransactWriteItems`).
 *  - Operator-edited rows in the range are NOT deleted; preflight
 *    returns a 409 `BLOCK_CONFLICTS_OPERATOR_DATES` instead.
 *  - Audit row emitted with `mode: 'merge'` + `systemRowsReplaced`.
 */
export async function createCalendarBlock(
  data: CreateCalendarBlockDto,
): Promise<CalendarBlockResponseDto> {
  return apiPost<CalendarBlockResponseDto, CreateCalendarBlockDto>(`/calendar-blocks`, data)
}

/**
 * Update a block's metadata (name / descriptor / description /
 * sub-events). The date range is intentionally NOT mutable on PATCH —
 * to change the range, delete and recreate. This preserves the audit
 * trail of "operator regretted the range" vs "operator silently
 * widened it". Per-day overrides on existing child dates survive a
 * PATCH per C4.4.
 */
export async function updateCalendarBlock(
  schoolId: string,
  blockId: string,
  data: UpdateCalendarBlockDto,
): Promise<CalendarBlockResponseDto> {
  return apiPatch<CalendarBlockResponseDto, UpdateCalendarBlockDto>(
    `/calendar-blocks/${blockId}?schoolId=${encodeURIComponent(schoolId)}`,
    data,
  )
}

/**
 * Delete a block. Cascades to all child CalendarDate rows in the same
 * transaction. Response carries `deletedChildren` for the toast copy.
 */
export async function deleteCalendarBlock(
  schoolId: string,
  blockId: string,
): Promise<{ deletedChildren: number }> {
  return apiDelete<{ deletedChildren: number }>(
    `/calendar-blocks/${blockId}?schoolId=${encodeURIComponent(schoolId)}`,
  )
}

// ============================================================================
// CONVENIENCE EXPORT
// ============================================================================

export const calendarBlockService = {
  listCalendarBlocks,
  getCalendarBlock,
  createCalendarBlock,
  updateCalendarBlock,
  deleteCalendarBlock,
}
