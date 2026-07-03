/**
 * AtRiskPanel — worst-first list of students below the at-risk threshold, with a
 * band filter (All / Chronic <70 / At-risk 70–90), a real 30-day sparkline per
 * student (from `useAttendanceStudentTrends`), absent/total, trend, and rate.
 * Rows open the per-student drill-down modal; the header offers a CSV export.
 * Height-capped + scrollable. Rows are already deduped + banded upstream.
 */

import { useMemo, useState } from 'react'
import { AlertTriangle, Download } from 'lucide-react'
import { SegmentedControl, AttendanceTrend } from '@edforge/ui'
import type { StudentAttendanceTrend } from '../../../services/academics.service'
import { UserAvatar } from '../../common/UserAvatar'
import { StudentAttendanceModal } from '../StudentAttendanceModal'
import { useAcademicsI18n } from '../../../lib/i18n'
import type { RankedAlert } from './coverage'

type Filter = 'all' | 'chronic' | 'atrisk'

interface AtRiskPanelProps {
  alerts: RankedAlert[]
  trends: Record<string, StudentAttendanceTrend>
  schoolId: string
}

function downloadCsv(filename: string, rows: string[][]) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
  const csv = rows.map((r) => r.map(escape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function AtRiskPanel({ alerts, trends, schoolId }: AtRiskPanelProps) {
  const { t, formatNumber } = useAcademicsI18n()
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState<{ studentId: string; studentName: string } | null>(null)

  const chronic = alerts.filter((a) => a.band === 'chronic').length
  const atrisk = alerts.length - chronic

  const visible = useMemo(
    () => alerts.filter((a) => (filter === 'all' ? true : a.band === filter)),
    [alerts, filter],
  )

  const filterTabs = useMemo(
    () => [
      { id: 'all', label: t('attendance.dashboard.atRisk.filterAll'), count: alerts.length },
      { id: 'chronic', label: t('attendance.dashboard.atRisk.filterChronic'), count: chronic },
      { id: 'atrisk', label: t('attendance.dashboard.atRisk.filterAtRisk'), count: atrisk },
    ],
    [alerts.length, chronic, atrisk, t],
  )

  const handleExport = () => {
    const header = [
      t('attendance.dashboard.columns.student'),
      t('attendance.dashboard.gradeLevel'),
      t('attendance.dashboard.columns.rate'),
      t('attendance.dashboard.columns.absent'),
      t('attendance.dashboard.columns.total'),
      t('attendance.dashboard.columns.trend'),
    ]
    const body = visible.map((a) => [
      a.studentName,
      a.gradeLevel ?? '',
      `${a.attendanceRate.toFixed(1)}%`,
      String(a.absentDays),
      String(a.totalDays),
      t(`attendance.dashboard.trends.${a.trend}`),
    ])
    downloadCsv('attendance-at-risk.csv', [header, ...body])
  }

  const trendClass = (trend: RankedAlert['trend']) =>
    trend === 'improving'
      ? 'text-[rgb(var(--state-success-fg))]'
      : trend === 'declining'
        ? 'text-[rgb(var(--state-danger-fg))]'
        : 'text-[rgb(var(--text-tertiary))]'

  return (
    <section className="flex h-full flex-col rounded-xl border border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-secondary))]">
      <div className="flex items-start justify-between gap-3 border-b border-[rgb(var(--border-primary)/0.3)] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-[rgb(var(--state-warning-fg))]" aria-hidden="true" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">
              {t('attendance.dashboard.atRisk.title')}
            </div>
            <div className="truncate text-2xs text-[rgb(var(--text-tertiary))]">
              {t('attendance.dashboard.atRisk.subtitle')}
            </div>
          </div>
        </div>
        {visible.length > 0 && (
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-[rgb(var(--border-primary)/0.35)] px-2.5 text-2xs font-medium text-[rgb(var(--text-secondary))] transition-colors hover:bg-[rgb(var(--background-tertiary))]"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            {t('attendance.dashboard.atRisk.export')}
          </button>
        )}
      </div>

      <div className="px-4 pt-3">
        <SegmentedControl
          tabs={filterTabs}
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
          aria-label={t('attendance.dashboard.atRisk.filterAria')}
        />
      </div>

      <div className="mt-2 max-h-96 flex-1 overflow-y-auto px-2 pb-2">
        {visible.length === 0 ? (
          <div className="py-10 text-center text-sm text-[rgb(var(--text-tertiary))]">
            {t('attendance.dashboard.atRisk.empty')}
          </div>
        ) : (
          visible.map((a) => (
            <div
              key={a.studentId}
              className="flex items-center gap-3 border-b border-[rgb(var(--border-primary)/0.15)] px-2 py-2 last:border-b-0"
            >
              <UserAvatar userId={a.studentId} userName={a.studentName} size="sm" />
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => setSelected({ studentId: a.studentId, studentName: a.studentName })}
                  className="block truncate text-left text-sm font-medium text-[rgb(var(--text-primary))] hover:underline"
                >
                  {a.studentName}
                </button>
                {a.gradeLevel && (
                  <div className="truncate text-3xs text-[rgb(var(--text-tertiary))]">{a.gradeLevel}</div>
                )}
              </div>
              <span className="hidden sm:inline">
                <AttendanceTrend
                  rate={a.attendanceRate}
                  series={trends[a.studentId]?.series ?? null}
                  trend={a.trend}
                  width={58}
                  height={22}
                  showValue={false}
                />
              </span>
              <span className="hidden w-10 text-right text-2xs tabular-nums text-[rgb(var(--text-tertiary))] sm:inline">
                {formatNumber(a.absentDays)}
                <span className="text-[rgb(var(--text-disabled))]">/{formatNumber(a.totalDays)}</span>
              </span>
              <span className={`w-16 text-right text-2xs font-semibold capitalize ${trendClass(a.trend)}`}>
                {t(`attendance.dashboard.trends.${a.trend}`)}
              </span>
              <span
                className={`w-12 text-right text-sm font-bold tabular-nums ${
                  a.attendanceRate < 70 ? 'text-[rgb(var(--state-danger-fg))]' : 'text-[rgb(var(--state-warning-fg))]'
                }`}
              >
                {a.attendanceRate.toFixed(0)}%
              </span>
            </div>
          ))
        )}
      </div>

      {selected && (
        <StudentAttendanceModal
          open={!!selected}
          onClose={() => setSelected(null)}
          studentId={selected.studentId}
          studentName={selected.studentName}
          schoolId={schoolId}
        />
      )}
    </section>
  )
}
