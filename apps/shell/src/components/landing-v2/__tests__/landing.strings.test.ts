import { describe, it, expect } from 'vitest'
import * as STR from '../landing.strings'

/**
 * Strings catalog invariants. Copy changes are expected; structural changes
 * (missing exports, wrong shapes) break downstream sections and should fail
 * loudly here.
 */
describe('landing.strings', () => {
  it('exports all required section blocks', () => {
    const expected = [
      'HERO',
      'USE_CASE_DISTRICT',
      'USE_CASE_TEACHERS',
      'USE_CASE_STUDENTS',
      'PLATFORM_PILLARS',
      'SECURITY_STRIP',
      'MIGRATION',
      'FAQ',
      'FINAL_CTA',
      'FOOTER',
    ]
    for (const key of expected) {
      expect(STR, `missing export ${key}`).toHaveProperty(key)
    }
  })

  it('each use-case has 3 features with numeric chapter starts', () => {
    const blocks = [STR.USE_CASE_DISTRICT, STR.USE_CASE_TEACHERS, STR.USE_CASE_STUDENTS]
    for (const b of blocks) {
      expect(b.features).toHaveLength(3)
      for (const f of b.features) {
        expect(typeof f.start).toBe('number')
        expect(f.id).toBeTruthy()
        expect(f.title).toBeTruthy()
      }
    }
  })

  it('FAQ has 6 Q/A items with non-empty strings', () => {
    expect(STR.FAQ.items).toHaveLength(6)
    for (const item of STR.FAQ.items) {
      expect(item.q.length).toBeGreaterThan(0)
      expect(item.a.length).toBeGreaterThan(0)
    }
  })

  it('Platform pillars sum colSpans to 36 (12-col grid × 3 rows)', () => {
    const sum = STR.PLATFORM_PILLARS.cards.reduce((a, c) => a + c.colSpan, 0)
    expect(sum).toBe(36)
  })

  it('Migration has 4 weekly steps', () => {
    expect(STR.MIGRATION.steps).toHaveLength(4)
  })

  it('Footer has 4 link columns and 4 legal links', () => {
    expect(STR.FOOTER.columns).toHaveLength(4)
    expect(STR.FOOTER.legalLinks).toHaveLength(4)
  })

  it('Footer links use relative hrefs or anchors only (no hardcoded origin)', () => {
    const all = [
      ...STR.FOOTER.columns.flatMap((c) => c.items),
      ...STR.FOOTER.legalLinks,
    ]
    for (const link of all) {
      expect(link.href, `bad href ${link.href}`).toMatch(/^(\/|#|mailto:)/)
    }
  })
})
