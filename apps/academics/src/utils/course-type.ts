/**
 * Course Type Utilities
 *
 * Normalizes and maps course type values from the API to
 * display labels and visual style keys for CourseTypeChip.
 */

export type CourseTypeStyle = 'standard' | 'honors' | 'ap' | 'dual' | 'vocational' | 'elective'

export function formatCourseType(
  type: string | null | undefined
): { label: string; style: CourseTypeStyle } {
  const normalized = (type ?? '').toLowerCase().trim().replace(/[_\s]+/g, '')

  if (!normalized || normalized === 'standard' || normalized === 'required')
    return { label: 'Standard', style: 'standard' }
  if (normalized === 'honors') return { label: 'Honors', style: 'honors' }
  if (normalized === 'ap') return { label: 'AP', style: 'ap' }
  if (['dualenrollment', 'dual'].includes(normalized))
    return { label: 'Dual Enrollment', style: 'dual' }
  if (normalized === 'vocational') return { label: 'Vocational', style: 'vocational' }
  if (normalized === 'elective') return { label: 'Elective', style: 'elective' }

  return { label: type as string, style: 'standard' }
}
