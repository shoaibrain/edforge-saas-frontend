import { describe, expect, it } from 'vitest'
import {
  ARCHETYPE_REGISTRY,
  ENTITY_KINDS,
  REGISTERED_ARCHETYPES,
  getArchetypeProfile,
  getIdentifierSpec,
} from '../registry'

describe('getArchetypeProfile — resolution (mirrors resolveAddressVariant)', () => {
  it('resolves PABSON to the Nepal-shaped, Bikram Sambat profile', () => {
    const p = getArchetypeProfile('PABSON')
    expect(p.archetype).toBe('PABSON')
    expect(p.addressVariant).toBe('nepal')
    expect(p.calendarSystem).toBe('bikram_sambat')
  })

  it('resolves GENERIC to the legacy, Gregorian profile', () => {
    const p = getArchetypeProfile('GENERIC')
    expect(p.archetype).toBe('GENERIC')
    expect(p.addressVariant).toBe('legacy')
    expect(p.calendarSystem).toBe('gregorian')
  })

  it('archetype wins over country (GENERIC + NPL → GENERIC, not PABSON)', () => {
    expect(getArchetypeProfile('GENERIC', 'NPL').archetype).toBe('GENERIC')
  })

  it('falls back to PABSON for an unknown/absent archetype in Nepal (country tiebreak)', () => {
    expect(getArchetypeProfile(null, 'NPL').archetype).toBe('PABSON')
    expect(getArchetypeProfile('XYZ', 'NPL').archetype).toBe('PABSON')
  })

  it('degrades any unregistered archetype to GENERIC (never throws)', () => {
    expect(getArchetypeProfile('CBSE_IN').archetype).toBe('GENERIC')
    expect(getArchetypeProfile(undefined, undefined).archetype).toBe('GENERIC')
    expect(getArchetypeProfile(null, 'USA').archetype).toBe('GENERIC')
  })

  it('does not treat inherited prototype keys as archetypes (tenant-data safety)', () => {
    expect(getArchetypeProfile('toString').archetype).toBe('GENERIC')
    expect(getArchetypeProfile('__proto__').archetype).toBe('GENERIC')
    expect(getArchetypeProfile('constructor').archetype).toBe('GENERIC')
    expect(getArchetypeProfile('hasOwnProperty', 'NPL').archetype).toBe('PABSON')
  })
})

describe('identifier specs — governance-specific overrides', () => {
  it('PABSON student → government EMIS id primary, studentNumber secondary, PII-sensitive', () => {
    const spec = getIdentifierSpec('student', 'PABSON')
    expect(spec.primaryField).toBe('emisStudentId')
    expect(spec.secondaryField).toBe('studentNumber')
    expect(spec.fallbackField).toBe('studentNumber')
    expect(spec.format).toBe('iemis')
    expect(spec.sensitive).toBe(true)
  })

  it('GENERIC student → studentNumber primary, id fallback, not sensitive', () => {
    const spec = getIdentifierSpec('student', 'GENERIC')
    expect(spec.primaryField).toBe('studentNumber')
    expect(spec.fallbackField).toBe('id')
    expect(spec.sensitive).toBeUndefined()
  })

  it('PABSON inherits GENERIC for non-overridden entities (e.g. payment)', () => {
    expect(getIdentifierSpec('payment', 'PABSON')).toEqual(
      getIdentifierSpec('payment', 'GENERIC'),
    )
  })

  it('UUID-shaped entities are uuid-short + copyable (never rendered raw)', () => {
    const tx = getIdentifierSpec('transaction', 'GENERIC')
    expect(tx.format).toBe('uuid-short')
    expect(tx.copyable).toBe(true)
  })
})

describe('conformance — every registered archetype is fully wired', () => {
  it.each(REGISTERED_ARCHETYPES)(
    '%s has an identifier spec for every EntityKind',
    (archetype) => {
      const profile = ARCHETYPE_REGISTRY[archetype]
      for (const entity of ENTITY_KINDS) {
        const spec = profile.identifiers[entity]
        expect(spec, `${archetype}.${entity} missing`).toBeDefined()
        expect(spec.primaryField, `${archetype}.${entity}.primaryField`).toBeTruthy()
        expect(spec.labelKey, `${archetype}.${entity}.labelKey`).toMatch(/^identifiers\./)
        expect(['iemis', 'uuid-short', 'plain', 'mono']).toContain(spec.format)
      }
    },
  )

  it('every labelKey lives in the identifiers namespace (GF1 i18n-coverage anchor)', () => {
    for (const archetype of REGISTERED_ARCHETYPES) {
      for (const entity of ENTITY_KINDS) {
        expect(ARCHETYPE_REGISTRY[archetype].identifiers[entity].labelKey).toMatch(
          /^identifiers\.[a-zA-Z]+$/,
        )
      }
    }
  })
})
