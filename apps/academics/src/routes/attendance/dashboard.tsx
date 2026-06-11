/**
 * AttendanceDashboard — V2 Redesign
 *
 * Rich analytics dashboard powered by the single `useAttendanceOverview`
 * aggregate endpoint. All cards use V2 card chrome, inline SVG charts,
 * and proper color system matching edforge_classrooms_v2_redesign.html.
 *
 * Layout (top to bottom):
 *  - Today Summary strip (CLS-014)
 *  - Two-col: Absence Breakdown + DOW Pattern bars (CLS-015)
 *  - Full-width: 30-Day Trend SVG chart (CLS-016)
 *  - Two-col: Section Completion ring + Period Averages (CLS-017, CLS-018)
 *  - Full-width: Attendance Alerts table (CLS-019)
 *
 * Data source: single useAttendanceOverview aggregate endpoint.
 *
 * Presentation: static type/spacing/color live in Tailwind classes (semantic
 * tokens + the text-2xs/3xs/4xs micro-scale). Genuinely per-datum colors and
 * chart geometry stay inline, marked `allow-presentation-style`. Off-scale
 * fixed pixel widths/heights stay inline (width/height aren't presentation
 * keys); off-scale padding is snapped to the 4px scale.
 */

import { useState, useMemo } from 'react'
import {
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { WidgetErrorBoundaryV2, DataTable, createColumnHelper } from '@edforge/ui'
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
// V2 DESIGN TOKENS
// ============================================================================

// Vivid brand accents kept as literals for SVG stroke/fill and per-datum
// chart/legend colors (these stay inline + marked, never moved to className).
// The neutral text/surface/border members feed inline non-presentation styles
// (borderLeft/borderBottom ternaries) and dynamic per-datum color choices.
const V2 = {
  bgSurface: 'rgb(var(--background-secondary))',
  borderDefault: 'rgb(var(--border-primary) / 0.35)',
  borderSeparator: 'rgb(var(--border-primary) / 0.3)',
  borderRow: 'rgb(var(--border-primary) / 0.15)',
  textPrimary: 'rgb(var(--text-primary))',
  textSecondary: 'rgb(var(--text-secondary))',
  textMuted: 'rgb(var(--text-tertiary))',
  textHint: 'rgb(var(--text-disabled))',
  textGhost: 'rgb(var(--text-disabled))',
  success: '#1D9E75',
  info: '#378ADD',
  warning: '#EF9F27',
  danger: '#E24B4A',
  purple: '#7F77DD',
  orange: '#D85A30',
}

// Shared card chrome as class strings (semantic tokens) — de-dupes the former
// cardStyle/cardHeaderStyle/cardBodyStyle inline objects.
const CARD =
  'bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-primary)/0.35)] rounded-[10px] overflow-hidden'
const CARD_HEADER =
  'px-4 py-3 border-b border-[rgb(var(--border-primary)/0.3)] flex items-center justify-between'
const CARD_BODY = 'p-4'

// ============================================================================
// SVG ICON COMPONENTS
// ============================================================================

function AlertCircleIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={V2.danger} strokeWidth="2">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function ActivityIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={V2.warning} strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}

function TrendLineIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={V2.success} strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}

function CheckSquareIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={V2.purple} strokeWidth="2">
      <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}

function BarChartSmallIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={V2.success} strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function WarningTriangleIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={V2.warning} strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

// ============================================================================
// CARD HEADER COMPONENT
// ============================================================================

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
      <div className="flex items-center gap-2">
        <div
          // allow-presentation-style: per-card icon tint passed as prop + fixed 22px chip
          className="rounded-[5px] flex items-center justify-center"
          style={{ width: 22, height: 22, background: iconBg }}
        >
          {icon}
        </div>
        <div>
          <div className="text-xs font-semibold text-[rgb(var(--text-primary))]">{title}</div>
          <div className="text-3xs text-[rgb(var(--text-disabled))] mt-px">{subtitle}</div>
        </div>
      </div>
      {right}
    </div>
  )
}

// ============================================================================
// SKELETON LOADERS
// ============================================================================

