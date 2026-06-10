/**
 * CourseTypeChip — V2 course type badge
 *
 * Renders a colored chip based on normalized course type.
 * Replaces the old CourseTypeBadge that used Tailwind light-mode classes.
 */

import { formatCourseType, type CourseTypeStyle } from '../../utils/course-type'

const STYLE_MAP: Record<CourseTypeStyle, { bg: string; color: string }> = {
  standard: { bg: 'rgba(255,255,255,0.04)', color: 'var(--text-hint, #5a6070)' },
  honors: { bg: 'rgba(239,159,39,0.10)', color: 'var(--color-warning, #EF9F27)' },
  ap: { bg: 'rgba(226,75,74,0.10)', color: 'var(--color-danger, #E24B4A)' },
  dual: { bg: 'rgba(55,138,221,0.10)', color: 'var(--color-info, #378ADD)' },
  vocational: { bg: 'rgba(239,159,39,0.10)', color: 'var(--color-warning, #EF9F27)' },
  elective: { bg: 'rgba(127,119,221,0.10)', color: '#7F77DD' },
}

interface CourseTypeChipProps {
  type: string | null | undefined
}

export function CourseTypeChip({ type }: CourseTypeChipProps) {
  const { label, style } = formatCourseType(type)
  const colors = STYLE_MAP[style]

  return (
    <span
      // allow-presentation-style: per-course-type chip bg/text from the style map
      className="text-3xs font-medium py-0.5 px-2 rounded-md whitespace-nowrap"
      style={{ background: colors.bg, color: colors.color }}
    >
      {label}
    </span>
  )
}
