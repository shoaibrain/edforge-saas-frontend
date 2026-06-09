/**
 * AttendanceHeatmap — Monthly calendar grid with color-coded attendance cells
 *
 * Supports both Gregorian and Bikram Sambat calendar systems via
 * the calendarAdapter prop. Defaults to Gregorian.
 */

import { forwardRef, useMemo, type HTMLAttributes } from 'react'
import { cn, focusRingInset } from '../utils'

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
  present: { bg: 'rgb(var(--state-success-bg))' },
  absent: { bg: 'rgb(var(--state-danger-bg))' },
  late: { bg: 'rgb(var(--state-warning-bg))' },
  excused: { bg: 'rgb(var(--state-info-bg))' },
  holiday: {
    bg: 'repeating-linear-gradient(-45deg, transparent, transparent 3px, rgb(var(--border-primary) / 0.35) 3px, rgb(var(--border-primary) / 0.35) 4px)',
  },
  weekend: { bg: 'rgb(var(--background-tertiary) / 0.5)' },
  future: { bg: 'transparent' },
  none: { bg: 'transparent' },
}

const STATUS_TEXT: Record<HeatmapStatus, string> = {
  present: 'rgb(var(--state-success-fg))',
  absent: 'rgb(var(--state-danger-fg))',
  late: 'rgb(var(--state-warning-fg))',
  excused: 'rgb(var(--state-info-fg))',
  holiday: 'rgb(var(--text-tertiary))',
  weekend: 'rgb(var(--text-disabled))',
  future: 'rgb(var(--text-disabled))',
  none: 'rgb(var(--text-disabled))',
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
            className={cn('p-1.5 rounded-lg transition-colors', focusRingInset)}
            style={{ color: 'rgb(var(--text-tertiary))' }}
            aria-label="Previous month"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <span
            className="text-sm font-medium"
            style={{ color: 'rgb(var(--text-primary))' }}
          >
            {monthLabel}
          </span>
          <button
            onClick={() => onMonthChange(nextMonth(yearMonth))}
            className={cn('p-1.5 rounded-lg transition-colors', focusRingInset)}
            style={{ color: 'rgb(var(--text-tertiary))' }}
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
              className="text-center text-xs font-medium py-1"
              style={{ color: 'rgb(var(--text-tertiary))' }}
            >
              {h}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1" role="grid" aria-label="Attendance calendar">
          {grid.map((cell, i) => {
            if (!cell) {
              return <div key={`empty-${i}`} className="aspect-square" />
            }

            const colors = STATUS_COLORS[cell.status]

            return (
              <div
                key={cell.date}
                className={cn(
                  'aspect-square rounded-lg flex items-center justify-center text-xs font-medium tabular-nums',
                  focusRingInset
                )}
                style={{
                  background: colors.bg,
                  border: cell.isToday
                    ? '2px solid #1D9E75'
                    : colors.border ?? 'none',
                  color: STATUS_TEXT[cell.status],
                }}
                tabIndex={0}
                role="gridcell"
                aria-label={`${new Date(cell.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}: ${cell.status.charAt(0).toUpperCase() + cell.status.slice(1)}`}
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
                  border: STATUS_COLORS[status].border ?? '1px solid rgb(var(--border-primary) / 0.35)',
                }}
              />
              <span
                className="text-xs capitalize"
                style={{ color: 'rgb(var(--text-tertiary))' }}
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
