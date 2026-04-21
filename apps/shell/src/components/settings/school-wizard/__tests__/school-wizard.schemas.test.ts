/**
 * Sprint C Gap 3 — schemas factory archetype-awareness.
 *
 * Locks in the Step 1 Zod schema's two branches:
 *   - PABSON  → emisSchoolCode required (client-side "Continue" blocks)
 *   - anything else → emisSchoolCode optional
 *
 * Without this, someone refactoring `makeBasicInfoSchema` could silently
 * flip the requirement and the wizard would either block every tenant
 * (bad UX) or accept PABSON creates that the backend then rejects (worse
 * UX — four wasted steps before the server 400).
 */
import { describe, it, expect } from 'vitest'
import { makeBasicInfoSchema } from '../school-wizard.schemas'

const baseValid = {
  name: 'Test School',
  schoolCode: 'TST',
  schoolType: 'elementary' as const,
  'gradeRange.start': 'K',
  'gradeRange.end': '5',
}

describe('makeBasicInfoSchema(archetype)', () => {
  describe('archetype=PABSON', () => {
    const schema = makeBasicInfoSchema('PABSON')

    it('rejects payload without emisSchoolCode', () => {
      const result = schema.safeParse({ ...baseValid })
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path[0] === 'emisSchoolCode')
        expect(issue).toBeDefined()
        expect(issue!.message).toMatch(/PABSON/i)
      }
    })

    it('rejects empty-string emisSchoolCode', () => {
      const result = schema.safeParse({ ...baseValid, emisSchoolCode: '' })
      expect(result.success).toBe(false)
    })

    it('accepts payload with emisSchoolCode', () => {
      const result = schema.safeParse({ ...baseValid, emisSchoolCode: '31012345' })
      expect(result.success).toBe(true)
    })

    it('rejects emisSchoolCode over 32 chars even for PABSON', () => {
      const result = schema.safeParse({
        ...baseValid,
        emisSchoolCode: 'X'.repeat(33),
      })
      expect(result.success).toBe(false)
    })
  })

  describe('archetype=GENERIC (and all non-PABSON)', () => {
    const schema = makeBasicInfoSchema('GENERIC')

    it('accepts payload without emisSchoolCode', () => {
      const result = schema.safeParse({ ...baseValid })
      expect(result.success).toBe(true)
    })

    it('accepts payload with emisSchoolCode', () => {
      const result = schema.safeParse({ ...baseValid, emisSchoolCode: 'DISTRICT-42' })
      expect(result.success).toBe(true)
    })

    it('still enforces 32-char max on emisSchoolCode', () => {
      const result = schema.safeParse({
        ...baseValid,
        emisSchoolCode: 'X'.repeat(33),
      })
      expect(result.success).toBe(false)
    })
  })

  describe('archetype=null (fallback / pre-hydration)', () => {
    const schema = makeBasicInfoSchema(null)

    it('treats emisSchoolCode as optional', () => {
      // Matches the back-compat basicInfoSchema export; pre-hydration
      // render must not block "Continue" just because archetype hasn't
      // resolved yet.
      const result = schema.safeParse({ ...baseValid })
      expect(result.success).toBe(true)
    })
  })

  describe('shared invariants across archetypes', () => {
    it('still rejects reversed grade ranges', () => {
      const schema = makeBasicInfoSchema('GENERIC')
      const result = schema.safeParse({
        ...baseValid,
        'gradeRange.start': '12',
        'gradeRange.end': 'K',
      })
      expect(result.success).toBe(false)
    })

    it('still rejects mismatched schoolType × gradeRange', () => {
      const schema = makeBasicInfoSchema('GENERIC')
      const result = schema.safeParse({
        ...baseValid,
        schoolType: 'elementary' as const,
        'gradeRange.start': '9',
        'gradeRange.end': '12',
      })
      expect(result.success).toBe(false)
    })
  })
})
