/**
 * BrandingFileField — eager-upload file picker for branding assets
 * (Sprint M3 phase 2).
 *
 * **Per-slot lifecycle:** mounts ONE `usePresignedAssetUpload` hook so
 * each FileField (logo / signature / letterhead) has its own `isPending`
 * — mirrors the per-row hook isolation pattern from M1.6 / M1.5-FU.4.
 * Uploading the logo never disables the signature picker.
 *
 * **Eager-upload UX:** the file is uploaded the moment the operator
 * picks it, BEFORE Save. On success the resulting S3 key is written to
 * the RHF form field via Controller. Save just sends the PATCH with
 * the staged key. Trade-off: an operator who picks a file and then
 * Cancels leaves an orphan S3 object — accepted because the server's
 * S3 lifecycle policy cleans these up, and the alternative
 * (defer-upload-to-save) makes Save long-running with partial-failure
 * UX. Documented for phase 3 if operator feedback flips the decision.
 *
 * **Validation:** pre-flight against the per-assetType allowlists from
 * `@edforge/identity-services`. Failures show inline error and never
 * fire the upload. Server re-validates; client validation is fail-fast
 * UX only.
 *
 * **Remove existing asset:** NOT in phase 2. If `branding.logoS3Key`
 * is already set when the form mounts, the current-asset preview
 * renders read-only and the operator can only Replace (upload a new
 * file). Phase 3 needs server support for explicit removal.
 *
 * **Inline (not promoted to `@edforge/forms`):** single consumer
 * today (BrandingForm's 3 slots). Promote when a second consumer
 * materializes; mirrors the BrandingColorPicker rationale.
 */

import { useRef, useId, useState, useCallback, useEffect } from 'react'
import { Controller } from '@edforge/forms'
import { useTranslation } from '@edforge/i18n'
import {
  Loader2,
  Upload,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  FileText,
  RotateCw,
} from 'lucide-react'
import {
  usePresignedAssetUpload,
  BRANDING_ASSET_MIME_ALLOWLIST,
  BRANDING_ASSET_MAX_BYTES,
  type BrandingAssetType,
} from '@edforge/identity-services'

interface BrandingFileFieldProps {
  /** RHF field name that will receive the resulting S3 key. */
  name: string
  /** Which asset slot this field manages (drives allowlist + size cap). */
  assetType: BrandingAssetType
  /** UUID of the active school — required for the presign endpoint. */
  schoolId: string
  /** Visible label shown above the picker. */
  label: string
  /** Optional signed GET URL for the CURRENT asset (rendered as a thumbnail). */
  currentUrl?: string
  /** Disable the picker (parent uses this during form submit). */
  disabled?: boolean
}

const MIB = 1024 * 1024

