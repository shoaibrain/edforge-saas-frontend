/**
 * Branding query + mutation hooks (Sprint M2 — read; Sprint M3 — write).
 *
 * `useSchoolBranding(schoolId)` — gated `useQuery` for the read.
 *   Disabled when `schoolId` is falsy (pre-school-context cold mount
 *   in Shell). staleTime = 60s mirrors the backend's signed-URL TTL
 *   (10 min) with an order-of-magnitude buffer.
 *
 * `useUpdateBranding(schoolId)` — `useMutation` for PATCH. On success:
 *   - writes the server's freshly-returned `BrandingResponse` into the
 *     `brandingKeys.school(schoolId)` cache slot via `setQueryData`
 *     (eager update — view reflects the save immediately, no spinner
 *     between save-success and refetch-completion)
 *   - invalidates the same key so any other component subscribed to
 *     `useSchoolBranding(schoolId)` re-renders with the new data
 *
 * Error path: AxiosError propagates to the mutation's `error` field
 * unchanged; consumers can branch on `error.response?.status` for
 * 400 (Zod) vs 403 (perm) vs 5xx.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'

import { getBranding, updateBranding } from '../services/branding.service'
import type { BrandingResponse, UpdateBrandingRequest } from '../types'

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

/**
 * Mutation for `PATCH /schools/:schoolId/branding` (Sprint M3).
 *
 * Mirrors the `useUpdateInvoice` shape in finance-services. The
 * onSuccess handler does TWO things:
 *   1. `setQueryData` — writes the server-returned response into the
 *      cache slot eagerly. The Branding settings page (or any other
 *      consumer subscribed to `useSchoolBranding(schoolId)`) renders
 *      the updated branding without a spinner gap.
 *   2. `invalidateQueries` — marks the slot stale so any consumer
 *      that mounts AFTER the mutation completes (e.g., a sibling
 *      settings tab) gets a fresh fetch on next render. Cheap belt-
 *      and-suspenders alongside the setQueryData write.
 *
 * The mutation does NOT swallow errors — consumers wire toasts at the
 * call site (Sprint M3.5 BrandingForm uses `sonner` for save success
 * + failure).
 */
export function useUpdateBranding(
  schoolId: string | undefined,
): UseMutationResult<BrandingResponse, Error, UpdateBrandingRequest> {
  const queryClient = useQueryClient()
  return useMutation({
    // Fail-fast when schoolId is undefined. Without this guard, the
    // `schoolId as string` cast would let `updateBranding` issue a
    // `PATCH /schools/undefined/branding` request — the server's
    // routing would return 404 and the caller would see a confusing
    // error after the round-trip. Surfacing the error synchronously
    // (before any network call) keeps the failure mode honest +
    // testable. PR #89 review-fix.
    mutationFn: (body: UpdateBrandingRequest) => {
      if (!schoolId) {
        return Promise.reject(
          new Error('useUpdateBranding: schoolId is required'),
        )
      }
      return updateBranding(schoolId, body)
    },
    onSuccess: (data) => {
      if (!schoolId) return
      queryClient.setQueryData(brandingKeys.school(schoolId), data)
      queryClient.invalidateQueries({ queryKey: brandingKeys.school(schoolId) })
    },
  })
}
