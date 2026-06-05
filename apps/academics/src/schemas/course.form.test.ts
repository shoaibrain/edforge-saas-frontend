import { describe, expect, it } from 'vitest'
import { courseFormSchema, ACADEMIC_SUBJECT_OPTIONS } from './course.form'

const baseCourse = {
  courseCode: 'NCF-NEP-G68',
  courseName: 'Nepali',
  subjectArea: 'world_languages' as const,
  courseType: 'required' as const,
  credits: 4,
  typicalDuration: 'year' as const,
  gradeLevels: ['6', '7'],
}

describe('courseFormSchema — academicSubject (Phase 2)', () => {
  it('accepts a valid granular academicSubject', () => {
    const parsed = courseFormSchema.parse({ ...baseCourse, academicSubject: 'nepali' })
    expect(parsed.academicSubject).toBe('nepali')
  })

  it('is optional — a course without academicSubject still parses', () => {
    const parsed = courseFormSchema.parse(baseCourse)
    expect(parsed.academicSubject).toBeUndefined()
  })

  it('rejects a value outside the descriptor set', () => {
    expect(() => courseFormSchema.parse({ ...baseCourse, academicSubject: 'not_a_subject' })).toThrow()
  })

  it('every ACADEMIC_SUBJECT_OPTIONS value is a schema-valid academicSubject', () => {
    for (const opt of ACADEMIC_SUBJECT_OPTIONS) {
      expect(() => courseFormSchema.parse({ ...baseCourse, academicSubject: opt.value })).not.toThrow()
    }
  })
})
