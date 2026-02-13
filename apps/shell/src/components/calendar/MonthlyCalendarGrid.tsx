/**
 * MonthlyCalendarGrid Component (Task 2.9b)
 *
 * Renders a month-view calendar grid with color-coded date cells
 * based on calendar event types (instructional, holiday, break, etc.).
 * Supports click-to-select and multi-select (bulk mode).
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useCalendarDates } from '@/hooks/useCalendar'
import type { CalendarDateResponseDto } from '@aibrains/shared-types'

// ============================================================================
// CONSTANTS
// ============================================================================

const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const EVENT_COLOR_MAP: Record<string, { bg: string; border: string; text: string }> = {
  instructional_day: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  holiday:           { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700' },
  teacher_only:      { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700' },
  break:             { bg: 'bg-purple-50',   border: 'border-purple-200',  text: 'text-purple-700' },
  non_instructional_day: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600' },
  student_holiday:   { bg: 'bg-orange-50',   border: 'border-orange-200',  text: 'text-orange-700' },
  early_release:     { bg: 'bg-sky-50',      border: 'border-sky-200',     text: 'text-sky-700' },
  late_start:        { bg: 'bg-indigo-50',   border: 'border-indigo-200',  text: 'text-indigo-700' },
  make_up_day:       { bg: 'bg-teal-50',     border: 'border-teal-200',    text: 'text-teal-700' },
  weather_day:       { bg: 'bg-blue-50',     border: 'border-blue-200',    text: 'text-blue-700' },
  testing_day:       { bg: 'bg-yellow-50',   border: 'border-yellow-200',  text: 'text-yellow-700' },
  conference_day:    { bg: 'bg-pink-50',     border: 'border-pink-200',    text: 'text-pink-700' },
  graduation:        { bg: 'bg-violet-50',   border: 'border-violet-200',  text: 'text-violet-700' },
  in_service:        { bg: 'bg-lime-50',     border: 'border-lime-200',    text: 'text-lime-700' },
  other:             { bg: 'bg-gray-50',     border: 'border-gray-200',    text: 'text-gray-600' },
}

const WEEKEND_STYLE = { bg: 'bg-gray-100', border: 'border-gray-200', text: 'text-gray-400' }

// ============================================================================
// HELPERS
// ============================================================================

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const startDow = firstDay.getDay()
  const totalDays = lastDay.getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getPrimaryEventType(calendarDate: CalendarDateResponseDto): string {
  if (calendarDate.isWeekend) return '__weekend__'
  if (calendarDate.calendarEvents?.length > 0) {
    return calendarDate.calendarEvents[0].eventType
  }
  if (calendarDate.isInstructionalDay) return 'instructional_day'
  return 'non_instructional_day'
}

function getColors(eventType: string) {
  if (eventType === '__weekend__') return WEEKEND_STYLE
  return EVENT_COLOR_MAP[eventType] || EVENT_COLOR_MAP.other
}

function getEventLabel(calendarDate: CalendarDateResponseDto): string | null {
  if (calendarDate.calendarEvents?.length > 0) {
    const evt = calendarDate.calendarEvents[0]
    if (evt.description) return evt.description
    return evt.eventType.replace(/_/g, ' ')
  }
  return null
}

// ============================================================================
// PROPS
// ============================================================================

interface MonthlyCalendarGridProps {
  schoolId: string
  academicYearId: string
  selectedMonth: number
  selectedYear: number
  onDateClick: (date: string) => void
  selectedDates?: string[]
  isEditable?: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MonthlyCalendarGrid({
  schoolId,
  academicYearId,
  selectedMonth,
  selectedYear,
  onDateClick,
  selectedDates = [],
  isEditable = false,
}: MonthlyCalendarGridProps) {
  const { data, isLoading } = useCalendarDates(
    schoolId,
    { academicYearId, month: selectedMonth },
    !!academicYearId
  )

  const dateMap = useMemo(() => {
    const map = new Map<string, CalendarDateResponseDto>()
    if (data?.items) {
      for (const item of data.items) {
        map.set(item.date, item)
      }
    }
    return map
  }, [data])

  const cells = useMemo(
    () => getMonthGrid(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  )

  const today = new Date()
  const todayKey = formatDateKey(today.getFullYear(), today.getMonth() + 1, today.getDate())

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
        <span className="ml-2 text-sm text-[rgb(var(--text-tertiary))]">Loading calendar...</span>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-primary))] overflow-hidden"
    >
      {/* Weekday headers */}
      <div className="grid grid-cols-7 bg-[rgb(var(--surface-secondary))]">
        {WEEKDAY_HEADERS.map((day) => (
          <div
            key={day}
            className="py-2.5 text-center text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (day === null) {
            return (
              <div
                key={`empty-${idx}`}
                className="min-h-[80px] border-t border-r border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))]/30 last:border-r-0"
              />
            )
          }

          const dateKey = formatDateKey(selectedYear, selectedMonth, day)
          const calDate = dateMap.get(dateKey)
          const isToday = dateKey === todayKey
          const isSelected = selectedDates.includes(dateKey)

          const eventType = calDate ? getPrimaryEventType(calDate) : null
          const colors = eventType ? getColors(eventType) : null
          const label = calDate ? getEventLabel(calDate) : null

          return (
            <button
              key={dateKey}
              onClick={() => onDateClick(dateKey)}
              disabled={!isEditable && !calDate}
              className={`
                relative min-h-[80px] p-1.5 border-t border-r border-[rgb(var(--border-primary))] last:border-r-0
                text-left transition-all group
                ${isEditable ? 'cursor-pointer hover:ring-2 hover:ring-teal-400/40 hover:z-10' : calDate ? 'cursor-pointer' : 'cursor-default'}
                ${isSelected ? 'ring-2 ring-teal-500 z-10 bg-teal-50/50' : ''}
                ${colors ? `${colors.bg}` : 'bg-[rgb(var(--surface-primary))]'}
              `}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`
                    inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full
                    ${isToday ? 'bg-teal-500 text-white' : colors ? colors.text : 'text-[rgb(var(--text-secondary))]'}
                  `}
                >
                  {day}
                </span>
                {calDate?.isInstructionalDay && !calDate.isWeekend && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Instructional" />
                )}
              </div>

              {/* Event label */}
              {label && (
                <div
                  className={`
                    text-[10px] leading-tight font-medium truncate px-1 py-0.5 rounded
                    ${colors ? `${colors.text} ${colors.bg}` : 'text-[rgb(var(--text-tertiary))]'}
                  `}
                  title={label}
                >
                  {label}
                </div>
              )}

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-1 right-1">
                  <div className="w-3 h-3 rounded-full bg-teal-500 flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Empty state */}
      {!data?.items?.length && !isLoading && (
        <div className="py-8 text-center text-sm text-[rgb(var(--text-tertiary))]">
          No calendar dates generated for this month. Click <strong>Generate</strong> to create calendar dates.
        </div>
      )}
    </motion.div>
  )
}
