/**
 * Student location formatting — the single source of truth for turning a
 * student/guardian `Address` into a compact, Nepal-aware locality label.
 *
 * Prefers the Nepal extension fields (municipality / district / province,
 * Sprint A.1) and falls back to the legacy city/state pair. Returns a two-line
 * shape for table cells; `null` when no locality is on file.
 *
 * Typed against the canonical `Address` (`@aibrains/shared-types`) — note the
 * field is `zipCode`, not `postalCode`.
 */

import type { Address } from '@aibrains/shared-types'

export interface StudentLocality {
  /** Primary line — settlement (municipality ?? city). */
  primary: string
  /** Secondary line — region (district ?? state), may be empty. */
  secondary: string
}

/**
 * Nepal-shape if the country is NPL/Nepal OR any Nepal extension field is set.
 * Country-keyed *data* check (not an archetype branch) — IEMIS imports can
 * populate Nepal-shape addresses even on GENERIC-archetype tenants.
 */
export function isNepalAddress(address?: Address | null): boolean {
  if (!address) return false
  return (
    address.country === 'NPL' ||
    address.country === 'Nepal' ||
    Boolean(address.wardNumber || address.municipality || address.district || address.province)
  )
}

/**
 * Compact two-line locality for the roster table. `null` when nothing useful
 * is on file (so the cell can render a muted em-dash).
 */
export function formatStudentLocation(address?: Address | null): StudentLocality | null {
  if (!address) return null

  const primary = (address.municipality || address.city || '').trim()
  const secondary = (address.district || address.state || '').trim()

  if (!primary && !secondary) return null
  // Anchor on whichever line we have so the cell never shows a lone region.
  return { primary: primary || secondary, secondary: primary ? secondary : '' }
}
