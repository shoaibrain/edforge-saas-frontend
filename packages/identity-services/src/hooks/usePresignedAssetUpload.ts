/**
 * usePresignedAssetUpload — Sprint M3 phase 2.
 *
 * Combined 2-step branding-asset upload pipeline:
 *   1. Pre-validate the File client-side against the per-assetType MIME
 *      allowlist + size cap. Throw synchronously on violation so the
 *      operator never sees a 400 round-trip for an obviously-bad file.
 *   2. POST to `/schools/:id/branding/assets/upload-url` for a signed
 *      PUT URL.
 *   3. PUT the file bytes directly to S3 with the signed URL.
 *   4. Return the S3 `key` so the caller can include it in the
 *      next `PATCH /schools/:id/branding` body's `*S3Key` field.
 *
 * Returns React Query's `UseMutationResult` shape so consumers get
 * `isPending` / `isError` / `data` / `mutate` / `mutateAsync` for free.
 * The hook is stateless beyond what React Query tracks; orphan S3
 * objects from cancelled uploads are cleaned up by the server-side
 * S3 lifecycle policy (not the frontend's concern).
 *
 * **Pre-validation rationale:** the server enforces both checks too —
 * client validation is a fail-fast UX layer, not a security boundary.
 * If the maps drift between client/server, the operator just sees the
 * error later (after the round-trip) instead of synchronously.
 */

import { useMutation, type UseMutationResult } from '@tanstack/react-query'

import {
  presignBrandingUpload,
  uploadAssetToS3,
} from '../services/branding.service'
import {
  BRANDING_ASSET_MAX_BYTES,
  BRANDING_ASSET_MIME_ALLOWLIST,
  type BrandingAssetType,
} from '../types'

/** Args for a single asset-upload invocation. */
export interface AssetUploadVariables {
  /** UUID of the school whose branding row gets the new asset. */
  schoolId: string
  /** Which slot the asset is for. */
  assetType: BrandingAssetType
  /** The browser File the operator picked. */
  file: File
}

export interface AssetUploadResult {
  /** S3 key to assign to the matching `*S3Key` schema field on PATCH. */
  s3Key: string
}

/**
 * Pre-validation: matches the server's per-assetType constraints byte
 * for byte. A failure here throws synchronously with a code-tagged
 * message so the FileField can map to a user-friendly i18n key.
 *
 * Codes (stable; the UI matches on them):
 *   - `mime` — Content-Type not in the per-assetType allowlist
 *   - `size` — File.size exceeds the per-assetType byte ceiling
 */
function preValidate(assetType: BrandingAssetType, file: File): void {
  const allowed = BRANDING_ASSET_MIME_ALLOWLIST[assetType]
  if (!allowed.includes(file.type)) {
    const err = new Error(
      `MIME ${file.type || '(unknown)'} not allowed for ${assetType}; expected one of ${allowed.join(', ')}`,
    )
    ;(err as { code?: string }).code = 'mime'
    throw err
  }
  const maxBytes = BRANDING_ASSET_MAX_BYTES[assetType]
  if (file.size > maxBytes) {
    const err = new Error(
      `File size ${file.size}B exceeds ${assetType} ceiling ${maxBytes}B`,
    )
    ;(err as { code?: string }).code = 'size'
    throw err
  }
}

/**
 * Run the full upload pipeline for one file.
 *
 * Exported for direct use by tests + (future) batch-upload flows; the
 * hook below wraps this in a React Query mutation.
 */
export async function runAssetUpload(
  vars: AssetUploadVariables,
): Promise<AssetUploadResult> {
  preValidate(vars.assetType, vars.file)
  const { uploadUrl, key } = await presignBrandingUpload(vars.schoolId, {
    assetType: vars.assetType,
    contentType: vars.file.type,
    contentLength: vars.file.size,
  })
  await uploadAssetToS3(uploadUrl, vars.file)
  return { s3Key: key }
}

/**
 * React Query mutation wrapping the full pipeline.
 *
 * Per-call signature: each `mutate(vars)` invocation runs the 2-step
 * upload for ONE file. The form mounts ONE hook PER FileField slot,
 * mirroring the per-row hook isolation pattern from M1.6 (so each
 * slot's `isPending` is independent).
 */
export function usePresignedAssetUpload(): UseMutationResult<
  AssetUploadResult,
  Error,
  AssetUploadVariables
> {
  return useMutation({
    mutationFn: runAssetUpload,
  })
}
