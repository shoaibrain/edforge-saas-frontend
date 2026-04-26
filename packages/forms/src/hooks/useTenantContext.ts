/**
 * useTenantContext — read tenant archetype + country in MFE forms (Sprint A.13)
 *
 * Reads from the @edforge/config school-context-channel — the single
 * decoupling boundary between apps/shell (which owns tenant state) and the
 * MFE apps (which need to render archetype-aware UI without coupling to
 * apps/shell's React context).
 *
 * Initial value comes from `getSchoolContext()` (synchronous; populated by
 * Shell at bootstrap). Subsequent updates come via `onSchoolChange()`
 * subscriber — fires whenever Shell re-broadcasts (e.g., on school switch).
 *
 * Returns nullable archetype + country so callers can express "unknown
 * tenant context" gracefully (defaults to legacy/US-shaped form per the
 * resolveAddressVariant / phoneFormatForArchetype rules).
 */

import { useEffect, useState } from 'react'
import {
  getSchoolContext,
  onSchoolChange,
  type SchoolContextPayload,
} from '@edforge/config/school-context-channel'

export interface TenantContext {
  archetype: string | null
  country: string | null
}

export function useTenantContext(): TenantContext {
  const initial = getSchoolContext()
  const [ctx, setCtx] = useState<TenantContext>({
    archetype: initial.archetype ?? null,
    country: initial.country ?? null,
  })

  useEffect(() => {
    const unsub = onSchoolChange((payload: SchoolContextPayload) => {
      setCtx({
        archetype: payload.archetype ?? null,
        country: payload.country ?? null,
      })
    })
    return unsub
  }, [])

  return ctx
}

/**
 * Pure helper — true when archetype/country resolve to the Nepal-shaped
 * form variant. Mirrors `resolveAddressVariant === 'nepal'` for callers
 * that need the boolean directly (e.g., inline branching in Wizard steps
 * that don't use the AddressFields component because they manage state
 * outside react-hook-form).
 */
export function isNepalShape(
  archetype: string | undefined | null,
  country: string | undefined | null,
): boolean {
  return archetype === 'PABSON' || country === 'NPL'
}
