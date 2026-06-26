import { describe, it, expect } from 'vitest'
import { ACADEMIC_SUBJECT_DESCRIPTORS } from '@aibrains/shared-types'
import {
  ACADEMIC_SUBJECT_TO_CODE_PREFIX,
  gradeBandToken,
  generateCourseCode,
  dedupeCourseCode,
  sortGradeCodes,
} from './course.form'

describe('ACADEMIC_SUBJECT_TO_CODE_PREFIX', () => {
  it('has a prefix for every academic subject descriptor (drift guard)', () => {
    for (const descriptor of ACADEMIC_SUBJECT_DESCRIPTORS) {
      expect(ACADEMIC_SUBJECT_TO_CODE_PREFIX[descriptor]).toBeTruthy()
    }
  })

  it('uses uppercase letter prefixes', () => {
    for (const descriptor of ACADEMIC_SUBJECT_DESCRIPTORS) {
      expect(ACADEMIC_SUBJECT_TO_CODE_PREFIX[descriptor]).toMatch(/^[A-Z]+$/)
    }
  })
})

describe('sortGradeCodes', () => {
  it('sorts into canonical catalog order (PG → … → 10)', () => {
    expect(sortGradeCodes(['1', 'PG', 'LKG', 'NUR'])).toEqual(['PG', 'NUR', 'LKG', '1'])
  })

  it('sorts numeric grades numerically, not lexically', () => {
    expect(sortGradeCodes(['10', '2', '9'])).toEqual(['2', '9', '10'])
  })

  it('dedupes and drops nothing for known codes', () => {
    expect(sortGradeCodes(['7', '6', '7'])).toEqual(['6', '7'])
  })
})

describe('gradeBandToken', () => {
  it('reproduces the endorsed pilot bands', () => {
    expect(gradeBandToken(['9', '10'])).toBe('0910')
    expect(gradeBandToken(['8'])).toBe('08')
    expect(gradeBandToken(['6', '7'])).toBe('067')
    expect(gradeBandToken(['4', '5'])).toBe('045')
  })

  it('normalises the primary 1-3 band to a zero-padded start', () => {
    expect(gradeBandToken(['1', '2', '3'])).toBe('0123')
  })

  it('is order-independent (sorts before encoding)', () => {
    expect(gradeBandToken(['7', '6'])).toBe('067')
    expect(gradeBandToken(['10', '9'])).toBe('0910')
  })

  it('handles non-contiguous numeric grades (only the lowest is zero-padded)', () => {
    expect(gradeBandToken(['1', '3'])).toBe('013')
    expect(gradeBandToken(['6', '8'])).toBe('068')
  })

  it('uses uppercased tokens for early-childhood codes', () => {
    expect(gradeBandToken(['PG'])).toBe('PG')
    expect(gradeBandToken(['LKG', 'UKG'])).toBe('LKGUKG')
  })

  it('drops unknown codes and returns empty for none', () => {
    expect(gradeBandToken([])).toBe('')
    expect(gradeBandToken(['ZZ'])).toBe('')
  })
})

describe('generateCourseCode', () => {
  it('builds SUBJECT-GRADEBAND codes', () => {
    expect(generateCourseCode('english', ['9', '10'])).toBe('ENG-0910')
    expect(generateCourseCode('mathematics', ['6', '7'])).toBe('MAT-067')
    expect(generateCourseCode('science', ['8'])).toBe('SCI-08')
    expect(generateCourseCode('nepali', ['1', '2', '3'])).toBe('NEP-0123')
  })

  it('returns empty when subject or grades are missing', () => {
    expect(generateCourseCode(undefined, ['9'])).toBe('')
    expect(generateCourseCode('english', [])).toBe('')
  })

  it('always satisfies the courseCode character set', () => {
    expect(generateCourseCode('optional_computer_science', ['9', '10'])).toMatch(/^[A-Z0-9_-]+$/)
  })
})

describe('dedupeCourseCode', () => {
  it('returns the base when there is no collision', () => {
    expect(dedupeCourseCode('ENG-0910', ['MAT-067'])).toBe('ENG-0910')
  })

  it('appends -2, -3 … on collision', () => {
    expect(dedupeCourseCode('ENG-067', ['ENG-067'])).toBe('ENG-067-2')
    expect(dedupeCourseCode('ENG-067', ['ENG-067', 'ENG-067-2'])).toBe('ENG-067-3')
  })

  it('matches existing codes case-insensitively', () => {
    expect(dedupeCourseCode('ENG-067', ['eng-067'])).toBe('ENG-067-2')
  })

  it('respects the 20-char cap when appending a suffix', () => {
    const base = 'A'.repeat(20)
    const out = dedupeCourseCode(base, [base])
    expect(out.length).toBeLessThanOrEqual(20)
    expect(out.endsWith('-2')).toBe(true)
  })
})
