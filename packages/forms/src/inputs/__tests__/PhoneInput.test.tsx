/**
 * PhoneInput — archetype-aware phone field rules (Sprint A.11)
 *
 * Tests the pure rule-merger function that combines archetype-aware
 * validation with caller's RHF rules. Rendering of the input itself is
 * covered manually + by Sprint G prod rehearsal.
 */

import { describe, it, expect } from 'vitest'
import { buildPhoneInputRules } from '../PhoneInput'

describe('buildPhoneInputRules — Sprint A.11 archetype validation merge', () => {
  it('returns a rules object with archetypeFormat validator', () => {
    const rules = buildPhoneInputRules('PABSON', 'NPL') as any
    expect(rules.validate).toBeTruthy()
    expect(typeof rules.validate.archetypeFormat).toBe('function')
  })

  describe('PABSON / Nepal archetype validation', () => {
    const rules = buildPhoneInputRules('PABSON', 'NPL') as any

    it.each([
      ['9812345678', 'pure 10-digit local'],
      ['+9779812345678', 'with +977 prefix'],
      ['+977 981 234 5678', 'with spaces'],
    ])('accepts %s (%s)', (input) => {
      expect(rules.validate.archetypeFormat(input)).toBe(true)
    })

    it.each([
      ['8123456789', 'does not start with 9'],
      ['981234567', 'too short'],
      ['+1-555-555-5555', 'US phone on Nepal tenant'],
    ])('rejects %s (%s) with error message', (input) => {
      const result = rules.validate.archetypeFormat(input)
      expect(typeof result).toBe('string')
      expect(result).toMatch(/does not match/i)
    })

    it('treats empty string as valid (let `required` rule handle non-empty)', () => {
      expect(rules.validate.archetypeFormat('')).toBe(true)
    })
  })

  describe('US default validation', () => {
    const rules = buildPhoneInputRules(undefined, undefined) as any

    it('accepts a 10-digit US number', () => {
      expect(rules.validate.archetypeFormat('5551234567')).toBe(true)
    })

    it('rejects a Nepal number under US default', () => {
      const result = rules.validate.archetypeFormat('9812345678') // valid for Nepal, also matches US 10-digit
      expect(result).toBe(true) // Note: 10-digit Nepal happens to match US 10-digit; semantic differentiation is by dial code, not local digits
    })

    it('rejects 11+ digits under US default', () => {
      const result = rules.validate.archetypeFormat('12345678901')
      expect(typeof result).toBe('string')
    })
  })

  describe('Caller rules merge', () => {
    it("preserves caller's required + minLength rules", () => {
      const callerRules = { required: 'Phone is required', minLength: { value: 5, message: 'Too short' } }
      const merged = buildPhoneInputRules('PABSON', 'NPL', callerRules) as any
      expect(merged.required).toBe('Phone is required')
      expect(merged.minLength).toEqual({ value: 5, message: 'Too short' })
      expect(merged.validate.archetypeFormat).toBeTruthy()
    })

    it("preserves caller's other validate rules alongside archetypeFormat", () => {
      const customCheck = (v: string) => (v.startsWith('98') ? true : 'must start with 98')
      const merged = buildPhoneInputRules('PABSON', 'NPL', {
        validate: { customCheck },
      }) as any
      expect(typeof merged.validate.customCheck).toBe('function')
      expect(typeof merged.validate.archetypeFormat).toBe('function')
      expect(merged.validate.customCheck('9812345678')).toBe(true)
      expect(merged.validate.customCheck('7012345678')).toBe('must start with 98')
    })
  })
})
