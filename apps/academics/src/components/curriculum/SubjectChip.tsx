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
      style={{
        fontSize: 10,
        fontWeight: 500,
        padding: '2px 8px',
        borderRadius: 8,
        whiteSpace: 'nowrap',
        display: 'inline-block',
        background: bg,
        color: text,
      }}
    >
      {getSubjectAreaLabel(subject)}
    </span>
  )
}
