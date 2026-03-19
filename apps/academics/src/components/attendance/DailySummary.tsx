/**
 * DailySummary Component
 *
 * Compact inline stats bar showing daily attendance metrics.
 */

import type { DailyAttendanceSummary } from '../../services/academics.service'

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

  const rate = summary.attendanceRate
  const rateColor =
    rate >= 95
      ? 'text-emerald-600 dark:text-emerald-400'
      : rate >= 90
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400'

  const stats = [
    { label: 'Present', value: summary.present, dot: 'bg-emerald-500' },
    { label: 'Absent', value: summary.absent, dot: 'bg-red-500' },
    { label: 'Late', value: summary.late, dot: 'bg-amber-500' },
    { label: 'Excused', value: summary.excused, dot: 'bg-blue-500' },
    ...(summary.remote ? [{ label: 'Remote', value: summary.remote, dot: 'bg-indigo-500' }] : []),
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
