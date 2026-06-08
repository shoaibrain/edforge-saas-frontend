/**
 * BrandingForm — editable branding card (Sprint M3 phase 1 + 2).
 *
 * Scope (phases 1 + 2):
 *   - Identity: formalName, tagline, panNumber, vatNumber
 *   - Contact: phone, email, addressLines (textarea, one line per row,
 *     max 4 lines)
 *   - Colors: primary, accent (BrandingColorPicker each)
 *   - Assets: logo, principalSignature, letterheadBackground via the
 *     `BrandingFileField` (eager-upload to S3 then S3 key staged in
 *     form state; Save fires the PATCH including the staged keys).
 *
 * **Submission semantics:** the server treats `PATCH /schools/:id/branding`
 * as a partial merge. The client computes the diff against the
 * `initialBranding` snapshot and sends only fields that the operator
 * actually changed — this avoids unintentionally re-writing existing
 * values to empty strings if the operator clears a previously-populated
 * field. Field omitted from the PATCH body = "leave it alone"; field
 * present but undefined = the form's controlled blank state, which
 * Zod rejects unless the field is `.optional()` on the server.
 *
 * **Validation:** mirrors `schoolBrandingSchema` server-side constraints
 * (length caps, hex pattern). Server is the source of truth — the
 * client schema is fail-fast UX, not a security boundary.
 */

import { useMemo } from 'react'
import { toast } from 'sonner'
import { Loader2, Save, X } from 'lucide-react'
import { useForm, FormProvider, zodResolver } from '@edforge/forms'
import { useTranslation } from '@edforge/i18n'
import { useUpdateBranding } from '@edforge/identity-services'
import type {
  BrandingResponse,
  SchoolBrandingDto,
  UpdateBrandingRequest,
} from '@edforge/identity-services'
import { z } from 'zod'
import { useFormDirtyGuard } from '../../hooks/useFormDirtyGuard'
import { BrandingColorPicker } from './BrandingColorPicker'
import { BrandingFileField } from './BrandingFileField'

// ============================================================================
// FORM SCHEMA
// ============================================================================

/**
 * Mirrors `schoolBrandingSchema` (server-side) for the fields phase 1
 * edits. Keeps the field shapes string-not-optional so the form is
 * always controlled — empty strings are translated to `undefined` at
 * submit time in `formToPatch` below.
 *
 * Hex validation matches the server's `/^#[0-9A-Fa-f]{6}$/`. The
 * `.or(z.literal(''))` lets the field stay empty (operator clears it),
 * which submit logic translates to "drop the palette."
 */
const hexOrEmpty = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a 6-digit hex color in the form #RRGGBB')
  .or(z.literal(''))

// S3 key fields (phase 2): the form holds the staged key (string) per
// asset slot. Empty string means "no staged change for this slot."
// The diff helper compares against initialBranding to decide whether
// to include the key in the PATCH body.
const s3KeyOrEmpty = z.string().max(500).or(z.literal(''))

const brandingFormSchema = z
  .object({
    formalName: z.string().max(200).or(z.literal('')),
    tagline: z.string().max(100).or(z.literal('')),
    panNumber: z.string().max(32).or(z.literal('')),
    vatNumber: z.string().max(32).or(z.literal('')),
    phone: z.string().max(50).or(z.literal('')),
    email: z.string().email('Must be a valid email').or(z.literal('')),
    addressLinesText: z.string(),
    primaryColor: hexOrEmpty,
    accentColor: hexOrEmpty,
    logoS3Key: s3KeyOrEmpty,
    principalSignatureS3Key: s3KeyOrEmpty,
    letterheadBackgroundS3Key: s3KeyOrEmpty,
  })
  .refine(
    (data) => {
      const p = data.primaryColor
      const a = data.accentColor
      // Server's `colorPaletteSchema` requires BOTH primary + accent
      // when palette is set. Either both empty (drop palette) or both
      // filled (set palette). One filled + one empty is invalid.
      const pSet = p !== ''
      const aSet = a !== ''
      return pSet === aSet
    },
    {
      message: 'Both primary and accent colors are required when setting a palette',
      path: ['accentColor'],
    },
  )
  .refine(
    (data) => {
      const lines = parseAddressLines(data.addressLinesText)
      if (lines.length > 4) return false
      return lines.every((l) => l.length <= 120)
    },
    {
      message: 'Address: max 4 lines, each at most 120 characters',
      path: ['addressLinesText'],
    },
  )

