import { useMemo } from 'react'
import { useTenantContext } from '@edforge/forms'
import { resolveIdentifier, type ResolvedIdentifier } from '../resolveIdentifier'
import type { EntityKind } from '../types'

/**
 * React hook — resolve an entity's display identifier under the current tenant's
 * governance body. Reads `archetype` + `country` from the cross-MFE tenant
 * context (`useTenantContext`) and runs the pure resolver. Memoized on the
 * resolution inputs so it doesn't re-resolve on unrelated re-renders.
 */
export function useArchetypeIdentifier(
  entity: EntityKind,
  data: object | null | undefined,
): ResolvedIdentifier {
  const { archetype, country } = useTenantContext()
  return useMemo(
    () => resolveIdentifier(entity, data, { archetype, country }),
    [entity, data, archetype, country],
  )
}
