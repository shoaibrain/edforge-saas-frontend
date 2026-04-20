import { Building2 } from 'lucide-react'
import type { TenantArchetype } from '@edforge/types'

export interface TenantBadgeProps {
  /** Display name of the tenant (e.g. "saraswatiboardingschool"). */
  tenantName?: string | null
  /** Archetype from tenant response. Undefined on legacy tenants. */
  archetype?: TenantArchetype | null
  /** ISO-3166 alpha-3 country code (e.g. NPL, USA). Undefined on legacy tenants. */
  country?: string | null
  /** Optional extra classes. */
  className?: string
}

/**
 * Friendly archetype label for tooltips/aria; falls back to the raw code.
 * V1 only displays PABSON + GENERIC; others are reserved.
 */
const ARCHETYPE_LABELS: Record<TenantArchetype, string> = {
  PABSON: 'PABSON (Private & Boarding Schools — Nepal)',
  GENERIC: 'Generic',
  CBSE_IN: 'CBSE India',
  NAIS_US: 'NAIS United States',
  GEMS_UAE: 'GEMS UAE',
}

/**
 * TenantBadge — compact pill showing "<tenantName> · <archetype> · <country>" in the shell topbar.
 *
 * Degrades gracefully when archetype or country is missing (legacy tenants) — renders
 * the segments that do exist, without trailing separators.
 *
 * Accessibility: the whole badge carries an aria-label that spells out tenant/archetype/country
 * in full so a screen-reader user gets the same context as a sighted user.
 */
export function TenantBadge({
  tenantName,
  archetype,
  country,
  className,
}: TenantBadgeProps) {
  if (!tenantName && !archetype && !country) return null

  const segments = [tenantName, archetype, country].filter(
    (s): s is string => typeof s === 'string' && s.length > 0,
  )

  const archetypeLabel = archetype ? ARCHETYPE_LABELS[archetype] ?? archetype : undefined
  const ariaParts: string[] = []
  if (tenantName) ariaParts.push(`Tenant ${tenantName}`)
  if (archetypeLabel) ariaParts.push(`archetype ${archetypeLabel}`)
  if (country) ariaParts.push(`country ${country}`)

  return (
    <span
      data-testid="tenant-badge"
      aria-label={ariaParts.join(', ')}
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
        'border text-[11px] font-semibold tracking-wide',
        'border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-tertiary))]',
        'text-[rgb(var(--text-secondary))]',
        className ?? '',
      ].join(' ')}
    >
      <Building2 aria-hidden width={12} height={12} className="opacity-70" />
      {segments.map((seg, i) => (
        <span key={`${seg}-${i}`} className="inline-flex items-center">
          {i > 0 && (
            <span aria-hidden className="mx-1 opacity-40">
              ·
            </span>
          )}
          <span>{seg}</span>
        </span>
      ))}
    </span>
  )
}
