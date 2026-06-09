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

const MAX_VISIBLE = 3

function relationshipLabel(rel: string): string {
  return rel.charAt(0).toUpperCase() + rel.slice(1)
}

/** Collision-resistant avatar seed — guardianId is optional and names repeat. */
function guardianSeed(g: GuardianDto): string {
  return g.guardianId ?? `${g.firstName}|${g.lastName}|${g.relationship}`
}

function sortPrimaryFirst(guardians: GuardianDto[]): GuardianDto[] {
  return [...guardians].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
}

function GuardianBadges({ guardian }: { guardian: GuardianDto }) {
  return (
    <span className="inline-flex items-center gap-2">
      {guardian.isPrimary && <Badge color="#1D9E75" label="Primary" />}
      {guardian.hasPortalAccess && <Badge color="#378ADD" label="Portal" />}
      {guardian.canPickup && <Badge color="rgb(var(--text-tertiary))" label="Pickup" />}
    </span>
  )
}

function Badge({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide" style={{ color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}

export function GuardianCell({ guardians }: { guardians?: GuardianDto[] }) {
  const [open, setOpen] = useState(false)

  if (!guardians || guardians.length === 0) {
    return <span className="text-xs italic text-[rgb(var(--text-tertiary))]">No guardian on file</span>
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
        aria-label={`${sorted.length} guardian${sorted.length === 1 ? '' : 's'}; primary ${primary.firstName} ${primary.lastName}, ${relationshipLabel(primary.relationship)}`}
        className="flex items-center gap-2.5 min-w-0 text-left rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus))]"
      >
        {/* Stacked avatars — primary leftmost and on top (descending z-index) */}
        <div className="flex -space-x-2 flex-shrink-0">
          {visible.map((g, i) => (
            <span
              key={guardianSeed(g)}
              className="rounded-full"
              style={{
                zIndex: visible.length - i,
                boxShadow: `0 0 0 2px rgb(var(--background-secondary))${g.isPrimary ? ', 0 0 0 3px #1D9E75' : ''}`,
              }}
            >
              <UserAvatar userId={g.guardianId ?? ''} userName={`${g.firstName} ${g.lastName}`} role="staff" size="sm" seed={guardianSeed(g)} />
            </span>
          ))}
          {extra > 0 && (
            <span
              className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold flex-shrink-0"
              style={{ background: 'rgba(0,95,115,0.14)', color: 'rgb(var(--text-secondary))', boxShadow: '0 0 0 2px rgb(var(--background-secondary))', zIndex: 0 }}
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
              {relationshipLabel(primary.relationship)}
            </span>
            {primary.hasPortalAccess && <Badge color="#378ADD" label="Portal" />}
          </span>
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-label="Guardians"
            className="absolute left-0 z-20 mt-1 w-64 rounded-lg border overflow-hidden shadow-lg"
            style={{ background: 'rgb(var(--background-secondary))', borderColor: 'rgb(var(--border-primary)/0.5)' }}
            onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
          >
            <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider border-b text-[rgb(var(--text-tertiary))]" style={{ borderColor: 'rgb(var(--border-primary)/0.3)' }}>
              {sorted.length} Guardian{sorted.length === 1 ? '' : 's'}
            </div>
            <ul>
              {sorted.map((g) => (
                <li key={guardianSeed(g)} className="flex items-center gap-2.5 px-3 py-2 border-b last:border-b-0" style={{ borderColor: 'rgb(var(--border-secondary)/0.4)' }}>
                  <UserAvatar userId={g.guardianId ?? ''} userName={`${g.firstName} ${g.lastName}`} role="staff" size="sm" seed={guardianSeed(g)} />
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate text-[rgb(var(--text-primary))]">{g.firstName} {g.lastName}</div>
                    <GuardianBadges guardian={g} />
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
