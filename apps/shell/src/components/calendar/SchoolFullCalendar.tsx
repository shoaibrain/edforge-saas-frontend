/**
 * SchoolFullCalendar Component
 *
 * Production-ready school calendar using FullCalendar.
 * - Month and list views with built-in navigation
 * - Click-to-edit via drawer (single date editing)
 * - Custom event rendering with instructional indicators & bell schedules
 * - Bikram Sambat dual-calendar support with labeled BS/AD dates
 * - Dark mode via CSS class-based event coloring
 * - Loading overlay during month navigation
 */

import { useState, useMemo, useCallback, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import type {
  DatesSetArg,
  EventContentArg,
  DayCellContentArg,
  LocaleInput,
} from '@fullcalendar/core'
import neLocale from '@fullcalendar/core/locales/ne'
import { Loader2, Wand2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { adToBS, BS_MONTH_NAMES_EN, BS_MONTH_NAMES_NE } from '@edforge/date-utils'
import { useFullCalendarEvents } from '@/hooks/useFullCalendarEvents'
import { getPrimaryEventType } from './fullcalendar-utils'
import type { CalendarDateResponseDto } from '@aibrains/shared-types'

import '../../styles/fullcalendar-theme.css'

// ============================================================================
// PROPS
// ============================================================================

interface SchoolFullCalendarProps {
  schoolId: string
  academicYearId: string
  onDateClick: (date: string, calendarDate?: CalendarDateResponseDto) => void
  focusedDate?: string | null  // drawer-active date (distinct visual highlight)
  isEditable?: boolean
  calendarSystem?: 'gregorian' | 'bikram_sambat'
  locale?: string         // e.g. 'ne' for Nepali, 'en' default
  timeZone?: string       // e.g. 'Asia/Kathmandu'
  firstDay?: number       // 0=Sunday, 1=Monday, 6=Saturday
  activeTypes?: Set<string>  // filter visible event types
  onGenerate?: () => void
}

const LOCALE_MAP: Record<string, LocaleInput> = {
  ne: neLocale,
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getBSDualTitle(startDate: Date, endDate: Date, locale: string): string {
  try {
    const start = new Date(startDate.getTime() + 7 * 86400000)
    const end = new Date(endDate.getTime() - 7 * 86400000)
    const startBS = adToBS(start)
    const endBS = adToBS(end)
    const monthNames = locale === 'ne' ? BS_MONTH_NAMES_NE : BS_MONTH_NAMES_EN
    if (startBS.month === endBS.month && startBS.year === endBS.year) {
      return `${monthNames[startBS.month - 1]} ${startBS.year}`
    }
    if (startBS.year === endBS.year) {
      return `${monthNames[startBS.month - 1]} – ${monthNames[endBS.month - 1]} ${startBS.year}`
    }
    return `${monthNames[startBS.month - 1]} ${startBS.year} – ${monthNames[endBS.month - 1]} ${endBS.year}`
  } catch {
    return ''
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SchoolFullCalendar({
  schoolId,
  academicYearId,
  onDateClick,
  focusedDate,
  isEditable = false,
  calendarSystem = 'gregorian',
  locale,
  timeZone,
  firstDay = 0,
  activeTypes,
  onGenerate,
}: SchoolFullCalendarProps) {
  const { i18n } = useTranslation()
  const fcLocale = locale ? LOCALE_MAP[locale] : undefined
  const calendarRef = useRef<FullCalendar>(null)
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null)
  const [bsTitle, setBsTitle] = useState('')
  const [adTitle, setAdTitle] = useState('')

  const { events, bgEvents, rawDates, isLoading, isEmpty } = useFullCalendarEvents(
    schoolId,
    academicYearId,
    dateRange,
    activeTypes,
  )

  const allEvents = useMemo(() => [...events, ...bgEvents], [events, bgEvents])

  // Build a lookup map from raw API data for edit drawer access
  const dateMap = useMemo(() => {
    const map = new Map<string, CalendarDateResponseDto>()
    for (const cd of rawDates) {
      map.set(cd.date, cd)
    }
    return map
  }, [rawDates])

  // Track whether we've had data before (to distinguish initial load vs refetch)
  const hasHadData = useRef(false)
  if (rawDates.length > 0) hasHadData.current = true

  // ── Callbacks ──

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setDateRange({
      start: formatDateStr(arg.start),
      end: formatDateStr(arg.end),
    })

    if (calendarSystem === 'bikram_sambat') {
      setBsTitle(getBSDualTitle(arg.start, arg.end, i18n.language))
      const mid = new Date(arg.start)
      mid.setDate(mid.getDate() + 15)
      setAdTitle(mid.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))
    }
  }, [calendarSystem, i18n.language])

  const handleDateClick = useCallback((arg: { dateStr: string }) => {
    const calDate = dateMap.get(arg.dateStr)
    onDateClick(arg.dateStr, calDate)
  }, [onDateClick, dateMap])

  // ── Custom rendering ──

  const renderEventContent = useCallback((arg: EventContentArg) => {
    const { extendedProps } = arg.event
    if (!extendedProps) return null

    return (
      <div className="fc-event-content-row">
        {extendedProps.isInstructional && !extendedProps.isWeekend && (
          <span className="fc-event-instructional-dot" />
        )}
        <span className="fc-event-title-text">
          {arg.event.title}
        </span>
        {extendedProps.bellScheduleName && (
          <span className="fc-event-bell-schedule">
            {extendedProps.bellScheduleName}
          </span>
        )}
      </div>
    )
  }, [])

  const renderDayCellContent = useCallback((arg: DayCellContentArg) => {
    if (calendarSystem !== 'bikram_sambat') {
      return (
        <span className="fc-daygrid-day-number">{arg.dayNumberText}</span>
      )
    }

    try {
      const bs = adToBS(arg.date)
      const adDay = arg.dayNumberText.replace(/\D/g, '')
      return (
        <div className="fc-day-header-row">
          <span className="fc-bs-date">
            <span className="fc-daygrid-day-number">{bs.day}</span>
            <span className="fc-date-label">BS</span>
          </span>
          <span className="fc-ad-date">
            <span className="fc-ad-day-number">{adDay}</span>
            <span className="fc-date-label">AD</span>
          </span>
        </div>
      )
    } catch {
      return <span className="fc-daygrid-day-number">{arg.dayNumberText}</span>
    }
  }, [calendarSystem])

  const dayCellClassNames = useCallback((arg: DayCellContentArg) => {
    const dateStr = formatDateStr(arg.date)
    const classes: string[] = []
    if (focusedDate === dateStr) {
      classes.push('fc-day--focused')
    }
    const calDate = dateMap.get(dateStr)
    if (calDate) {
      const eventType = getPrimaryEventType(calDate)
      classes.push(`fc-event-type-${eventType}`)
    }
    return classes
  }, [focusedDate, dateMap])

  // ── Initial loading state ──

  if (isLoading && !hasHadData.current) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
        <span className="ml-2 text-sm text-[rgb(var(--text-tertiary))]">Loading calendar...</span>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* BS dual-title header for Nepal schools — primary BS title, secondary AD */}
      {calendarSystem === 'bikram_sambat' && bsTitle && (
        <div className="fc-bs-title-header">
          <h3 className="text-base font-bold text-[rgb(var(--text-primary))]">{bsTitle}</h3>
          <p className="text-xs text-[rgb(var(--text-tertiary))]">{adTitle}</p>
        </div>
      )}

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: calendarSystem === 'bikram_sambat' ? '' : 'title',
          right: 'dayGridMonth,listMonth',
        }}
        events={allEvents}
        height="auto"
        fixedWeekCount={false}
        dayMaxEvents={3}
        moreLinkText={(n) => `+${n} more`}
        editable={false}
        datesSet={handleDatesSet}
        dateClick={isEditable ? handleDateClick : undefined}
        eventContent={renderEventContent}
        dayCellContent={renderDayCellContent}
        dayCellClassNames={dayCellClassNames}
        noEventsContent="No calendar dates for this period"
        locale={fcLocale}
        timeZone={timeZone || 'local'}
        firstDay={firstDay}
        titleFormat={{ year: 'numeric', month: 'long' }}
      />

      {/* Refetch loading overlay (shows during month navigation) */}
      {isLoading && hasHadData.current && (
        <div className="fc-loading-overlay">
          <Loader2 className="w-5 h-5 text-teal-500 animate-spin" />
        </div>
      )}

      {/* Empty state overlay */}
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center bg-[rgb(var(--surface-primary))]/80 rounded-xl z-10 pointer-events-auto">
          <div className="text-center">
            <p className="text-sm text-[rgb(var(--text-tertiary))] mb-3">
              No calendar dates generated for this academic year.
            </p>
            {onGenerate && (
              <button
                onClick={onGenerate}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
              >
                <Wand2 className="w-4 h-4" />
                Generate Calendar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
