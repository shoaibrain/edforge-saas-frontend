import { describe, expect, it } from 'vitest'
import { ARCHETYPE_REGISTRY, ENTITY_KINDS, REGISTERED_ARCHETYPES } from '@edforge/archetype'
import en from '../locales/en/identifiers.json'
import ar from '../locales/ar/identifiers.json'
import hi from '../locales/hi/identifiers.json'
import ne from '../locales/ne/identifiers.json'

/**
 * Coverage fence: every `labelKey` the archetype registry references must
 * resolve in each supported `identifiers` namespace. A future registry edit
 * that introduces a labelKey without a translation fails CI here — so the
 * identifier UI is never half-translated for localized operators.
 */
const PREFIX = 'identifiers.'
const stripNs = (labelKey: string) =>
  labelKey.startsWith(PREFIX) ? labelKey.slice(PREFIX.length) : labelKey

const labelKeys = new Set<string>()
for (const archetype of REGISTERED_ARCHETYPES) {
  for (const entity of ENTITY_KINDS) {
    labelKeys.add(ARCHETYPE_REGISTRY[archetype].identifiers[entity].labelKey)
  }
}

describe('identifiers i18n coverage', () => {
  it.each([...labelKeys])('registry labelKey %s resolves in en + ne + hi + ar', (labelKey) => {
    const key = stripNs(labelKey)
    expect(en, `en/identifiers.json missing "${key}"`).toHaveProperty(key)
    expect(ne, `ne/identifiers.json missing "${key}"`).toHaveProperty(key)
    expect(hi, `hi/identifiers.json missing "${key}"`).toHaveProperty(key)
    expect(ar, `ar/identifiers.json missing "${key}"`).toHaveProperty(key)
  })

  it('localized identifiers namespaces have identical key sets', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(ne).sort())
    expect(Object.keys(en).sort()).toEqual(Object.keys(hi).sort())
    expect(Object.keys(en).sort()).toEqual(Object.keys(ar).sort())
  })

  it('no identifier translation value is empty', () => {
    for (const v of [...Object.values(en), ...Object.values(ne), ...Object.values(hi), ...Object.values(ar)]) {
      expect(typeof v === 'string' && v.trim().length > 0).toBe(true)
    }
  })
})
