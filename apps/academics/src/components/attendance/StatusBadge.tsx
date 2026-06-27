/**
 * StatusBadge Component
 *
 * Reusable color-coded badge for attendance status display.
 * Vocabulary + colors come from the single source (attendanceStatus.ts) — see
 * Sprint F0.T2. `statusConfig` is re-derived for any legacy importer.
 */

import type { AttendanceStatus } from '../../services/academics.service'
import { ATTENDANCE_STATUS_META, TONE_CLASSES } from './attendanceStatus'

interface StatusBadgeProps {
  status: AttendanceStatus
  variant?: 'full' | 'compact'
}

export function StatusBadge({ status, variant = 'full' }: StatusBadgeProps) {
  const meta = ATTENDANCE_STATUS_META[status]
  if (!meta) return null
  const tone = TONE_CLASSES[meta.tone]

  if (variant === 'compact') {
    return (
      <span
        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${tone.badgeBg} ${tone.fg}`}
        title={meta.label}
      >
        {meta.shortLabel}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tone.badgeBg} ${tone.fg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
      {meta.label}
    </span>
  )
}

/**
 * Back-compat: the legacy `{label, shortLabel, bg, text, dot}` map, derived from
 * the single source so it can't drift. Prefer importing from attendanceStatus.ts.
 */
export const statusConfig = Object.fromEntries(
  (Object.keys(ATTENDANCE_STATUS_META) as AttendanceStatus[]).map((s) => {
    const meta = ATTENDANCE_STATUS_META[s]
    const tone = TONE_CLASSES[meta.tone]
    return [s, { label: meta.label, shortLabel: meta.shortLabel, bg: tone.badgeBg, text: tone.fg, dot: tone.dot }]
  }),
) as Record<AttendanceStatus, { label: string; shortLabel: string; bg: string; text: string; dot: string }>
