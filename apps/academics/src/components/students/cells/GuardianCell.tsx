/**
 * GuardianCell — stacked guardian avatars + primary summary + popover.
 *
 * Students can have multiple guardians; this renders a horizontal stack
 * (primary painted on top, brand ring), a "+N" overflow chip, the primary's
 * name · relationship, and Portal / Pickup affordances. A keyboard-accessible
 * popover lists every guardian.
 *
 * Privacy: renders summary fields only (name, relationship, portal/pickup).
 * Guardian phone/email/address live on the full profile. NOTE this is a
 * rendering boundary, not a data boundary — true PII minimization is the
 * server-side slim list DTO (see D-1 in the sprint plan).
 */

import { useState } from 'react'
import type { GuardianDto } from '@aibrains/shared-types'
import { UserAvatar } from '../../common/UserAvatar'
import { useAcademicsI18n } from '../../../lib/i18n'

const MAX_VISIBLE = 3

function relationshipLabel(rel: string, t: (key: string, options?: Record<string, unknown>) => string): string {
  const fallback = rel.charAt(0).toUpperCase() + rel.slice(1)
  const key = `studentProfile.guardian.relationships.${rel}`
  const translated = t(key)
  return translated === key ? fallback : translated
}

/** Collision-resistant avatar seed — guardianId is optional and names repeat. */
function guardianSeed(g: GuardianDto): string {
  return g.guardianId ?? `${g.firstName}|${g.lastName}|${g.relationship}`
}

function sortPrimaryFirst(guardians: GuardianDto[]): GuardianDto[] {
  return [...guardians].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
}

function GuardianBadges({ guardian }: { guardian: GuardianDto }) {
  const { t } = useAcademicsI18n()

  return (
    <span className="inline-flex items-center gap-2">
      {guardian.isPrimary && <Badge color="rgb(var(--accent-enrollment))" label={t('studentProfile.guardian.badges.primary')} />}
      {guardian.hasPortalAccess && <Badge color="rgb(var(--accent-academics))" label={t('studentProfile.guardian.badges.portal')} />}
      {guardian.canPickup && <Badge color="rgb(var(--text-tertiary))" label={t('studentProfile.guardian.badges.pickup')} />}
    </span>
  )
}

function Badge({ color, label }: { color: string; label: string }) {
  return (
    <span
      // allow-presentation-style: badge color is a per-badge prop
      className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide"
      style={{ color }}
    >
      <span
        // allow-presentation-style: badge dot matches the color prop
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  )
}

export function GuardianCell({ guardians }: { guardians?: GuardianDto[] }) {
  const { t, formatNumber } = useAcademicsI18n()
  const [open, setOpen] = useState(false)

  if (!guardians || guardians.length === 0) {
    return <span className="text-xs italic text-[rgb(var(--text-tertiary))]">{t('studentProfile.guardian.noGuardian')}</span>
  }

  const sorted = sortPrimaryFirst(guardians)
  const visible = sorted.slice(0, MAX_VISIBLE)
  const extra = sorted.length - visible.length
  const primary = sorted[0]

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t('studentProfile.guardian.cellAria', {
          count: sorted.length,
          value: formatNumber(sorted.length),
          firstName: primary.firstName,
          lastName: primary.lastName,
          relationship: relationshipLabel(primary.relationship, t),
        })}
        className="flex items-center gap-2.5 min-w-0 text-left rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus))]"
      >
        {/* Stacked avatars — primary leftmost and on top (descending z-index) */}
        <div className="flex -space-x-2 flex-shrink-0">
          {visible.map((g, i) => (
            <span
              key={guardianSeed(g)}
              // allow-presentation-style: primary guardian gets a green avatar ring (dynamic boxShadow)
              className="rounded-full"
              style={{
                zIndex: visible.length - i,
                boxShadow: `0 0 0 2px rgb(var(--background-secondary))${g.isPrimary ? ', 0 0 0 3px rgb(var(--accent-enrollment))' : ''}`,
              }}
            >
              <UserAvatar userId={g.guardianId ?? ''} userName={`${g.firstName} ${g.lastName}`} role="staff" size="sm" seed={guardianSeed(g)} />
            </span>
          ))}
          {extra > 0 && (
            <span
              className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold flex-shrink-0 bg-[rgb(var(--state-info-fg)/0.14)] text-[rgb(var(--text-secondary))] shadow-[0_0_0_2px_rgb(var(--background-secondary))]"
              style={{ zIndex: 0 }}
            >
              +{extra}
            </span>
          )}
        </div>

        {/* Primary summary */}
        <span className="min-w-0">
          <span className="block text-xs font-medium truncate text-[rgb(var(--text-primary))]">
            {primary.firstName} {primary.lastName}
          </span>
          <span className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-[rgb(var(--text-tertiary))]">
              {relationshipLabel(primary.relationship, t)}
            </span>
            {primary.hasPortalAccess && <Badge color="rgb(var(--accent-academics))" label={t('studentProfile.guardian.badges.portal')} />}
          </span>
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-label={t('studentProfile.guardian.guardians')}
            className="absolute left-0 z-20 mt-1 w-64 rounded-lg border overflow-hidden shadow-lg bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary)/0.5)]"
            onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
          >
            <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider border-b text-[rgb(var(--text-tertiary))] border-[rgb(var(--border-primary)/0.3)]">
              {t('studentProfile.guardian.guardianCount', {
                count: sorted.length,
                value: formatNumber(sorted.length),
              })}
            </div>
            <ul>
              {sorted.map((g) => (
                <li key={guardianSeed(g)} className="flex items-center gap-2.5 px-3 py-2 border-b last:border-b-0 border-[rgb(var(--border-secondary)/0.4)]">
                  <UserAvatar userId={g.guardianId ?? ''} userName={`${g.firstName} ${g.lastName}`} role="staff" size="sm" seed={guardianSeed(g)} />
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate text-[rgb(var(--text-primary))]">{g.firstName} {g.lastName}</div>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <span className="text-xs font-medium text-[rgb(var(--text-secondary))]">{relationshipLabel(g.relationship, t)}</span>
                      <GuardianBadges guardian={g} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
