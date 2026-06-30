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

export interface CourseCsvLabels {
  headers: {
    code: string
    courseName: string
    subject: string
    grades: string
    credits: string
    type: string
    duration: string
    status: string
  }
  status: {
    active: string
    inactive: string
  }
}

const DEFAULT_LABELS: CourseCsvLabels = {
  headers: {
    code: 'Code',
    courseName: 'Course Name',
    subject: 'Subject',
    grades: 'Grades',
    credits: 'Credits',
    type: 'Type',
    duration: 'Duration',
    status: 'Status',
  },
  status: {
    active: 'Active',
    inactive: 'Inactive',
  },
}

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
export function coursesToCsv(
  courses: CourseResponseDto[],
  labels: CourseCsvLabels = DEFAULT_LABELS
): string {
  const header = labels.headers
  const lines = [
    [
      header.code,
      header.courseName,
      header.subject,
      header.grades,
      header.credits,
      header.type,
      header.duration,
      header.status,
    ].map(escape).join(','),
    ...courses.map((c) =>
      [
        c.courseCode,
        c.courseName,
        getSubjectAreaLabel(c.subjectArea),
        sortGradeCodes(c.gradeLevels).map(getGradeLevelLabel).join(' | '),
        c.credits,
        getCourseTypeLabel(c.courseType),
        getDurationLabel(c.typicalDuration),
        c.isActive ? labels.status.active : labels.status.inactive,
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
  filename = 'courses-export.csv',
  labels?: CourseCsvLabels
): void {
  const csv = coursesToCsv(courses, labels)
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
