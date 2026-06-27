/**
 * DailySummary Component
 *
 * Compact inline stats bar showing daily attendance metrics.
 */

import type { DailyAttendanceSummary } from '../../services/academics.service'
import { ATTENDANCE_STATUS_META, TONE_CLASSES } from './attendanceStatus'

interface DailySummaryProps {
  summary: DailyAttendanceSummary | undefined
  isLoading: boolean
}

function SkeletonBar() {
  return (
    <div className="flex items-center gap-6 px-4 py-3 bg-surface-secondary rounded-xl border border-border-secondary animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-4 w-20 bg-surface-hover rounded" />
      ))}
    </div>
  )
}

export function DailySummary({ summary, isLoading }: DailySummaryProps) {
  if (isLoading) return <SkeletonBar />

  if (!summary) {
    return (
      <div className="flex items-center gap-6 px-4 py-3 bg-surface-secondary rounded-xl border border-border-secondary">
        <span className="text-sm text-text-tertiary">No attendance data for this date</span>
      </div>
    )
  }

  // A summary with zero recorded students must NOT read as "0.0% rate" (that looks
  // like everyone was absent). Show an explicit not-recorded state instead.
  const recordedCount =
    summary.totalRecorded ??
    summary.present + summary.absent + summary.late + summary.excused +
      (summary.halfDay ?? 0) + (summary.remote ?? 0)
  if (recordedCount === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-surface-secondary rounded-xl border border-border-secondary">
        <span className="w-2 h-2 rounded-full bg-[rgb(var(--text-tertiary))]" />
        <span className="text-sm text-text-tertiary">Attendance not recorded for this date</span>
      </div>
    )
  }

  const rate = summary.attendanceRate
  const rateColor =
    rate >= 95
      ? 'text-[rgb(var(--state-success-fg))]'
      : rate >= 90
        ? 'text-[rgb(var(--state-warning-fg))]'
        : 'text-[rgb(var(--state-danger-fg))]'

  // Labels + dot colors come from the single status source (F0.T2) so the
  // summary can't drift from the badges/entry grid (e.g. "Late" → "Tardy").
  const dot = (status: keyof typeof ATTENDANCE_STATUS_META) =>
    TONE_CLASSES[ATTENDANCE_STATUS_META[status].tone].dot
  const stats = [
    { label: ATTENDANCE_STATUS_META.present.label, value: summary.present, dot: dot('present') },
    { label: ATTENDANCE_STATUS_META.absent.label, value: summary.absent, dot: dot('absent') },
    { label: ATTENDANCE_STATUS_META.late.label, value: summary.late, dot: dot('late') },
    { label: ATTENDANCE_STATUS_META.excused.label, value: summary.excused, dot: dot('excused') },
    ...(summary.remote ? [{ label: ATTENDANCE_STATUS_META.remote.label, value: summary.remote, dot: dot('remote') }] : []),
  ]

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 bg-surface-secondary rounded-xl border border-border-secondary">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-1.5 text-sm">
          <span className={`w-2 h-2 rounded-full ${s.dot}`} />
          <span className="font-medium text-text-primary">{s.value}</span>
          <span className="text-text-tertiary">{s.label}</span>
        </div>
      ))}

      <div className="ml-auto flex items-center gap-1.5 text-sm">
        <span className={`font-semibold ${rateColor}`}>{rate.toFixed(1)}%</span>
        <span className="text-text-tertiary">Rate</span>
      </div>
    </div>
  )
}
