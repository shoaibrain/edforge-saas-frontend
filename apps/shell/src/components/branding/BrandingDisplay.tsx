/**
 * BrandingDisplay — read-only branding summary card (Sprint M2.4).
 *
 * Renders the school's branding configuration as a tabular summary:
 * logo + signature thumbnails, color palette swatches, formal name,
 * address lines, contact info, PAN/VAT, tagline. Empty-state when
 * the school hasn't configured branding yet.
 *
 * **Read-only by design.** Sprint M3 (Branding write) will replace
 * this with an editable form. Keeping read + write as separate
 * components mirrors the GradingPolicy / SchoolConfiguration pattern
 * (read-first, write-later) and lets M2 ship without a forms-runtime
 * dependency.
 *
 * **Asset URLs:** The `urls.logo` / `urls.principalSignature` come
 * from `BrandingResponse.urls` — backend-minted signed S3 GETs with
 * a 10-min TTL. React Query's 60s staleTime keeps these refreshed
 * well within the TTL during continuous use.
 *
 * **i18n:** Uses the `branding` namespace (new in this PR — see
 * `packages/i18n/src/locales/{en,ne}/branding.json`).
 */

import { useTranslation } from '@edforge/i18n'
import { Image as ImageIcon, Palette, FileText, AlertCircle } from 'lucide-react'
import type { BrandingResponse } from '@edforge/identity-services'

interface BrandingDisplayProps {
  data: BrandingResponse
}

export function BrandingDisplay({ data }: BrandingDisplayProps) {
  const { t } = useTranslation('branding')
  const branding = data.branding
  const urls = data.urls

  if (!branding) {
    return (
      <div className="rounded-2xl border border-dashed border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] p-8 text-center">
        <AlertCircle className="w-8 h-8 mx-auto mb-3 text-[rgb(var(--text-tertiary))]" />
        <h3 className="text-sm font-medium text-[rgb(var(--text-primary))]">
          {t('empty.title')}
        </h3>
        <p className="mt-1 text-xs text-[rgb(var(--text-secondary))] max-w-sm mx-auto">
          {t('empty.description')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Identity section — name, tagline, tax IDs */}
      <Section icon={FileText} title={t('sections.identity')}>
        <Field label={t('fields.formalName')} value={branding.formalName} />
        <Field label={t('fields.tagline')} value={branding.tagline} />
        <Field label={t('fields.panNumber')} value={branding.panNumber} mono />
        <Field label={t('fields.vatNumber')} value={branding.vatNumber} mono />
      </Section>

      {/* Contact + address section */}
      <Section icon={FileText} title={t('sections.contact')}>
        <Field label={t('fields.phone')} value={branding.phone} />
        <Field label={t('fields.email')} value={branding.email} />
        {branding.addressLines && branding.addressLines.length > 0 && (
          <div className="flex justify-between items-start gap-4 py-1.5">
            <span className="text-xs text-[rgb(var(--text-tertiary))] shrink-0">
              {t('fields.addressLines')}
            </span>
            <div className="text-sm text-[rgb(var(--text-primary))] text-right">
              {branding.addressLines.map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Color palette */}
      <Section icon={Palette} title={t('sections.colors')}>
        {branding.colorPalette ? (
          <div className="flex items-center gap-6">
            <ColorSwatch
              label={t('fields.primaryColor')}
              hex={branding.colorPalette.primary}
            />
            <ColorSwatch
              label={t('fields.accentColor')}
              hex={branding.colorPalette.accent}
            />
          </div>
        ) : (
          <p className="text-xs text-[rgb(var(--text-tertiary))]">
            {t('emptyField.colorPalette')}
          </p>
        )}
      </Section>

      {/* Assets — logo + signature. (Sprint C.1.10 Path E 2026-05-27 PM)
          The letterhead preview row was removed alongside the upload slot
          in BrandingForm: operator-uploaded letterheads are not used by
          the V1 PDF renderer, so showing them in the read-only display
          would mislead the operator into thinking they're in effect.
          Letterhead returns in V1.5 with the C.2 Template Editor. */}
      <Section icon={ImageIcon} title={t('sections.assets')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AssetPreview
            label={t('fields.logo')}
            url={urls?.logo}
            emptyText={t('emptyField.logo')}
          />
          <AssetPreview
            label={t('fields.principalSignature')}
            url={urls?.principalSignature}
            emptyText={t('emptyField.principalSignature')}
          />
        </div>
      </Section>

      {/* Version footer — opaque UUID for ops debugging only */}
      {branding.brandingVersionId && (
        <p className="text-xs text-[rgb(var(--text-tertiary))] font-mono text-center pt-2">
          {t('versionLabel')}: {branding.brandingVersionId}
        </p>
      )}
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface SectionProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}

function Section({ icon: Icon, title, children }: SectionProps) {
  return (
    <section className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] p-5">
      <header className="flex items-center gap-2 mb-3 pb-2 border-b border-[rgb(var(--border-primary))]">
        <Icon className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-secondary))]">
          {title}
        </h3>
      </header>
      <div className="space-y-1">{children}</div>
    </section>
  )
}

interface FieldProps {
  label: string
  value: string | undefined
  mono?: boolean
}

function Field({ label, value, mono }: FieldProps) {
  if (!value) {
    return (
      <div className="flex justify-between items-baseline gap-4 py-1.5">
        <span className="text-xs text-[rgb(var(--text-tertiary))] shrink-0">
          {label}
        </span>
        <span className="text-xs text-[rgb(var(--text-tertiary))] italic">
          —
        </span>
      </div>
    )
  }
  return (
    <div className="flex justify-between items-baseline gap-4 py-1.5">
      <span className="text-xs text-[rgb(var(--text-tertiary))] shrink-0">
        {label}
      </span>
      <span
        className={`text-sm text-[rgb(var(--text-primary))] text-right break-all ${
          mono ? 'font-mono text-xs' : ''
        }`}
      >
        {value}
      </span>
    </div>
  )
}

interface ColorSwatchProps {
  label: string
  hex: string
}

function ColorSwatch({ label, hex }: ColorSwatchProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        // allow-presentation-style: swatch fill is the tenant's configured brand hex
        className="w-10 h-10 rounded-lg border border-[rgb(var(--border-primary))] shadow-sm shrink-0"
        style={{ backgroundColor: hex }}
        role="img"
        aria-label={`${label} ${hex}`}
      />
      <div>
        <div className="text-xs text-[rgb(var(--text-tertiary))]">{label}</div>
        <div className="text-sm font-mono text-[rgb(var(--text-primary))]">{hex}</div>
      </div>
    </div>
  )
}

