import { describe, it, expect } from 'vitest'
import {
  fieldPathToStepIndex,
  flattenZodPath,
  STEP_INDEX_BASIC,
  STEP_INDEX_LOCATION,
  STEP_INDEX_ORGANIZATION,
  STEP_INDEX_EDFI,
} from '../school-wizard.utils'

describe('flattenZodPath', () => {
  it('joins an array path with dots', () => {
    expect(flattenZodPath(['address', 'country'])).toBe('address.country')
    expect(flattenZodPath(['gradeRange', 'start'])).toBe('gradeRange.start')
  })

  it('passes a string path through', () => {
    expect(flattenZodPath('emisSchoolCode')).toBe('emisSchoolCode')
  })

  it('returns empty string for unknown shapes', () => {
    expect(flattenZodPath(undefined)).toBe('')
    expect(flattenZodPath(null)).toBe('')
    expect(flattenZodPath({ not: 'a path' })).toBe('')
  })

  it('drops nulls inside an array path', () => {
    expect(flattenZodPath(['a', null, 'b'])).toBe('a.b')
  })

  it('coerces numeric indices to strings', () => {
    expect(flattenZodPath(['institutionTelephones', 0, 'telephoneNumber']))
      .toBe('institutionTelephones.0.telephoneNumber')
  })
})

describe('fieldPathToStepIndex', () => {
  it('routes Basic Info fields to Step 1', () => {
    expect(fieldPathToStepIndex('emisSchoolCode')).toBe(STEP_INDEX_BASIC)
    expect(fieldPathToStepIndex('name')).toBe(STEP_INDEX_BASIC)
    expect(fieldPathToStepIndex('gradeRange.start')).toBe(STEP_INDEX_BASIC)
    expect(fieldPathToStepIndex('schoolType')).toBe(STEP_INDEX_BASIC)
    expect(fieldPathToStepIndex('schoolCode')).toBe(STEP_INDEX_BASIC)
  })

  it('routes Location/Contact fields to Step 2', () => {
    expect(fieldPathToStepIndex('address.country')).toBe(STEP_INDEX_LOCATION)
    expect(fieldPathToStepIndex('address')).toBe(STEP_INDEX_LOCATION)
    expect(fieldPathToStepIndex('phone')).toBe(STEP_INDEX_LOCATION)
    expect(fieldPathToStepIndex('email')).toBe(STEP_INDEX_LOCATION)
    expect(fieldPathToStepIndex('institutionTelephones.0.telephoneNumber')).toBe(STEP_INDEX_LOCATION)
  })

  it('routes Organization fields to Step 3', () => {
    expect(fieldPathToStepIndex('localEducationAgencyId')).toBe(STEP_INDEX_ORGANIZATION)
    expect(fieldPathToStepIndex('administrativeFundingControlDescriptor')).toBe(STEP_INDEX_ORGANIZATION)
    expect(fieldPathToStepIndex('schoolTypeDescriptor')).toBe(STEP_INDEX_ORGANIZATION)
  })

  it('routes Ed-Fi fields to Step 4', () => {
    expect(fieldPathToStepIndex('gradeLevels')).toBe(STEP_INDEX_EDFI)
    expect(fieldPathToStepIndex('schoolCategories')).toBe(STEP_INDEX_EDFI)
  })

  it('defaults unknown fields to Basic Info (safe fallback)', () => {
    expect(fieldPathToStepIndex('unrecognizedField')).toBe(STEP_INDEX_BASIC)
    expect(fieldPathToStepIndex('')).toBe(STEP_INDEX_BASIC)
  })

  it('does not confuse prefix-match fields', () => {
    // `addressBookId` is a hypothetical field — must NOT route to Step 2 just
    // because it starts with "address". The regex is anchored on (dot or end).
    expect(fieldPathToStepIndex('addressBookId')).toBe(STEP_INDEX_BASIC)
  })
})
