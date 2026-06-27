/**
 * IdentityCell — avatar + name + (studentNumber · grade) for a roster row.
 *
 * Humanizes the roster and, critically, DISAMBIGUATES look-alike names: the
 * DiceBear avatar is seeded by `studentId` (UserAvatar's student-role default),
 * so two students with identical names ("Aashiya Khatun" ×2) get distinct
 * avatars. The student number renders in `font-mono` so near-identical IDs are
 * scannable.
 */

import { UserAvatar } from '../../common/UserAvatar'

export interface IdentityCellProps {
  studentId: string
  studentName: string
  studentNumber?: string
  gradeLevel?: string
  /** Daily-presence locked elsewhere — recede the whole cluster. */
  dimmed?: boolean
}

export function IdentityCell({
  studentId,
  studentName,
  studentNumber,
  gradeLevel,
  dimmed = false,
}: IdentityCellProps) {
  return (
    <div className={`flex min-w-0 items-center gap-2.5 ${dimmed ? 'opacity-60' : ''}`}>
      <UserAvatar
        userId={studentId}
        userName={studentName}
        role="student"
        size="sm"
        className="flex-shrink-0"
      />
      <div className="min-w-0">
        <span className="block truncate text-sm font-medium text-text-primary">{studentName}</span>
        {(studentNumber || gradeLevel) && (
          <span className="block truncate text-xs text-text-tertiary">
            {studentNumber && <span className="font-mono">{studentNumber}</span>}
            {studentNumber && gradeLevel && ' · '}
            {gradeLevel}
          </span>
        )}
      </div>
    </div>
  )
}
