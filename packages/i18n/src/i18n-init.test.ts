/**
 * i18n Initialization Tests
 *
 * Validates that the i18n instance initializes correctly,
 * supports all expected languages, and resolves translation keys.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { initI18n, i18n, SUPPORTED_LANGUAGES, NAMESPACES } from './config'

describe('initI18n', () => {
  beforeAll(() => {
    initI18n()
  })

  it('initializes i18next successfully', () => {
    expect(i18n.isInitialized).toBe(true)
  })

  it('defaults to English fallback', () => {
    expect(i18n.options.fallbackLng).toContain('en')
  })

  it('supports en and ne languages', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(i18n.options.supportedLngs).toContain(lang)
    }
  })

  it('has all namespaces loaded for en', () => {
    for (const ns of NAMESPACES) {
      const bundle = i18n.getResourceBundle('en', ns)
      expect(bundle, `Missing en/${ns} resource bundle`).toBeTruthy()
      expect(Object.keys(bundle).length).toBeGreaterThan(0)
    }
  })

  it('has all namespaces loaded for ne', () => {
    for (const ns of NAMESPACES) {
      const bundle = i18n.getResourceBundle('ne', ns)
      expect(bundle, `Missing ne/${ns} resource bundle`).toBeTruthy()
      expect(Object.keys(bundle).length).toBeGreaterThan(0)
    }
  })

  it('resolves a known key in English', () => {
    i18n.changeLanguage('en')
    expect(i18n.t('save', { ns: 'common' })).toBe('Save')
    expect(i18n.t('welcomeBack', { ns: 'auth' })).toBe('Welcome Back')
    expect(i18n.t('dashboard', { ns: 'nav' })).toBe('Dashboard')
  })

  it('resolves a known key in Nepali', () => {
    i18n.changeLanguage('ne')
    expect(i18n.t('save', { ns: 'common' })).toBe('सुरक्षित गर्नुहोस्')
    expect(i18n.t('dashboard', { ns: 'nav' })).toBe('ड्यासबोर्ड')
  })

  it('falls back to en for unsupported languages', () => {
    i18n.changeLanguage('fr')
    expect(i18n.t('save', { ns: 'common' })).toBe('Save')
  })

  it('is idempotent — calling initI18n twice returns same instance', () => {
    const first = initI18n()
    const second = initI18n()
    expect(first).toBe(second)
  })
})
