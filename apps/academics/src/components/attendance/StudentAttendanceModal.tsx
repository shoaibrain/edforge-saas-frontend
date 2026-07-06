/**
 * StudentAttendanceModal Component (Task 3.4)
 *
 * Drill-down modal for student attendance details.
 * Opens when clicking a student name in the alerts table.
 *
 * Sections:
 *  - Header: student name + overall rate badge
 *  - Summary row: total days, present, absent, late, excused, rate
 *  - Calendar heatmap: last 30 days colored cells
 *  - Recent records table: last 10 with date, status badge, notes
 */

import { Fragment, useMemo } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  useStudentAttendance,
  useStudentAttendanceSummary,
} from '../../hooks/useAttendance'
import { StatusBadge } from './StatusBadge'
import { ATTENDANCE_STATUS_META, TONE_CLASSES, summarizeByBucket } from './attendanceStatus'
import type { AttendanceStatus } from '../../services/academics.service'
import { useAcademicsI18n } from '../../lib/i18n'

// ============================================================================
// TREND (F3.T1) — recent-half vs older-half attending rate over the window.
// Self-contained from the fetched history; no extra request.
// ============================================================================

type Trend = 'improving' | 'declining' | 'stable'

function halfAttendingRate(rows: Array<{ status: AttendanceStatus }>): number | null {
  const b = summarizeByBucket(rows.map((r) => r.status))
  if (b.total === 0) return null
  return (b.present / b.total) * 100
}

function computeTrend(history: Array<{ date: string; status: AttendanceStatus }>): Trend | null {
  if (history.length < 4) return null
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date))
  const mid = Math.floor(sorted.length / 2)
  const older = halfAttendingRate(sorted.slice(0, mid))
  const recent = halfAttendingRate(sorted.slice(mid))
  if (older == null || recent == null) return null
  const delta = recent - older
  if (delta > 5) return 'improving'
  if (delta < -5) return 'declining'
  return 'stable'
}

function TrendChip({ trend }: { trend: Trend }) {
  const { t } = useAcademicsI18n()
  const cfg = {
    improving: { Icon: TrendingUp, text: t('attendance.modal.trends.improving'), cls: 'text-[rgb(var(--state-success-fg))]' },
    declining: { Icon: TrendingDown, text: t('attendance.modal.trends.declining'), cls: 'text-[rgb(var(--state-danger-fg))]' },
    stable: { Icon: Minus, text: t('attendance.modal.trends.stable'), cls: 'text-text-tertiary' },
  }[trend]
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.cls}`} title={t('attendance.modal.trendTitle')}>
      <cfg.Icon className="w-3.5 h-3.5" />
      {cfg.text}
    </span>
  )
}

interface StudentAttendanceModalProps {
  open: boolean
  onClose: () => void
  studentId: string
  studentName: string
  schoolId: string
}

// ============================================================================
// RATE BADGE (local, same as dashboard)
// ============================================================================

function RateBadge({ rate }: { rate: number }) {
  // Derive from the single tone source so the badge can't drift (and to drop the
  // hardcoded amber-700/amber-400 that diverged from the Tardy/warning amber).
  const tone: 'success' | 'warning' | 'danger' = rate >= 95 ? 'success' : rate >= 90 ? 'warning' : 'danger'
  const style = `${TONE_CLASSES[tone].badgeBg} ${TONE_CLASSES[tone].fg}`
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${style}`}>
      {rate.toFixed(1)}%
    </span>
  )
}

// ============================================================================
// CALENDAR HEATMAP
// ============================================================================

// Heatmap cell + legend colors derive from the single status source
// (attendanceStatus.ts) so they can't drift from the badges/summary. Warning
// (Tardy / early-departure) resolves to the amber `--state-warning-border` via
// `TONE_CLASSES.warning.dot`, keeping it amber in both light and dark — replacing
// the old hardcoded `bg-amber-400`.
const statusCellColor = (status: string): string => {
  const key = (status === 'tardy' ? 'late' : status) as AttendanceStatus
  const meta = ATTENDANCE_STATUS_META[key]
  return meta ? TONE_CLASSES[meta.tone].dot : 'bg-[rgb(var(--border-secondary))]'
}

