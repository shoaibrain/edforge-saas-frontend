import { describe, it, expect } from 'vitest'
import { queryMatchesSchool } from '../school-queries'

describe('queryMatchesSchool', () => {
  const matches = queryMatchesSchool('school-1')

  it('matches a bare string segment', () => {
    expect(matches({ queryKey: ['schools', 'school-1'] })).toBe(true)
    expect(matches({ queryKey: ['home', 'overview', 'school-1', '2026-07-02'] })).toBe(true)
  })

  it('matches a schoolId inside a filter object segment', () => {
    expect(matches({ queryKey: ['students', { schoolId: 'school-1', page: 2 }] })).toBe(true)
  })

  it('does not match other schools or unrelated keys', () => {
    expect(matches({ queryKey: ['schools', 'school-2'] })).toBe(false)
    expect(matches({ queryKey: ['userProfile'] })).toBe(false)
    expect(matches({ queryKey: ['students', { schoolId: 'school-2' }] })).toBe(false)
  })

  it('does not match null segments or nested-deeper ids', () => {
    expect(matches({ queryKey: [null, undefined] })).toBe(false)
    expect(matches({ queryKey: ['x', { filters: { schoolId: 'school-1' } }] })).toBe(false)
  })
})
