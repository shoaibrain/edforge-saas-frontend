import { describe, expect, it } from 'vitest'
import { getMFSharedConfig } from './mf-shared'

describe('mf-shared — governance-body archetype registry singleton', () => {
  it('registers @edforge/archetype as a shared singleton (host + remote)', () => {
    for (const role of ['host', 'remote'] as const) {
      const cfg = getMFSharedConfig(role)
      const entry = cfg['@edforge/archetype']
      expect(entry, '@edforge/archetype missing from MF shared config').toBeDefined()
      expect(entry.singleton, '@edforge/archetype must be a singleton').toBe(true)
      expect(entry.eager, '@edforge/archetype should stay eager-loaded').toBe(true)
      expect(entry.requiredVersion, '@edforge/archetype requiredVersion drifted').toBe('0.0.1')
    }
  })

  it('keeps @edforge/forms a singleton (regression fence)', () => {
    const cfg = getMFSharedConfig('host')
    expect(cfg['@edforge/forms'].singleton).toBe(true)
  })

  // @edforge/config has NO "." export — only subpaths
  // (./school-context-channel, ./resolved-settings, …), and all consumers
  // import by subpath. A bare '@edforge/config' share key matches only the
  // exact request string, so it NEVER engages: each container silently
  // bundles its own copy of the school-context-channel and its module-scope
  // _lastPayload, breaking the cross-MFE synchronous settings read (the
  // 2026-07-09 finance USD-flash bug). Only the trailing-slash PREFIX key
  // matches subpath requests.
  it('shares @edforge/config via the trailing-slash prefix key, never the bare key', () => {
    for (const role of ['host', 'remote'] as const) {
      const cfg = getMFSharedConfig(role)
      const prefix = cfg['@edforge/config/']
      expect(prefix, "'@edforge/config/' prefix share missing").toBeDefined()
      expect(prefix.singleton, 'school-context-channel must be a cross-container singleton').toBe(true)
      expect(prefix.eager).toBe(true)
      expect(cfg['@edforge/config'], 'bare @edforge/config key is a no-op (no "." export) — remove it').toBeUndefined()
    }
  })
})
