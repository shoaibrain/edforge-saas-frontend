import { allowedValuesFor, type AllowedValueControl } from '@edforge/archetype'

/**
 * GF3.2 — constrain a settings dropdown's options to the governance body's
 * allowed value-set. A GENERIC / unconstrained tenant keeps the full list
 * (`allowedValuesFor` returns `null`); a constrained body (PABSON → NPR /
 * Asia-Kathmandu / Bikram Sambat) is narrowed to its allowed values.
 *
 * The currently-saved value is **always preserved** even when it falls outside
 * the allowed set, so an operator with a legacy value sees their real setting
 * (and can change it) rather than being silently switched — the safe form of
 * P2.2's anti-rigidity escape hatch.
 */
export function constrainOptionsByArchetype<T extends { value: string }>(
  options: readonly T[],
  control: AllowedValueControl,
  ctx: { archetype: string | null; country: string | null; current?: string | null },
): T[] {
  const allowed = allowedValuesFor(control, ctx.archetype, ctx.country)
  if (allowed === null) return [...options]
  return options.filter((o) => allowed.includes(o.value) || o.value === ctx.current)
}
