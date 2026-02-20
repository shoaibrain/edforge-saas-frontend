import { describe, it, expect } from 'vitest'
import {
  MODULE_AVAILABILITY,
  isModuleEnabled,
  PARKED_MODULE_PATHS,
} from '../modules.config'

describe('modules.config', () => {
  describe('MODULE_AVAILABILITY', () => {
    it('has MVP modules enabled', () => {
      expect(MODULE_AVAILABILITY.academics).toBe(true)
      expect(MODULE_AVAILABILITY.finance).toBe(true)
      expect(MODULE_AVAILABILITY.people).toBe(true)
    })

    it('has parked modules disabled', () => {
      expect(MODULE_AVAILABILITY['special-programs']).toBe(false)
      expect(MODULE_AVAILABILITY.messages).toBe(false)
      expect(MODULE_AVAILABILITY.analytics).toBe(false)
      expect(MODULE_AVAILABILITY.edfi).toBe(false)
    })
  })

  describe('isModuleEnabled', () => {
    it('returns true for MVP modules', () => {
      expect(isModuleEnabled('academics')).toBe(true)
      expect(isModuleEnabled('finance')).toBe(true)
      expect(isModuleEnabled('people')).toBe(true)
    })

    it('returns false for parked modules', () => {
      expect(isModuleEnabled('special-programs')).toBe(false)
      expect(isModuleEnabled('messages')).toBe(false)
      expect(isModuleEnabled('analytics')).toBe(false)
      expect(isModuleEnabled('edfi')).toBe(false)
    })

    it('returns false for unknown modules', () => {
      expect(isModuleEnabled('unknown')).toBe(false)
    })
  })

  describe('PARKED_MODULE_PATHS', () => {
    it('lists all parked module path prefixes', () => {
      expect(PARKED_MODULE_PATHS).toHaveLength(4)
      expect(PARKED_MODULE_PATHS).toContain('/messages')
      expect(PARKED_MODULE_PATHS).toContain('/analytics')
      expect(PARKED_MODULE_PATHS).toContain('/special-programs')
      expect(PARKED_MODULE_PATHS).toContain('/edfi')
    })
  })
})
