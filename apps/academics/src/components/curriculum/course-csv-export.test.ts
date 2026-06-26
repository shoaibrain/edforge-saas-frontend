import { describe, it, expect } from 'vitest'
import type { CourseResponseDto } from '@aibrains/shared-types'
import { coursesToCsv } from './course-csv-export'

function makeCourse(overrides: Partial<CourseResponseDto>): CourseResponseDto {
  return {
    courseId: 'c1',
    schoolId: 's1',
    tenantId: 't1',
    courseCode: 'ENG-0910',
    courseName: 'Compulsory English',
    gradeLevels: ['9', '10'],
    credits: 4,
    subjectArea: 'english_language_arts',
    courseType: 'required',
    typicalDuration: 'year',
    isActive: true,
    ...overrides,
  } as CourseResponseDto
}

describe('coursesToCsv', () => {
  it('emits the exact 8-column header', () => {
    const csv = coursesToCsv([])
    expect(csv.split('\r\n')[0]).toBe(
      'Code,Course Name,Subject,Grades,Credits,Type,Duration,Status'
    )
  })

  it('uses CRLF line endings and a trailing newline', () => {
    const csv = coursesToCsv([makeCourse({})])
    expect(csv.endsWith('\r\n')).toBe(true)
    // header + 1 row + trailing empty segment
    expect(csv.split('\r\n').filter(Boolean)).toHaveLength(2)
  })

  it('RFC-4180 quotes values containing comma, quote, or newline', () => {
    const csv = coursesToCsv([
      makeCourse({ courseName: 'Algebra, "Advanced"\nTrack' }),
    ])
    const row = csv.split('\r\n')[1]
    expect(row).toContain('"Algebra, ""Advanced""\nTrack"')
  })

  it('joins sorted grade labels with a pipe (not a comma)', () => {
    const row = coursesToCsv([makeCourse({ gradeLevels: ['10', '9'] })]).split('\r\n')[1]
    // grades is the 4th column; with two grades it is pipe-joined, never comma-joined
    expect(row).toContain(' | ')
  })

  it('maps isActive to a Status label', () => {
    expect(coursesToCsv([makeCourse({ isActive: false })]).split('\r\n')[1]).toContain('Inactive')
    expect(coursesToCsv([makeCourse({ isActive: true })]).split('\r\n')[1]).toContain('Active')
  })
})
