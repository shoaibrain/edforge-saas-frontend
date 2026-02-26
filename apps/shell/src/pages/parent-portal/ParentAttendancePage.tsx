/**
 * Parent Portal — Child's Attendance Page
 *
 * Displays attendance summary and records for the active child.
 */

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../../lib/api'
import { useAppStore } from '../../stores/app.store'
import { useShell } from '../../lib/shell-context'
import { useParentPortal } from './ParentPortalLayout'
import { Card, CardContent, CardHeader, Skeleton, Button } from '@edforge/ui'
import { CalendarCheck, CalendarX, Clock, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import type {
  StudentAttendanceSummaryDto,
  AttendanceResponseDto,
} from '@aibrains/shared-types'

type AttendanceRecord = AttendanceResponseDto & { periodName?: string }

// ============================================================================
// COMPONENT
// ============================================================================

export default function ParentAttendancePage() {
  const { activeChild } = useParentPortal()
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const { activeSchoolYear } = useShell()

  const studentId = activeChild?.studentId
  const [monthOffset, setMonthOffset] = useState(0)

  const { startDate, endDate, monthLabel } = useMemo(() => {
    const now = new Date()
    const target = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
    const start = target.toISOString().slice(0, 10)
    const end = new Date(target.getFullYear(), target.getMonth() + 1, 0).toISOString().slice(0, 10)
    const label = target.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    return { startDate: start, endDate: end, monthLabel: label }
  }, [monthOffset])

  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['parent-child-attendance-summary', studentId, activeSchoolId, activeSchoolYear?.id],
    queryFn: () =>
      apiGet<StudentAttendanceSummaryDto>(`/academics/students/${studentId}/attendance/summary`, {
        schoolId: activeSchoolId,
        ...(activeSchoolYear?.id && { academicYearId: activeSchoolYear.id }),
      }),
    enabled: !!studentId && !!activeSchoolId,
    staleTime: 5 * 60 * 1000,
  })

  const { data: recordsData, isLoading: isRecordsLoading } = useQuery({
    queryKey: ['parent-child-attendance-records', studentId, activeSchoolId, startDate, endDate],
    queryFn: () =>
      apiGet<{ items: AttendanceRecord[] }>(`/academics/students/${studentId}/attendance`, {
        schoolId: activeSchoolId,
        startDate,
        endDate,
      }),
    enabled: !!studentId && !!activeSchoolId,
    staleTime: 5 * 60 * 1000,
  })

  const records = recordsData?.items ?? []

  if (!activeChild) {
    return (
      <div className="p-6">
        <p className="text-sm text-[rgb(var(--text-secondary))]">Please select a child to view attendance.</p>
      </div>
    )
  }

  if (isSummaryLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
        {activeChild.firstName}'s Attendance
      </h1>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <SummaryCard icon={<CalendarCheck className="w-5 h-5" />} label="Total Days" value={summary.totalDays} color="gray" />
          <SummaryCard icon={<CalendarCheck className="w-5 h-5" />} label="Present" value={summary.present} color="green" />
          <SummaryCard icon={<CalendarX className="w-5 h-5" />} label="Absent" value={summary.absent} color="red" />
          <SummaryCard icon={<Clock className="w-5 h-5" />} label="Late" value={summary.late} color="amber" />
          <SummaryCard icon={<CalendarCheck className="w-5 h-5" />} label="Excused" value={summary.excused} color="blue" />
          <SummaryCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Rate"
            value={`${(summary.attendanceRate ?? 0).toFixed(1)}%`}
            color={(summary.attendanceRate ?? 0) >= 90 ? 'green' : (summary.attendanceRate ?? 0) >= 80 ? 'amber' : 'red'}
          />
        </div>
      )}

      {/* Monthly Records */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Daily Records</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setMonthOffset((p) => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-[rgb(var(--text-primary))] min-w-[140px] text-center">{monthLabel}</span>
              <Button variant="outline" size="sm" onClick={() => setMonthOffset((p) => p + 1)} disabled={monthOffset >= 0}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isRecordsLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : records.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgb(var(--border-primary))]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase">Date</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase">Status</th>
                    {records.some((r) => r.periodName || r.courseName) && (
                      <th className="text-left px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase">Period / Course</th>
                    )}
                    {records.some((r) => r.notes) && (
                      <th className="text-left px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase">Notes</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgb(var(--border-primary))]">
                  {records.map((record) => (
                    <tr key={record.attendanceId} className="hover:bg-[rgb(var(--surface-secondary))]">
                      <td className="px-4 py-3 text-sm text-[rgb(var(--text-primary))]">
                        {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <AttendanceBadge status={record.status} />
                      </td>
                      {records.some((r) => r.periodName || r.courseName) && (
                        <td className="px-4 py-3 text-sm text-[rgb(var(--text-secondary))]">{record.periodName ?? record.courseName ?? '-'}</td>
                      )}
                      {records.some((r) => r.notes) && (
                        <td className="px-4 py-3 text-sm text-[rgb(var(--text-secondary))]">{record.notes ?? '-'}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <CalendarCheck className="w-10 h-10 text-[rgb(var(--text-tertiary))] mx-auto mb-3" />
              <p className="text-sm text-[rgb(var(--text-secondary))]">No attendance records for {monthLabel}.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: 'green' | 'red' | 'amber' | 'blue' | 'gray' }) {
  const colorMap = {
    green: 'bg-green-500/10 text-green-600 dark:text-green-400',
    red: 'bg-red-500/10 text-red-600 dark:text-red-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    gray: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
  }
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color]}`}>{icon}</div>
          <div>
            <p className="text-xs text-[rgb(var(--text-secondary))]">{label}</p>
            <p className="text-lg font-bold text-[rgb(var(--text-primary))]">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AttendanceBadge({ status }: { status?: string | null }) {
  if (!status) return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">Unknown</span>
  const n = status.toLowerCase()
  let cls = 'inline-flex px-2 py-0.5 rounded-full text-xs font-medium '
  if (n === 'present') cls += 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  else if (n === 'absent') cls += 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  else if (n === 'late' || n === 'tardy') cls += 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
  else if (n === 'excused') cls += 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
  else cls += 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  return <span className={cls}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
}