function formatBytes(bytes: number): string {
  if (bytes < MIB) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / MIB).toFixed(1)} MB`
}

/**
 * Operator-readable label for a MIME type. The naive
 * `m.split('/')[1].toUpperCase()` approach produces `SVG+XML` for
 * `image/svg+xml` — accurate but ugly. Map the common ones explicitly;
 * fall back to the subtype-uppercase for anything not listed.
 */
const MIME_LABELS: Record<string, string> = {
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
  'image/svg+xml': 'SVG',
  'application/pdf': 'PDF',
}

function labelMime(mime: string): string {
  return MIME_LABELS[mime] ?? mime.split('/')[1].toUpperCase()
}

/**
 * Best-effort PDF detection from the signed URL. Letterhead may be a
 * PDF; rendering it as <img> shows broken-image. Falls back to <img>
 * on parse failure (acceptable — alt text handles the broken state).
 */
function isLikelyPdf(url: string): boolean {
  try {
    const u = new URL(url)
    return /\.pdf(\?|$)/i.test(u.pathname) || /pdf/i.test(u.search)
  } catch {
    return false
  }
}

export function BrandingFileField({
  name,
  assetType,
  schoolId,
  label,
  currentUrl,
  disabled,
}: BrandingFileFieldProps) {
  return (
    <Controller
      name={name}
      defaultValue=""
      render={({ field, fieldState }) => (
        <BrandingFileFieldInner
          field={field}
          fieldState={fieldState}
          assetType={assetType}
          schoolId={schoolId}
          label={label}
          currentUrl={currentUrl}
          disabled={disabled}
        />
      )}
    />
  )
}

interface InnerProps {
  field: {
    name: string
    value: unknown
    onChange: (v: unknown) => void
    onBlur: () => void
    disabled?: boolean
  }
  fieldState: { error?: { message?: string } }
  assetType: BrandingAssetType
  schoolId: string
  label: string
  currentUrl?: string
  disabled?: boolean
}

function BrandingFileFieldInner({
  field,
  fieldState,
  assetType,
  schoolId,
  label,
  currentUrl,
  disabled,
}: InnerProps) {
  const { t } = useTranslation('branding')
  const inputRef = useRef<HTMLInputElement>(null)
  const id = useId()
  const [localError, setLocalError] = useState<string | null>(null)

  // Sprint M3-phase-3 — eager preview (closes Issue #25 from
  // pdf-service-mfe-integration-plan.md §0.3). After a successful
  // upload we hold a `URL.createObjectURL(file)` blob so the
  // preview reflects the just-picked file immediately, BEFORE the
  // form is saved and `currentUrl` refetches with the new signed
  // GET URL. Without this, the preview kept showing the prior
  // asset until Save → refetch, which the operator (correctly)
  // read as "the upload didn't take effect."
  //
  // Lifecycle:
  //   - On successful upload, set { url: createObjectURL(file), isPdf }
  //   - On subsequent re-pick, revoke previous + create new
  //   - On unmount, revoke whatever's current (useEffect cleanup)
  //   - When `currentUrl` updates from a refetch we COULD revoke
  //     here, but it's harmless to keep the blob until unmount —
  //     and `eagerPreview` takes priority anyway, so we don't
  //     even need to gate on it.
  const [eagerPreview, setEagerPreview] = useState<
    { url: string; isPdf: boolean } | null
  >(null)
  useEffect(() => {
    return () => {
      if (eagerPreview) URL.revokeObjectURL(eagerPreview.url)
    }
    // We deliberately depend on the url so a fresh blob revokes the
    // previous one when the operator re-picks; mount-time effect run
    // with `eagerPreview === null` is a no-op.
  }, [eagerPreview])

  // Per-slot upload mutation.
  const upload = usePresignedAssetUpload()

  const stagedKey: string = typeof field.value === 'string' ? field.value : ''
  // Operator has staged SOME key in this form session (either initial
  // server-returned OR newly uploaded). Drives "Replace" vs
  // "Choose file" button label.
  const hasStagedUpload = stagedKey !== ''
  // Specifically tracks whether the upload mutation succeeded in this
  // session (i.e., operator just uploaded a NEW file). Drives the
  // "Uploaded — Save to apply" status pill so the operator knows to
  // click Save next. Resets to false on the next pick.
  const justUploaded = upload.isSuccess && !!upload.data?.s3Key

  const allowlist = BRANDING_ASSET_MIME_ALLOWLIST[assetType]
  const maxBytes = BRANDING_ASSET_MAX_BYTES[assetType]

  const acceptAttr = allowlist.join(',')

  const handlePick = useCallback(
    async (file: File) => {
      setLocalError(null)
      try {
        const result = await upload.mutateAsync({ schoolId, assetType, file })
        field.onChange(result.s3Key)
        // Eager preview — synthesize a local blob URL from the file so
        // the operator sees the new asset reflected immediately. The
        // useEffect cleanup on `eagerPreview` revokes the prior URL
        // when this one replaces it.
        setEagerPreview({
          url: URL.createObjectURL(file),
          isPdf: file.type === 'application/pdf',
        })
      } catch (e) {
        const code = (e as { code?: string }).code
        if (code === 'mime') {
          setLocalError(
            t('form.upload.mimeError', {
              allowed: allowlist.join(', '),
              defaultValue: `Unsupported file type. Allowed: ${allowlist.join(', ')}`,
            }),
          )
        } else if (code === 'size') {
          setLocalError(
            t('form.upload.sizeError', {
              max: formatBytes(maxBytes),
              defaultValue: `File too large. Max: ${formatBytes(maxBytes)}`,
            }),
          )
        } else {
          setLocalError(
            t('form.upload.serverError', {
              defaultValue: 'Upload failed. Please try again.',
            }),
          )
        }
      }
      // Reset the input so picking the same file again re-fires onChange.
      if (inputRef.current) inputRef.current.value = ''
    },
    [allowlist, assetType, field, maxBytes, schoolId, t, upload],
  )

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void handlePick(file)
  }

  const triggerPicker = () => {
    if (disabled || upload.isPending) return
    inputRef.current?.click()
  }

  // Eager preview takes priority over the server-supplied `currentUrl`.
  // After a successful upload the operator sees the new asset
  // immediately; after Save → refetch, `currentUrl` updates with the
  // new signed URL and continues to work (the blob URL stays valid
  // until unmount but the eager value is the correct preview).
  const previewSrc = eagerPreview?.url ?? currentUrl ?? null
  const previewIsPdf = eagerPreview
    ? eagerPreview.isPdf
    : !!currentUrl && isLikelyPdf(currentUrl)
  const preview = previewSrc ? (
    previewIsPdf ? (
      <a
        href={previewSrc}
        target="_blank"
        rel="noopener noreferrer"
        className="aspect-video rounded-md border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] hover:bg-[rgb(var(--bg-tertiary))] transition-colors flex items-center justify-center text-xs text-[rgb(var(--text-secondary))] font-medium"
      >
        <FileText className="w-4 h-4 mr-1" /> PDF
      </a>
    ) : (
      <img
        src={previewSrc}
        alt={label}
        className="block w-full aspect-video object-contain rounded-md border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))]"
      />
    )
  ) : (
    <div
      className="aspect-video rounded-md border border-dashed border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] flex items-center justify-center text-xs text-[rgb(var(--text-tertiary))] italic"
      role="img"
      aria-label={t('emptyField.logo', { defaultValue: 'No file uploaded' })}
    >
      <ImageIcon className="w-5 h-5 opacity-50" />
    </div>
  )

  const errorMessage = localError ?? fieldState.error?.message ?? null

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-xs font-medium text-[rgb(var(--text-secondary))]">
        {label}
      </label>

      {preview}

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={acceptAttr}
        onChange={onChange}
        disabled={disabled || upload.isPending}
        className="sr-only"
        aria-describedby={errorMessage ? `${id}-err` : `${id}-help`}
      />

      <button
        type="button"
        onClick={triggerPicker}
        disabled={disabled || upload.isPending}
        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-secondary))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {upload.isPending ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {t('form.upload.uploading', { defaultValue: 'Uploading…' })}
          </>
        ) : currentUrl || hasStagedUpload ? (
          <>
            <RotateCw className="w-3.5 h-3.5" />
            {t('form.upload.replace', { defaultValue: 'Replace' })}
          </>
        ) : (
          <>
            <Upload className="w-3.5 h-3.5" />
            {t('form.upload.choose', { defaultValue: 'Choose file' })}
          </>
        )}
      </button>

      {justUploaded && !errorMessage && (
        <p
          className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
          role="status"
        >
          <CheckCircle2 className="w-3 h-3" />
          {t('form.upload.uploaded', { defaultValue: 'Uploaded — Save to apply' })}
        </p>
      )}

      {errorMessage && (
        <p id={`${id}-err`} className="text-xs text-red-500 flex items-start gap-1" role="alert">
          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </p>
      )}

      <p id={`${id}-help`} className="text-[10px] text-[rgb(var(--text-tertiary))]">
        {t('form.upload.constraints', {
          allowed: allowlist.map(labelMime).join(', '),
          max: formatBytes(maxBytes),
          defaultValue: `Allowed: ${allowlist.map(labelMime).join(', ')} · Max ${formatBytes(maxBytes)}`,
        })}
      </p>

      {/* Sprint C.1.9 — letterhead-specific operator guidance.
          When a letterhead is uploaded, the server-side renderer
          (`@aibrains/pdf-renderer@^0.8.0`) suppresses its own
          BrandedHeader + BrandedFooter and pushes content into the
          letterhead's safe-area band. Operators need to know what to
          design for. Only renders on the letterhead slot — logo +
          signature have no such contract. */}
      {assetType === 'letterhead' && (
        <p
          className="text-[10px] text-[rgb(var(--text-tertiary))] leading-relaxed"
          role="note"
        >
          {t('form.upload.letterheadGuidance', {
            defaultValue:
              'Design for A4 portrait (210×297mm). Keep the center ~150mm clean — that is where invoice + receipt content sits. When a letterhead is set, the school name + logo from your branding settings are not added by the renderer; the letterhead provides them.',
          })}
        </p>
      )}
    </div>
  )
}
