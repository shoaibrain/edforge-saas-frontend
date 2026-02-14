/**
 * AttendanceDashboard Component
 *
 * Analytics view showing school-level attendance data:
 * - Today's summary stat cards (present, absent, late, excused)
 * - 30-day attendance rate trend (Recharts area chart)
 * - Grade-level breakdown table (placeholder until enrollment integration)
 * - Student alerts (below 90% attendance threshold)
 * - CSV export button for alert data
 */

import { useMemo, useCallback } from 'react'
import {
  UserCheck,
  UserX,
  Clock,
  AlertTriangle,
  CheckCircle,
  Download,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import {
  useAttendanceSummary,
  useAttendanceTrend,
  useAttendanceAlerts,
} from '../../hooks/useAttendance'
import type { AttendanceAlert } from '../../services/academics.service'

// ============================================================================
// TYPES
// ============================================================================

interface AttendanceDashboardProps {
  schoolId: string
  academicYearId: string
  currentDate: string // ISO date string (today)
}

// ============================================================================
// STAT CARD
// ============================================================================

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  accent,
  bg,
}: {
  icon: typeof UserCheck
  label: string
  value: string | number
  subValue?: string
  accent: string
  bg: string
}) {
  return (
    <div className="bg-surface-primary rounded-xl border border-border-secondary p-5">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${bg}`}>
          <Icon className={`w-5 h-5 ${accent}`} />
        </div>
        <div>
          <p className="text-xs text-text-tertiary uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
          {subValue && <p className="text-xs text-text-secondary mt-0.5">{subValue}</p>}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SKELETON LOADERS
// ============================================================================

function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-surface-primary rounded-xl border border-border-secondary p-5 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-hover rounded-lg" />
            <div className="space-y-2">
              <div className="h-3 w-16 bg-surface-hover rounded" />
              <div className="h-6 w-12 bg-surface-hover rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SkeletonChart() {
  return (
    <div className="bg-surface-primary rounded-xl border border-border-secondary p-5 animate-pulse">
      <div className="h-4 w-48 bg-surface-hover rounded mb-4" />
      <div className="h-64 bg-surface-hover rounded" />
    </div>
  )
}

function SkeletonTable() {
  return (
    <div className="bg-surface-primary rounded-xl border border-border-secondary p-5 animate-pulse">
      <div className="h-4 w-36 bg-surface-hover rounded mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-4 w-32 bg-surface-hover rounded" />
            <div className="h-4 w-16 bg-surface-hover rounded" />
            <div className="h-4 w-16 bg-surface-hover rounded" />
            <div className="h-4 w-16 bg-surface-hover rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// RATE BADGE
// ============================================================================

function RateBadge({ rate }: { rate: number }) {
  const style =
    rate < 80
      ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
      : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {rate.toFixed(1)}%
    </span>
  )
}

// ============================================================================
// CUSTOM TOOLTIP FOR CHART
// ============================================================================

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-primary border border-border-secondary rounded-lg shadow-lg px-3 py-2">
      <p className="text-xs text-text-tertiary mb-1">{label}</p>
      <p className="text-sm font-semibold text-text-primary">
        {payload[0].value.toFixed(1)}%
      </p>
    </div>
  )
}

// ============================================================================
// CSV EXPORT
// ============================================================================

function exportAlertsCsv(alerts: AttendanceAlert[], schoolId: string) {
  const header = 'Student Name,Attendance Rate (%),Days Absent,Total Days\n'
  const rows = alerts
    .map(
      (a) =>
        `"${a.studentName}",${a.attendanceRate.toFixed(1)},${a.absentDays},${a.totalDays}`
    )
    .join('\n')

  const csv = header + rows
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `attendance-alerts-${schoolId}-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AttendanceDashboard({
  schoolId,
  academicYearId,
  currentDate,
}: AttendanceDashboardProps) {
  // ---------------------------------------------------------------------------
  // Derived dates
  // ---------------------------------------------------------------------------
  const { startDate30, startDateYear } = useMemo(() => {
    const current = new Date(currentDate)
    const thirtyDaysAgo = new Date(current)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // For alerts: use start of current academic year approximation (90 days back as fallback)
    const yearStart = new Date(current)
    yearStart.setDate(yearStart.getDate() - 90)

    return {
      startDate30: thirtyDaysAgo.toISOString().split('T')[0],
      startDateYear: yearStart.toISOString().split('T')[0],
    }
  }, [currentDate])

  // ---------------------------------------------------------------------------
  // Data hooks
  // ---------------------------------------------------------------------------
  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useAttendanceSummary({
    schoolId,
    date: currentDate,
    enabled: !!schoolId,
  })

  const {
    data: trendData,
    isLoading: trendLoading,
    error: trendError,
  } = useAttendanceTrend({
    schoolId,
    startDate: startDate30,
    endDate: currentDate,
    enabled: !!schoolId,
  })

  const {
    data: alerts,
    isLoading: alertsLoading,
    error: alertsError,
  } = useAttendanceAlerts({
    schoolId,
    academicYearId,
    threshold: 90,
    startDate: startDateYear,
    endDate: currentDate,
    enabled: !!schoolId && !!academicYearId,
  })

  // ---------------------------------------------------------------------------
  // Chart data formatting
  // ---------------------------------------------------------------------------
  const chartData = useMemo(() => {
    if (!trendData) return []
    return trendData.map((d) => {
      const date = new Date(d.date)
      return {
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        rate: d.attendanceRate,
        present: d.present,
        absent: d.absent,
        total: d.totalStudents,
      }
    })
  }, [trendData])

  // ---------------------------------------------------------------------------
  // Sorted alerts
  // ---------------------------------------------------------------------------
  const sortedAlerts = useMemo(() => {
    if (!alerts) return []
    return [...alerts].sort((a, b) => a.attendanceRate - b.attendanceRate)
  }, [alerts])

  // ---------------------------------------------------------------------------
  // CSV export handler
  // ---------------------------------------------------------------------------
  const handleExport = useCallback(() => {
    if (sortedAlerts.length > 0) {
      exportAlertsCsv(sortedAlerts, schoolId)
    }
  }, [sortedAlerts, schoolId])

  // ---------------------------------------------------------------------------
  // Computed summary values
  // ---------------------------------------------------------------------------
  const pct = useCallback(
    (count: number) => {
      if (!summary || summary.totalStudents === 0) return ''
      return `${((count / summary.totalStudents) * 100).toFixed(1)}% of ${summary.totalStudents}`
    },
    [summary]
  )

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* EXPORT BUTTON (top-right) */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleExport}
          disabled={!sortedAlerts.length}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-surface-secondary border border-border-secondary text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Export Alerts CSV
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SUMMARY STAT CARDS */}
      {/* ------------------------------------------------------------------ */}
      {summaryLoading ? (
        <SkeletonCards />
      ) : summaryError ? (
        <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-400">
          Failed to load today's attendance summary. Please try refreshing.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={UserCheck}
            label="Present"
            value={summary?.present ?? '--'}
            subValue={summary ? pct(summary.present) : undefined}
            accent="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-500/10"
          />
          <StatCard
            icon={UserX}
            label="Absent"
            value={summary?.absent ?? '--'}
            subValue={summary ? pct(summary.absent) : undefined}
            accent="text-red-600 dark:text-red-400"
            bg="bg-red-500/10"
          />
          <StatCard
            icon={Clock}
            label="Late / Tardy"
            value={summary?.late ?? '--'}
            subValue={summary ? pct(summary.late) : undefined}
            accent="text-amber-600 dark:text-amber-400"
            bg="bg-amber-500/10"
          />
          <StatCard
            icon={ShieldCheck}
            label="Excused"
            value={summary?.excused ?? '--'}
            subValue={summary ? pct(summary.excused) : undefined}
            accent="text-blue-600 dark:text-blue-400"
            bg="bg-blue-500/10"
          />
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 30-DAY ATTENDANCE TREND CHART */}
      {/* ------------------------------------------------------------------ */}
      {trendLoading ? (
        <SkeletonChart />
      ) : trendError ? (
        <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-400">
          Failed to load attendance trend data.
        </div>
      ) : (
        <div className="bg-surface-primary rounded-xl border border-border-secondary p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-teal-500" />
            <h3 className="text-sm font-semibold text-text-primary">
              30-Day Attendance Rate
            </h3>
          </div>

          {chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-text-tertiary text-sm">
              No trend data available for the selected period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border-secondary, #e5e7eb)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'var(--color-text-tertiary, #9ca3af)' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: 'var(--color-text-tertiary, #9ca3af)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  fill="url(#attendanceGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#14b8a6', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* GRADE-LEVEL BREAKDOWN TABLE (placeholder) */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-surface-primary rounded-xl border border-border-secondary p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Attendance by Grade Level
        </h3>

        {summaryLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 bg-surface-hover rounded animate-pulse" />
            ))}
          </div>
        ) : summary?.byGradeLevel && Object.keys(summary.byGradeLevel).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-secondary">
                  <th className="text-left py-2 pr-4 text-text-tertiary font-medium">Grade Level</th>
                  <th className="text-right py-2 px-4 text-text-tertiary font-medium">Students</th>
                  <th className="text-right py-2 px-4 text-text-tertiary font-medium">Present</th>
                  <th className="text-right py-2 px-4 text-text-tertiary font-medium">Absent</th>
                  <th className="text-right py-2 pl-4 text-text-tertiary font-medium">Rate</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(summary.byGradeLevel)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([grade, data]) => {
                    const rateColor =
                      data.rate >= 95
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : data.rate >= 90
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
                    return (
                      <tr key={grade} className="border-b border-border-secondary last:border-b-0">
                        <td className="py-2.5 pr-4 text-text-primary font-medium">{grade}</td>
                        <td className="py-2.5 px-4 text-right text-text-secondary">{data.total}</td>
                        <td className="py-2.5 px-4 text-right text-text-secondary">{data.present}</td>
                        <td className="py-2.5 px-4 text-right text-text-secondary">{data.absent}</td>
                        <td className={`py-2.5 pl-4 text-right font-medium ${rateColor}`}>
                          {data.rate.toFixed(1)}%
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-text-tertiary py-4 text-center">
            Grade-level data available with enrollment integration
          </p>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* STUDENT ALERTS */}
      {/* ------------------------------------------------------------------ */}
      {alertsLoading ? (
        <SkeletonTable />
      ) : alertsError ? (
        <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-400">
          Failed to load attendance alerts.
        </div>
      ) : (
        <div className="bg-surface-primary rounded-xl border border-border-secondary p-5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-text-primary">
                Attendance Alerts
              </h3>
            </div>
            {sortedAlerts.length > 0 && (
              <span className="text-xs text-text-tertiary">
                {sortedAlerts.length} student{sortedAlerts.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-xs text-text-tertiary mb-4">
            Students below 90% attendance rate
          </p>

          {sortedAlerts.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle className="w-10 h-10 mx-auto text-emerald-500 mb-3" />
              <p className="text-sm text-text-secondary">
                No students below the attendance threshold
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-secondary">
                    <th className="text-left py-2 pr-4 text-text-tertiary font-medium">
                      Student Name
                    </th>
                    <th className="text-right py-2 px-4 text-text-tertiary font-medium">
                      Attendance Rate
                    </th>
                    <th className="text-right py-2 px-4 text-text-tertiary font-medium">
                      Days Absent
                    </th>
                    <th className="text-right py-2 pl-4 text-text-tertiary font-medium">
                      Total Days
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAlerts.map((alert) => (
                    <tr
                      key={alert.studentId}
                      className="border-b border-border-secondary last:border-b-0"
                    >
                      <td className="py-2.5 pr-4 text-text-primary font-medium">
                        {alert.studentName}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <RateBadge rate={alert.attendanceRate} />
                      </td>
                      <td className="py-2.5 px-4 text-right text-text-secondary">
                        {alert.absentDays}
                      </td>
                      <td className="py-2.5 pl-4 text-right text-text-secondary">
                        {alert.totalDays}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AttendanceDashboard
