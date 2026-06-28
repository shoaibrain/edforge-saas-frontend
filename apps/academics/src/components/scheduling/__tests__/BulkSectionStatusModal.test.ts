import { describe, it, expect } from 'vitest'
import type { SectionResponseDto } from '@aibrains/shared-types'
import { splitEligibleSections } from '../BulkSectionStatusModal'

function makeSection(id: string, isActive: boolean): SectionResponseDto {
  return {
    sectionId: id,
    schoolId: 'school-1',
    sectionNumber: id,
    isActive,
    currentEnrollment: 0,
    maxEnrollment: 30,
  } as SectionResponseDto
}

describe('splitEligibleSections', () => {
  it('routes rows already in the target state to skipped', () => {
    const sections = [makeSection('a', true), makeSection('b', true), makeSection('c', false)]
    const { eligible, skipped } = splitEligibleSections(sections, true)
    expect(eligible.map((s) => s.sectionId)).toEqual(['c'])
    expect(skipped.map((s) => s.sectionId)).toEqual(['a', 'b'])
  })

  it('routes rows not in the target state to eligible', () => {
    const sections = [makeSection('a', true), makeSection('b', false)]
    const { eligible, skipped } = splitEligibleSections(sections, false)
    expect(eligible.map((s) => s.sectionId)).toEqual(['a'])
    expect(skipped.map((s) => s.sectionId)).toEqual(['b'])
  })

  it('handles empty input', () => {
    expect(splitEligibleSections([], true)).toEqual({ eligible: [], skipped: [] })
  })

  it('all rows match target → everything skipped', () => {
    const sections = [makeSection('a', true), makeSection('b', true)]
    const { eligible, skipped } = splitEligibleSections(sections, true)
    expect(eligible).toEqual([])
    expect(skipped).toHaveLength(2)
  })
})
