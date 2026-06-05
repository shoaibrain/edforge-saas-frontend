import { describe, expect, it } from 'vitest'
import { constrainOptionsByArchetype } from './archetype-options'

const CURRENCY = [
  { value: 'NPR', label: 'Nepali Rupee (NPR)' },
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'INR', label: 'Indian Rupee (INR)' },
]
const TIMEZONE = [
  { value: 'America/New_York', label: 'Eastern' },
  { value: 'Asia/Kathmandu', label: 'Nepal' },
]
const CALENDAR = [
  { value: 'gregorian', label: 'Gregorian' },
  { value: 'bikram_sambat', label: 'Bikram Sambat' },
]

const vals = <T extends { value: string }>(o: T[]) => o.map((x) => x.value)

describe('constrainOptionsByArchetype (GF3.2)', () => {
  it('PABSON narrows currency to NPR only', () => {
    const out = constrainOptionsByArchetype(CURRENCY, 'currency', { archetype: 'PABSON', country: 'NPL' })
    expect(vals(out)).toEqual(['NPR'])
  })

  it('PABSON narrows timezone + calendar to the Nepal values', () => {
    expect(vals(constrainOptionsByArchetype(TIMEZONE, 'timezone', { archetype: 'PABSON', country: 'NPL' }))).toEqual(['Asia/Kathmandu'])
    expect(vals(constrainOptionsByArchetype(CALENDAR, 'calendarSystem', { archetype: 'PABSON', country: 'NPL' }))).toEqual(['bikram_sambat'])
  })

  it('GENERIC keeps the full list (unconstrained)', () => {
    const out = constrainOptionsByArchetype(CURRENCY, 'currency', { archetype: 'GENERIC', country: 'USA' })
    expect(vals(out)).toEqual(['NPR', 'USD', 'EUR', 'INR'])
  })

  it('preserves a legacy saved value outside the allowed set (no silent switch)', () => {
    const out = constrainOptionsByArchetype(CURRENCY, 'currency', { archetype: 'PABSON', country: 'NPL', current: 'USD' })
    expect(vals(out)).toEqual(['NPR', 'USD'])
  })

  it('does not duplicate the current value when it is already allowed', () => {
    const out = constrainOptionsByArchetype(CURRENCY, 'currency', { archetype: 'PABSON', country: 'NPL', current: 'NPR' })
    expect(vals(out)).toEqual(['NPR'])
  })

  it('an unknown archetype degrades to the full list (never empties the dropdown)', () => {
    const out = constrainOptionsByArchetype(CURRENCY, 'currency', { archetype: 'XYZ', country: 'USA' })
    expect(vals(out)).toEqual(['NPR', 'USD', 'EUR', 'INR'])
  })
})
