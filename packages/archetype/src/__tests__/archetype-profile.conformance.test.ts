/**
 * GF0.8 — archetype profile conformance + i18n-coverage gate.
 *
 * The single regression fence for the governance-body registry. It fails CI if
 * a registered archetype is incompletely wired OR references an identifier label
 * that isn't translated in every supported locale. This is the FE counterpart of
 * the backend `governance-profile.conformance.spec.ts` (GB0) — the safety net
 * that keeps adding a governance body a data-only change.
 *
 * Two assertions, deliberately distinct from the value-level loops in
 * `registry.test.ts` / `feature-matrix.test.ts`:
 *   1. Profile envelope — every active archetype defines every top-level slot
 *      with a valid scalar + the canonical key sets (not the per-field detail).
 *   2. i18n coverage — every `identifiers[].labelKey` the registry references
 *      resolves to a non-empty string in BOTH `en` and `ne`. This is the tie
 *      from the registry to the i18n files; a new archetype that adds a label
 *      but forgets its `ne` translation fails here, not in production.
 *
 * The locale tables are imported directly (the same idiom as the i18n package's
 * own `locale-parity.test.ts`), resolved via the `@edforge/i18n` vitest alias.
 */

import { describe, expect, it } from 'vitest'
import enIdentifiers from '@edforge/i18n/locales/en/identifiers.json'
import neIdentifiers from '@edforge/i18n/locales/ne/identifiers.json'
import {
  ARCHETYPE_REGISTRY,
  REGISTERED_ARCHETYPES,
  ENTITY_KINDS,
  FEATURE_FIELDS,
  ALLOWED_VALUE_CONTROLS,
} from '../registry'

// Mirror the `AddressVariant` / `CalendarSystem` unions in types.ts. There is no
// runtime const for these (they're type-only), so they are listed here the same
// way `feature-matrix.test.ts` lists the `FieldRequirement` values. Growing the
// union means growing this list — intended: a new variant must be conformed.
const ADDRESS_VARIANTS = ['nepal', 'legacy']
const CALENDAR_SYSTEMS = ['bikram_sambat', 'gregorian']

// Identifier labels live in the `identifiers` i18n namespace. The coverage check
// strips this prefix to look the leaf up in each locale's identifiers.json.
const IDENTIFIERS_NS = 'identifiers'

// Every supported locale's identifiers table, keyed by language. When a third
// language is added to @edforge/i18n, add its import here — the coverage loop
// then enforces the registry's labels are translated there too.
const LOCALE_IDENTIFIERS: Record<string, Record<string, unknown>> = {
  en: enIdentifiers,
  ne: neIdentifiers,
}

/** Distinct identifier labelKeys the registry actually references. */
function referencedLabelKeys(): string[] {
  const keys = new Set<string>()
  for (const archetype of REGISTERED_ARCHETYPES) {
    for (const entity of ENTITY_KINDS) {
      keys.add(ARCHETYPE_REGISTRY[archetype].identifiers[entity].labelKey)
    }
  }
  return [...keys].sort()
}

/** Resolve a dot-path against a (possibly nested) locale table. */
function resolvePath(table: Record<string, unknown>, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>((node, key) => (node == null ? undefined : (node as Record<string, unknown>)[key]), table)
}

describe('GF0.8 conformance — profile envelope', () => {
  it.each(REGISTERED_ARCHETYPES)('%s defines every top-level slot with valid scalars', (archetype) => {
    const profile = ARCHETYPE_REGISTRY[archetype]

    expect(profile.archetype, `${archetype}.archetype label`).toBe(archetype)
    expect(ADDRESS_VARIANTS, `${archetype}.addressVariant invalid`).toContain(profile.addressVariant)
    expect(CALENDAR_SYSTEMS, `${archetype}.calendarSystem invalid`).toContain(profile.calendarSystem)

    // The compound slots carry exactly the canonical key sets — no missing or
    // stray entity/field/control. (The per-value checks live in the sibling
    // specs; this is the envelope.)
    expect(Object.keys(profile.identifiers).sort(), `${archetype}.identifiers keys`).toEqual(
      [...ENTITY_KINDS].sort(),
    )
    expect(Object.keys(profile.features.fields).sort(), `${archetype}.features.fields keys`).toEqual(
      [...FEATURE_FIELDS].sort(),
    )
    expect(
      Object.keys(profile.features.allowedValues).sort(),
      `${archetype}.features.allowedValues keys`,
    ).toEqual([...ALLOWED_VALUE_CONTROLS].sort())
  })
})

describe('GF0.8 conformance — i18n coverage of identifier labels', () => {
  it('every referenced labelKey is in the identifiers namespace', () => {
    for (const labelKey of referencedLabelKeys()) {
      expect(labelKey.startsWith(`${IDENTIFIERS_NS}.`), `labelKey "${labelKey}" not in ${IDENTIFIERS_NS} ns`).toBe(
        true,
      )
    }
  })

  for (const [lang, table] of Object.entries(LOCALE_IDENTIFIERS)) {
    it.each(referencedLabelKeys())(`${lang}: "%s" resolves to a non-empty string`, (labelKey) => {
      const leaf = labelKey.slice(IDENTIFIERS_NS.length + 1)
      const value = resolvePath(table, leaf)
      expect(value, `${lang}/identifiers.json missing "${leaf}" (referenced by the registry)`).toBeTruthy()
      expect(typeof value, `${lang}/identifiers.json "${leaf}" should be a string`).toBe('string')
    })
  }
})
