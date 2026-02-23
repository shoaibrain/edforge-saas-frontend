/**
 * AttendanceDashboard Component
 *
 * Sprint 2 + Sprint 3 redesign: Rich analytics dashboard powered by
 * the single `useAttendanceOverview` aggregate endpoint.
 *
 * Sections:
 *  - Stat cards with trend indicators (2.5)
 *  - Grade-level breakdown table with sorting (2.3)
 *  - Section completion donut + table (2.4, 2.6)
 *  - 30-day trend chart with enhanced tooltip + reference line (3.1)
 *  - Absence breakdown pills (2.7)
 *  - Day-of-week pattern heatmap (2.8)
 *  - Sortable alerts table with trend arrows (3.2)
 *  - Export dropdown with 3 options (3.5)
 *  - Loading skeletons for every section (2.9)
 */

import { useState, useMemo, useCallback, useRef, useEffect, Component, type ReactNode, type ErrorInfo, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import {
  UserCheck,
  UserX,
  Clock,
  AlertTriangle,
  CheckCircle,
  Download,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  BarChart3,
  ChevronUp,
  ChevronDown,
  MoreVertical,
  FileSpreadsheet,
  FileText,
  Activity,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { useAttendanceOverview } from '../../hooks/useAttendance'
import { StudentAttendanceModal } from '../../components/attendance/StudentAttendanceModal'
import { toBSString, toBSShort, BS_MONTH_NAMES, adToBS } from '../../lib/bikram-sambat'
import type {
  AttendanceAlert,
  AttendanceOverviewResponse,
} from '../../services/academics.service'

// ============================================================================
// TYPES
// ============================================================================

interface AttendanceDashboardProps {
  schoolId: string
  academicYearId: string
  currentDate: string
  exportPortalRef?: RefObject<HTMLDivElement | null>
}

type SortDir = 'asc' | 'desc'

/** Natural sort order for grade levels: PK, K, 1-12, then alphabetic */
function gradeSort(grade: string): number {
  const g = grade.trim().toUpperCase()
  if (g === 'PK' || g === 'PRE-K') return -2
  if (g === 'K' || g === 'KINDERGARTEN') return -1
  const num = parseInt(g, 10)
  if (!isNaN(num)) return num
  return 100 // Unclassified and other labels sort last
}

// ============================================================================
// CHART ERROR BOUNDARY (Task 5.4)
// ============================================================================

interface ChartErrorBoundaryState {
  hasError: boolean
}

class ChartErrorBoundary extends Component<
  { children: ReactNode; fallbackMessage?: string },
  ChartErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallbackMessage?: string }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ChartErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Chart render error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-6 text-center">
          <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
            {this.props.fallbackMessage || 'Chart could not be rendered. Please refresh.'}
          </p>
        </div>
      )
    }
    return this.props.children
  }
}

// ============================================================================
// STAT CARD (Task 2.5)
// ============================================================================

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  accent,
  bg,
  trend,
}: {
  icon: typeof UserCheck
  label: string
  value: string | number
  subValue?: string
  accent: string
  bg: string
  trend?: { delta: number; direction: 'up' | 'down' | 'neutral' }
}) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-surface-primary border border-border-secondary min-w-0">
      <div className={`p-1.5 rounded-md ${bg} shrink-0`}>
        <Icon className={`w-4 h-4 ${accent}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-text-tertiary uppercase tracking-wide leading-tight">{label}</p>
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-bold text-text-primary leading-tight">{value}</span>
          {trend && trend.direction !== 'neutral' && (
            <span
              className={`flex items-center gap-0.5 text-[10px] font-medium ${
                trend.direction === 'up'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {trend.direction === 'up' ? (
                <TrendingUp className="w-2.5 h-2.5" />
              ) : (
                <TrendingDown className="w-2.5 h-2.5" />
              )}
              {Math.abs(trend.delta).toFixed(1)}%
            </span>
          )}
        </div>
        {subValue && <p className="text-[10px] text-text-secondary leading-tight truncate">{subValue}</p>}
      </div>
    </div>
  )
}

// ============================================================================
// SKELETON LOADERS (Task 2.9)
// ============================================================================

