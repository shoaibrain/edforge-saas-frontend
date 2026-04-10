import { describe, it, expect } from 'vitest'
import {
  MODULE_AVAILABILITY,
  isModuleEnabled,
} from '../modules.config'

describe('modules.config', () => {
  describe('MODULE_AVAILABILITY', () => {
    it('has all modules enabled', () => {
      expect(MODULE_AVAILABILITY.academics).toBe(true)
      expect(MODULE_AVAILABILITY.people).toBe(true)
      expect(MODULE_AVAILABILITY.finance).toBe(true)
    })
  })

  describe('isModuleEnabled', () => {
    it('returns true for active modules', () => {
      expect(isModuleEnabled('academics')).toBe(true)
      expect(isModuleEnabled('people')).toBe(true)
      expect(isModuleEnabled('finance')).toBe(true)
    })

    it('returns false for unknown modules', () => {
      expect(isModuleEnabled('unknown')).toBe(false)
    })
  })
})
