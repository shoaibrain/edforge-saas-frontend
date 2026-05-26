/**
 * Branding service (Sprint M2 — Branding read).
 *
 * Thin axios-via-`apiGet` wrapper around the C.0.7 backend endpoint:
 *   `GET /schools/:schoolId/branding` → `BrandingResponse`
 *
 * Backend gate: `BrandingController@findOne` (decorator
 * `@RequirePermission('branding', 'view')`). Frontend ABAC mirror is
 * `apps/shell` settings hub via `usePermission('view', 'branding')`.
 *
 * Error path: AxiosError propagates as-is — consumers (the
 * `useSchoolBranding` hook) classify it. 404 means "school has no
 * branding configured yet" and the response has `branding: null`,
 * NOT a 404 status (the controller always returns 200 with a
 * nullable shape). A real 404 from this endpoint indicates the
 * school itself doesn't exist or the caller can't see it.
 */

import { apiGet } from '@edforge/api-client'

import type { BrandingResponse } from '../types'

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
