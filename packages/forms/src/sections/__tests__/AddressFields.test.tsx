/**
 * AddressFields — region-aware address switch (Sprint A.10)
 *
 * Tests the archetype-resolution logic that picks between
 * AddressFieldsLegacy (US-shaped) and AddressFieldsNepal (CEHRD-shaped).
 *
 * The render-level smoke checks just confirm the right variant mounts.
 * Cascading-province behavior + RHF integration are covered by manual
 * smoke (Sprint A.25) and the prod rehearsal QA (Sprint G).
 */

import { describe, it, expect } from 'vitest'
import { resolveAddressVariant } from '../AddressFields'

describe('resolveAddressVariant — Sprint A.10 archetype switch', () => {
  describe('PABSON archetype takes precedence', () => {
    it.each([
      ['PABSON', 'NPL'],
      ['PABSON', 'USA'],
      ['PABSON', undefined],
      ['PABSON', null],
    ])('archetype=%s, country=%s → nepal', (archetype, country) => {
      expect(resolveAddressVariant(archetype, country as string | null | undefined)).toBe('nepal')
    })
  })

  describe('Country fallback when archetype is not PABSON', () => {
    it.each([
      ['GENERIC', 'NPL'],
      [undefined, 'NPL'],
      [null, 'NPL'],
    ])('archetype=%s, country=%s → nepal (country fallback)', (archetype, country) => {
      expect(
        resolveAddressVariant(
          archetype as string | null | undefined,
          country as string | null | undefined,
        ),
      ).toBe('nepal')
    })
  })

  describe('Legacy US-shaped default for everything else', () => {
    it.each([
      ['GENERIC', 'USA'],
      ['GENERIC', undefined],
      [undefined, undefined],
      [null, null],
      ['CBSE_IN', 'IND'], // future archetype not yet defined as Nepal
    ])('archetype=%s, country=%s → legacy', (archetype, country) => {
      expect(
        resolveAddressVariant(
          archetype as string | null | undefined,
          country as string | null | undefined,
        ),
      ).toBe('legacy')
    })
  })
})
