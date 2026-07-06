/**
 * DailySummary Component
 *
 * Compact inline stats bar showing daily attendance metrics.
 */

import type { DailyAttendanceSummary } from '../../services/academics.service'
import { ATTENDANCE_STATUS_META, TONE_CLASSES } from './attendanceStatus'
import { useAcademicsI18n } from '../../lib/i18n'

interface DailySummaryProps {
  summary: DailyAttendanceSummary | undefined
  isLoading: boolean
}

function SkeletonBar() {
  return (
    <div className="flex items-center gap-6 px-4 py-3 bg-surface-secondary rounded-xl border border-border-secondary">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="v2-skeleton-pulse h-4 w-20 rounded bg-[rgb(var(--background-tertiary))]" />
      ))}
    </div>
  )
}

export function DailySummary({ summary, isLoading }: DailySummaryProps) {
  const { t, formatNumber, attendanceStatusLabel } = useAcademicsI18n()
  if (isLoading) return <SkeletonBar />

  if (!summary) {
    return (
      <div className="flex items-center gap-6 px-4 py-3 bg-surface-secondary rounded-xl border border-border-secondary">
        <span className="text-sm text-text-tertiary">{t('attendance.empty.noDataForDate')}</span>
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
        <span className="text-sm text-text-tertiary">{t('attendance.empty.notRecordedForDate')}</span>
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

  // Coverage truth (attendance realignment): recorded ÷ enrolled — how much of
  // the roll-call is done — distinct from the attendance RATE (attending ÷
  // enrolled). While recording is incomplete the enrolled-denominator rate reads
  // as a false alarm (a scary-low % that is really just low coverage), so lead
  // with coverage and only surface the rate once recording is essentially done.
  const totalStudents = summary.totalStudents || recordedCount
  const coveragePct = totalStudents > 0 ? (recordedCount / totalStudents) * 100 : 0
  const recordingComplete = coveragePct >= 90
  const coverageColor =
    coveragePct >= 90
      ? 'text-[rgb(var(--state-success-fg))]'
      : coveragePct >= 60
        ? 'text-[rgb(var(--state-warning-fg))]'
        : 'text-[rgb(var(--state-danger-fg))]'

  // Labels + dot colors come from the single status source (F0.T2) so the
  // summary can't drift from the badges/entry grid (e.g. "Late" → "Tardy").
  const dot = (status: keyof typeof ATTENDANCE_STATUS_META) =>
    TONE_CLASSES[ATTENDANCE_STATUS_META[status].tone].dot
  const stats = [
    { label: attendanceStatusLabel('present'), value: summary.present, dot: dot('present') },
    { label: attendanceStatusLabel('absent'), value: summary.absent, dot: dot('absent') },
    { label: attendanceStatusLabel('late'), value: summary.late, dot: dot('late') },
    { label: attendanceStatusLabel('excused'), value: summary.excused, dot: dot('excused') },
    ...(summary.remote ? [{ label: attendanceStatusLabel('remote'), value: summary.remote, dot: dot('remote') }] : []),
  ]

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 bg-surface-secondary rounded-xl border border-border-secondary">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-1.5 text-sm">
          <span className={`w-2 h-2 rounded-full ${s.dot}`} />
          <span className="font-medium text-text-primary">{formatNumber(s.value)}</span>
          <span className="text-text-tertiary">{s.label}</span>
        </div>
      ))}

      <div className="ms-auto flex items-center gap-4 text-sm">
        <div
          className="flex items-center gap-1.5"
          title={t('attendance.grid.coverageTitle')}
        >
          <span className={`font-semibold tabular-nums ${coverageColor}`}>{coveragePct.toFixed(0)}%</span>
          <span className="text-text-tertiary">{t('attendance.grid.coverage')}</span>
          <span className="text-text-tertiary">· {t('attendance.grid.ofTotal', { recorded: formatNumber(recordedCount), total: formatNumber(totalStudents) })}</span>
        </div>
        {recordingComplete && (
          <div className="flex items-center gap-1.5" title={t('attendance.grid.rateTitle')}>
            <span className={`font-semibold tabular-nums ${rateColor}`}>{rate.toFixed(1)}%</span>
            <span className="text-text-tertiary">{t('attendance.grid.rate')}</span>
          </div>
        )}
      </div>
    </div>
  )
}
