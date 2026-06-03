/**
 * i18n config — unit tests for the identifiers namespace addition.
 *
 * Verifies that the `identifiers` namespace is properly wired into the
 * NAMESPACES constant and that both `en` and `ne` locale files are present
 * in the resource bundle — things the coverage fence test does not check
 * at the config layer.
 */
import { describe, expect, it } from 'vitest'
import { NAMESPACES, SUPPORTED_LANGUAGES, type Namespace, type SupportedLanguage } from '../config'

// Import the locale files directly (same pattern as the coverage fence test)
import enIdentifiers from '../locales/en/identifiers.json'
import neIdentifiers from '../locales/ne/identifiers.json'

describe('NAMESPACES — identifiers namespace registration', () => {
  it('includes "identifiers" in the NAMESPACES tuple', () => {
    expect(NAMESPACES).toContain('identifiers')
  })

  it('"identifiers" is the last namespace (added in this PR, not mixed in)', () => {
    expect(NAMESPACES[NAMESPACES.length - 1]).toBe('identifiers')
  })

  it('NAMESPACES has exactly 12 entries (11 pre-existing + identifiers)', () => {
    expect(NAMESPACES).toHaveLength(12)
  })

  it('pre-existing namespaces are still all present (regression fence)', () => {
    const expected: Namespace[] = [
      'common', 'auth', 'nav', 'settings', 'dashboard',
      'errors', 'academics', 'people', 'payments', 'portal', 'branding',
    ]
    for (const ns of expected) {
      expect(NAMESPACES).toContain(ns)
    }
  })
})

describe('SUPPORTED_LANGUAGES — unchanged (regression fence)', () => {
  it('still supports English and Nepali', () => {
    const langs: SupportedLanguage[] = ['en', 'ne']
    for (const lang of langs) {
      expect(SUPPORTED_LANGUAGES).toContain(lang)
    }
  })

  it('has exactly 2 supported languages', () => {
    expect(SUPPORTED_LANGUAGES).toHaveLength(2)
  })
})

describe('identifiers locale files — content validity', () => {
  it('en/identifiers.json is a non-empty object', () => {
    expect(typeof enIdentifiers).toBe('object')
    expect(Object.keys(enIdentifiers).length).toBeGreaterThan(0)
  })

  it('ne/identifiers.json is a non-empty object', () => {
    expect(typeof neIdentifiers).toBe('object')
    expect(Object.keys(neIdentifiers).length).toBeGreaterThan(0)
  })

  it('identifiers locale files contain the core display keys', () => {
    const coreKeys = ['emisStudentId', 'studentNumber', 'copy', 'copied', 'maskedIdentifier', 'hidden', 'none']
    for (const key of coreKeys) {
      expect(enIdentifiers, `en missing "${key}"`).toHaveProperty(key)
      expect(neIdentifiers, `ne missing "${key}"`).toHaveProperty(key)
    }
  })

  it('en and ne locale files have identical key sets (parity)', () => {
    expect(Object.keys(enIdentifiers).sort()).toEqual(Object.keys(neIdentifiers).sort())
  })

  it('no identifier value in either locale is an empty string', () => {
    for (const [key, value] of Object.entries(enIdentifiers)) {
      expect(value.trim().length, `en["${key}"] is empty`).toBeGreaterThan(0)
    }
    for (const [key, value] of Object.entries(neIdentifiers)) {
      expect(value.trim().length, `ne["${key}"] is empty`).toBeGreaterThan(0)
    }
  })

  it('UUID-related display keys exist: copy, copied, maskedIdentifier', () => {
    // These keys are used by UuidBadge and EntityIdDisplay
    expect(enIdentifiers).toHaveProperty('copy')
    expect(enIdentifiers).toHaveProperty('copied')
    expect(enIdentifiers).toHaveProperty('maskedIdentifier')
    expect(enIdentifiers).toHaveProperty('hidden')
    expect(enIdentifiers).toHaveProperty('none')
  })
})
