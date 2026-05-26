/**
 * Branding query hooks (Sprint M2 — Branding read).
 *
 * `useSchoolBranding(schoolId)` — gated `useQuery` for the school's
 * branding read. Disabled when `schoolId` is falsy (pre-school-context
 * cold mount in Shell). Sprint M3 (write) will use the exported
 * `brandingKeys` for cache invalidation after a PATCH.
 *
 * staleTime = 60s mirrors the backend's signed-URL TTL (10 min) with
 * an order-of-magnitude buffer. Short enough that operator-side mutations
 * land within reasonable time; long enough to avoid hammering the
 * endpoint on tab switches.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { getBranding } from '../services/branding.service'
import type { BrandingResponse } from '../types'

/**
 * Stable React Query keys for the branding namespace.
 *
 * Stamped `as const` so consumers (M3 write mutations) can spread
 * them into `queryClient.invalidateQueries({ queryKey: ... })` with
 * TypeScript narrowing intact.
 */
export const brandingKeys = {
  all: ['branding'] as const,
  school: (schoolId: string) => [...brandingKeys.all, schoolId] as const,
}

/**
 * Read the branding payload for a school.
 *
 * Returns the standard React Query result shape. Consumers MUST handle:
 *   - `isLoading || isPending` → spinner (covers the schoolId-gating
 *     idle window the same way the M1.5-FU.1 receipt-page fix handles it)
 *   - `error` → typed UI per status (404 = school not found / forbidden,
 *     401 = auth, 5xx = retry). Branding-not-configured is NOT an error
 *     — it surfaces as `data.branding === null`.
 *   - `data?.branding === null` → empty-state UI
 *   - `data?.branding` truthy → render with optional `data?.urls`
 *
 * @param schoolId — UUID. When undefined / empty string, the query
 *                   stays disabled (idle).
 */
export function useSchoolBranding(
  schoolId: string | undefined,
): UseQueryResult<BrandingResponse, Error> {
  return useQuery({
    queryKey: brandingKeys.school(schoolId ?? ''),
    queryFn: () => getBranding(schoolId as string),
    enabled: !!schoolId,
    staleTime: 60_000,
  })
}
