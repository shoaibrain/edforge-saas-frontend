import { describe, expect, it } from 'vitest'
import {
  ARCHETYPE_REGISTRY,
  REGISTERED_ARCHETYPES,
  FEATURE_FIELDS,
  ALLOWED_VALUE_CONTROLS,
  getArchetypeFeatureMatrix,
  fieldRequirement,
  allowedValuesFor,
} from '../registry'

const REQUIREMENTS = ['required', 'optional', 'hidden']

describe('getArchetypeFeatureMatrix — resolution (mirrors getArchetypeProfile)', () => {
  it('PABSON locks the IEMIS code required + Nepal-only option sets', () => {
    const m = getArchetypeFeatureMatrix('PABSON')
    expect(m.fields.emisSchoolCode).toBe('required')
    expect(m.allowedValues.currency).toEqual(['NPR'])
    expect(m.allowedValues.timezone).toEqual(['Asia/Kathmandu'])
    expect(m.allowedValues.calendarSystem).toEqual(['bikram_sambat'])
  })

  it('GENERIC is fully open — nothing required, every control unconstrained', () => {
    const m = getArchetypeFeatureMatrix('GENERIC')
    expect(m.fields.emisSchoolCode).toBe('optional')
    expect(m.allowedValues.currency).toBeNull()
    expect(m.allowedValues.timezone).toBeNull()
    expect(m.allowedValues.calendarSystem).toBeNull()
  })

  it('archetype wins over country (GENERIC + NPL → open, not PABSON-locked)', () => {
    expect(getArchetypeFeatureMatrix('GENERIC', 'NPL').allowedValues.currency).toBeNull()
  })

  it('falls back to PABSON for an unknown/absent archetype in Nepal', () => {
    expect(getArchetypeFeatureMatrix(null, 'NPL').allowedValues.currency).toEqual(['NPR'])
    expect(getArchetypeFeatureMatrix('XYZ', 'NPL').fields.emisSchoolCode).toBe('required')
  })

  it('degrades any unregistered archetype to GENERIC (never throws)', () => {
    expect(getArchetypeFeatureMatrix('CBSE_IN').allowedValues.currency).toBeNull()
    expect(getArchetypeFeatureMatrix(undefined, undefined).fields.emisSchoolCode).toBe('optional')
  })

  it('does not treat inherited prototype keys as archetypes (tenant-data safety)', () => {
    expect(getArchetypeFeatureMatrix('__proto__').allowedValues.currency).toBeNull()
    expect(getArchetypeFeatureMatrix('constructor').fields.emisSchoolCode).toBe('optional')
  })
})

describe('feature-matrix accessors', () => {
  it('fieldRequirement reads one field for a tenant', () => {
    expect(fieldRequirement('emisSchoolCode', 'PABSON')).toBe('required')
    expect(fieldRequirement('emisSchoolCode', 'GENERIC')).toBe('optional')
  })

  it('allowedValuesFor returns the locked set (PABSON) or null (GENERIC open)', () => {
    expect(allowedValuesFor('currency', 'PABSON')).toEqual(['NPR'])
    expect(allowedValuesFor('timezone', 'PABSON')).toEqual(['Asia/Kathmandu'])
    expect(allowedValuesFor('currency', 'GENERIC')).toBeNull()
  })

  it('the null-or-includes filter contract a dropdown will use', () => {
    // PABSON: NPR allowed, USD not. GENERIC: everything allowed.
    const allowFor = (opt: string, archetype: string) => {
      const allowed = allowedValuesFor('currency', archetype)
      return allowed === null || allowed.includes(opt)
    }
    expect(allowFor('NPR', 'PABSON')).toBe(true)
    expect(allowFor('USD', 'PABSON')).toBe(false)
    expect(allowFor('USD', 'GENERIC')).toBe(true)
  })
})

describe('conformance — every registered archetype has a complete feature matrix', () => {
  it.each(REGISTERED_ARCHETYPES)('%s declares every FeatureField with a valid requirement', (archetype) => {
    const { fields } = ARCHETYPE_REGISTRY[archetype].features
    for (const field of FEATURE_FIELDS) {
      expect(fields[field], `${archetype}.fields.${field} missing`).toBeDefined()
      expect(REQUIREMENTS, `${archetype}.fields.${field} invalid`).toContain(fields[field])
    }
  })

  it.each(REGISTERED_ARCHETYPES)('%s declares every AllowedValueControl (null or non-empty)', (archetype) => {
    const { allowedValues } = ARCHETYPE_REGISTRY[archetype].features
    for (const control of ALLOWED_VALUE_CONTROLS) {
      expect(control in allowedValues, `${archetype}.allowedValues.${control} missing`).toBe(true)
      const set = allowedValues[control]
      // `null` = unconstrained (valid); an array must never be empty (an empty
      // allow-list would hide every option — always a mistake, not a lockdown).
      if (set !== null) {
        expect(Array.isArray(set), `${archetype}.allowedValues.${control} not array/null`).toBe(true)
        expect(set.length, `${archetype}.allowedValues.${control} empty`).toBeGreaterThan(0)
      }
    }
  })

  it.each(REGISTERED_ARCHETYPES)('%s allowedValues.calendarSystem agrees with the scalar calendarSystem', (archetype) => {
    const profile = ARCHETYPE_REGISTRY[archetype]
    const set = profile.features.allowedValues.calendarSystem
    // When the calendar is locked down, the single scalar the profile renders
    // dates with must be one of the allowed values (no contradictory profile).
    if (set !== null) {
      expect(set, `${archetype} calendar scalar not in allowed set`).toContain(profile.calendarSystem)
    }
  })
})