function SkeletonStatCards() {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-surface-primary border border-border-secondary animate-pulse"
        >
          <div className="w-7 h-7 bg-surface-hover rounded-md" />
          <div className="space-y-1">
            <div className="h-2.5 w-12 bg-surface-hover rounded" />
            <div className="h-4 w-8 bg-surface-hover rounded" />
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

function SkeletonGradeTable() {
  return (
    <div className="bg-surface-primary rounded-xl border border-border-secondary p-5 animate-pulse">
      <div className="h-4 w-44 bg-surface-hover rounded mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-4 w-24 bg-surface-hover rounded" />
            <div className="h-4 w-16 bg-surface-hover rounded" />
            <div className="h-4 w-16 bg-surface-hover rounded" />
            <div className="h-4 w-16 bg-surface-hover rounded" />
            <div className="h-4 w-16 bg-surface-hover rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

function SkeletonSectionTable() {
  return (
    <div className="bg-surface-primary rounded-xl border border-border-secondary p-5 animate-pulse">
      <div className="h-4 w-44 bg-surface-hover rounded mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-4 w-40 bg-surface-hover rounded" />
            <div className="h-4 w-16 bg-surface-hover rounded" />
            <div className="h-4 w-16 bg-surface-hover rounded" />
            <div className="h-4 w-20 bg-surface-hover rounded" />
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
    rate >= 95
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
      : rate >= 90
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
        : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {rate.toFixed(1)}%
    </span>
  )
}

// ============================================================================
// TREND TOOLTIP (Task 3.1)
// ============================================================================

function TrendTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-surface-primary border border-border-secondary rounded-lg shadow-lg px-4 py-3 min-w-[160px]">
      <p className="text-xs text-text-tertiary mb-1 font-medium">{label}</p>
      {/* Task 5.6: Show BS date in tooltip */}
      {d.bsDate && (
        <p className="text-[10px] text-text-tertiary mb-2">{d.bsDate} BS</p>
      )}
      <p className="text-lg font-bold text-text-primary mb-2">
        {d.rate?.toFixed(1)}%
      </p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-text-tertiary">Present</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">{d.present ?? '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-tertiary">Absent</span>
          <span className="text-red-600 dark:text-red-400 font-medium">{d.absent ?? '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-tertiary">Late</span>
          <span className="text-amber-600 dark:text-amber-400 font-medium">{d.late ?? '—'}</span>
        </div>
        <div className="flex justify-between border-t border-border-secondary pt-1 mt-1">
          <span className="text-text-tertiary">Total Students</span>
          <span className="text-text-primary font-medium">{d.total ?? '—'}</span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SECTION COMPLETION TABLE (Task 2.4)
// ============================================================================

type SectionSortKey = 'courseName' | 'studentCount' | 'recordedCount' | 'status'

function SectionCompletionTable({
  sections,
}: {
  sections: AttendanceOverviewResponse['sectionCompletion']['sections']
}) {
  const [sortKey, setSortKey] = useState<SectionSortKey>('courseName')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const toggleSort = (key: SectionSortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    const list = [...sections]
    list.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'courseName':
          cmp = `${a.courseName} ${a.sectionNumber}`.localeCompare(`${b.courseName} ${b.sectionNumber}`)
          break
        case 'studentCount':
          cmp = a.studentCount - b.studentCount
          break
        case 'recordedCount':
          cmp = a.recordedCount - b.recordedCount
          break
        case 'status': {
          const aVal = a.isComplete ? 2 : a.recordedCount > 0 ? 1 : 0
          const bVal = b.isComplete ? 2 : b.recordedCount > 0 ? 1 : 0
          cmp = aVal - bVal
          break
        }
      }
      return sortDir === 'desc' ? -cmp : cmp
    })
    return list
  }, [sections, sortKey, sortDir])

  const SortHeader = ({ label, field }: { label: string; field: SectionSortKey }) => (
    <th
      className="py-2 px-4 text-text-tertiary font-medium cursor-pointer select-none hover:text-text-secondary transition-colors"
      onClick={() => toggleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === field && (
          sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        )}
      </span>
    </th>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-secondary">
            <SortHeader label="Section" field="courseName" />
            <SortHeader label="Enrolled" field="studentCount" />
            <SortHeader label="Recorded" field="recordedCount" />
            <SortHeader label="Status" field="status" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((s) => {
            const statusColor = s.isComplete
              ? 'text-emerald-600 dark:text-emerald-400'
              : s.recordedCount > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-text-tertiary'
            const statusLabel = s.isComplete
              ? 'Complete'
              : s.recordedCount > 0
                ? 'Partial'
                : 'Not Started'
            return (
              <tr key={s.sectionId} className="border-b border-border-secondary last:border-b-0">
                <td className="py-2.5 px-4 text-text-primary font-medium">
                  {s.courseName} — {s.sectionNumber}
                </td>
                <td className="py-2.5 px-4 text-right text-text-secondary">{s.studentCount}</td>
                <td className="py-2.5 px-4 text-right text-text-secondary">{s.recordedCount}</td>
                <td className={`py-2.5 px-4 text-right font-medium ${statusColor}`}>
                  <span className="inline-flex items-center gap-1.5">
                    {s.isComplete && <CheckCircle className="w-3.5 h-3.5" />}
                    {statusLabel}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ============================================================================
// ALERTS TABLE (Task 3.2)
// ============================================================================

type AlertSortKey = 'studentName' | 'attendanceRate' | 'absentDays' | 'totalDays' | 'trend'

function AlertsTable({
  alerts,
  totalAtRiskCount,
  onStudentClick,
}: {
  alerts: AttendanceAlert[]
  totalAtRiskCount: number
  onStudentClick?: (studentId: string) => void
}) {
  const [sortKey, setSortKey] = useState<AlertSortKey>('attendanceRate')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const toggleSort = (key: AlertSortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    const list = [...alerts]
    list.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'studentName':
          cmp = a.studentName.localeCompare(b.studentName)
          break
        case 'attendanceRate':
          cmp = a.attendanceRate - b.attendanceRate
          break
        case 'absentDays':
          cmp = a.absentDays - b.absentDays
          break
        case 'totalDays':
          cmp = a.totalDays - b.totalDays
          break
        case 'trend': {
          const order = { declining: 0, stable: 1, improving: 2 }
          cmp = (order[a.trend] ?? 1) - (order[b.trend] ?? 1)
          break
        }
      }
      return sortDir === 'desc' ? -cmp : cmp
    })
    return list
  }, [alerts, sortKey, sortDir])

  const SortHeader = ({
    label,
    field,
    align = 'left',
  }: {
    label: string
    field: AlertSortKey
    align?: 'left' | 'right'
  }) => (
    <th
      className={`py-2 px-4 text-text-tertiary font-medium cursor-pointer select-none hover:text-text-secondary transition-colors ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
      onClick={() => toggleSort(field)}
    >
      <span className={`inline-flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        {label}
        {sortKey === field && (
          sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        )}
      </span>
    </th>
  )

  const trendIndicator = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">↑ Improving</span>
      case 'declining':
        return <span className="text-red-600 dark:text-red-400 text-xs font-medium">↓ Declining</span>
      default:
        return <span className="text-text-tertiary text-xs font-medium">→ Stable</span>
    }
  }

  return (
    <div className="bg-surface-primary rounded-xl border border-border-secondary p-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-text-primary">Attendance Alerts</h3>
        </div>
        {alerts.length > 0 && (
          <span className="text-xs text-text-tertiary">
            Showing {alerts.length} of {totalAtRiskCount} at-risk student{totalAtRiskCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <p className="text-xs text-text-tertiary mb-3">Students below 90% attendance rate</p>

      {alerts.length === 0 ? (
        <div className="py-8 text-center">
          <CheckCircle className="w-10 h-10 mx-auto text-emerald-500 mb-3" />
          <p className="text-sm text-text-secondary">No students below the attendance threshold</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-secondary">
                <SortHeader label="Student Name" field="studentName" />
                <SortHeader label="Rate" field="attendanceRate" align="right" />
                <SortHeader label="Absent" field="absentDays" align="right" />
                <SortHeader label="Total" field="totalDays" align="right" />
                <SortHeader label="Trend" field="trend" align="right" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((alert) => (
                <tr
                  key={alert.studentId}
                  className="border-b border-border-secondary last:border-b-0 hover:bg-surface-hover/50 transition-colors"
                >
                  <td className="py-2.5 px-4 text-text-primary font-medium">
                    <button
                      type="button"
                      className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left"
                      onClick={() => onStudentClick?.(alert.studentId)}
                    >
                      {alert.studentName}
                    </button>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <RateBadge rate={alert.attendanceRate} />
                  </td>
                  <td className="py-2.5 px-4 text-right text-text-secondary">{alert.absentDays}</td>
                  <td className="py-2.5 px-4 text-right text-text-secondary">{alert.totalDays}</td>
                  <td className="py-2.5 px-4 text-right">{trendIndicator(alert.trend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// EXPORT DROPDOWN (Task 3.5)
// ============================================================================

function ExportDropdown({
  data,
  schoolId,
}: {
  data: AttendanceOverviewResponse | undefined
  schoolId: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const dateStr = new Date().toISOString().split('T')[0]

  const downloadCsv = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setOpen(false)
  }

  const exportAlerts = () => {
    if (!data?.atRiskStudents?.length) return
    const header = 'Student Name,Grade Level,Attendance Rate (%),Days Absent,Total Days,Trend\n'
    const rows = data.atRiskStudents
      .map(
        (a) =>
          `"${a.studentName}","${a.gradeLevel || ''}",${a.attendanceRate.toFixed(1)},${a.absentDays},${a.totalDays},"${a.trend}"`
      )
      .join('\n')
    downloadCsv(header + rows, `attendance-alerts-${schoolId}-${dateStr}.csv`)
  }

  const exportDailyRegister = () => {
    if (!data?.todaySummary) return
    const s = data.todaySummary
    // Task 5.6: Include BS date in daily register export
    const bsDate = toBSString(s.date)
    let csv = `Daily Attendance Register — ${s.date} (${bsDate} BS)\n`
    csv += `School ID,${s.schoolId}\n`
    csv += `Total Students,${s.totalStudents}\n`
    csv += `Total Recorded,${s.totalRecorded ?? s.totalStudents}\n`
    csv += `Present,${s.present}\n`
    csv += `Absent,${s.absent}\n`
    csv += `Late,${s.late}\n`
    csv += `Excused,${s.excused}\n`
    csv += `Half Day,${s.halfDay}\n`
    csv += `Attendance Rate,${s.attendanceRate}%\n`
    if (s.byGradeLevel) {
      csv += '\nGrade Level,Total,Present,Absent,Rate\n'
      for (const [grade, d] of Object.entries(s.byGradeLevel).sort(([a], [b]) => gradeSort(a) - gradeSort(b))) {
        csv += `"${grade}",${d.total},${d.present},${d.absent},${d.rate.toFixed(1)}%\n`
      }
    }
    downloadCsv(csv, `daily-register-${schoolId}-${dateStr}.csv`)
  }

  const exportTrend = () => {
    if (!data?.trend?.length) return
    // Task 5.6: Include BS date column in trend export
    const header = 'Date,BS Date,Total Students,Present,Absent,Late,Excused,Half Day,Rate (%)\n'
    const rows = data.trend
      .map(
        (d) =>
          `${d.date},${toBSString(d.date)},${d.totalStudents},${d.present},${d.absent},${d.late},${d.excused},${d.halfDay},${d.attendanceRate.toFixed(1)}`
      )
      .join('\n')
    downloadCsv(header + rows, `attendance-trend-${schoolId}-${dateStr}.csv`)
  }

  // Task 5.7: Government-format monthly attendance register (Nepal MoE format)
  const exportMonthlyRegister = () => {
    if (!data?.trend?.length || !data?.todaySummary) return

    const bs = adToBS(data.todaySummary.date)
    const bsYear = String(bs.year)
    const bsMonth = String(bs.month).padStart(2, '0')
    const bsMonthName = BS_MONTH_NAMES[bs.month - 1] || bsMonth

    let csv = `Monthly Attendance Register — Nepal Ministry of Education Format\n`
    csv += `School ID,${schoolId}\n`
    csv += `Month,"${bsMonthName} ${bsYear} BS"\n`
    csv += `Generated,${new Date().toISOString().split('T')[0]}\n\n`

    // Group trend data by grade level from today's summary
    if (data.todaySummary.byGradeLevel) {
      const grades = Object.entries(data.todaySummary.byGradeLevel).sort(([a], [b]) => gradeSort(a) - gradeSort(b))

      csv += `Grade Level Summary\n`
      csv += `Grade,Total Enrolled,Present Today,Absent Today,Attendance Rate\n`
      for (const [grade, d] of grades) {
        csv += `"${grade}",${d.total},${d.present},${d.absent},${d.rate.toFixed(1)}%\n`
      }
      csv += '\n'
    }

    // Monthly trend data with BS dates
    csv += `Daily Attendance Log\n`
    csv += `AD Date,BS Date,Day,Total Students,Present,Absent,Late,Excused,Half Day,Rate (%)\n`
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    for (const d of data.trend) {
      const dayOfWeek = dayNames[new Date(d.date).getDay()]
      csv += `${d.date},${toBSString(d.date)},${dayOfWeek},${d.totalStudents},${d.present},${d.absent},${d.late},${d.excused},${d.halfDay},${d.attendanceRate.toFixed(1)}\n`
    }

    // Monthly summary
    csv += '\n'
    csv += `Monthly Summary\n`
    const totalDays = data.trend.length
    const avgRate = data.trend.reduce((sum, d) => sum + d.attendanceRate, 0) / (totalDays || 1)
    const totalPresent = data.trend.reduce((sum, d) => sum + d.present, 0)
    const totalAbsent = data.trend.reduce((sum, d) => sum + d.absent, 0)
    csv += `Total Instructional Days,${totalDays}\n`
    csv += `Average Attendance Rate,${avgRate.toFixed(1)}%\n`
    csv += `Total Present (student-days),${totalPresent}\n`
    csv += `Total Absent (student-days),${totalAbsent}\n`

    downloadCsv(csv, `monthly-register-moe-${schoolId}-${bsYear}-${bsMonth}.csv`)
  }

  const options = [
    {
      label: 'Export Alerts CSV',
      icon: AlertTriangle,
      onClick: exportAlerts,
      disabled: !data?.atRiskStudents?.length,
    },
    {
      label: 'Export Daily Register',
      icon: FileSpreadsheet,
      onClick: exportDailyRegister,
      disabled: !data?.todaySummary,
    },
    {
      label: 'Export Trend Data',
      icon: FileText,
      onClick: exportTrend,
      disabled: !data?.trend?.length,
    },
    {
      label: 'Monthly Register (MoE)',
      icon: FileSpreadsheet,
      onClick: exportMonthlyRegister,
      disabled: !data?.trend?.length || !data?.todaySummary,
    },
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-surface-secondary border border-border-secondary text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
      >
        <Download className="w-4 h-4" />
        Export
        <MoreVertical className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-56 bg-surface-primary border border-border-secondary rounded-lg shadow-lg z-20 py-1">
          {options.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={opt.onClick}
              disabled={opt.disabled}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <opt.icon className="w-4 h-4" />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// COMPLETION DONUT (Task 2.6)
// ============================================================================

const DONUT_COLORS = ['#14b8a6', '#e5e7eb'] // teal, gray

function CompletionDonut({
  completed,
  total,
}: {
  completed: number
  total: number
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const chartData = [
    { name: 'Completed', value: completed },
    { name: 'Pending', value: Math.max(0, total - completed) },
  ]

  return (
    <div className="relative flex items-center justify-center">
      <ChartErrorBoundary fallbackMessage="Completion chart could not be rendered.">
      <ResponsiveContainer width={180} height={180}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            startAngle={90}
            endAngle={-270}
            isAnimationActive={true}
            animationDuration={600}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={DONUT_COLORS[i]} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              return (
                <div className="bg-surface-primary border border-border-secondary rounded-lg shadow-lg px-3 py-2 text-xs">
                  <span className="font-medium">{payload[0].name}:</span> {payload[0].value} section{(payload[0].value as number) !== 1 ? 's' : ''}
                </div>
              )
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      </ChartErrorBoundary>
      {/* Center overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold text-text-primary">{pct}%</span>
        <span className="text-xs text-text-tertiary">
          {completed}/{total}
        </span>
      </div>
    </div>
  )
}

// ============================================================================
// ABSENCE BREAKDOWN (Task 2.7)
// ============================================================================

function AbsenceBreakdown({
  breakdown,
  totalAbsent,
}: {
  breakdown: AttendanceOverviewResponse['absenceBreakdown']
  totalAbsent: number
}) {
  const categories = [
    { label: 'Unexcused', count: breakdown.unexcused, bar: 'bg-red-500', dot: 'bg-red-500' },
    { label: 'Excused', count: breakdown.excused, bar: 'bg-blue-500', dot: 'bg-blue-500' },
    { label: 'Late', count: breakdown.late, bar: 'bg-amber-500', dot: 'bg-amber-500' },
    { label: 'Half Day', count: breakdown.halfDay, bar: 'bg-purple-500', dot: 'bg-purple-500' },
    { label: 'Remote', count: breakdown.remote, bar: 'bg-indigo-500', dot: 'bg-indigo-500' },
  ]
  const nonZero = categories.filter((c) => c.count > 0)

  if (totalAbsent === 0) {
    return <p className="text-xs text-text-tertiary">No absences recorded today.</p>
  }

  return (
    <div className="space-y-2">
      {/* Stacked bar */}
      <div className="flex h-2.5 rounded-full overflow-hidden bg-surface-hover">
        {nonZero.map((cat) => (
          <div
            key={cat.label}
            className={`${cat.bar} transition-all`}
            style={{ width: `${(cat.count / totalAbsent) * 100}%` }}
            title={`${cat.label}: ${cat.count}`}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {nonZero.map((cat) => (
          <span key={cat.label} className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
            <span className={`w-2 h-2 rounded-full ${cat.dot}`} />
            {cat.label} <span className="font-semibold text-text-primary">{cat.count}</span>
            <span className="text-text-tertiary">({((cat.count / totalAbsent) * 100).toFixed(0)}%)</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// DAY OF WEEK PATTERN (Task 2.8)
// ============================================================================

// Nepal school week: Sun-Fri (Saturday is weekly holiday)
const DAYS_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const DAY_SHORT = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' } as Record<string, string>

function DayOfWeekPattern({
  pattern,
}: {
  pattern: Record<string, { avgRate: number; avgAbsent: number }>
}) {
  const days = DAYS_ORDER.filter((d) => pattern[d] != null)
  if (days.length === 0) return null

  const rates = days.map((d) => pattern[d].avgRate)
  const minRate = Math.min(...rates)
  const maxRate = Math.max(...rates)
  const range = maxRate - minRate || 1

  const getIntensity = (rate: number) => {
    const norm = (rate - minRate) / range
    if (norm >= 0.8) return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
    if (norm >= 0.6) return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    if (norm >= 0.4) return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
    if (norm >= 0.2) return 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
    return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
  }

  return (
    <div className="flex gap-1.5">
      {days.map((day) => {
        const d = pattern[day]
        return (
          <div
            key={day}
            className={`flex-1 rounded-md px-1 py-1.5 text-center ${getIntensity(d.avgRate)}`}
            title={`${DAY_SHORT[day]}: ${d.avgRate.toFixed(1)}% avg, ${d.avgAbsent.toFixed(1)} avg absent`}
          >
            <p className="text-[10px] font-medium leading-tight">{DAY_SHORT[day]}</p>
            <p className="text-xs font-bold leading-tight">{d.avgRate.toFixed(1)}%</p>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT (Task 2.2 — single useAttendanceOverview hook)
// ============================================================================

export function AttendanceDashboard({
  schoolId,
  academicYearId,
  currentDate,
  exportPortalRef,
}: AttendanceDashboardProps) {
  // Task 3.4: Student drill-down modal state
  const [selectedStudent, setSelectedStudent] = useState<{
    studentId: string
    studentName: string
  } | null>(null)

  // Single aggregate data source (Task 2.2)
  const {
    data,
    isLoading,
    error,
  } = useAttendanceOverview({
    schoolId,
    academicYearId,
    date: currentDate,
    enabled: !!schoolId && !!academicYearId,
  })

  // Chart data formatting — Task 5.6: include BS date
  const chartData = useMemo(() => {
    if (!data?.trend) return []
    return data.trend.map((d) => {
      const date = new Date(d.date)
      return {
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        bsDate: toBSShort(d.date),
        isoDate: d.date,
        rate: d.attendanceRate,
        present: d.present,
        absent: d.absent,
        late: d.late,
        total: d.totalStudents,
      }
    })
  }, [data?.trend])

  // Compute trend deltas for stat cards (Task 2.5)
  const trendDeltas = useMemo(() => {
    if (!data?.periodAverages || !data?.todaySummary) return null
    const todayRate = data.todaySummary.attendanceRate
    const last7 = data.periodAverages.last7Days
    return {
      presentDelta: todayRate - last7,
    }
  }, [data])

  // Summary helpers
  const summary = data?.todaySummary
  const pct = useCallback(
    (count: number) => {
      if (!summary || summary.totalStudents === 0) return ''
      return `${((count / summary.totalStudents) * 100).toFixed(1)}% of ${summary.totalStudents}`
    },
    [summary]
  )

  // Error state
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-6 text-sm text-red-700 dark:text-red-400">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">Failed to load attendance overview</span>
        </div>
        <p>Please try refreshing the page. If the issue persists, contact support.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* EXPORT DROPDOWN — portaled into page header */}
      {exportPortalRef?.current && data && createPortal(
        <ExportDropdown data={data} schoolId={schoolId} />,
        exportPortalRef.current,
      )}

      {/* QUICK STATS + INSIGHTS — single cohesive card */}
      {isLoading ? (
        <SkeletonStatCards />
      ) : (
        <div className="bg-surface-primary rounded-xl border border-border-secondary p-4">
          {/* Row 1: Stat cards */}
          <div className="flex flex-wrap gap-2">
            <StatCard
              icon={UserCheck}
              label="Present"
              value={summary?.present ?? '--'}
              subValue={summary ? `${summary.totalRecorded ?? summary.present} of ${summary.totalStudents} recorded` : undefined}
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
            <StatCard
              icon={Activity}
              label="School Average"
              value={data?.periodAverages ? `${data.periodAverages.academicYear.toFixed(1)}%` : '--'}
              subValue={data?.periodAverages ? `7-day: ${data.periodAverages.last7Days.toFixed(1)}% · 30-day: ${data.periodAverages.last30Days.toFixed(1)}%` : undefined}
              accent="text-teal-600 dark:text-teal-400"
              bg="bg-teal-500/10"
              trend={
                trendDeltas
                  ? {
                      delta: trendDeltas.presentDelta,
                      direction: trendDeltas.presentDelta > 0.5 ? 'up' : trendDeltas.presentDelta < -0.5 ? 'down' : 'neutral',
                    }
                  : undefined
              }
            />
          </div>

          {/* Row 2: Absence Breakdown + Day-of-Week Pattern */}
          {data && (data.absenceBreakdown || (data.dayOfWeekPattern && Object.keys(data.dayOfWeekPattern).length > 0)) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3 pt-3 border-t border-border-secondary">
              {data.absenceBreakdown && (
                <div>
                  <h3 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wide mb-1.5">Today's Absence Breakdown</h3>
                  <AbsenceBreakdown
                    breakdown={data.absenceBreakdown}
                    totalAbsent={
                      data.absenceBreakdown.unexcused +
                      data.absenceBreakdown.excused +
                      data.absenceBreakdown.late +
                      data.absenceBreakdown.halfDay +
                      data.absenceBreakdown.remote
                    }
                  />
                </div>
              )}
              {data.dayOfWeekPattern && Object.keys(data.dayOfWeekPattern).length > 0 && (
                <div>
                  <h3 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wide mb-1.5">Day-of-Week Pattern</h3>
                  <DayOfWeekPattern pattern={data.dayOfWeekPattern} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TWO-COLUMN: GRADE TABLE + SECTION DONUT/TABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* GRADE-LEVEL BREAKDOWN TABLE (Task 2.3) */}
        {isLoading ? (
          <SkeletonGradeTable />
        ) : (
          <div className="bg-surface-primary rounded-xl border border-border-secondary p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-teal-500" />
              <h3 className="text-sm font-semibold text-text-primary">
                Attendance by Grade Level
              </h3>
            </div>

            {summary?.byGradeLevel && Object.keys(summary.byGradeLevel).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-secondary">
                      <th className="text-left py-2 pr-4 text-text-tertiary font-medium">Grade</th>
                      <th className="text-right py-2 px-4 text-text-tertiary font-medium">Students</th>
                      <th className="text-right py-2 px-4 text-text-tertiary font-medium">Present</th>
                      <th className="text-right py-2 px-4 text-text-tertiary font-medium">Absent</th>
                      <th className="text-right py-2 pl-4 text-text-tertiary font-medium">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(summary.byGradeLevel)
                      .sort(([a], [b]) => gradeSort(a) - gradeSort(b))
                      .map(([grade, d]) => (
                        <tr key={grade} className="border-b border-border-secondary last:border-b-0">
                          <td className="py-2.5 pr-4 text-text-primary font-medium">{grade}</td>
                          <td className="py-2.5 px-4 text-right text-text-secondary">{d.total}</td>
                          <td className="py-2.5 px-4 text-right text-text-secondary">{d.present}</td>
                          <td className="py-2.5 px-4 text-right text-text-secondary">{d.absent}</td>
                          <td className="py-2.5 pl-4 text-right">
                            {d.present === 0 && d.absent === 0 ? (
                              <span className="text-xs text-text-tertiary">No records</span>
                            ) : (
                              <RateBadge rate={d.rate} />
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-text-tertiary py-8 text-center">
                No grade-level data available for this date.
              </p>
            )}
          </div>
        )}

        {/* SECTION COMPLETION (Tasks 2.4 + 2.6) — donut + table in one card */}
        {isLoading ? (
          <SkeletonSectionTable />
        ) : data?.sectionCompletion ? (
          <div className="bg-surface-primary rounded-xl border border-border-secondary p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-teal-500" />
              <h3 className="text-sm font-semibold text-text-primary">
                Section Completion
              </h3>
            </div>
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <CompletionDonut
                  completed={data.sectionCompletion.sectionsWithAttendance}
                  total={data.sectionCompletion.totalSections}
                />
              </div>
              {data.sectionCompletion.sections.length > 0 && (
                <div className="flex-1 min-w-0 overflow-hidden">
                  <SectionCompletionTable sections={data.sectionCompletion.sections} />
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* 30-DAY TREND CHART (Task 3.1) */}
      {isLoading ? (
        <SkeletonChart />
      ) : (
        <div className="bg-surface-primary rounded-xl border border-border-secondary p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-teal-500" />
            <h3 className="text-sm font-semibold text-text-primary">
              30-Day Attendance Rate
            </h3>
          </div>

          {chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-text-tertiary text-sm">
              No trend data available for the selected period.
            </div>
          ) : (
            <ChartErrorBoundary>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 8"
                  stroke="var(--color-border-secondary, #e5e7eb)"
                  strokeOpacity={0.3}
                  vertical={false}
                />
                {/* Task 5.6: X-axis shows BS dates */}
                <XAxis
                  dataKey="bsDate"
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
                <ReferenceLine
                  y={90}
                  stroke="#f59e0b"
                  strokeDasharray="6 4"
                  strokeOpacity={0.6}
                  label={{ value: '90% threshold', position: 'right', fontSize: 10, fill: '#f59e0b' }}
                />
                <Tooltip content={<TrendTooltip />} />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  fill="url(#attendanceGradient)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#14b8a6', stroke: '#fff', strokeWidth: 2 }}
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
            </ChartErrorBoundary>
          )}
        </div>
      )}

      {/* ALERTS TABLE (Task 3.2) */}
      {isLoading ? (
        <SkeletonSectionTable />
      ) : (
        <AlertsTable
          alerts={data?.atRiskStudents ?? []}
          totalAtRiskCount={data?.totalAtRiskCount ?? 0}
          onStudentClick={(studentId) => {
            const student = data?.atRiskStudents?.find((s) => s.studentId === studentId)
            if (student) {
              setSelectedStudent({ studentId, studentName: student.studentName })
            }
          }}
        />
      )}

      {/* Task 3.4: Student Drill-Down Modal */}
      {selectedStudent && (
        <StudentAttendanceModal
          open={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          studentId={selectedStudent.studentId}
          studentName={selectedStudent.studentName}
          schoolId={schoolId}
        />
      )}
    </div>
  )
}

export default AttendanceDashboard
