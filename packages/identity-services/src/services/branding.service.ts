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

import { apiGet, apiPatch, apiPost } from '@edforge/api-client'

import type {
  BrandingResponse,
  PresignedUploadRequest,
  PresignedUploadResponse,
  UpdateBrandingRequest,
} from '../types'

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

/**
 * Request a presigned PUT URL for a branding asset (Sprint M3 phase 2 —
 * step 1 of the 2-step upload flow).
 *
 *   POST /schools/:schoolId/branding/assets/upload-url
 *
 * The server validates `contentType` against its per-assetType MIME
 * allowlist + caps `contentLength` against `ASSET_MAX_BYTES`. Failing
 * either produces a 400 with a descriptive `message`. Frontend
 * pre-validates the same constraints (via `BRANDING_ASSET_MIME_ALLOWLIST`
 * + `BRANDING_ASSET_MAX_BYTES` exported alongside) to fail fast without
 * a round-trip.
 *
 * On success: returns the signed `uploadUrl` (short TTL), the `key` to
 * persist on the PATCH body, and `expiresInSeconds` (informational).
 */
export async function presignBrandingUpload(
  schoolId: string,
  body: PresignedUploadRequest,
): Promise<PresignedUploadResponse> {
  return apiPost<PresignedUploadResponse, PresignedUploadRequest>(
    `/schools/${encodeURIComponent(schoolId)}/branding/assets/upload-url`,
    body,
  )
}

/**
 * PUT the asset bytes directly to S3 using a presigned URL (Sprint M3
 * phase 2 — step 2 of the 2-step upload flow).
 *
 * **Not via `@edforge/api-client`'s axios instance.** That instance
 * attaches Cognito Authorization + tenant headers; sending those to
 * S3 would (a) leak the bearer token to the asset CDN and (b) cause
 * S3 to reject the request because the signed URL has its own auth
 * embedded. A plain `fetch` is the right tool here.
 *
 * Throws on non-2xx — caller (the hook) classifies + surfaces.
 */
export async function uploadAssetToS3(
  uploadUrl: string,
  file: File,
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  })
  if (!response.ok) {
    throw new Error(
      `S3 upload failed with status ${response.status} ${response.statusText}`,
    )
  }
}
