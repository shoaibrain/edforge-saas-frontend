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

  it('keeps @edforge/config + @edforge/forms singletons (regression fence)', () => {
    const cfg = getMFSharedConfig('host')
    expect(cfg['@edforge/config'].singleton).toBe(true)
    expect(cfg['@edforge/forms'].singleton).toBe(true)
  })
})
