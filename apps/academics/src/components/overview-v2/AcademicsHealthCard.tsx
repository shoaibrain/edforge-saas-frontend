/**
 * AcademicsHealthCard — V2
 *
 * Unified academics health view with two sections:
 * 1. Enrollment status donut chart (enrolled, pending, withdrawn, graduated, transferred)
 * 2. Attendance health gauge with 7-day mini sparkline
 *
 * Analogous to Finance's BillingHealthCard — same visual language, different domain.
 */

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts'
import { CheckCircle2, ClipboardCheck } from 'lucide-react'
import type { AttendanceTrendPoint } from '../../hooks/useAcademicsOverview'

// ─── Colors ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  enrolled: '#1D9E75',
  active: '#1D9E75',
  pending: '#EF9F27',
  withdrawn: '#E24B4A',
  graduated: '#378ADD',
  transferred: '#7F77DD',
  no_show: '#888780',
}

function formatStatusLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function getAttendanceGaugeColor(rate: number): string {
  if (rate >= 95) return '#1D9E75'
  if (rate >= 90) return '#378ADD'
  if (rate >= 80) return '#EF9F27'
  return '#E24B4A'
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface AcademicsHealthCardProps {
  enrollmentByStatus: Record<string, number> | null
  totalEnrolled: number | null
  todayAttendanceRate: number | null
  todayAttendanceSummary: {
    totalStudents: number
    totalRecorded?: number
    present: number
    absent: number
    late: number
  } | null
  trendData: AttendanceTrendPoint[]
  atRiskCount: number
  isLoading: boolean
}

// ─── Skeletons ───────────────────────────────────────────────────────────────

function DonutSkeleton() {
  return (
    <div className="flex items-start gap-4">
      <div
        className="w-[110px] h-[110px] rounded-full v2-skeleton-pulse flex-shrink-0"
        style={{ background: 'var(--v2-bg-elevated)' }}
      />
      <div className="flex-1 space-y-2.5 pt-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
              <div className="h-3 w-16 rounded v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
            </div>
            <div className="h-3 w-8 rounded v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function AttendanceSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-4">
        <div className="h-8 w-16 rounded v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
        <div className="flex-1 h-10 rounded v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
      </div>
      <div className="h-3 w-48 rounded v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
    </div>
  )
}

// ─── Tooltips ────────────────────────────────────────────────────────────────

function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div
      className="rounded-lg border px-3 py-2 text-[11px] shadow-lg"
      style={{
        background: 'var(--v2-bg-surface)',
        borderColor: 'var(--v2-border-default)',
        color: 'var(--v2-text-secondary)',
      }}
    >
      <div className="font-semibold">{d.name}</div>
      <div style={{ color: 'var(--v2-text-faint)' }}>
        {d.value} student{d.value !== 1 ? 's' : ''} · {d.payload.pct}%
      </div>
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AcademicsHealthCard({
  enrollmentByStatus,
  totalEnrolled,
  todayAttendanceRate,
  todayAttendanceSummary,
  trendData,
  atRiskCount,
  isLoading,
}: AcademicsHealthCardProps) {
  const total = totalEnrolled ?? 0

  // Build donut data — filter out zero-count statuses
  const donutData = useMemo(() => {
    if (!enrollmentByStatus) return []
    return Object.entries(enrollmentByStatus)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([status, count]) => ({
        name: formatStatusLabel(status),
        value: count,
        color: STATUS_COLORS[status] || '#888780',
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
  }, [enrollmentByStatus, total])

  // Last 7 days of trend data for mini sparkline
  const sparklineData = useMemo(() => {
    if (trendData.length <= 7) return trendData
    return trendData.slice(-7)
  }, [trendData])

  const hasEnrollmentData = donutData.length > 0
  const gaugeColor = todayAttendanceRate != null ? getAttendanceGaugeColor(todayAttendanceRate) : undefined

  return (
    <div
      className="rounded-xl border flex flex-col"
      style={{
        background: 'var(--v2-bg-surface)',
        borderColor: 'var(--v2-border-default)',
        padding: 18,
      }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-medium" style={{ color: 'var(--v2-text-secondary)' }}>
          Academics health
        </h3>
        {!isLoading && hasEnrollmentData && todayAttendanceRate != null && todayAttendanceRate >= 90 && (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(29,158,117,0.12)', color: '#1D9E75' }}
          >
            <CheckCircle2 className="w-3 h-3" />
            On track
          </span>
        )}
      </div>

      {/* ── Section 1: Enrollment Status Donut ── */}
      {isLoading ? (
        <DonutSkeleton />
      ) : !hasEnrollmentData ? (
        <div className="flex flex-col items-center py-6">
          <CheckCircle2 className="w-8 h-8 mb-2" style={{ color: 'var(--v2-text-hint)', opacity: 0.4 }} />
          <p className="text-[12px] font-medium" style={{ color: 'var(--v2-text-hint)' }}>
            No enrollment data yet
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--v2-text-faint)' }}>
            Enroll students to see enrollment health data.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-4">
            {/* Donut */}
            <div className="flex-shrink-0 relative" style={{ width: 110, height: 110 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={33}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                    animationDuration={700}
                    animationEasing="ease-out"
                    stroke="none"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[15px] font-semibold leading-none" style={{ color: 'var(--v2-text-primary)' }}>
                  {total}
                </span>
                <span className="text-[9px] mt-0.5" style={{ color: 'var(--v2-text-faint)' }}>
                  students
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-1.5 pt-1">
              {donutData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                    <span className="text-[11px]" style={{ color: 'var(--v2-text-secondary)' }}>
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] tabular-nums" style={{ color: 'var(--v2-text-faint)' }}>
                      {item.pct}%
                    </span>
                    <span className="text-[11px] font-medium tabular-nums" style={{ color: 'var(--v2-text-secondary)' }}>
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="my-4" style={{ height: 1, background: 'var(--v2-border-default)' }} />

          {/* ── Section 2: Attendance Health ── */}
          {isLoading ? (
            <AttendanceSkeleton />
          ) : todayAttendanceRate == null ? (
            <div className="flex items-center gap-3 py-3">
              <ClipboardCheck className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--v2-text-hint)', opacity: 0.5 }} />
              <div>
                <p className="text-[12px] font-medium" style={{ color: 'var(--v2-text-hint)' }}>
                  No attendance data yet
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--v2-text-faint)' }}>
                  Start recording attendance to see health metrics.
                </p>
              </div>
            </div>
          ) : (
            <div>
              {/* Section header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-medium" style={{ color: 'var(--v2-text-secondary)' }}>
                  Attendance health
                </span>
                {todayAttendanceSummary && (
                  <span className="text-[10px] tabular-nums" style={{ color: 'var(--v2-text-faint)' }}>
                    {todayAttendanceSummary.totalRecorded ?? 0} of {todayAttendanceSummary.totalStudents} recorded
                  </span>
                )}
              </div>

              {/* Rate + Sparkline row */}
              <div className="flex items-end gap-4">
                {/* Large rate number */}
                <div className="flex-shrink-0">
                  <span
                    className="text-[28px] font-bold leading-none tabular-nums"
                    style={{ color: gaugeColor }}
                  >
                    {todayAttendanceRate.toFixed(1)}
                  </span>
                  <span
                    className="text-[13px] font-semibold ml-0.5"
                    style={{ color: gaugeColor }}
                  >
                    %
                  </span>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--v2-text-faint)' }}>
                    today
                  </p>
                </div>

                {/* 7-day mini sparkline */}
                {sparklineData.length > 1 && (
                  <div className="flex-1 min-w-0" style={{ height: 44 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sparklineData} margin={{ top: 4, right: 2, left: 2, bottom: 0 }}>
                        <defs>
                          <linearGradient id="v2AcademicsSparkGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={gaugeColor} stopOpacity={0.15} />
                            <stop offset="95%" stopColor={gaugeColor} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="rate"
                          stroke={gaugeColor}
                          strokeWidth={1.5}
                          fill="url(#v2AcademicsSparkGrad)"
                          dot={false}
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                    <p className="text-[9px] text-right mt-0.5" style={{ color: 'var(--v2-text-ghost)' }}>
                      7-day trend
                    </p>
                  </div>
                )}
              </div>

              {/* Summary text */}
              {todayAttendanceSummary && (
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <span className="text-[10px]" style={{ color: 'var(--v2-text-faint)' }}>
                    {todayAttendanceSummary.present} present
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--v2-text-ghost)' }}>·</span>
                  <span className="text-[10px]" style={{ color: todayAttendanceSummary.absent > 0 ? '#E24B4A' : 'var(--v2-text-faint)' }}>
                    {todayAttendanceSummary.absent} absent
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--v2-text-ghost)' }}>·</span>
                  <span className="text-[10px]" style={{ color: todayAttendanceSummary.late > 0 ? '#EF9F27' : 'var(--v2-text-faint)' }}>
                    {todayAttendanceSummary.late} late
                  </span>
                </div>
              )}

              {/* At-risk insight */}
              {atRiskCount > 0 && (
                <p className="text-[11px] mt-2.5 leading-relaxed" style={{ color: 'var(--v2-text-hint)' }}>
                  {atRiskCount} student{atRiskCount !== 1 ? 's' : ''} below 90% attendance threshold over the past 90 days.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
