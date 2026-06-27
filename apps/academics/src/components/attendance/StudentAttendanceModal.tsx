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
import { summarizeByBucket } from './attendanceStatus'
import type { AttendanceStatus } from '../../services/academics.service'

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
  const cfg = {
    improving: { Icon: TrendingUp, text: 'Improving', cls: 'text-[rgb(var(--state-success-fg))]' },
    declining: { Icon: TrendingDown, text: 'Declining', cls: 'text-[rgb(var(--state-danger-fg))]' },
    stable: { Icon: Minus, text: 'Stable', cls: 'text-text-tertiary' },
  }[trend]
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.cls}`} title="Trend over the window (recent vs earlier)">
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
  const style =
    rate >= 95
      ? 'bg-[rgb(var(--state-success-bg)/0.18)] text-[rgb(var(--state-success-fg))] dark:bg-[rgb(var(--state-success-fg)/0.2)] '
      : rate >= 90
        ? 'bg-[rgb(var(--state-warning-bg)/0.18)] text-amber-700 dark:bg-[rgb(var(--state-warning-fg))]/20 dark:text-amber-400'
        : 'bg-[rgb(var(--state-danger-bg)/0.18)] text-[rgb(var(--state-danger-fg))] dark:bg-[rgb(var(--state-danger-fg)/0.2)] '
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${style}`}>
      {rate.toFixed(1)}%
    </span>
  )
}

// ============================================================================
// CALENDAR HEATMAP
// ============================================================================

const statusColorMap: Record<string, string> = {
  present: 'bg-[rgb(var(--state-success-fg))] dark:bg-[rgb(var(--state-success-fg))]',
  absent: 'bg-[rgb(var(--state-danger-fg))] dark:bg-[rgb(var(--state-danger-fg))]',
  late: 'bg-amber-400 dark:bg-[rgb(var(--state-warning-fg))]',
  tardy: 'bg-amber-400 dark:bg-[rgb(var(--state-warning-fg))]',
  excused: 'bg-[rgb(var(--state-info-fg))] dark:bg-[rgb(var(--state-info-fg))]',
  half_day: 'bg-[rgb(var(--state-info-fg))] dark:bg-[rgb(var(--state-info-fg))]',
  remote: 'bg-[rgb(var(--state-info-fg))] dark:bg-[rgb(var(--state-info-fg))]',
  early_departure: 'bg-[rgb(var(--state-warning-fg))] dark:bg-[rgb(var(--state-warning-fg))]',
}

function CalendarHeatmap({
  records,
}: {
  records: Array<{ date: string; status: AttendanceStatus }>
}) {
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
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        status: recordMap.get(iso),
      })
    }
    return grid
  }, [records])

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-3.5 h-3.5 text-text-tertiary" />
        <span className="text-xs text-text-tertiary font-medium">Last 30 Days</span>
      </div>
      <div className="grid grid-cols-10 gap-1">
        {days.map((day) => (
          <div
            key={day.date}
            className={`w-full aspect-square rounded-sm ${
              day.status
                ? statusColorMap[day.status] || 'bg-[rgb(var(--border-secondary))] '
                : 'bg-[rgb(var(--background-tertiary))] '
            }`}
            title={`${day.label}: ${day.status || 'No record'}`}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2">
        {[
          { label: 'Present', color: 'bg-[rgb(var(--state-success-fg))]' },
          { label: 'Absent', color: 'bg-[rgb(var(--state-danger-fg))]' },
          { label: 'Late', color: 'bg-amber-400' },
          { label: 'Excused', color: 'bg-[rgb(var(--state-info-fg))]' },
          { label: 'No Record', color: 'bg-[rgb(var(--background-tertiary))] ' },
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
                          <SummaryStatRow label="Total" value={summary.totalDays} />
                          <SummaryStatRow
                            label="Present"
                            value={summary.present}
                            color="text-[rgb(var(--state-success-fg))]"
                          />
                          <SummaryStatRow
                            label="Absent"
                            value={summary.absent}
                            color="text-[rgb(var(--state-danger-fg))]"
                          />
                          <SummaryStatRow
                            label="Late"
                            value={summary.late}
                            color="text-[rgb(var(--state-warning-fg))]"
                          />
                          <SummaryStatRow
                            label="Excused"
                            value={summary.excused}
                            color="text-[rgb(var(--state-info-fg))]"
                          />
                          <SummaryStatRow
                            label="Rate"
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
                          Recent Records
                        </h4>
                        {recentRecords.length === 0 ? (
                          <p className="text-sm text-text-tertiary py-4 text-center">
                            No attendance records found.
                          </p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border-secondary">
                                  <th className="text-left py-1.5 pr-4 text-text-tertiary font-medium text-xs">
                                    Date
                                  </th>
                                  <th className="text-left py-1.5 px-4 text-text-tertiary font-medium text-xs">
                                    Status
                                  </th>
                                  <th className="text-left py-1.5 pl-4 text-text-tertiary font-medium text-xs">
                                    Notes
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {recentRecords.map((record) => {
                                  const d = new Date(record.date)
                                  const dateLabel = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
                                  return (
                                    <tr
                                      key={record.date}
                                      className="border-b border-border-secondary last:border-b-0"
                                    >
                                      <td className="py-2 pr-4 text-text-primary text-xs">
                                        {dateLabel}
                                      </td>
                                      <td className="py-2 px-4">
                                        <StatusBadge
                                          status={record.status as AttendanceStatus}
                                          variant="compact"
                                        />
                                      </td>
                                      <td className="py-2 pl-4 text-text-secondary text-xs truncate max-w-40">
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
                    Close
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
