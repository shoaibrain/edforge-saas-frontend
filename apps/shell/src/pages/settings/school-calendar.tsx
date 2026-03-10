/**
 * School Calendar Page
 *
 * Full calendar management page using FullCalendar:
 * - Month + list views with built-in navigation
 * - Drag-to-select for bulk editing
 * - Click-to-edit with auto-populated form fields
 * - Calendar generation
 * - SessionManager (academic sessions/terms)
 * - Bikram Sambat dual-calendar for Nepal schools
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  CalendarDays,
  Wand2,
  Save,
  Layers,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button, Drawer, DrawerFooter, Dropdown } from '@edforge/ui'
import type { DropdownOption } from '@edforge/ui'
import type { CalendarDateResponseDto } from '@aibrains/shared-types'
import { tenantService } from '@/services/tenant.service'
import {
  useCalendarStats,
  useUpdateCalendarDate,
  useBulkUpdateCalendarDates,
  useGenerateCalendar,
} from '@/hooks/useCalendar'
import { useBellSchedules } from '@/hooks/useBellSchedules'
import { SchoolFullCalendar } from '@/components/calendar/SchoolFullCalendar'
import { SessionManager } from '@/components/calendar/SessionManager'
import { LEGEND_ITEMS, ALL_EVENT_TYPES } from '@/components/calendar/fullcalendar-utils'
import { adToBS, BS_MONTH_NAMES_EN, BS_MONTH_NAMES_NE, DAY_NAMES_NE } from '@edforge/date-utils'
import {
  SettingsAlert,
} from '@/components/settings/SettingsShared'

// ============================================================================
// CONSTANTS
// ============================================================================

const EVENT_TYPE_OPTIONS = [
  { value: 'instructional_day', label: 'Instructional Day' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'teacher_only', label: 'Teacher Only' },
  { value: 'break', label: 'Break' },
  { value: 'non_instructional_day', label: 'Non-Instructional' },
  { value: 'student_holiday', label: 'Student Holiday' },
  { value: 'early_release', label: 'Early Release' },
  { value: 'late_start', label: 'Late Start' },
  { value: 'make_up_day', label: 'Make-up Day' },
  { value: 'weather_day', label: 'Weather Day' },
  { value: 'testing_day', label: 'Testing Day' },
  { value: 'conference_day', label: 'Conference Day' },
  { value: 'graduation', label: 'Graduation' },
  { value: 'in_service', label: 'In-Service' },
]

// ============================================================================
// HELPERS
// ============================================================================

const DAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatDrawerDate(dateStr: string, calendarSystem: string, locale: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const isNepali = locale === 'ne'
  const dayNames = isNepali ? DAY_NAMES_NE : DAY_NAMES_EN
  const dayOfWeek = dayNames[date.getDay()]
  const bsMonthNames = isNepali ? BS_MONTH_NAMES_NE : BS_MONTH_NAMES_EN

  if (calendarSystem === 'bikram_sambat') {
    try {
      const bs = adToBS(date)
      const bsMonth = bsMonthNames[bs.month - 1] || ''
      const bsPrimary = `${dayOfWeek}, ${bsMonth} ${bs.day}, ${bs.year} BS`
      const adSecondary = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      return `${bsPrimary} — ${adSecondary}`
    } catch { /* ignore conversion errors */ }
  }

  const formatted = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  return `${dayOfWeek}, ${formatted}`
}

// ============================================================================
// PROPS
// ============================================================================

interface SchoolCalendarPageProps {
  schoolId: string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SchoolCalendarPage({ schoolId }: SchoolCalendarPageProps) {
  const { i18n } = useTranslation()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [showGenerator, setShowGenerator] = useState(false)
  const [showSessions, setShowSessions] = useState(false)
  const [editEventType, setEditEventType] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editIsInstructional, setEditIsInstructional] = useState(true)
  const [editBellScheduleId, setEditBellScheduleId] = useState<string | null>(null)
  const [editCalendarDate, setEditCalendarDate] = useState<CalendarDateResponseDto | null>(null)

  // Filter state — all types active by default (including weekend pseudo-type)
  const [activeTypes, setActiveTypes] = useState<Set<string>>(
    () => new Set([...ALL_EVENT_TYPES, '__weekend__'])
  )
  const allTypesActive = activeTypes.size === ALL_EVENT_TYPES.length + 1

