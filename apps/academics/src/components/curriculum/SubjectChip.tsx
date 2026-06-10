/**
 * SubjectChip — V2 subject area badge
 *
 * Renders a colored chip based on subject area string.
 * Uses inline styles for dark/light theme compatibility.
 */

import { getSubjectChipStyle } from '../../utils/subject-colors'
import { getSubjectAreaLabel } from '../../schemas/course.form'

interface SubjectChipProps {
  subject: string
}

export function SubjectChip({ subject }: SubjectChipProps) {
  const { bg, text } = getSubjectChipStyle(subject)

  return (
    <span
      // allow-presentation-style: per-subject chip bg/text from the subject-area color map
      className="text-3xs font-medium py-0.5 px-2 rounded-lg whitespace-nowrap inline-block"
      style={{ background: bg, color: text }}
    >
      {getSubjectAreaLabel(subject)}
    </span>
  )
}
