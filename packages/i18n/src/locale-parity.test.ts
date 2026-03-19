/**
 * Locale Parity Test
 *
 * Ensures every translation key in the English (en) locale
 * has a corresponding key in the Nepali (ne) locale and vice versa.
 * This prevents missing translations from reaching production.
 */

import { describe, it, expect } from 'vitest'

// Import all translation files
import enCommon from './locales/en/common.json'
import enAuth from './locales/en/auth.json'
import enNav from './locales/en/nav.json'
import enSettings from './locales/en/settings.json'
import enDashboard from './locales/en/dashboard.json'
import enErrors from './locales/en/errors.json'

import neCommon from './locales/ne/common.json'
import neAuth from './locales/ne/auth.json'
import neNav from './locales/ne/nav.json'
import neSettings from './locales/ne/settings.json'
import neDashboard from './locales/ne/dashboard.json'
import neErrors from './locales/ne/errors.json'

/**
 * Recursively extract all keys from a nested JSON object as dot-separated paths.
 */
function getKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = []
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    const value = obj[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...getKeys(value as Record<string, unknown>, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  return keys.sort()
}

type NamespaceFiles = {
  name: string
  en: Record<string, unknown>
  ne: Record<string, unknown>
}

const namespaces: NamespaceFiles[] = [
  { name: 'common', en: enCommon, ne: neCommon },
  { name: 'auth', en: enAuth, ne: neAuth },
  { name: 'nav', en: enNav, ne: neNav },
  { name: 'settings', en: enSettings, ne: neSettings },
  { name: 'dashboard', en: enDashboard, ne: neDashboard },
  { name: 'errors', en: enErrors, ne: neErrors },
]

describe('Locale parity (en ↔ ne)', () => {
  for (const ns of namespaces) {
    describe(`namespace: ${ns.name}`, () => {
      it('en keys have corresponding ne keys', () => {
        const enKeys = getKeys(ns.en)
        const neKeys = new Set(getKeys(ns.ne))

        const missing = enKeys.filter((k) => !neKeys.has(k))
        expect(missing, `Missing in ne/${ns.name}.json: ${missing.join(', ')}`).toEqual([])
      })

      it('ne keys have corresponding en keys', () => {
        const neKeys = getKeys(ns.ne)
        const enKeys = new Set(getKeys(ns.en))

        const extra = neKeys.filter((k) => !enKeys.has(k))
        expect(extra, `Extra in ne/${ns.name}.json (not in en): ${extra.join(', ')}`).toEqual([])
      })

      it('all ne values are non-empty strings', () => {
        const neKeys = getKeys(ns.ne)
        for (const key of neKeys) {
          const value = key.split('.').reduce((o: any, k) => o?.[k], ns.ne)
          expect(value, `ne/${ns.name}.json "${key}" should be a non-empty string`).toBeTruthy()
          expect(typeof value, `ne/${ns.name}.json "${key}" should be string, got ${typeof value}`).toBe('string')
        }
      })
    })
  }
})
