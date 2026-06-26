/**
 * Course catalog CSV export. Kept as a separate module so the pure serializer
 * (`coursesToCsv`) stays unit-testable without DOM stubs, mirroring the IEMIS
 * findings export pattern (`students/iemis/iemis-findings-export.ts`).
 *
 * Columns match the on-screen catalog table:
 * CODE, COURSE NAME, SUBJECT, GRADES, CREDITS, TYPE, DURATION, STATUS.
 */

import type { CourseResponseDto } from '@aibrains/shared-types'
import {
  getSubjectAreaLabel,
  getCourseTypeLabel,
  getDurationLabel,
  getGradeLevelLabel,
  sortGradeCodes,
} from '../../schemas/course.form'

const HEADER = [
  'Code',
  'Course Name',
  'Subject',
  'Grades',
  'Credits',
  'Type',
  'Duration',
  'Status',
] as const

// RFC 4180 quoting — double embedded quotes, wrap values containing
// `,` / `"` / newline. Identical behaviour in Excel/Sheets/LibreOffice.
function escape(value: string | number): string {
  const s = String(value)
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

/**
 * Serialize courses as CSV. Grades are rendered as sorted, human-readable
 * labels joined by ` | ` (pipe, not comma, to avoid clashing with the CSV
 * delimiter).
 */
export function coursesToCsv(courses: CourseResponseDto[]): string {
  const lines = [
    HEADER.join(','),
    ...courses.map((c) =>
      [
        c.courseCode,
        c.courseName,
        getSubjectAreaLabel(c.subjectArea),
        sortGradeCodes(c.gradeLevels).map(getGradeLevelLabel).join(' | '),
        c.credits,
        getCourseTypeLabel(c.courseType),
        getDurationLabel(c.typicalDuration),
        c.isActive ? 'Active' : 'Inactive',
      ]
        .map(escape)
        .join(',')
    ),
  ]
  return lines.join('\r\n') + '\r\n'
}

/**
 * Trigger a browser download of the courses CSV. Separated from `coursesToCsv`
 * so the pure serializer remains testable.
 */
export function downloadCoursesCsv(
  courses: CourseResponseDto[],
  filename = 'courses-export.csv'
): void {
  const csv = coursesToCsv(courses)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