function CalendarHeatmap({
  records,
}: {
  records: Array<{ date: string; status: AttendanceStatus }>
}) {
  const { t, formatDate, attendanceStatusLabel } = useAcademicsI18n()
  // Build last 30 days grid
  const days = useMemo(() => {
    const today = new Date()
    const grid: Array<{ date: string; label: string; status?: AttendanceStatus }> = []
    const recordMap = new Map(records.map((r) => [r.date, r.status]))

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const iso = d.toISOString().split('T')[0]
      grid.push({
        date: iso,
        label: formatDate(d, { month: 'numeric', day: 'numeric' }),
        status: recordMap.get(iso),
      })
    }
    return grid
  }, [records])

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-3.5 h-3.5 text-text-tertiary" />
        <span className="text-xs text-text-tertiary font-medium">{t('attendance.modal.last30Days')}</span>
      </div>
      <div className="grid grid-cols-10 gap-1">
        {days.map((day) => (
          <div
            key={day.date}
            className={`w-full aspect-square rounded-sm ${
              day.status
                ? statusCellColor(day.status)
                : 'bg-[rgb(var(--background-tertiary))] '
            }`}
            title={`${day.label}: ${day.status ? attendanceStatusLabel(day.status) : t('attendance.modal.noRecord')}`}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2">
        {[
          { label: attendanceStatusLabel('present'), color: statusCellColor('present') },
          { label: attendanceStatusLabel('absent'), color: statusCellColor('absent') },
          { label: attendanceStatusLabel('late'), color: statusCellColor('late') },
          { label: attendanceStatusLabel('excused'), color: statusCellColor('excused') },
          { label: t('attendance.modal.noRecord'), color: 'bg-[rgb(var(--background-tertiary))] ' },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1 text-xs text-text-tertiary">
            <span className={`w-2 h-2 rounded-sm ${item.color}`} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// SUMMARY STAT ROW
// ============================================================================

function SummaryStatRow({
  label,
  value,
  color,
}: {
  label: string
  value: number | string
  color?: string
}) {
  return (
    <div className="text-center">
      <p className={`text-lg font-bold ${color || 'text-text-primary'}`}>{value}</p>
      <p className="text-xs text-text-tertiary uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  )
}

// ============================================================================
// SKELETON
// ============================================================================

function ModalSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-surface-hover" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-surface-hover rounded" />
          <div className="h-3 w-20 bg-surface-hover rounded" />
        </div>
      </div>
      <div className="grid grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-surface-hover rounded" />
        ))}
      </div>
      <div className="h-24 bg-surface-hover rounded" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 bg-surface-hover rounded" />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// MAIN MODAL
// ============================================================================

export function StudentAttendanceModal({
  open,
  onClose,
  studentId,
  studentName,
  schoolId: _schoolId,
}: StudentAttendanceModalProps) {
  const { t, formatDate, formatNumber } = useAcademicsI18n()
  // Compute date range: last 90 days
  const { startDate, endDate } = useMemo(() => {
    const today = new Date()
    const start = new Date(today)
    start.setDate(start.getDate() - 90)
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    }
  }, [])

  // Fetch student attendance history
  const {
    data: history,
    isLoading: historyLoading,
  } = useStudentAttendance({
    studentId,
    startDate,
    endDate,
    enabled: open && !!studentId,
  })

  // Fetch student summary
  const {
    data: summary,
    isLoading: summaryLoading,
  } = useStudentAttendanceSummary({
    studentId,
    enabled: open && !!studentId,
  })

  const isLoading = historyLoading || summaryLoading

  // Recent records (last 10)
  const recentRecords = useMemo(() => {
    if (!history) return []
    return [...history]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10)
  }, [history])

  // Heatmap records
  const heatmapRecords = useMemo(() => {
    if (!history) return []
    return history.map((r) => ({
      date: r.date,
      status: r.status as AttendanceStatus,
    }))
  }, [history])

  // F3.T1 — directional trend for the student detail.
  const trend = useMemo(() => computeTrend(heatmapRecords), [heatmapRecords])

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-[rgb(var(--background-overlay)/0.40)] backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-surface-primary border border-border-primary shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border-secondary">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[rgb(var(--state-info-bg)/0.18)] flex items-center justify-center text-sm font-bold text-[rgb(var(--action-secondary-fg))]">
                      {studentName
                        .split(' ')
                        .map((w) => w[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-text-primary">
                        {studentName}
                      </Dialog.Title>
                      {summary && (
                        <div className="mt-0.5 flex items-center gap-2">
                          <RateBadge rate={summary.attendanceRate} />
                          {trend && <TrendChip trend={trend} />}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-5 max-h-[65vh] overflow-y-auto">
                  {isLoading ? (
                    <ModalSkeleton />
                  ) : (
                    <div className="space-y-6">
                      {/* Summary Stats Row */}
                      {summary && (
                        <div className="grid grid-cols-6 gap-2 p-4 bg-surface-secondary rounded-xl">
                          <SummaryStatRow label={t('attendance.modal.total')} value={formatNumber(summary.totalDays)} />
                          <SummaryStatRow
                            label={t('attendance.status.present.label')}
                            value={formatNumber(summary.present)}
                            color="text-[rgb(var(--state-success-fg))]"
                          />
                          <SummaryStatRow
                            label={t('attendance.status.absent.label')}
                            value={formatNumber(summary.absent)}
                            color="text-[rgb(var(--state-danger-fg))]"
                          />
                          <SummaryStatRow
                            label={t('attendance.status.late.label')}
                            value={formatNumber(summary.late)}
                            color="text-[rgb(var(--state-warning-fg))]"
                          />
                          <SummaryStatRow
                            label={t('attendance.status.excused.label')}
                            value={formatNumber(summary.excused)}
                            color="text-[rgb(var(--state-info-fg))]"
                          />
                          <SummaryStatRow
                            label={t('attendance.modal.rate')}
                            value={`${summary.attendanceRate.toFixed(1)}%`}
                            color={
                              summary.attendanceRate >= 90
                                ? 'text-[rgb(var(--state-success-fg))]'
                                : 'text-[rgb(var(--state-danger-fg))]'
                            }
                          />
                        </div>
                      )}

                      {/* Calendar Heatmap */}
                      <CalendarHeatmap records={heatmapRecords} />

                      {/* Recent Records Table */}
                      <div>
                        <h4 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">
                          {t('attendance.modal.recentRecords')}
                        </h4>
                        {recentRecords.length === 0 ? (
                          <p className="text-sm text-text-tertiary py-4 text-center">
                            {t('attendance.modal.noRecords')}
                          </p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border-secondary">
                                  <th className="text-start py-1.5 pe-4 text-text-tertiary font-medium text-xs">
                                    {t('attendance.modal.date')}
                                  </th>
                                  <th className="text-start py-1.5 px-4 text-text-tertiary font-medium text-xs">
                                    {t('attendance.modal.status')}
                                  </th>
                                  <th className="text-start py-1.5 ps-4 text-text-tertiary font-medium text-xs">
                                    {t('attendance.modal.notes')}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {recentRecords.map((record) => {
                                  const dateLabel = formatDate(record.date, { year: 'numeric', month: 'numeric', day: 'numeric' })
                                  return (
                                    <tr
                                      key={record.date}
                                      className="border-b border-border-secondary last:border-b-0"
                                    >
                                      <td className="py-2 pe-4 text-text-primary text-xs">
                                        {dateLabel}
                                      </td>
                                      <td className="py-2 px-4">
                                        <StatusBadge
                                          status={record.status as AttendanceStatus}
                                          variant="compact"
                                        />
                                      </td>
                                      <td className="py-2 ps-4 text-text-secondary text-xs truncate max-w-40">
                                        {record.notes || '—'}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border-secondary flex justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-surface-secondary border border-border-secondary text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                  >
                    {t('attendance.modal.close')}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