type BrandingFormValues = z.infer<typeof brandingFormSchema>

// ============================================================================
// HELPERS
// ============================================================================

function parseAddressLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

function formValuesFromBranding(b: SchoolBrandingDto | null): BrandingFormValues {
  return {
    formalName: b?.formalName ?? '',
    tagline: b?.tagline ?? '',
    panNumber: b?.panNumber ?? '',
    vatNumber: b?.vatNumber ?? '',
    phone: b?.phone ?? '',
    email: b?.email ?? '',
    addressLinesText: (b?.addressLines ?? []).join('\n'),
    primaryColor: b?.colorPalette?.primary ?? '',
    accentColor: b?.colorPalette?.accent ?? '',
    logoS3Key: b?.logoS3Key ?? '',
    principalSignatureS3Key: b?.principalSignatureS3Key ?? '',
    letterheadBackgroundS3Key: b?.letterheadBackgroundS3Key ?? '',
  }
}

/**
 * Diff the form values against the loaded branding to compute the
 * partial PATCH body. Only fields that actually changed reach the wire.
 *
 * String fields: form `''` against initial-present-value → sends
 * `undefined` (operator cleared); the server `.optional()` strips
 * undefined fields from the stored row.
 *
 * NOTE: Zod's `.partial()` on the server treats missing keys as
 * "don't change." Sending `undefined` for a field is the same as
 * omitting it. So we just omit unchanged keys.
 */
function formToPatch(
  values: BrandingFormValues,
  initial: SchoolBrandingDto | null,
): UpdateBrandingRequest {
  const patch: UpdateBrandingRequest = {}

  const stringField = (
    key: keyof Omit<UpdateBrandingRequest, 'addressLines' | 'colorPalette'>,
    formValue: string,
    initialValue: string | undefined,
  ) => {
    const next = formValue.trim() === '' ? undefined : formValue.trim()
    if (next === initialValue) return
    if (next === undefined && initialValue === undefined) return
    ;(patch as Record<string, unknown>)[key] = next
  }

  stringField('formalName', values.formalName, initial?.formalName)
  stringField('tagline', values.tagline, initial?.tagline)
  stringField('panNumber', values.panNumber, initial?.panNumber)
  stringField('vatNumber', values.vatNumber, initial?.vatNumber)
  stringField('phone', values.phone, initial?.phone)
  stringField('email', values.email, initial?.email)

  // Asset S3 keys (Sprint M3 phase 2). The form's value is the staged
  // key from a successful upload, OR the initial server-returned key
  // if the operator didn't touch the slot. Diff against initial so
  // unchanged slots are omitted from the PATCH (server treats omitted
  // as "leave alone"). Empty staged key vs unset initial means the
  // operator never picked a file — still omit.
  // NOTE phase-2 limitation: there's no "Remove existing asset" path
  // because the server's Zod schema for `*S3Key` uses `.min(1).optional()`
  // — sending empty string fails validation, and sending undefined is
  // indistinguishable from "no change." A dedicated remove-asset flow
  // is phase-3 work and requires server changes.
  stringField('logoS3Key', values.logoS3Key, initial?.logoS3Key)
  stringField(
    'principalSignatureS3Key',
    values.principalSignatureS3Key,
    initial?.principalSignatureS3Key,
  )
  stringField(
    'letterheadBackgroundS3Key',
    values.letterheadBackgroundS3Key,
    initial?.letterheadBackgroundS3Key,
  )

  const nextAddressLines = parseAddressLines(values.addressLinesText)
  const initialAddressLines = initial?.addressLines ?? []
  if (
    nextAddressLines.length !== initialAddressLines.length ||
    nextAddressLines.some((l, i) => l !== initialAddressLines[i])
  ) {
    patch.addressLines = nextAddressLines.length > 0 ? nextAddressLines : undefined
  }

  const nextPalette =
    values.primaryColor && values.accentColor
      ? { primary: values.primaryColor, accent: values.accentColor }
      : undefined
  const initialPalette = initial?.colorPalette
  const palettesEqual =
    !!nextPalette === !!initialPalette &&
    (!nextPalette ||
      (initialPalette &&
        nextPalette.primary === initialPalette.primary &&
        nextPalette.accent === initialPalette.accent))
  if (!palettesEqual) {
    patch.colorPalette = nextPalette
  }

  return patch
}

