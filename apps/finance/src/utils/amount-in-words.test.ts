import { describe, it, expect } from 'vitest'
import { amountInWords } from './amount-in-words'

describe('amountInWords (Indian numbering — crore/lakh)', () => {
  it('handles zero', () => {
    expect(amountInWords(0)).toBe('Zero Rupees Only')
  })

  it('spells 1–19 directly', () => {
    expect(amountInWords(1)).toBe('One Rupees Only')
    expect(amountInWords(13)).toBe('Thirteen Rupees Only')
    expect(amountInWords(19)).toBe('Nineteen Rupees Only')
  })

  it('composes tens and ones', () => {
    expect(amountInWords(20)).toBe('Twenty Rupees Only')
    expect(amountInWords(47)).toBe('Forty Seven Rupees Only')
    expect(amountInWords(99)).toBe('Ninety Nine Rupees Only')
  })

  it('composes hundreds', () => {
    expect(amountInWords(100)).toBe('One Hundred Rupees Only')
    expect(amountInWords(305)).toBe('Three Hundred Five Rupees Only')
    expect(amountInWords(999)).toBe('Nine Hundred Ninety Nine Rupees Only')
  })

  it('composes thousands', () => {
    expect(amountInWords(1_000)).toBe('One Thousand Rupees Only')
    expect(amountInWords(8_900)).toBe('Eight Thousand Nine Hundred Rupees Only')
    expect(amountInWords(20_000)).toBe('Twenty Thousand Rupees Only')
    expect(amountInWords(99_999)).toBe('Ninety Nine Thousand Nine Hundred Ninety Nine Rupees Only')
  })

  it('uses lakh, not hundred-thousand', () => {
    expect(amountInWords(100_000)).toBe('One Lakh Rupees Only')
    expect(amountInWords(150_000)).toBe('One Lakh Fifty Thousand Rupees Only')
    expect(amountInWords(2_512_345)).toBe(
      'Twenty Five Lakh Twelve Thousand Three Hundred Forty Five Rupees Only'
    )
  })

  it('uses crore above 10^7', () => {
    expect(amountInWords(10_000_000)).toBe('One Crore Rupees Only')
    expect(amountInWords(123_456_789)).toBe(
      'Twelve Crore Thirty Four Lakh Fifty Six Thousand Seven Hundred Eighty Nine Rupees Only'
    )
  })

  it('rounds fractional rupees', () => {
    expect(amountInWords(99.6)).toBe('One Hundred Rupees Only')
    expect(amountInWords(99.4)).toBe('Ninety Nine Rupees Only')
  })

  it('guards non-finite input and negatives', () => {
    expect(amountInWords(Number.NaN)).toBe('')
    expect(amountInWords(Number.POSITIVE_INFINITY)).toBe('')
    expect(amountInWords(-500)).toBe('Five Hundred Rupees Only')
  })
})
