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
 */

import { useState, useMemo } from 'react'
import {
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { WidgetErrorBoundaryV2 } from '@edforge/ui'
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

type SortDir = 'asc' | 'desc'

// ============================================================================
// V2 DESIGN TOKENS
// ============================================================================

const V2 = {
  bgSurface: 'var(--v2-bg-surface, #161b27)',
  borderDefault: 'var(--v2-border-default, rgba(255,255,255,0.06))',
  borderSeparator: 'rgba(255,255,255,0.05)',
  borderRow: 'rgba(255,255,255,0.04)',
  textPrimary: 'var(--v2-text-primary, #e8eaf0)',
  textSecondary: 'var(--v2-text-secondary, #c8ccd8)',
  textMuted: 'var(--v2-text-muted, #7a8099)',
  textHint: 'var(--v2-text-hint, #4a5068)',
  textGhost: 'var(--v2-text-ghost, #2a3045)',
  success: '#1D9E75',
  info: '#378ADD',
  warning: '#EF9F27',
  danger: '#E24B4A',
  purple: '#7F77DD',
  orange: '#D85A30',
}

const cardStyle: React.CSSProperties = {
  background: V2.bgSurface,
  border: `1px solid ${V2.borderDefault}`,
  borderRadius: 10,
  overflow: 'hidden',
}

const cardHeaderStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: `1px solid ${V2.borderSeparator}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}

const cardBodyStyle: React.CSSProperties = {
  padding: 16,
}

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
    <div style={cardHeaderStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 22, height: 22, borderRadius: 5, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: V2.textPrimary }}>{title}</div>
          <div style={{ fontSize: 10, color: V2.textGhost, marginTop: 1 }}>{subtitle}</div>
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
    <div style={{ ...cardStyle, padding: '14px 16px', display: 'flex', gap: 0 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 32, height: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 4 }} />
          <div style={{ width: 48, height: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 3 }} />
        </div>
      ))}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div style={{ ...cardStyle, padding: 16 }}>
      <div style={{ width: '50%', height: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 4, marginBottom: 12 }} />
      <div style={{ height: 120, background: 'rgba(255,255,255,0.04)', borderRadius: 6 }} />
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
    <div style={{ ...cardStyle, padding: '14px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 0 }}>
      {stats.map((s, i) => (
        <div
          key={s.label}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 2,
            borderLeft: i > 0 ? `1px solid ${V2.borderDefault}` : 'none',
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 700, lineHeight: 1, color: s.color }}>{s.value}</span>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: V2.textGhost }}>{s.label}</span>
          <span style={{ fontSize: 9, color: V2.textGhost }}>{s.sub}</span>
        </div>
      ))}

      {/* Divider */}
      <div style={{ width: 1, height: 48, background: V2.borderDefault, flexShrink: 0, margin: '0 16px' }} />

      {/* School Average */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1.5, gap: 2 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: V2.success, lineHeight: 1 }}>
          {periodAverages.academicYear.toFixed(1)}%
        </span>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: V2.textGhost }}>
          School Average
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <span style={{
            fontSize: 9, fontWeight: 500, padding: '1px 5px', borderRadius: 4,
            background: sevenDayUp ? 'rgba(29,158,117,0.10)' : 'rgba(226,75,74,0.10)',
            color: sevenDayUp ? V2.success : V2.danger,
          }}>
            7-day: {periodAverages.last7Days.toFixed(1)}%
          </span>
          <span style={{
            fontSize: 9, fontWeight: 500, padding: '1px 5px', borderRadius: 4,
            background: !sevenDayUp ? 'rgba(29,158,117,0.10)' : 'rgba(226,75,74,0.10)',
            color: !sevenDayUp ? V2.success : V2.danger,
          }}>
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
    <div style={cardStyle}>
      <CardHeader
        icon={<AlertCircleIcon />}
        iconBg="rgba(226,75,74,0.08)"
        title="Today's Absence Breakdown"
        subtitle={`${dateLabel} — ${total === 0 ? 'no absences recorded yet' : `${total} absences`}`}
      />
      <div style={cardBodyStyle}>
        {categories.map((cat, i) => (
          <div
            key={cat.label}
            style={{
              display: 'flex', alignItems: 'center', padding: '7px 0', gap: 8,
              borderBottom: i < categories.length - 1 ? `1px solid ${V2.borderRow}` : 'none',
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: V2.textSecondary, flex: 1 }}>{cat.label}</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: V2.textMuted }}>{cat.count}</span>
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
    <div style={cardStyle}>
      <CardHeader
        icon={<ActivityIcon />}
        iconBg="rgba(239,159,39,0.10)"
        title="Day-of-Week Pattern"
        subtitle="Average attendance rate by weekday"
      />
      <div style={cardBodyStyle}>
        <div style={{ display: 'flex', gap: 6 }}>
          {days.map((day) => {
            const d = pattern[day]
            const heightPct = maxRate > 0 ? (d.avgRate / 100) * 100 : 0
            const lowest = isLowest(d.avgRate)
            return (
              <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ height: 36, width: '100%', background: 'rgba(255,255,255,0.04)', borderRadius: 4, overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{ width: '100%', height: `${heightPct}%`, background: getBarColor(d.avgRate), borderRadius: 3, transition: 'all 0.3s' }} />
                </div>
                <div style={{ fontSize: 9, color: lowest ? V2.danger : V2.textGhost }}>{DAY_SHORT[day]}</div>
                <div style={{ fontSize: 9, fontWeight: 600, color: lowest ? V2.danger : V2.textMuted }}>{d.avgRate.toFixed(0)}%</div>
              </div>
            )
          })}
        </div>
        <div style={{ fontSize: 9, color: V2.textGhost, marginTop: 10, paddingTop: 8, borderTop: `1px solid ${V2.borderSeparator}` }}>
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
      <div style={cardStyle}>
        <CardHeader
          icon={<TrendLineIcon />}
          iconBg="rgba(29,158,117,0.10)"
          title="30-Day Attendance Rate"
          subtitle="No trend data available"
        />
        <div style={{ ...cardBodyStyle, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, color: V2.textHint }}>No trend data available for the selected period.</span>
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
    <div style={cardStyle}>
      <CardHeader
        icon={<TrendLineIcon />}
        iconBg="rgba(29,158,117,0.10)"
        title="30-Day Attendance Rate"
        subtitle={`Daily recorded attendance rate trend — ${firstDate} to ${lastDate}`}
        right={
          <div style={{ display: 'flex', gap: 12, fontSize: 10 }}>
            <span style={{ color: V2.textHint }}>7-day avg: <strong style={{ color: V2.success }}>{periodAverages.last7Days.toFixed(1)}%</strong></span>
            <span style={{ color: V2.textHint }}>30-day avg: <strong style={{ color: V2.textMuted }}>{periodAverages.last30Days.toFixed(1)}%</strong></span>
          </div>
        }
      />
      <div style={{ ...cardBodyStyle, paddingTop: 8 }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 9, color: V2.textGhost }}>
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
    <div style={cardStyle}>
      <CardHeader
        icon={<CheckSquareIcon />}
        iconBg="rgba(127,119,221,0.10)"
        title="Section Completion"
        subtitle="Today's recording status per section"
      />
      <div style={cardBodyStyle}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {/* Ring */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ position: 'relative', width: 72, height: 72 }}>
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
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
              }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: pct > 0 ? V2.textPrimary : V2.textHint }}>{pct}%</span>
              </div>
            </div>
            <div style={{ fontSize: 9, color: V2.textHint }}>{sectionsWithAttendance} / {totalSections}</div>
          </div>

          {/* Section list */}
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            {/* Header row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, paddingBottom: 6,
              borderBottom: `1px solid ${V2.borderSeparator}`,
            }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: V2.textGhost, textTransform: 'uppercase', letterSpacing: '0.5px', flex: 1 }}>Section</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: V2.textGhost, textTransform: 'uppercase', letterSpacing: '0.5px', width: 28, textAlign: 'center' }}>Enr.</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: V2.textGhost, textTransform: 'uppercase', letterSpacing: '0.5px', width: 36, textAlign: 'center' }}>Rec.</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: V2.textGhost, textTransform: 'uppercase', letterSpacing: '0.5px', width: 70, textAlign: 'right' }}>Status</span>
            </div>
            {/* Rows */}
            {sections.map((s, i) => {
              const statusLabel = s.isComplete ? 'Complete' : s.recordedCount > 0 ? 'Partial' : 'Not Started'
              const statusStyle: React.CSSProperties = s.isComplete
                ? { background: 'rgba(29,158,117,0.10)', color: V2.success }
                : s.recordedCount > 0
                  ? { background: 'rgba(239,159,39,0.10)', color: V2.warning }
                  : { background: 'rgba(255,255,255,0.05)', color: V2.textHint }

              return (
                <div
                  key={s.sectionId}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '7px 0', gap: 10,
                    borderBottom: i < sections.length - 1 ? `1px solid ${V2.borderRow}` : 'none',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: V2.textSecondary }}>{s.courseName}</div>
                    <span style={{ fontSize: 9, color: V2.textHint, fontFamily: 'var(--font-mono, monospace)' }}>#{s.sectionNumber}</span>
                  </div>
                  <span style={{ fontSize: 10, color: V2.textHint, width: 28, textAlign: 'center' }}>{s.studentCount}</span>
                  <span style={{ fontSize: 10, color: V2.textHint, width: 36, textAlign: 'center' }}>{s.recordedCount}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 500, padding: '2px 7px', borderRadius: 5, whiteSpace: 'nowrap', width: 70, textAlign: 'right',
                    ...statusStyle,
                  }}>{statusLabel}</span>
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
    <div style={cardStyle}>
      <CardHeader
        icon={<BarChartSmallIcon />}
        iconBg="rgba(29,158,117,0.10)"
        title="Period Averages"
        subtitle="Attendance rates across different time windows"
      />
      <div style={cardBodyStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
          {tiles.map((t) => (
            <div key={t.label} style={{
              background: 'rgba(255,255,255,0.02)', border: `1px solid ${V2.borderDefault}`,
              borderRadius: 8, padding: 12, textAlign: 'center',
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: V2.textGhost, marginBottom: 6 }}>{t.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: t.color }}>{t.value.toFixed(1)}%</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: V2.textGhost, fontStyle: 'italic', textAlign: 'center', marginTop: 4 }}>
          Attendance is trending {trending} over the last 7 days vs. 30-day baseline.
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ATTENDANCE ALERTS TABLE (CLS-019)
// ============================================================================

type AlertSortKey = 'studentName' | 'attendanceRate' | 'absentDays' | 'totalDays' | 'trend'

function getRateColorHex(rate: number): string {
  if (rate < 60) return V2.danger
  if (rate < 80) return V2.warning
  return V2.textMuted
}

function AlertsTableV2({
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
        case 'studentName': cmp = a.studentName.localeCompare(b.studentName); break
        case 'attendanceRate': cmp = a.attendanceRate - b.attendanceRate; break
        case 'absentDays': cmp = a.absentDays - b.absentDays; break
        case 'totalDays': cmp = a.totalDays - b.totalDays; break
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

  const headerColStyle = (_field: AlertSortKey, width: number | string, align: 'left' | 'right' | 'center' = 'right'): React.CSSProperties => ({
    fontSize: 9,
    fontWeight: 700,
    color: V2.textGhost,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    width: typeof width === 'number' ? width : undefined,
    flex: width === 'flex' ? 1 : undefined,
    textAlign: align,
    cursor: 'pointer',
    userSelect: 'none',
  })

  const trendText = (trend: string) => {
    switch (trend) {
      case 'improving': return { text: '↑ Improving', color: V2.success }
      case 'declining': return { text: '↓ Declining', color: V2.danger }
      default: return { text: '— Stable', color: V2.textHint }
    }
  }

  return (
    <div style={cardStyle}>
      <CardHeader
        icon={<WarningTriangleIcon />}
        iconBg="rgba(239,159,39,0.10)"
        title="Attendance Alerts"
        subtitle="Students below 90% attendance rate · sorted by severity"
        right={
          alerts.length > 0
            ? <span style={{ fontSize: 10, color: V2.textHint }}>Showing {alerts.length} of {totalAtRiskCount} at-risk student{totalAtRiskCount !== 1 ? 's' : ''}</span>
            : undefined
        }
      />
      <div style={cardBodyStyle}>
        {alerts.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <CheckCircle style={{ width: 40, height: 40, color: V2.success, margin: '0 auto 12px' }} />
            <p style={{ fontSize: 12, color: V2.textSecondary }}>No students below the attendance threshold</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, paddingBottom: 6, borderBottom: `1px solid ${V2.borderSeparator}` }}>
              <span style={headerColStyle('studentName', 'flex', 'left')} onClick={() => toggleSort('studentName')}>
                Student {sortKey === 'studentName' && (sortDir === 'asc' ? '▲' : '▼')}
              </span>
              <span style={headerColStyle('attendanceRate', 70)} onClick={() => toggleSort('attendanceRate')}>
                Rate {sortKey === 'attendanceRate' && (sortDir === 'asc' ? '▲' : '▼')}
              </span>
              <span style={headerColStyle('absentDays', 60, 'center')} onClick={() => toggleSort('absentDays')}>
                Absent {sortKey === 'absentDays' && (sortDir === 'asc' ? '▲' : '▼')}
              </span>
              <span style={headerColStyle('totalDays', 50, 'center')} onClick={() => toggleSort('totalDays')}>
                Total {sortKey === 'totalDays' && (sortDir === 'asc' ? '▲' : '▼')}
              </span>
              <span style={headerColStyle('trend', 60)} onClick={() => toggleSort('trend')}>
                Trend {sortKey === 'trend' && (sortDir === 'asc' ? '▲' : '▼')}
              </span>
            </div>
            {/* Rows */}
            {sorted.map((alert, i) => {
              const t = trendText(alert.trend)
              return (
                <div
                  key={alert.studentId}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '8px 0', gap: 12,
                    borderBottom: i < sorted.length - 1 ? `1px solid ${V2.borderRow}` : 'none',
                  }}
                >
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <UserAvatar userId={alert.studentId} userName={alert.studentName} size="sm" />
                    <div style={{ minWidth: 0 }}>
                      <button
                        type="button"
                        onClick={() => onStudentClick?.(alert.studentId)}
                        style={{
                          background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left',
                          fontSize: 12, fontWeight: 500, color: V2.textPrimary,
                        }}
                      >
                        {alert.studentName}
                      </button>
                      {alert.gradeLevel && (
                        <span style={{ display: 'block', fontSize: 9, color: V2.textHint }}>{alert.gradeLevel}</span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, width: 60, textAlign: 'right', color: getRateColorHex(alert.attendanceRate) }}>
                    {alert.attendanceRate.toFixed(1)}%
                  </span>
                  <span style={{ fontSize: 11, color: V2.textMuted, width: 50, textAlign: 'center' }}>{alert.absentDays}</span>
                  <span style={{ fontSize: 11, color: V2.textHint, width: 50, textAlign: 'center' }}>{alert.totalDays}</span>
                  <span style={{ fontSize: 10, color: t.color, width: 60, textAlign: 'right' }}>{t.text}</span>
                </div>
              )
            })}
          </>
        )}
      </div>
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
      <div style={{ ...cardStyle, padding: 24, textAlign: 'center' }}>
        <AlertTriangle style={{ width: 20, height: 20, color: V2.danger, margin: '0 auto 8px' }} />
        <p style={{ fontSize: 13, fontWeight: 500, color: V2.danger, marginBottom: 4 }}>Failed to load attendance overview</p>
        <p style={{ fontSize: 11, color: V2.textMuted }}>Please try refreshing the page. If the issue persists, contact support.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* SCOPE INDICATOR */}
      {!isSchoolWide && summary && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
          fontSize: 10, fontWeight: 500, borderRadius: 20,
          background: 'rgba(55,138,221,0.08)', color: V2.info,
        }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : data ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : data ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
          <AlertsTableV2
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