// ============================================================================
// COMPONENT
// ============================================================================

interface BrandingFormProps {
  schoolId: string
  data: BrandingResponse
  onCancel: () => void
  onSaved: () => void
}

export function BrandingForm({ schoolId, data, onCancel, onSaved }: BrandingFormProps) {
  const { t } = useTranslation('branding')
  const branding = data.branding
  const initialValues = useMemo(() => formValuesFromBranding(branding), [branding])

  const methods = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingFormSchema),
    mode: 'onBlur',
    defaultValues: initialValues,
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = methods

  const mutation = useUpdateBranding(schoolId)

  const { guardedClose } = useFormDirtyGuard({ isDirty, onClose: onCancel })

  const onSubmit = (values: BrandingFormValues) => {
    const patch = formToPatch(values, branding)
    if (Object.keys(patch).length === 0) {
      // Nothing changed — treat as cancel.
      onSaved()
      return
    }
    mutation.mutate(patch, {
      onSuccess: () => {
        toast.success(t('form.saveSuccess'))
        onSaved()
      },
      onError: () => {
        toast.error(t('form.saveError'))
      },
    })
  }

  const inputBase =
    'w-full px-3 py-2 text-sm rounded-md border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] disabled:opacity-50'
  const labelBase = 'block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5'
  const errorBase = 'mt-1 text-xs text-[rgb(var(--state-danger-fg))]'

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* Identity section */}
        <section className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] p-5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-secondary))] pb-2 border-b border-[rgb(var(--border-primary))]">
            {t('sections.identity')}
          </h3>
          <div>
            <label htmlFor="formalName" className={labelBase}>
              {t('fields.formalName')}
            </label>
            <input
              id="formalName"
              type="text"
              maxLength={200}
              {...register('formalName')}
              className={inputBase}
              disabled={mutation.isPending}
            />
            {errors.formalName && <p className={errorBase}>{errors.formalName.message}</p>}
          </div>
          <div>
            <label htmlFor="tagline" className={labelBase}>
              {t('fields.tagline')}
            </label>
            <input
              id="tagline"
              type="text"
              maxLength={100}
              {...register('tagline')}
              className={inputBase}
              disabled={mutation.isPending}
            />
            {errors.tagline && <p className={errorBase}>{errors.tagline.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="panNumber" className={labelBase}>
                {t('fields.panNumber')}
              </label>
              <input
                id="panNumber"
                type="text"
                maxLength={32}
                {...register('panNumber')}
                className={`${inputBase} font-mono`}
                disabled={mutation.isPending}
              />
              {errors.panNumber && <p className={errorBase}>{errors.panNumber.message}</p>}
            </div>
            <div>
              <label htmlFor="vatNumber" className={labelBase}>
                {t('fields.vatNumber')}
              </label>
              <input
                id="vatNumber"
                type="text"
                maxLength={32}
                {...register('vatNumber')}
                className={`${inputBase} font-mono`}
                disabled={mutation.isPending}
              />
              {errors.vatNumber && <p className={errorBase}>{errors.vatNumber.message}</p>}
            </div>
          </div>
        </section>

        {/* Contact section */}
        <section className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] p-5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-secondary))] pb-2 border-b border-[rgb(var(--border-primary))]">
            {t('sections.contact')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className={labelBase}>
                {t('fields.phone')}
              </label>
              <input
                id="phone"
                type="tel"
                maxLength={50}
                {...register('phone')}
                className={inputBase}
                disabled={mutation.isPending}
              />
              {errors.phone && <p className={errorBase}>{errors.phone.message}</p>}
            </div>
            <div>
              <label htmlFor="email" className={labelBase}>
                {t('fields.email')}
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className={inputBase}
                disabled={mutation.isPending}
              />
              {errors.email && <p className={errorBase}>{errors.email.message}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="addressLinesText" className={labelBase}>
              {t('fields.addressLines')}
            </label>
            <textarea
              id="addressLinesText"
              rows={4}
              {...register('addressLinesText')}
              placeholder={t('form.addressLinesPlaceholder')}
              className={`${inputBase} resize-none`}
              disabled={mutation.isPending}
            />
            <p className="mt-1 text-xs text-[rgb(var(--text-tertiary))]">
              {t('form.addressLinesHelper')}
            </p>
            {errors.addressLinesText && (
              <p className={errorBase}>{errors.addressLinesText.message}</p>
            )}
          </div>
        </section>

        {/* Colors section */}
        <section className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] p-5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-secondary))] pb-2 border-b border-[rgb(var(--border-primary))]">
            {t('sections.colors')}
          </h3>
          <p className="text-xs text-[rgb(var(--text-tertiary))]">
            {t('form.colorsHelper')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <BrandingColorPicker name="primaryColor" label={t('fields.primaryColor')} />
            <BrandingColorPicker name="accentColor" label={t('fields.accentColor')} />
          </div>
          {/* Surface the cross-field refinement error on accentColor's row. */}
        </section>

        {/* Assets section — Sprint M3 phase 2.
            Each FileField runs its own usePresignedAssetUpload mutation,
            so uploads are per-slot isolated. Upload happens eagerly on
            file pick; the resulting S3 key is staged in form state and
            included in the PATCH on Save. The current asset URL (from
            BrandingResponse.urls) is shown as a thumbnail so the
            operator can see what's currently set. */}
        <section className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] p-5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-secondary))] pb-2 border-b border-[rgb(var(--border-primary))]">
            {t('sections.assets')}
          </h3>
          <p className="text-xs text-[rgb(var(--text-tertiary))]">
            {t('form.assetsHelper')}
          </p>
          {/* Sprint C.1.10 (Path E, 2026-05-27 PM) — letterhead upload slot
              removed from V1. Operator-uploaded letterhead PNGs produced
              unprofessional rendering regardless of `objectFit` strategy
              because typical operator-designed letterheads (non-A4-portrait
              aspect ratio, internal header band + center watermark)
              compete with the EdForge-rendered content. The renderer
              cannot fix bad source images; this needs a preview-before-
              save UX which ships in V1.5 with the C.2 Template Editor.
              Logo + signature stay (raster, no layout collision). The
              BrandingFileField component, the `letterhead` entry in
              `BRANDING_ASSET_TYPES`, and `letterheadBackgroundS3Key` on
              the form state all remain — only the slot is gone. Saved
              S3 keys on existing tenants persist in DDB but the server
              no longer forwards them to the renderer (see C.1.10 in
              v1-master-epic-breakdown.md). */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BrandingFileField
              name="logoS3Key"
              assetType="logo"
              schoolId={schoolId}
              label={t('fields.logo')}
              currentUrl={data.urls?.logo}
              disabled={mutation.isPending}
            />
            <BrandingFileField
              name="principalSignatureS3Key"
              assetType="signature"
              schoolId={schoolId}
              label={t('fields.principalSignature')}
              currentUrl={data.urls?.principalSignature}
              disabled={mutation.isPending}
            />
          </div>
        </section>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={guardedClose}
            disabled={mutation.isPending}
            className="px-4 py-2 text-sm rounded-lg border border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-secondary))] transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            {t('form.cancel')}
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || !isDirty}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
          >
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {mutation.isPending ? t('form.saving') : t('form.save')}
          </button>
        </div>
      </form>
    </FormProvider>
  )
}
