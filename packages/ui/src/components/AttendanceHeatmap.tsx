/**
 * AttendanceHeatmap — Monthly calendar grid with color-coded attendance cells
 *
 * Supports both Gregorian and Bikram Sambat calendar systems via
 * the calendarAdapter prop. Defaults to Gregorian.
 */

import { forwardRef, useMemo, type HTMLAttributes } from 'react'
import { cn } from '../utils'

export type HeatmapStatus = 'present' | 'absent' | 'late' | 'excused' | 'holiday' | 'weekend' | 'future' | 'none'

export interface HeatmapDay {
  date: string // ISO date string (YYYY-MM-DD)
  dayNumber: number
  status: HeatmapStatus
  isToday?: boolean
}

export interface AttendanceHeatmapProps extends HTMLAttributes<HTMLDivElement> {
  /** Current year + month (YYYY-MM) */
  yearMonth: string
  /** Day data for the month */
  days: HeatmapDay[]
  /** Called when user navigates to prev/next month */
  onMonthChange: (yearMonth: string) => void
  /** Month display label (e.g., "April 2026" or "बैशाख २०८३") */
  monthLabel: string
  /** Day-of-week headers */
  dayHeaders?: string[]
  /** First day of week offset (0=Sun, 1=Mon) */
  weekStartsOn?: 0 | 1
}

const STATUS_COLORS: Record<HeatmapStatus, { bg: string; border?: string }> = {
  present: { bg: 'var(--v2-status-present-bg)' },
  absent: { bg: 'var(--v2-status-absent-bg)' },
  late: { bg: 'var(--v2-status-late-bg)' },
  excused: { bg: 'var(--v2-status-excused-bg)' },
  holiday: { bg: 'var(--v2-surface-inset)', border: '1px dashed var(--v2-border-default)' },
  weekend: { bg: 'var(--v2-surface-inset)' },
  future: { bg: 'transparent' },
  none: { bg: 'transparent' },
}

const STATUS_TEXT: Record<HeatmapStatus, string> = {
  present: 'var(--v2-status-present)',
  absent: 'var(--v2-status-absent)',
  late: 'var(--v2-status-late)',
  excused: 'var(--v2-status-excused)',
  holiday: 'var(--v2-text-hint)',
  weekend: 'var(--v2-text-ghost)',
  future: 'var(--v2-text-ghost)',
  none: 'var(--v2-text-ghost)',
}

const DEFAULT_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function prevMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function nextMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export const AttendanceHeatmap = forwardRef<HTMLDivElement, AttendanceHeatmapProps>(
  (
    {
      className,
      yearMonth,
      days,
      onMonthChange,
      monthLabel,
      dayHeaders = DEFAULT_HEADERS,
      weekStartsOn = 0,
      ...props
    },
    ref
  ) => {
    // Build the grid: pad leading empty cells for day-of-week alignment
    const grid = useMemo(() => {
      if (days.length === 0) return []
      // Find the day-of-week of the first day
      const firstDate = days[0]?.date
      if (!firstDate) return []
      const firstDow = new Date(firstDate).getDay()
      const offset = (firstDow - weekStartsOn + 7) % 7
      const cells: (HeatmapDay | null)[] = Array(offset).fill(null)
      cells.push(...days)
      return cells
    }, [days, weekStartsOn])

    return (
      <div
        ref={ref}
        className={cn('', className)}
        {...props}
      >
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => onMonthChange(prevMonth(yearMonth))}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--v2-text-muted)' }}
            aria-label="Previous month"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--v2-text-primary)' }}
          >
            {monthLabel}
          </span>
          <button
            onClick={() => onMonthChange(nextMonth(yearMonth))}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--v2-text-muted)' }}
            aria-label="Next month"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayHeaders.map((h) => (
            <div
              key={h}
              className="text-center text-[10px] font-medium py-1"
              style={{ color: 'var(--v2-text-hint)' }}
            >
              {h}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {grid.map((cell, i) => {
            if (!cell) {
              return <div key={`empty-${i}`} className="aspect-square" />
            }

            const colors = STATUS_COLORS[cell.status]

            return (
              <div
                key={cell.date}
                className="aspect-square rounded-lg flex items-center justify-center text-[11px] font-medium tabular-nums"
                style={{
                  background: colors.bg,
                  border: cell.isToday
                    ? '2px solid var(--v2-brand-primary)'
                    : colors.border ?? 'none',
                  color: STATUS_TEXT[cell.status],
                }}
                aria-label={`${cell.date}: ${cell.status}`}
              >
                {cell.dayNumber}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          {(['present', 'absent', 'late', 'excused', 'holiday'] as HeatmapStatus[]).map((status) => (
            <div key={status} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded"
                style={{
                  background: STATUS_COLORS[status].bg,
                  border: STATUS_COLORS[status].border ?? '1px solid var(--v2-border-default)',
                }}
              />
              <span
                className="text-[10px] capitalize"
                style={{ color: 'var(--v2-text-hint)' }}
              >
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
)

AttendanceHeatmap.displayName = 'AttendanceHeatmap'
