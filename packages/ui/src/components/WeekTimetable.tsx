/**
 * WeekTimetable — 5-column week grid with time rows and class blocks
 *
 * Renders a school week timetable from bell schedule periods and enrolled sections.
 * Each cell shows a color-coded class block with course name and room.
 *
 * Design: matches the prototype's timetable grid with:
 *   - Mon-Fri columns, "today" indicator (filled dot)
 *   - Time rows derived from bell schedule periods
 *   - Deterministic color per course (same hash as CourseCard)
 *   - Horizontal scroll on mobile with today column visible
 *   - Empty cells for free periods
 *   - Both light and dark mode via V2 tokens
 */

import { forwardRef, useMemo, type HTMLAttributes } from 'react'
import { cn } from '../utils'

// ============================================================================
// TYPES
// ============================================================================

export interface TimetableSlot {
  periodNumber: number
  periodName: string
  startTime: string   // HH:MM
  endTime: string     // HH:MM
  periodType: string
  isAcademic: boolean
}

export interface TimetableClassBlock {
  /** Which period number this block occupies */
  periodNumber: number
  /** Day of week: 1=Mon ... 5=Fri */
  dayOfWeek: number
  courseName: string
  courseCode?: string
  room?: string
  teacherName?: string
  sectionId: string
}

export interface WeekTimetableProps extends HTMLAttributes<HTMLDivElement> {
  /** Ordered period slots from bell schedule (the rows) */
  periods: TimetableSlot[]
  /** Class blocks to place in the grid */
  blocks: TimetableClassBlock[]
  /** ISO date string for the start of the displayed week (Monday) */
  weekStartDate?: string
}

// ============================================================================
// HELPERS
// ============================================================================

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const

const COURSE_COLORS = [
  '#1D9E75', '#378ADD', '#7F77DD', '#D85A30',
  '#EF9F27', '#E24B4A', '#0a9396', '#ca6702',
]

function courseColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
  }
  return COURSE_COLORS[Math.abs(hash) % COURSE_COLORS.length]
}

/** Get the ISO day-of-week (1=Mon, 7=Sun) for today */
function todayDow(): number {
  const d = new Date().getDay()
  return d === 0 ? 7 : d // Convert Sun=0 to 7
}

/** Format a date offset from weekStart as "Apr 10" */
function dayDate(weekStart: string | undefined, dayIdx: number): string {
  if (!weekStart) return ''
  const d = new Date(weekStart)
  d.setDate(d.getDate() + dayIdx)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// ============================================================================
// COMPONENT
// ============================================================================

export const WeekTimetable = forwardRef<HTMLDivElement, WeekTimetableProps>(
  ({ className, periods, blocks, weekStartDate, ...props }, ref) => {
    const today = todayDow()

    // Build a lookup: key = "periodNumber-dayOfWeek" → block
    const blockMap = useMemo(() => {
      const map = new Map<string, TimetableClassBlock>()
      for (const b of blocks) {
        map.set(`${b.periodNumber}-${b.dayOfWeek}`, b)
      }
      return map
    }, [blocks])

    if (periods.length === 0) return null

    return (
      <div
        ref={ref}
        className={cn('overflow-x-auto', className)}
        {...props}
      >
        <div className="min-w-3xl">
          {/* ---- Header row: day labels ---- */}
          <div className="grid grid-cols-[72px_repeat(5,1fr)] gap-1 mb-1">
            {/* Time column header */}
            <div />
            {DAY_LABELS.map((label, i) => {
              const dow = i + 1
              const isToday = dow === today
              return (
                <div
                  key={label}
                  // allow-presentation-style: today-column highlight tints with the brand accent
                  className="text-center py-2 rounded-lg"
                  style={{
                    background: isToday
                      ? 'color-mix(in srgb, #1D9E75 10%, transparent)'
                      : 'transparent',
                  }}
                >
                  <div className="flex items-center justify-center gap-1">
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#1D9E75]" />
                    )}
                    <p className={`text-xs font-medium ${isToday ? 'text-[#1D9E75]' : 'text-[rgb(var(--text-tertiary))]'}`}>
                      {label}
                    </p>
                  </div>
                  {weekStartDate && (
                    <p className={`text-xs ${isToday ? 'text-[#1D9E75]' : 'text-[rgb(var(--text-tertiary))]'}`}>
                      {dayDate(weekStartDate, i)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {/* ---- Period rows ---- */}
          {periods.map((period) => (
            <div
              key={period.periodNumber}
              className="grid grid-cols-[72px_repeat(5,1fr)] gap-1 mb-1"
            >
              {/* Time label */}
              <div className="flex flex-col justify-center pr-2 text-right">
                <span className="text-xs font-mono tabular-nums leading-tight text-[rgb(var(--text-tertiary))]">
                  {period.startTime}
                </span>
                <span className="text-xs font-mono tabular-nums text-[rgb(var(--text-disabled))]">
                  {period.endTime}
                </span>
              </div>

              {/* 5 day cells */}
              {DAY_LABELS.map((_, dayIdx) => {
                const dow = dayIdx + 1
                const block = blockMap.get(`${period.periodNumber}-${dow}`)

                if (block) {
                  const color = courseColor(block.courseName)
                  return (
                    <div
                      key={dow}
                      // allow-presentation-style: cell tint is the deterministic per-course hue
                      className="rounded-lg p-2 min-h-14 border transition-colors"
                      style={{
                        background: `color-mix(in srgb, ${color} 10%, transparent)`,
                        borderColor: `color-mix(in srgb, ${color} 20%, transparent)`,
                      }}
                    >
                      <p
                        // allow-presentation-style: course title color is the per-course hue
                        className="text-xs font-semibold truncate leading-tight"
                        style={{ color }}
                      >
                        {block.courseName}
                      </p>
                      {block.room && (
                        <p className="text-xs truncate mt-0.5 text-[rgb(var(--text-tertiary))]">
                          {block.room}
                        </p>
                      )}
                    </div>
                  )
                }

                // Non-academic period (lunch, recess, etc.) — show label
                if (!period.isAcademic && period.periodType !== 'passing') {
                  return (
                    <div
                      key={dow}
                      className="rounded-lg p-2 min-h-14 flex items-center justify-center bg-[rgb(var(--background-tertiary)/0.5)]"
                    >
                      <span className="text-xs italic text-[rgb(var(--text-disabled))]">
                        {period.periodName}
                      </span>
                    </div>
                  )
                }

                // Empty academic slot
                return (
                  <div
                    key={dow}
                    className="rounded-lg min-h-14 border border-dashed border-[rgb(var(--border-primary)/0.35)]"
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }
)

WeekTimetable.displayName = 'WeekTimetable'