function SkeletonStrip() {
  return (
    <div className={`${CARD} px-4 py-3.5 flex gap-0`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-8 h-5 rounded bg-[rgb(var(--background-tertiary))]" />
          <div className="w-12 h-2 rounded-[3px] bg-[rgb(var(--background-tertiary))]" />
        </div>
      ))}
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
// TODAY SUMMARY STRIP (CLS-014)
// ============================================================================

function TodaySummaryStrip({
  summary,
  periodAverages,
}: {
  summary: AttendanceOverviewResponse['todaySummary']
  periodAverages: AttendanceOverviewResponse['periodAverages']
}) {
  const pct = (count: number) =>
    summary.totalStudents > 0 ? `${((count / summary.totalStudents) * 100).toFixed(1)}% of ${summary.totalStudents}` : '—'

  const stats = [
    { label: 'Present', value: summary.present, color: V2.success, sub: `${summary.totalRecorded ?? summary.present} of ${summary.totalStudents} recorded` },
    { label: 'Absent', value: summary.absent, color: V2.danger, sub: pct(summary.absent) },
    { label: 'Late / Tardy', value: summary.late, color: V2.warning, sub: pct(summary.late) },
    { label: 'Excused', value: summary.excused, color: V2.info, sub: pct(summary.excused) },
  ]

  const sevenDayUp = periodAverages.last7Days > periodAverages.last30Days

  return (
    <div className={`${CARD} px-4 py-3.5 mb-3 flex items-center gap-0`}>
      {stats.map((s, i) => (
        <div
          key={s.label}
          className="flex flex-col items-center flex-1 gap-0.5"
          style={{ borderLeft: i > 0 ? `1px solid ${V2.borderDefault}` : 'none' }}
        >
          <span
            // allow-presentation-style: per-stat accent color
            className="text-xl font-bold leading-none"
            style={{ color: s.color }}
          >{s.value}</span>
          <span className="text-4xs font-bold uppercase tracking-[0.5px] text-[rgb(var(--text-disabled))]">{s.label}</span>
          <span className="text-4xs text-[rgb(var(--text-disabled))]">{s.sub}</span>
        </div>
      ))}

      {/* Divider */}
      <div className="w-px h-12 bg-[rgb(var(--border-primary)/0.35)] shrink-0 mx-4" />

      {/* School Average */}
      <div className="flex flex-col items-center gap-0.5" style={{ flex: 1.5 }}>
        <span className="text-xl font-bold leading-none text-[#1D9E75]">
          {periodAverages.academicYear.toFixed(1)}%
        </span>
        <span className="text-4xs font-bold uppercase tracking-[0.5px] text-[rgb(var(--text-disabled))]">
          School Average
        </span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            // allow-presentation-style: up/down trend accent (success/danger)
            className="text-4xs font-medium px-1.5 py-px rounded"
            style={{
              background: sevenDayUp ? 'rgba(29,158,117,0.10)' : 'rgba(226,75,74,0.10)',
              color: sevenDayUp ? V2.success : V2.danger,
            }}
          >
            7-day: {periodAverages.last7Days.toFixed(1)}%
          </span>
          <span
            // allow-presentation-style: up/down trend accent (success/danger)
            className="text-4xs font-medium px-1.5 py-px rounded"
            style={{
              background: !sevenDayUp ? 'rgba(29,158,117,0.10)' : 'rgba(226,75,74,0.10)',
              color: !sevenDayUp ? V2.success : V2.danger,
            }}
          >
            30-day: {periodAverages.last30Days.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ABSENCE BREAKDOWN (CLS-014 companion — V2 styled rows)
// ============================================================================

function AbsenceBreakdownCard({
  breakdown,
  date,
}: {
  breakdown: AttendanceOverviewResponse['absenceBreakdown']
  date: string
}) {
  const categories = [
    { label: 'Unexcused', count: breakdown.unexcused, color: V2.danger },
    { label: 'Excused', count: breakdown.excused, color: V2.info },
    { label: 'Late / Tardy', count: breakdown.late, color: V2.warning },
    { label: 'Half Day', count: breakdown.halfDay, color: V2.purple },
    { label: 'Remote', count: breakdown.remote, color: V2.success },
  ]

  const total = categories.reduce((sum, c) => sum + c.count, 0)
  const dateLabel = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className={CARD}>
      <CardHeader
        icon={<AlertCircleIcon />}
        iconBg="rgba(226,75,74,0.08)"
        title="Today's Absence Breakdown"
        subtitle={`${dateLabel} — ${total === 0 ? 'no absences recorded yet' : `${total} absences`}`}
      />
      <div className={CARD_BODY}>
        {categories.map((cat, i) => (
          <div
            key={cat.label}
            className="flex items-center gap-2 py-2"
            style={{ borderBottom: i < categories.length - 1 ? `1px solid ${V2.borderRow}` : 'none' }}
          >
            <div
              // allow-presentation-style: per-category legend dot color
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: cat.color }}
            />
            <span className="text-2xs text-[rgb(var(--text-secondary))] flex-1">{cat.label}</span>
            <span className="text-2xs font-medium text-[rgb(var(--text-tertiary))]">{cat.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// DAY OF WEEK PATTERN — BAR CHART (CLS-015)
// ============================================================================

const DAYS_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const DAY_SHORT: Record<string, string> = {
  Sunday: 'Sun', Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat',
}

function DOWPatternCard({
  pattern,
}: {
  pattern: Record<string, { avgRate: number; avgAbsent: number }>
}) {
  const days = DAYS_ORDER.filter((d) => pattern[d] != null)
  if (days.length === 0) return null

  const rates = days.map((d) => pattern[d].avgRate)
  const maxRate = Math.max(...rates)
  const minRate = Math.min(...rates)
  const minDay = days[rates.indexOf(minRate)]
  const maxDay = days[rates.indexOf(maxRate)]

  // Color helper: lowest = red, highest = green, mid = blue
  const getBarColor = (rate: number) => {
    if (rate === minRate && minRate < maxRate) return `rgba(226,75,74,0.7)`
    if (rate === maxRate) return `rgba(29,158,117,0.6)`
    return `rgba(55,138,221,0.5)`
  }

  const isLowest = (rate: number) => rate === minRate && minRate < maxRate

  return (
    <div className={CARD}>
      <CardHeader
        icon={<ActivityIcon />}
        iconBg="rgba(239,159,39,0.10)"
        title="Day-of-Week Pattern"
        subtitle="Average attendance rate by weekday"
      />
      <div className={CARD_BODY}>
        <div className="flex gap-1.5">
          {days.map((day) => {
            const d = pattern[day]
            const heightPct = maxRate > 0 ? (d.avgRate / 100) * 100 : 0
            const lowest = isLowest(d.avgRate)
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full h-9 rounded bg-[rgb(var(--background-tertiary))] overflow-hidden flex items-end">
                  <div
                    // allow-presentation-style: data-driven bar height + rate color
                    className="w-full rounded-[3px] transition-all"
                    style={{ height: `${heightPct}%`, background: getBarColor(d.avgRate) }}
                  />
                </div>
                <div
                  // allow-presentation-style: lowest-day emphasis color
                  className="text-4xs"
                  style={{ color: lowest ? V2.danger : V2.textGhost }}
                >{DAY_SHORT[day]}</div>
                <div
                  // allow-presentation-style: lowest-day emphasis color
                  className="text-4xs font-semibold"
                  style={{ color: lowest ? V2.danger : V2.textMuted }}
                >{d.avgRate.toFixed(0)}%</div>
              </div>
            )
          })}
        </div>
        <div className="text-4xs text-[rgb(var(--text-disabled))] mt-2.5 pt-2" style={{ borderTop: `1px solid ${V2.borderSeparator}` }}>
          {DAY_SHORT[minDay]} has the lowest avg attendance ({minRate.toFixed(0)}%). {DAY_SHORT[maxDay]} is highest.
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 30-DAY TREND SVG CHART (CLS-016)
// ============================================================================

function TrendChart({
  trend,
  periodAverages,
}: {
  trend: AttendanceOverviewResponse['trend']
  periodAverages: AttendanceOverviewResponse['periodAverages']
}) {
  const sorted = useMemo(() =>
    [...trend].sort((a, b) => a.date.localeCompare(b.date)),
    [trend]
  )

  if (sorted.length === 0) {
    return (
      <div className={CARD}>
        <CardHeader
          icon={<TrendLineIcon />}
          iconBg="rgba(29,158,117,0.10)"
          title="30-Day Attendance Rate"
          subtitle="No trend data available"
        />
        <div className={`${CARD_BODY} h-20 flex items-center justify-center`}>
          <span className="text-2xs text-[rgb(var(--text-disabled))]">No trend data available for the selected period.</span>
        </div>
      </div>
    )
  }

  const width = 760
  const height = 100
  const n = sorted.length
  const step = n > 1 ? width / (n - 1) : width

  // Build SVG path — y-axis: 0=100%, 100=0%
  const points = sorted.map((d, i) => {
    const x = i * step
    const y = height - (d.attendanceRate / 100) * height
    return { x, y }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`

  // Date labels (5 evenly spaced)
  const dateLabels: { label: string; x: number }[] = []
  const labelCount = Math.min(5, n)
  for (let i = 0; i < labelCount; i++) {
    const idx = Math.round((i / (labelCount - 1)) * (n - 1))
    const d = new Date(sorted[idx].date)
    dateLabels.push({
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      x: idx * step,
    })
  }

  // First and last dates for subtitle
  const firstDate = new Date(sorted[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const lastDate = new Date(sorted[n - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className={CARD}>
      <CardHeader
        icon={<TrendLineIcon />}
        iconBg="rgba(29,158,117,0.10)"
        title="30-Day Attendance Rate"
        subtitle={`Daily recorded attendance rate trend — ${firstDate} to ${lastDate}`}
        right={
          <div className="flex gap-3 text-3xs">
            <span className="text-[rgb(var(--text-disabled))]">7-day avg: <strong className="text-[#1D9E75]">{periodAverages.last7Days.toFixed(1)}%</strong></span>
            <span className="text-[rgb(var(--text-disabled))]">30-day avg: <strong className="text-[rgb(var(--text-tertiary))]">{periodAverages.last30Days.toFixed(1)}%</strong></span>
          </div>
        }
      />
      <div className={`${CARD_BODY} pt-2`}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="attTrendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={V2.success} stopOpacity={0.25} />
              <stop offset="100%" stopColor={V2.success} stopOpacity={0} />
            </linearGradient>
          </defs>
          {/* Gridlines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line key={y} x1="0" y1={y} x2={width} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          ))}
          {/* % labels */}
          <text x={width + 2} y={3} fontSize={8} fill="rgba(255,255,255,0.2)">100%</text>
          <text x={width + 2} y={53} fontSize={8} fill="rgba(255,255,255,0.2)">50%</text>
          <text x={width + 2} y={103} fontSize={8} fill="rgba(255,255,255,0.2)">0%</text>
          {/* Area fill */}
          <path d={areaPath} fill="url(#attTrendGrad)" />
          {/* Line */}
          <path d={linePath} fill="none" stroke={V2.success} strokeWidth="1.5" strokeLinejoin="round" />
          {/* Dots at last two points */}
          {points.length >= 2 && (
            <>
              <circle cx={points[points.length - 2].x} cy={points[points.length - 2].y} r={3} fill={V2.success} />
              <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={3} fill={V2.success} />
            </>
          )}
        </svg>
        <div className="flex justify-between mt-1.5 text-4xs text-[rgb(var(--text-disabled))]">
          {dateLabels.map((dl, i) => (
            <span key={i}>{dl.label}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SECTION COMPLETION RING + TABLE (CLS-017)
// ============================================================================

function SectionCompletionCard({
  sectionCompletion,
}: {
  sectionCompletion: AttendanceOverviewResponse['sectionCompletion']
}) {
  const { totalSections, sectionsWithAttendance, sections } = sectionCompletion
  const pct = totalSections > 0 ? Math.round((sectionsWithAttendance / totalSections) * 100) : 0

  // SVG donut ring
  const r = 28
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - pct / 100)

  return (
    <div className={CARD}>
      <CardHeader
        icon={<CheckSquareIcon />}
        iconBg="rgba(127,119,221,0.10)"
        title="Section Completion"
        subtitle="Today's recording status per section"
      />
      <div className={CARD_BODY}>
        <div className="flex gap-5 items-start">
          {/* Ring */}
          <div className="shrink-0 flex flex-col items-center gap-1.5">
            <div className="relative" style={{ width: 72, height: 72 }}>
              <svg width={72} height={72} viewBox="0 0 72 72">
                <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                <circle
                  cx="36" cy="36" r={r} fill="none"
                  stroke={pct > 0 ? V2.purple : 'rgba(255,255,255,0.10)'}
                  strokeWidth="10"
                  strokeDasharray={circumference.toFixed(1)}
                  strokeDashoffset={offset.toFixed(1)}
                  strokeLinecap="round"
                  transform="rotate(-90 36 36)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span
                  // allow-presentation-style: ring center value color depends on completion
                  className="text-base font-bold"
                  style={{ color: pct > 0 ? V2.textPrimary : V2.textHint }}
                >{pct}%</span>
              </div>
            </div>
            <div className="text-4xs text-[rgb(var(--text-disabled))]">{sectionsWithAttendance} / {totalSections}</div>
          </div>

          {/* Section list */}
          <div className="flex-1 min-w-0 overflow-hidden">
            {/* Header row */}
            <div className="flex items-center gap-2.5 mb-1.5 pb-1.5" style={{ borderBottom: `1px solid ${V2.borderSeparator}` }}>
              <span className="text-4xs font-bold text-[rgb(var(--text-disabled))] uppercase tracking-[0.5px] flex-1">Section</span>
              <span className="text-4xs font-bold text-[rgb(var(--text-disabled))] uppercase tracking-[0.5px] text-center" style={{ width: 28 }}>Enr.</span>
              <span className="text-4xs font-bold text-[rgb(var(--text-disabled))] uppercase tracking-[0.5px] text-center" style={{ width: 36 }}>Rec.</span>
              <span className="text-4xs font-bold text-[rgb(var(--text-disabled))] uppercase tracking-[0.5px] text-right" style={{ width: 70 }}>Status</span>
            </div>
            {/* Rows */}
            {sections.map((s, i) => {
              const statusLabel = s.isComplete ? 'Complete' : s.recordedCount > 0 ? 'Partial' : 'Not Started'
              const statusStyle: React.CSSProperties = s.isComplete
                ? { background: 'rgba(29,158,117,0.10)', color: V2.success }
                : s.recordedCount > 0
                  ? { background: 'rgba(239,159,39,0.10)', color: V2.warning }
                  : { background: 'rgb(var(--background-tertiary))', color: V2.textHint }

              return (
                <div
                  key={s.sectionId}
                  className="flex items-center gap-2.5 py-2"
                  style={{ borderBottom: i < sections.length - 1 ? `1px solid ${V2.borderRow}` : 'none' }}
                >
                  <div className="flex-1">
                    <div className="text-2xs font-medium text-[rgb(var(--text-secondary))]">{s.courseName}</div>
                    <span className="text-4xs text-[rgb(var(--text-disabled))]" style={{ fontFamily: 'var(--font-mono, monospace)' }}>#{s.sectionNumber}</span>
                  </div>
                  <span className="text-3xs text-[rgb(var(--text-disabled))] text-center" style={{ width: 28 }}>{s.studentCount}</span>
                  <span className="text-3xs text-[rgb(var(--text-disabled))] text-center" style={{ width: 36 }}>{s.recordedCount}</span>
                  <span
                    // allow-presentation-style: per-section status chip tint (complete/partial/not-started)
                    className="text-4xs font-medium px-2 py-0.5 rounded-[5px] whitespace-nowrap text-right"
                    style={{ width: 70, ...statusStyle }}
                  >{statusLabel}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// PERIOD AVERAGES (CLS-018)
// ============================================================================

function PeriodAveragesCard({
  periodAverages,
}: {
  periodAverages: AttendanceOverviewResponse['periodAverages']
}) {
  const tiles = [
    { label: '7-Day', value: periodAverages.last7Days, color: V2.success },
    { label: '30-Day', value: periodAverages.last30Days, color: V2.textMuted },
    { label: 'Yearly', value: periodAverages.academicYear, color: V2.textMuted },
  ]

  const trending = periodAverages.last7Days > periodAverages.last30Days ? 'upward' : 'downward'

  return (
    <div className={CARD}>
      <CardHeader
        icon={<BarChartSmallIcon />}
        iconBg="rgba(29,158,117,0.10)"
        title="Period Averages"
        subtitle="Attendance rates across different time windows"
      />
      <div className={CARD_BODY}>
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-lg p-3 text-center bg-[rgb(var(--background-tertiary)/0.5)] border border-[rgb(var(--border-primary)/0.35)]">
              <div className="text-4xs font-bold uppercase tracking-[0.5px] text-[rgb(var(--text-disabled))] mb-1.5">{t.label}</div>
              <div
                // allow-presentation-style: per-tile accent (success vs neutral)
                className="text-xl font-bold"
                style={{ color: t.color }}
              >{t.value.toFixed(1)}%</div>
            </div>
          ))}
        </div>
        <div className="text-3xs text-[rgb(var(--text-disabled))] italic text-center mt-1">
          Attendance is trending {trending} over the last 7 days vs. 30-day baseline.
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ATTENDANCE ALERTS TABLE (CLS-019)
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

/**
 * Attendance Alerts — the actionable at-risk list.
 *
 * Uses the shared @edforge/ui DataTable: bounded height + pagination + sort +
 * a Trend faceted filter + student search, so the page no longer grows
 * unbounded as the at-risk cohort grows. Client-paginated over the aggregate's
 * `atRiskStudents` today; when the backend exposes a server-paginated at-risk
 * endpoint (plan T4), swap to DataTable's `serverPagination` adapter.
 */
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
  // Student drill-down modal state
  const [selectedStudent, setSelectedStudent] = useState<{
    studentId: string
    studentName: string
  } | null>(null)

  // Scope indicator
  const isSchoolWide = usePermission('manage', 'attendance')

  // Single aggregate data source. Sprint 1 / Ticket 1.3b: the parent
  // `AttendanceModule` gates on the current AY, so `academicYearId` is
  // guaranteed non-empty here. Previously `isLoading = queryLoading || !queryEnabled`
  // permanently rendered skeletons whenever the AY was missing — the
  // original "skeleton forever" bug. If `academicYearId` somehow arrives
  // empty (programmer error from a future caller), the query is disabled
  // and the dashboard renders no-data states instead of spinning forever.
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

  // Error state
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
      {/* SCOPE INDICATOR */}
      {!isSchoolWide && summary && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-3xs font-medium rounded-[20px] bg-[rgb(var(--state-info-bg))] text-[rgb(var(--state-info-fg))]">
          Showing data for your sections ({summary.totalStudents} students)
        </div>
      )}

      {/* TODAY SUMMARY STRIP (CLS-014) */}
      <WidgetErrorBoundaryV2>
        {isLoading ? (
          <SkeletonStrip />
        ) : summary && data?.periodAverages ? (
          <TodaySummaryStrip summary={summary} periodAverages={data.periodAverages} />
        ) : null}
      </WidgetErrorBoundaryV2>

      {/* ROW 1: Absence Breakdown + DOW Pattern (CLS-015) */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 gap-3">
          {data.absenceBreakdown && (
            <WidgetErrorBoundaryV2>
              <AbsenceBreakdownCard breakdown={data.absenceBreakdown} date={currentDate} />
            </WidgetErrorBoundaryV2>
          )}
          {data.dayOfWeekPattern && Object.keys(data.dayOfWeekPattern).length > 0 && (
            <WidgetErrorBoundaryV2>
              <DOWPatternCard pattern={data.dayOfWeekPattern} />
            </WidgetErrorBoundaryV2>
          )}
        </div>
      ) : null}

      {/* ROW 2: 30-Day Trend Chart (CLS-016) — full width */}
      {isLoading ? (
        <SkeletonCard />
      ) : data?.trend ? (
        <WidgetErrorBoundaryV2>
          <TrendChart trend={data.trend} periodAverages={data.periodAverages} />
        </WidgetErrorBoundaryV2>
      ) : null}

      {/* ROW 3: Section Completion + Period Averages (CLS-017, CLS-018) */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 gap-3">
          {data.sectionCompletion && (
            <WidgetErrorBoundaryV2>
              <SectionCompletionCard sectionCompletion={data.sectionCompletion} />
            </WidgetErrorBoundaryV2>
          )}
          {data.periodAverages && (
            <WidgetErrorBoundaryV2>
              <PeriodAveragesCard periodAverages={data.periodAverages} />
            </WidgetErrorBoundaryV2>
          )}
        </div>
      ) : null}

      {/* ROW 4: Attendance Alerts (CLS-019) — full width */}
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

export default AttendanceDashboard