  const toggleType = (type: string) => {
    setActiveTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  const toggleAllTypes = () => {
    if (allTypesActive) {
      setActiveTypes(new Set())
    } else {
      setActiveTypes(new Set([...ALL_EVENT_TYPES, '__weekend__']))
    }
  }

  // ── Fetch school (for calendarSystem) ──
  const { data: school } = useQuery({
    queryKey: ['school', schoolId],
    queryFn: () => tenantService.getSchool(schoolId),
    enabled: !!schoolId,
    staleTime: 10 * 60 * 1000,
  })
  const calendarSystem = (school as any)?.calendarSystem || 'gregorian'
  const schoolTimezone = (school as any)?.timezone || undefined
  const schoolFirstDay = (school as any)?.defaultWeekStartsOn ?? 0

  // Map user's language preference (not school locale) to FullCalendar locale code
  const fcLocaleCode = i18n.language === 'ne' ? 'ne' : undefined

  // ── Fetch academic years ──
  const { data: academicYears } = useQuery({
    queryKey: ['academic-years', schoolId],
    queryFn: () => tenantService.getAcademicYears(schoolId),
    staleTime: 5 * 60 * 1000,
  })

  const activeYear = useMemo(() => {
    if (!academicYears?.length) return null
    return academicYears.find((y: any) => y.status === 'active') || academicYears[0]
  }, [academicYears])

  const academicYearId = activeYear?.id || ''

  // ── Mutations ──
  const updateDate = useUpdateCalendarDate(schoolId)
  const bulkUpdate = useBulkUpdateCalendarDates(schoolId)
  const generateCalendar = useGenerateCalendar(schoolId)

  // ── Bell Schedules ──
  const { data: schedulesData } = useBellSchedules(schoolId)
  const bellScheduleOptions: DropdownOption[] = useMemo(() => {
    const items = schedulesData?.items || []
    return [
      { id: '__none__', label: 'No Schedule', description: 'No bell schedule assigned' },
      ...items
        .filter((s: any) => s.isActive)
        .map((s: any) => ({
          id: s.bellScheduleId,
          label: s.bellScheduleName,
          description: s.dayType.replace(/_/g, ' '),
        })),
    ]
  }, [schedulesData])

  const getScheduleName = (id: string | null): string | undefined => {
    if (!id || id === '__none__') return undefined
    const items = schedulesData?.items || []
    return items.find((s: any) => s.bellScheduleId === id)?.bellScheduleName
  }

  // ── Stats ──
  const { data: stats } = useCalendarStats(schoolId, academicYearId, !!academicYearId)

  // ── Date click → open single edit drawer with pre-populated data ──
  const handleDateClick = (date: string, calendarDate?: CalendarDateResponseDto) => {
    if (date === selectedDate) {
      setSelectedDate(null)
      return
    }
    setSelectedDate(date)
    setEditCalendarDate(calendarDate || null)

    // Pre-populate edit form from existing calendar date data
    if (calendarDate) {
      const evt = calendarDate.calendarEvents?.[0]
      if (evt) {
        setEditEventType(evt.eventType)
        setEditDescription(evt.description || '')
      } else if (calendarDate.isInstructionalDay) {
        setEditEventType('instructional_day')
        setEditDescription('')
      } else {
        setEditEventType('non_instructional_day')
        setEditDescription('')
      }
      setEditIsInstructional(calendarDate.isInstructionalDay)
      setEditBellScheduleId(calendarDate.bellScheduleId || null)
    } else {
      // No data for this date — reset form
      setEditEventType('')
      setEditDescription('')
      setEditIsInstructional(true)
      setEditBellScheduleId(null)
    }
  }

  // ── Drag-select → populate bulk selection ──
  const handleDateRangeSelect = (dates: string[]) => {
    setSelectedDates(dates)
    // Reset bulk edit form
    setEditEventType('')
    setEditDescription('')
    setEditBellScheduleId(null)
  }

  // ── Clear selection ──
  const handleClearSelection = () => {
    setSelectedDates([])
    setEditEventType('')
    setEditBellScheduleId(null)
  }

  // ── Save single date edit ──
  const handleSaveDate = () => {
    if (!selectedDate || !editEventType) return
    const bellScheduleId = editBellScheduleId && editBellScheduleId !== '__none__' ? editBellScheduleId : undefined
    const bellScheduleName = getScheduleName(editBellScheduleId)
    updateDate.mutate(
      {
        date: selectedDate,
        data: {
          calendarEvents: [{ eventType: editEventType as any, isAllDay: true, description: editDescription || undefined }],
          isInstructionalDay: editIsInstructional,
          bellScheduleId,
          bellScheduleName,
        },
      },
      {
        onSuccess: () => {
          toast.success(`Updated ${selectedDate}`)
          setSelectedDate(null)
          setEditBellScheduleId(null)
        },
      }
    )
  }

  // ── Bulk update ──
  const handleBulkUpdate = () => {
    if (!selectedDates.length || !editEventType) return
    const bellScheduleId = editBellScheduleId && editBellScheduleId !== '__none__' ? editBellScheduleId : undefined
    const bellScheduleName = getScheduleName(editBellScheduleId)
    bulkUpdate.mutate(
      {
        dates: selectedDates,
        updates: {
          calendarEvents: [{ eventType: editEventType as any, isAllDay: true, description: editDescription || undefined }],
          isInstructionalDay: editIsInstructional,
          bellScheduleId,
          bellScheduleName,
        },
      },
      {
        onSuccess: () => {
          toast.success(`Updated ${selectedDates.length} dates`)
          handleClearSelection()
        },
      }
    )
  }

  // ── Generate calendar ──
  const handleGenerate = () => {
    if (!activeYear) return
    generateCalendar.mutate(
      {
        yearId: academicYearId,
        data: {
          academicYearId,
          startDate: activeYear.startDate,
          endDate: activeYear.endDate,
          schoolDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          includeWeekends: false,
        },
      },
      {
        onSuccess: (result) => {
          toast.success(`Generated ${result.totalDays} days (${result.instructionalDays} instructional)`)
          setShowGenerator(false)
        },
      }
    )
  }

  if (!academicYearId) {
    return (
      <SettingsAlert type="info" message="No academic year found. Please create an academic year first in the Academic Years tab." />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/20">
            <CalendarDays className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">School Calendar</h2>
            <p className="text-sm text-[rgb(var(--text-tertiary))]">
              {activeYear?.name || 'Academic Year'} Calendar Management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSessions(!showSessions)}
          >
            <Layers className="w-4 h-4 mr-1.5" />
            Sessions
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGenerator(true)}
          >
            <Wand2 className="w-4 h-4 mr-1.5" />
            Generate
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            { label: 'Total Days', value: stats.totalDays ?? 0, color: 'text-[rgb(var(--text-primary))]' },
            { label: 'Instructional', value: stats.instructionalDays ?? 0, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Holidays', value: stats.holidays ?? 0, color: 'text-red-500 dark:text-red-400' },
            { label: 'Non-Instructional', value: stats.nonInstructionalDays ?? 0, color: 'text-gray-400' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] px-4 py-3">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-[rgb(var(--text-tertiary))]">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Bulk selection bar */}
      {selectedDates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <span className="text-sm font-medium text-teal-700 dark:text-teal-300">
            {selectedDates.length} date{selectedDates.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={editEventType}
              onChange={(e) => {
                setEditEventType(e.target.value)
                setEditIsInstructional(e.target.value === 'instructional_day')
              }}
              className="text-sm rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] px-3 py-1.5"
            >
              <option value="">Select type...</option>
              {EVENT_TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {bellScheduleOptions.length > 1 && (
              <Dropdown
                options={bellScheduleOptions}
                value={editBellScheduleId}
                onChange={(id) => setEditBellScheduleId(id)}
                placeholder="Bell schedule..."
                buttonClassName="text-sm rounded-lg py-1.5"
              />
            )}
            <Button size="sm" variant="primary" onClick={handleBulkUpdate} disabled={!editEventType || bulkUpdate.isPending}>
              Apply
            </Button>
            <Button size="sm" variant="ghost" onClick={handleClearSelection}>
              <X className="w-3.5 h-3.5 mr-1" />
              Clear
            </Button>
          </div>
        </motion.div>
      )}

      {/* FullCalendar Grid */}
      <SchoolFullCalendar
        schoolId={schoolId}
        academicYearId={academicYearId}
        onDateClick={handleDateClick}
        onDateRangeSelect={handleDateRangeSelect}
        selectedDates={[...selectedDates, ...(selectedDate ? [selectedDate] : [])]}
        isEditable
        calendarSystem={calendarSystem}
        locale={fcLocaleCode}
        timeZone={schoolTimezone}
        firstDay={schoolFirstDay}
        activeTypes={allTypesActive ? undefined : activeTypes}
        onGenerate={() => setShowGenerator(true)}
      />

      {/* Single Date Edit Drawer */}
      <Drawer
        open={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        title="Edit Calendar Date"
        description={selectedDate ? formatDrawerDate(selectedDate, calendarSystem, i18n.language) : ''}
        size="sm"
      >
        <div className="space-y-5">
          {/* Date context info */}
          {selectedDate && editCalendarDate && (
            <div className="flex items-center gap-3 text-xs text-[rgb(var(--text-tertiary))] bg-[rgb(var(--surface-secondary))] rounded-xl px-3 py-2.5">
              {editCalendarDate.dayNumber && (
                <span>Day {editCalendarDate.dayNumber}</span>
              )}
              {editCalendarDate.instructionalDayNumber && (
                <span>Instructional Day #{editCalendarDate.instructionalDayNumber}</span>
              )}
              {editCalendarDate.bellScheduleName && (
                <span>Bell: {editCalendarDate.bellScheduleName}</span>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">Event Type</label>
            <select
              value={editEventType}
              onChange={(e) => {
                setEditEventType(e.target.value)
                setEditIsInstructional(e.target.value === 'instructional_day')
              }}
              className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-[rgb(var(--text-primary))] px-3 py-2.5"
            >
              <option value="">Select...</option>
              {EVENT_TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">Description</label>
            <input
              type="text"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Optional description (e.g., Dashain Holiday)"
              className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-[rgb(var(--text-primary))] px-3 py-2.5"
            />
          </div>

          {/* Instructional toggle */}
          <div className="flex items-center justify-between rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] px-3 py-2.5">
            <span className="text-sm text-[rgb(var(--text-secondary))]">Instructional Day</span>
            <button
              type="button"
              role="switch"
              aria-checked={editIsInstructional}
              onClick={() => setEditIsInstructional(!editIsInstructional)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                editIsInstructional ? 'bg-teal-500' : 'bg-[rgb(var(--border-primary))]'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                  editIsInstructional ? 'translate-x-4.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Bell Schedule */}
          {bellScheduleOptions.length > 1 && (
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">Bell Schedule</label>
              <Dropdown
                options={bellScheduleOptions}
                value={editBellScheduleId}
                onChange={(id) => setEditBellScheduleId(id)}
                placeholder="Assign bell schedule..."
                buttonClassName="rounded-xl py-2.5"
              />
            </div>
          )}

          <DrawerFooter>
            <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveDate}
              disabled={!editEventType || updateDate.isPending}
              isLoading={updateDate.isPending}
            >
              <Save className="w-4 h-4 mr-1.5" />
              Save
            </Button>
          </DrawerFooter>
        </div>
      </Drawer>

      {/* Generate Calendar Modal */}
      <AnimatePresence>
        {showGenerator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowGenerator(false)} />
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative w-full max-w-md bg-[rgb(var(--surface-primary))] rounded-2xl shadow-xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-500/10">
                  <Wand2 className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-[rgb(var(--text-primary))]">Generate Calendar</h3>
                  <p className="text-sm text-[rgb(var(--text-tertiary))]">
                    Auto-generate dates for {activeYear?.name}
                  </p>
                </div>
              </div>

              <div className="text-sm text-[rgb(var(--text-secondary))] space-y-2">
                <p>This will generate calendar dates from <strong>{activeYear?.startDate}</strong> to <strong>{activeYear?.endDate}</strong>.</p>
                <p>Weekdays will be marked as instructional days. Weekends will be marked automatically.</p>
                <p className="text-amber-600 dark:text-amber-400">Existing dates for this year will be replaced.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowGenerator(false)}>Cancel</Button>
                <Button
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={generateCalendar.isPending}
                  isLoading={generateCalendar.isPending}
                >
                  <Wand2 className="w-4 h-4 mr-1.5" />
                  Generate Calendar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Academic Sessions Drawer */}
      <Drawer
        open={showSessions && !!activeYear}
        onClose={() => setShowSessions(false)}
        title="Academic Sessions"
        description={`Semesters and terms for ${activeYear?.name || 'this year'}`}
        size="lg"
      >
        {activeYear && (
          <SessionManager
            schoolId={schoolId}
            academicYearId={academicYearId}
            academicYearStartDate={activeYear.startDate}
            academicYearEndDate={activeYear.endDate}
          />
        )}
      </Drawer>

      {/* Interactive Legend / Filter */}
      <div className="flex flex-wrap items-center gap-2 px-1 py-3">
        <button
          onClick={toggleAllTypes}
          className={`text-[11px] font-medium px-2 py-1 rounded-full border transition-colors ${
            allTypesActive
              ? 'border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300'
              : 'border-[rgb(var(--border-primary))] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]'
          }`}
        >
          {allTypesActive ? 'All' : 'None'}
        </button>
        {LEGEND_ITEMS.map(item => {
          const isActive = activeTypes.has(item.type)
          return (
            <button
              key={item.type}
              onClick={() => toggleType(item.type)}
              className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all ${
                isActive
                  ? 'border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-[rgb(var(--text-secondary))]'
                  : 'border-transparent bg-transparent text-[rgb(var(--text-tertiary))] opacity-40 hover:opacity-70'
              }`}
            >
              <span className={`fc-legend-dot fc-legend-dot--${item.type}`} />
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
