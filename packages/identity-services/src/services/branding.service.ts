/**
 * Branding service (Sprint M2 — read; Sprint M3 — write).
 *
 * Thin axios wrappers around the C.0.7 backend endpoints:
 *   GET   /schools/:schoolId/branding   → BrandingResponse        (M2)
 *   PATCH /schools/:schoolId/branding   → BrandingResponse        (M3)
 *
 * Backend gates: `BrandingController` mixes `@RequirePermission(view)`
 * for GET + `@RequirePermission(configure)` for PATCH. Frontend ABAC
 * mirrors via `usePermission('view'|'configure', 'branding')`.
 *
 * Error path: AxiosError propagates as-is — consumers (the
 * `useSchoolBranding` / `useUpdateBranding` hooks) classify it.
 *   - GET 404 / 403 → real "school not visible" not "no branding yet".
 *     A school WITH no branding configured returns 200 with
 *     `branding: null` (the controller never 404s for missing branding).
 *   - PATCH 400 → Zod validation failure on the partial DTO. The
 *     server-side schema enforces hex pattern + max-length + array
 *     bounds; failing those produces ZodValidationException → 400.
 *   - PATCH 403 → caller doesn't have `branding:configure` for this
 *     school. Should never reach this path because the frontend gates
 *     the Edit button on `usePermission('configure', 'branding')`.
 */

import { apiGet, apiPatch } from '@edforge/api-client'

import type { BrandingResponse, UpdateBrandingRequest } from '../types'

/**
 * Fetch the school's branding + signed asset URLs.
 *
 * @param schoolId — UUID of the school whose branding to read. Must be
 *                   in the caller's allowed-school set per ABAC; the
 *                   backend rejects otherwise.
 */
export async function getBranding(schoolId: string): Promise<BrandingResponse> {
  return apiGet<BrandingResponse>(`/schools/${encodeURIComponent(schoolId)}/branding`)
}

/**
 * Upsert the school's branding (Sprint M3 — write).
 *
 * Body is a partial — only fields the operator changed need to be
 * included; backend merges with the existing row. Returns the full
 * post-update `BrandingResponse` (including the new `brandingVersionId`
 * + freshly minted asset URLs if any S3 keys were touched). Consumers
 * SHOULD update React Query's cache from the return value AND
 * invalidate `brandingKeys.school(schoolId)` so any other surface
 * subscribed to the branding query re-fetches.
 *
 * @param schoolId — UUID. Backend authorizes against the caller's
 *                   `branding:configure` grant for this specific school.
 * @param body     — Partial branding fields. The
 *                   `*S3Key` fields are accepted by the backend but
 *                   M3 phase 1 leaves them undefined (asset uploads
 *                   land in phase 2).
 */
export async function updateBranding(
  schoolId: string,
  body: UpdateBrandingRequest,
): Promise<BrandingResponse> {
  return apiPatch<BrandingResponse, UpdateBrandingRequest>(
    `/schools/${encodeURIComponent(schoolId)}/branding`,
    body,
  )
}
