/**
 * AttendanceDashboard — consolidated Overview
 *
 * Distills the attendance Overview into THREE cohesive sections (was seven
 * stacked widgets):
 *   1. Attendance Pulse        — headline rate + 30-day trend (reusable
 *      @edforge/ui TrendAreaChart) + today's recording progress & composition
 *      + day-of-week patterns.
 *   2. Classrooms & Recording  — period averages (chips) + completion ring +
 *      per-classroom recording status.
 *   3. Attendance Alerts       — the bounded @edforge/ui DataTable of at-risk
 *      students.
 *
 * Terminology: "Classroom" is the user-facing frontend term; "section" is the
 * server / Ed-Fi term. The data fields stay `section*`; user-facing copy says
 * "classroom".
 *
 * Data source: the single useAttendanceOverview aggregate endpoint.
 *
 * Presentation: SVG geometry + per-datum colors are inherent to a data
 * visualization and stay inline (marked `allow-presentation-style`). Static
 * type/spacing use semantic tokens + the text-2xs/3xs/4xs micro scale.
 */

import { useState, useMemo } from 'react'
import { AlertTriangle, CheckCircle, ClipboardCheck } from 'lucide-react'
import {
  WidgetErrorBoundaryV2,
  DataTable,
  createColumnHelper,
  TrendAreaChart,
  type TrendChartPoint,
} from '@edforge/ui'
import type { ColumnDef } from '@tanstack/react-table'
import { useAttendanceOverview } from '../../hooks/useAttendance'
import { StudentAttendanceModal } from '../../components/attendance/StudentAttendanceModal'
import { UserAvatar } from '../../components/common/UserAvatar'
import { usePermission } from '@edforge/abac'
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
}

// ============================================================================
// V2 DESIGN TOKENS — vivid brand accents kept as literals for SVG stroke/fill
// and per-datum chart/legend colors (inline + marked, never moved to className).
// ============================================================================

const V2 = {
  success: '#1D9E75',
  info: '#378ADD',
  warning: '#EF9F27',
  danger: '#E24B4A',
  purple: '#7F77DD',
  textMuted: 'rgb(var(--text-tertiary))',
  textHint: 'rgb(var(--text-disabled))',
  borderRow: 'rgb(var(--border-primary) / 0.15)',
}

const CARD =
  'bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-primary)/0.35)] rounded-[10px] overflow-hidden'
const CARD_HEADER =
  'px-4 py-3 border-b border-[rgb(var(--border-primary)/0.3)] flex items-center justify-between'
const CARD_BODY = 'p-4'

const DAYS_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const DAY_SHORT: Record<string, string> = {
  Sunday: 'Sun', Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat',
}

function WarningTriangleIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={V2.warning} strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function CardHeader({
  icon,
  iconBg,
  title,
  subtitle,
  right,
}: {
  icon: React.ReactNode
  iconBg: string
  title: string
  subtitle: string
  right?: React.ReactNode
}) {
  return (
    <div className={CARD_HEADER}>
      <div className="flex items-center gap-2 min-w-0">
        <div
          // allow-presentation-style: per-card icon tint passed as prop + fixed 22px chip
          className="rounded-[5px] flex items-center justify-center shrink-0"
          style={{ width: 22, height: 22, background: iconBg }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-[rgb(var(--text-primary))]">{title}</div>
          <div className="text-3xs text-[rgb(var(--text-disabled))] mt-px truncate">{subtitle}</div>
        </div>
      </div>
      {right}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className={`${CARD} p-4`}>
      <div className="w-1/2 h-3 rounded bg-[rgb(var(--background-tertiary))] mb-3" />
      <div className="rounded-md bg-[rgb(var(--background-tertiary))]" style={{ height: 120 }} />
    </div>
  )
}

// ============================================================================
// SECTION 1 — ATTENDANCE PULSE
// headline rate + 30-day trend + today's recording + day-of-week patterns
// ============================================================================

function AttendancePulse({
  summary,
  periodAverages,
  absenceBreakdown,
  dayOfWeekPattern,
  trend,
}: {
  summary: AttendanceOverviewResponse['todaySummary']
  periodAverages: AttendanceOverviewResponse['periodAverages']
  absenceBreakdown: AttendanceOverviewResponse['absenceBreakdown']
  dayOfWeekPattern: AttendanceOverviewResponse['dayOfWeekPattern']
  trend: AttendanceOverviewResponse['trend']
}) {
  const recorded = summary.totalRecorded ?? summary.present
  const total = summary.totalStudents
  const recordedPct = total > 0 ? (recorded / total) * 100 : 0
  const inProgress = recorded < total
  const sevenUp = periodAverages.last7Days >= periodAverages.last30Days

  const trendData = useMemo<TrendChartPoint[]>(
    () =>
      [...trend]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((d) => ({ date: d.date, value: d.attendanceRate })),
    [trend]
  )

  const dow = DAYS_ORDER.filter((d) => dayOfWeekPattern[d] != null)
  const dowRates = dow.map((d) => dayOfWeekPattern[d].avgRate)
  const dowMax = dowRates.length ? Math.max(...dowRates) : 0
  const dowMin = dowRates.length ? Math.min(...dowRates) : 0
  const minDay = dow[dowRates.indexOf(dowMin)]
  const maxDay = dow[dowRates.indexOf(dowMax)]

  const composition = [
    { label: 'Present', value: summary.present, color: V2.success },
    { label: 'Late / Tardy', value: summary.late, color: V2.warning },
    { label: 'Excused', value: summary.excused, color: V2.info },
    { label: 'Absent', value: summary.absent, color: V2.danger },
  ]

  return (
    <div className={`${CARD} ${CARD_BODY}`}>
      {/* Headline + 30-day trend */}
      <div className="flex items-start justify-between gap-6">
        <div className="shrink-0">
          <div className="flex items-baseline gap-0.5">
            <span className="text-4xl font-extrabold leading-none tracking-tight text-[rgb(var(--text-primary))]">
              {periodAverages.academicYear.toFixed(1)}
            </span>
            <span className="text-lg font-bold text-[rgb(var(--text-tertiary))]">%</span>
          </div>
          <div className="text-4xs font-bold uppercase tracking-[0.5px] text-[rgb(var(--text-disabled))] mt-1.5">
            School average
          </div>
          <div className="flex gap-1.5 mt-2.5">
            <span
              // allow-presentation-style: 7-day up/down trend tint (success/danger)
              className="text-4xs font-medium px-1.5 py-0.5 rounded"
              style={{
                background: sevenUp ? 'rgba(29,158,117,0.10)' : 'rgba(226,75,74,0.10)',
                color: sevenUp ? V2.success : V2.danger,
              }}
            >
              {sevenUp ? '▲' : '▼'} 7-day {periodAverages.last7Days.toFixed(1)}%
            </span>
            <span className="text-4xs font-medium px-1.5 py-0.5 rounded bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))]">
              30-day {periodAverages.last30Days.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-3xs font-medium text-[rgb(var(--text-tertiary))] mb-1">30-day attendance trend</div>
          <TrendAreaChart
            data={trendData}
            height={84}
            color="rgb(var(--state-success-fg))"
            valueSuffix="%"
            clampDomain={[0, 100]}
            aria-label="30-day attendance rate trend"
          />
        </div>
      </div>

      {/* Today — recording progress + composition */}
      <div className="mt-4 pt-4 border-t border-[rgb(var(--border-primary)/0.18)]">
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="text-2xs font-medium text-[rgb(var(--text-secondary))]">
            Today · <span className="font-semibold text-[rgb(var(--text-primary))]">{recorded} of {total}</span> students recorded
            <span className="text-[rgb(var(--text-disabled))]">{inProgress ? ' — recording in progress' : ' — complete'}</span>
          </span>
          <span className="text-2xs font-bold text-[rgb(var(--text-tertiary))]">{recordedPct.toFixed(1)}%</span>
        </div>
        <div className="h-2 rounded-full bg-[rgb(var(--background-tertiary))] overflow-hidden">
          <div
            // allow-presentation-style: data-driven recording progress width + brand gradient
            className="h-full rounded-full"
            style={{ width: `${Math.min(100, recordedPct)}%`, background: 'linear-gradient(90deg, #1D9E75, #2FA37A)' }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-3">
          {composition.map((c) => (
            <span key={c.label} className="flex items-center gap-1.5 text-2xs text-[rgb(var(--text-secondary))]">
              <span
                // allow-presentation-style: per-status legend dot color
                className="w-2 h-2 rounded-full"
                style={{ background: c.color }}
              />
              {c.label} <b className="font-bold text-[rgb(var(--text-primary))]">{c.value}</b>
            </span>
          ))}
          <span className="text-2xs text-[rgb(var(--text-disabled))] ml-auto">
            {absenceBreakdown.unexcused} unexcused · {absenceBreakdown.halfDay} half-day · {absenceBreakdown.remote} remote
          </span>
        </div>
      </div>

      {/* Patterns — day-of-week (auto-scaled bars) */}
      {dow.length > 0 && (
        <div className="mt-4 pt-3.5 border-t border-[rgb(var(--border-primary)/0.18)] flex items-center justify-between gap-5">
          <span className="text-2xs text-[rgb(var(--text-tertiary))]">
            Patterns · <b className="font-semibold text-[rgb(var(--text-secondary))]">{DAY_SHORT[minDay]}</b> lowest ({dowMin.toFixed(0)}%) · <b className="font-semibold text-[rgb(var(--text-secondary))]">{DAY_SHORT[maxDay]}</b> highest ({dowMax.toFixed(0)}%)
          </span>
          <div className="flex items-end gap-2.5 shrink-0">
            {dow.map((day) => {
              const rate = dayOfWeekPattern[day].avgRate
              const h = dowMax > dowMin ? 8 + ((rate - dowMin) / (dowMax - dowMin)) * 20 : 18
              const isLow = rate === dowMin && dowMin < dowMax
              const isHigh = rate === dowMax
              const barColor = isLow ? V2.danger : isHigh ? V2.success : V2.info
              return (
                <div key={day} className="flex flex-col items-center gap-1" style={{ width: 26 }}>
                  <div
                    // allow-presentation-style: data-driven bar height + lowest/highest tint
                    className="rounded-[4px]"
                    style={{ width: 18, height: h, background: barColor }}
                  />
                  <span className="text-4xs text-[rgb(var(--text-disabled))] font-medium">{DAY_SHORT[day]}</span>
                  <span className="text-4xs text-[rgb(var(--text-tertiary))]">{rate.toFixed(0)}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// SECTION 2 — CLASSROOMS & RECORDING
// period averages (chips) + completion ring + per-classroom recording status
// ("classroom" = user-facing; the data field is `section`)
// ============================================================================

function PeriodChip({ label, value }: { label: string; value: number }) {
  return (
    <span className="text-4xs font-medium px-1.5 py-0.5 rounded bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))] whitespace-nowrap">
      {label} {value.toFixed(1)}%
    </span>
  )
}

function ClassroomsRecording({
  sectionCompletion,
  periodAverages,
}: {
  sectionCompletion: AttendanceOverviewResponse['sectionCompletion']
  periodAverages: AttendanceOverviewResponse['periodAverages']
}) {
  const { totalSections, sectionsWithAttendance, sections } = sectionCompletion
  const pct = totalSections > 0 ? Math.round((sectionsWithAttendance / totalSections) * 100) : 0
  const r = 30
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)

  return (
    <div className={CARD}>
      <CardHeader
        icon={<ClipboardCheck className="w-3 h-3 text-[rgb(var(--accent-reports))]" />}
        iconBg="rgba(127,119,221,0.10)"
        title="Classrooms & Recording"
        subtitle="Today's recording status by classroom"
        right={
          <div className="flex gap-1.5">
            <PeriodChip label="7-day" value={periodAverages.last7Days} />
            <PeriodChip label="30-day" value={periodAverages.last30Days} />
            <PeriodChip label="Yearly" value={periodAverages.academicYear} />
          </div>
        }
      />
      <div className={CARD_BODY}>
        <div className="flex gap-5 items-center">
          {/* Completion ring */}
          <div className="shrink-0 flex flex-col items-center gap-1.5">
            <div className="relative" style={{ width: 76, height: 76 }}>
              <svg width={76} height={76} viewBox="0 0 76 76">
                <circle cx="38" cy="38" r={r} fill="none" stroke="rgb(var(--background-tertiary))" strokeWidth="9" />
                <circle
                  cx="38" cy="38" r={r} fill="none"
                  stroke={pct > 0 ? V2.purple : 'rgb(var(--border-primary) / 0.3)'}
                  strokeWidth="9"
                  strokeDasharray={circ.toFixed(1)}
                  strokeDashoffset={offset.toFixed(1)}
                  strokeLinecap="round"
                  transform="rotate(-90 38 38)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-base font-bold text-[rgb(var(--text-primary))]">{pct}%</span>
                <span className="text-4xs text-[rgb(var(--text-disabled))]">{sectionsWithAttendance} of {totalSections}</span>
              </div>
            </div>
            <span className="text-4xs text-[rgb(var(--text-disabled))]">classrooms recorded</span>
          </div>

          {/* Per-classroom list — bounded */}
          <div className="flex-1 min-w-0 overflow-y-auto" style={{ maxHeight: 188 }}>
            {sections.length === 0 ? (
              <div className="py-8 text-center text-2xs text-[rgb(var(--text-disabled))]">No classrooms to record today.</div>
            ) : (
              sections.map((s, i) => {
                const statusLabel = s.isComplete ? 'Complete' : s.recordedCount > 0 ? 'Partial' : 'Not started'
                const statusStyle: React.CSSProperties = s.isComplete
                  ? { background: 'rgba(29,158,117,0.10)', color: V2.success }
                  : s.recordedCount > 0
                    ? { background: 'rgba(239,159,39,0.10)', color: V2.warning }
                    : { background: 'rgb(var(--background-tertiary))', color: V2.textHint }
                return (
                  <div
                    key={s.sectionId}
                    className="flex items-center gap-3 py-2"
                    style={{ borderBottom: i < sections.length - 1 ? `1px solid ${V2.borderRow}` : 'none' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-2xs font-medium text-[rgb(var(--text-primary))] truncate">{s.courseName}</div>
                      <div className="text-4xs text-[rgb(var(--text-disabled))]">#{s.sectionNumber}</div>
                    </div>
                    <span className="text-3xs tabular-nums text-[rgb(var(--text-tertiary))] text-right" style={{ width: 56 }}>
                      {s.recordedCount}/{s.studentCount}
                    </span>
                    <span
                      // allow-presentation-style: per-classroom status tint (complete/partial/not-started)
                      className="text-4xs font-medium px-2 py-0.5 rounded-[5px] text-center whitespace-nowrap"
                      style={{ width: 84, ...statusStyle }}
                    >
                      {statusLabel}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SECTION 3 — ATTENDANCE ALERTS (bounded @edforge/ui DataTable)
// ============================================================================

function getRateColorHex(rate: number): string {
  if (rate < 60) return V2.danger
  if (rate < 80) return V2.warning
  return V2.textMuted
}

const TREND_META: Record<AttendanceAlert['trend'], { text: string; color: string }> = {
  improving: { text: '↑ Improving', color: V2.success },
  declining: { text: '↓ Declining', color: V2.danger },
  stable: { text: '— Stable', color: V2.textHint },
}

const alertColumnHelper = createColumnHelper<AttendanceAlert>()

const alertColumns = [
  alertColumnHelper.accessor('studentName', {
    header: 'Student',
    enableSorting: true,
    cell: ({ row }) => {
      const a = row.original
      return (
        <div className="flex items-center gap-2 min-w-0">
          <UserAvatar userId={a.studentId} userName={a.studentName} size="sm" />
          <div className="min-w-0">
            <span className="block truncate text-xs font-medium text-[rgb(var(--text-primary))]">{a.studentName}</span>
            {a.gradeLevel && (
              <span className="block text-4xs text-[rgb(var(--text-disabled))]">{a.gradeLevel}</span>
            )}
          </div>
        </div>
      )
    },
    meta: { align: 'left' },
  }),
  alertColumnHelper.accessor('attendanceRate', {
    header: 'Rate',
    enableSorting: true,
    cell: ({ getValue }) => {
      const rate = getValue()
      return (
        <span
          // allow-presentation-style: rate severity color
          className="text-xs font-bold tabular-nums"
          style={{ color: getRateColorHex(rate) }}
        >
          {rate.toFixed(1)}%
        </span>
      )
    },
    meta: { align: 'right' },
  }),
  alertColumnHelper.accessor('absentDays', {
    header: 'Absent',
    enableSorting: true,
    cell: ({ getValue }) => (
      <span className="text-2xs tabular-nums text-[rgb(var(--text-tertiary))]">{getValue()}</span>
    ),
    meta: { align: 'center' },
  }),
  alertColumnHelper.accessor('totalDays', {
    header: 'Total',
    enableSorting: true,
    cell: ({ getValue }) => (
      <span className="text-2xs tabular-nums text-[rgb(var(--text-disabled))]">{getValue()}</span>
    ),
    meta: { align: 'center' },
  }),
  alertColumnHelper.accessor('trend', {
    header: 'Trend',
    enableSorting: true,
    // faceted filter supplies a string[] of selected trends
    filterFn: (row, columnId, filterValue) => {
      if (!Array.isArray(filterValue) || filterValue.length === 0) return true
      return (filterValue as string[]).includes(row.getValue(columnId))
    },
    cell: ({ getValue }) => {
      const t = TREND_META[getValue()]
      return (
        <span
          // allow-presentation-style: trend direction color
          className="text-3xs font-medium"
          style={{ color: t.color }}
        >
          {t.text}
        </span>
      )
    },
    meta: { align: 'right' },
  }),
] as ColumnDef<AttendanceAlert, unknown>[]

function AttendanceAlertsTable({
  alerts,
  totalAtRiskCount,
  onStudentClick,
}: {
  alerts: AttendanceAlert[]
  totalAtRiskCount: number
  onStudentClick?: (studentId: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="flex items-center justify-center rounded-md shrink-0 bg-[rgb(var(--accent-attendance)/0.1)]"
            style={{ width: 22, height: 22 }}
          >
            <WarningTriangleIcon />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[rgb(var(--text-primary))]">Attendance Alerts</div>
            <div className="text-3xs text-[rgb(var(--text-disabled))]">Students below 90% attendance rate</div>
          </div>
        </div>
        {totalAtRiskCount > 0 && (
          <span className="text-3xs text-[rgb(var(--text-disabled))] shrink-0">
            {alerts.length < totalAtRiskCount
              ? `Showing ${alerts.length} of ${totalAtRiskCount} at-risk students`
              : `${totalAtRiskCount} at-risk student${totalAtRiskCount !== 1 ? 's' : ''}`}
          </span>
        )}
      </div>

      <DataTable<AttendanceAlert>
        columns={alertColumns}
        data={alerts}
        getRowId={(a) => a.studentId}
        enableSorting
        searchPlaceholder="Search students"
        facetedFilters={[
          {
            columnId: 'trend',
            title: 'Trend',
            options: [
              { label: 'Declining', value: 'declining' },
              { label: 'Stable', value: 'stable' },
              { label: 'Improving', value: 'improving' },
            ],
          },
        ]}
        pagination={{ pageSize: 8, pageSizeOptions: [8, 16, 24] }}
        maxHeight="520px"
        onRowClick={(a) => onStudentClick?.(a.studentId)}
        emptyState={{
          icon: <CheckCircle className="text-[#1D9E75]" style={{ width: 40, height: 40 }} />,
          title: 'No students below the attendance threshold',
          description: 'Every student is at or above 90% attendance.',
        }}
      />
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AttendanceDashboard({
  schoolId,
  academicYearId,
  currentDate,
}: AttendanceDashboardProps) {
  const [selectedStudent, setSelectedStudent] = useState<{
    studentId: string
    studentName: string
  } | null>(null)

  const isSchoolWide = usePermission('manage', 'attendance')

  const queryEnabled = !!schoolId && !!academicYearId
  const {
    data,
    isLoading: queryLoading,
    error,
  } = useAttendanceOverview({
    schoolId,
    academicYearId,
    date: currentDate,
    enabled: queryEnabled,
  })
  const isLoading = queryLoading
  const summary = data?.todaySummary

  if (error) {
    return (
      <div className={`${CARD} p-6 text-center`}>
        <AlertTriangle className="text-[rgb(var(--state-danger-fg))] mx-auto mb-2" style={{ width: 20, height: 20 }} />
        <p className="text-sm font-medium text-[rgb(var(--state-danger-fg))] mb-1">Failed to load attendance overview</p>
        <p className="text-2xs text-[rgb(var(--text-tertiary))]">Please try refreshing the page. If the issue persists, contact support.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Scope indicator */}
      {!isSchoolWide && summary && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-3xs font-medium rounded-[20px] bg-[rgb(var(--state-info-bg))] text-[rgb(var(--state-info-fg))]">
          Showing data for your classrooms ({summary.totalStudents} students)
        </div>
      )}

      {/* SECTION 1 — Attendance Pulse */}
      {isLoading ? (
        <SkeletonCard />
      ) : summary && data?.periodAverages && data?.absenceBreakdown && data?.dayOfWeekPattern && data?.trend ? (
        <WidgetErrorBoundaryV2>
          <AttendancePulse
            summary={summary}
            periodAverages={data.periodAverages}
            absenceBreakdown={data.absenceBreakdown}
            dayOfWeekPattern={data.dayOfWeekPattern}
            trend={data.trend}
          />
        </WidgetErrorBoundaryV2>
      ) : null}

      {/* SECTION 2 — Classrooms & Recording */}
      {isLoading ? (
        <SkeletonCard />
      ) : data?.sectionCompletion && data?.periodAverages ? (
        <WidgetErrorBoundaryV2>
          <ClassroomsRecording sectionCompletion={data.sectionCompletion} periodAverages={data.periodAverages} />
        </WidgetErrorBoundaryV2>
      ) : null}

      {/* SECTION 3 — Attendance Alerts */}
      {isLoading ? (
        <SkeletonCard />
      ) : (
        <WidgetErrorBoundaryV2>
          <AttendanceAlertsTable
            alerts={data?.atRiskStudents ?? []}
            totalAtRiskCount={data?.totalAtRiskCount ?? 0}
            onStudentClick={(studentId) => {
              const student = data?.atRiskStudents?.find((s) => s.studentId === studentId)
              if (student) {
                setSelectedStudent({ studentId, studentName: student.studentName })
              }
            }}
          />
        </WidgetErrorBoundaryV2>
      )}

      {/* Student Drill-Down Modal */}
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
