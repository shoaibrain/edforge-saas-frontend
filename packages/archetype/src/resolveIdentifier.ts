/**
 * Pure identifier resolution — GF1a.
 *
 * Frame-free, synchronous core that turns an entity payload + tenant context
 * into a `ResolvedIdentifier` the React layer (GF1c) and the non-React
 * serializer (CSV/PDF) both render from. No React, no i18n resolution here —
 * the spec carries a `labelKey` the caller translates.
 *
 * Resolution is governance-body-driven via the @edforge/archetype registry:
 * `getArchetypeProfile` decides the effective governance body and its per-entity
 * spec, so a new governance body changes behavior with zero edits to this file.
 */

import { getArchetypeProfile } from './registry'
import type { EntityKind, IdentifierFormat } from './types'

export interface IdentifierContext {
  archetype?: string | null
  country?: string | null
}

export interface ResolvedIdentifier {
  /** The field actually rendered (after fallback). */
  field: string
  /** The value to display. Empty string only when nothing resolved. */
  value: string
  /** Optional secondary line (e.g. studentNumber under an EMIS id). */
  secondary?: { field: string; value: string }
  /** True when the primary field was empty and a fallback was used. */
  fallbackUsed: boolean
  /** i18n key (caller translates). */
  labelKey: string
  format: IdentifierFormat
  copyable: boolean
  sensitive: boolean
  /** Effective governance body that resolved (after archetype/country tiebreak). */
  archetype: string
  entity: EntityKind
}

/**
 * Empty = null/undefined or a whitespace-only string. A `'0'` (falsy-numeric)
 * string is NOT empty — it's a legitimate value. Numbers (incl. 0) are not empty.
 */
function isEmpty(v: unknown): boolean {
  if (v === null || v === undefined) return true
  if (typeof v === 'string') return v.trim() === ''
  return false
}

function readField(
  data: Record<string, unknown>,
  field: string | undefined,
): string | undefined {
  if (!field) return undefined
  const v = data[field]
  if (isEmpty(v)) return undefined
  return String(v)
}

/**
 * Resolve the display identifier for `entity` from `data` under `ctx`'s
 * governance body. Never throws; degrades to GENERIC via the registry, and to
 * an empty value if even the fallback (defaulting to `id`) is absent.
 */
export function resolveIdentifier(
  entity: EntityKind,
  data: Record<string, unknown> | null | undefined,
  ctx: IdentifierContext = {},
): ResolvedIdentifier {
  const profile = getArchetypeProfile(ctx.archetype, ctx.country)
  const spec = profile.identifiers[entity]
  const safeData = data ?? {}

  const primary = readField(safeData, spec.primaryField)
  const fallbackField = spec.fallbackField ?? 'id'

  let field = spec.primaryField
  let value = primary
  let fallbackUsed = false
  if (value === undefined) {
    value = readField(safeData, fallbackField)
    field = fallbackField
    fallbackUsed = true
  }

  const secondaryValue = readField(safeData, spec.secondaryField)
  const secondary =
    spec.secondaryField && secondaryValue !== undefined && spec.secondaryField !== field
      ? { field: spec.secondaryField, value: secondaryValue }
      : undefined

  return {
    field,
    value: value ?? '',
    secondary,
    fallbackUsed,
    labelKey: spec.labelKey,
    format: spec.format,
    copyable: spec.copyable ?? false,
    sensitive: spec.sensitive ?? false,
    archetype: profile.archetype,
    entity,
  }
}

/**
 * Non-React, already-flattened variant for CSV/PDF/export — same registry,
 * same resolution, so a serialized column never disagrees with the on-screen
 * value. `translate` turns the `labelKey` into a header; omit it to get the raw
 * key back (caller translates).
 */
export function serializeIdentifier(
  entity: EntityKind,
  data: Record<string, unknown> | null | undefined,
  ctx: IdentifierContext = {},
  translate?: (key: string) => string,
): { label: string; value: string } {
  const resolved = resolveIdentifier(entity, data, ctx)
  return {
    label: translate ? translate(resolved.labelKey) : resolved.labelKey,
    value: resolved.value,
  }
}