interface AssetPreviewProps {
  label: string
  url: string | undefined
  emptyText: string
  /**
   * When true, the asset MAY be a PDF (letterhead background). Renders
   * a "PDF" badge instead of an <img> tag for those URLs to avoid the
   * browser trying to render a PDF as an image (which would surface as
   * a broken-image icon).
   */
  isPdfPossible?: boolean
}

function AssetPreview({ label, url, emptyText, isPdfPossible }: AssetPreviewProps) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs text-[rgb(var(--text-tertiary))]">{label}</div>
      {url ? (
        isPdfPossible && isLikelyPdf(url) ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block aspect-video rounded-md border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] hover:bg-[rgb(var(--bg-tertiary))] transition-colors flex items-center justify-center text-xs text-[rgb(var(--text-secondary))] font-medium"
          >
            PDF
          </a>
        ) : (
          <img
            src={url}
            alt={label}
            className="block w-full aspect-video object-contain rounded-md border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))]"
          />
        )
      ) : (
        <div className="aspect-video rounded-md border border-dashed border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] flex items-center justify-center text-xs text-[rgb(var(--text-tertiary))] italic px-2 text-center">
          {emptyText}
        </div>
      )}
    </div>
  )
}

/**
 * Best-effort PDF detection from a signed URL. The signed URL path
 * may carry the `.pdf` extension OR a `Content-Type` hint in the
 * query string (S3 doesn't include the mime in the URL by default).
 * False negatives are fine — they just render as <img>, which fails
 * gracefully to the alt text.
 */
function isLikelyPdf(url: string): boolean {
  try {
    const u = new URL(url)
    return /\.pdf(\?|$)/i.test(u.pathname) || /pdf/i.test(u.search)
  } catch {
    return false
  }
}
