import { describe, it, expect } from 'vitest'
import { formatCourseType } from './course-type'

describe('formatCourseType', () => {
  it('returns Standard for null input', () => {
    const result = formatCourseType(null)
    expect(result).toEqual({ label: 'Standard', style: 'standard' })
  })

  it('returns Standard for undefined input', () => {
    const result = formatCourseType(undefined)
    expect(result).toEqual({ label: 'Standard', style: 'standard' })
  })

  it('returns Standard for empty string', () => {
    const result = formatCourseType('')
    expect(result).toEqual({ label: 'Standard', style: 'standard' })
  })

  it('returns Standard for "standard"', () => {
    const result = formatCourseType('standard')
    expect(result).toEqual({ label: 'Standard', style: 'standard' })
  })

  it('returns Standard for "Standard" (case-insensitive)', () => {
    const result = formatCourseType('Standard')
    expect(result).toEqual({ label: 'Standard', style: 'standard' })
  })

  it('returns Standard for "required" (maps to standard)', () => {
    const result = formatCourseType('required')
    expect(result).toEqual({ label: 'Standard', style: 'standard' })
  })

  it('returns AP for "AP"', () => {
    const result = formatCourseType('AP')
    expect(result).toEqual({ label: 'AP', style: 'ap' })
  })

  it('returns AP for "ap" (lowercase)', () => {
    const result = formatCourseType('ap')
    expect(result).toEqual({ label: 'AP', style: 'ap' })
  })

  it('returns Dual Enrollment for "Dual Enrollment"', () => {
    const result = formatCourseType('Dual Enrollment')
    expect(result).toEqual({ label: 'Dual Enrollment', style: 'dual' })
  })

  it('returns Dual Enrollment for "dual_enrollment" (underscore)', () => {
    const result = formatCourseType('dual_enrollment')
    expect(result).toEqual({ label: 'Dual Enrollment', style: 'dual' })
  })

  it('returns Honors for "honors"', () => {
    const result = formatCourseType('honors')
    expect(result).toEqual({ label: 'Honors', style: 'honors' })
  })

  it('returns Honors for "Honors" (capitalized)', () => {
    const result = formatCourseType('Honors')
    expect(result).toEqual({ label: 'Honors', style: 'honors' })
  })

  it('returns Vocational for "vocational"', () => {
    const result = formatCourseType('vocational')
    expect(result).toEqual({ label: 'Vocational', style: 'vocational' })
  })

  it('returns Elective for "elective"', () => {
    const result = formatCourseType('elective')
    expect(result).toEqual({ label: 'Elective', style: 'elective' })
  })

  it('returns the original string with standard style for unknown values', () => {
    const result = formatCourseType('enrichment')
    expect(result).toEqual({ label: 'enrichment', style: 'standard' })
  })

  it('handles whitespace padding', () => {
    const result = formatCourseType('  honors  ')
    expect(result).toEqual({ label: 'Honors', style: 'honors' })
  })
})
