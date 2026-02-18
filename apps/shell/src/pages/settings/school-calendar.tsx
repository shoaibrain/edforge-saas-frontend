/**
 * School Calendar Page (Task 2.9c)
 *
 * Full calendar management page assembling:
 * - Month navigation + academic year selector
 * - MonthlyCalendarGrid (read + click-to-edit)
 * - Calendar date editing panel
 * - Bulk date actions
 * - Calendar generation
 * - SessionManager (academic sessions/terms)
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Wand2,
  CheckSquare,
  Save,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button, Drawer, DrawerFooter, Dropdown } from '@edforge/ui'
import type { DropdownOption } from '@edforge/ui'
import { tenantService } from '@/services/tenant.service'
import {
  useCalendarStats,
  useUpdateCalendarDate,
  useBulkUpdateCalendarDates,
  useGenerateCalendar,
} from '@/hooks/useCalendar'
import { useBellSchedules } from '@/hooks/useBellSchedules'
import { MonthlyCalendarGrid } from '@/components/calendar/MonthlyCalendarGrid'
import { SessionManager } from '@/components/calendar/SessionManager'
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
]

const LEGEND_ITEMS = [
  { label: 'Instructional',     color: 'bg-emerald-500' },
  { label: 'Holiday',           color: 'bg-red-500' },
  { label: 'Teacher Only',      color: 'bg-amber-500' },
  { label: 'Break',             color: 'bg-purple-500' },
  { label: 'Non-Instructional', color: 'bg-slate-400' },
  { label: 'Student Holiday',   color: 'bg-orange-500' },
]

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

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
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const [showSessions, setShowSessions] = useState(false)
  const [editEventType, setEditEventType] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editIsInstructional, setEditIsInstructional] = useState(true)
  const [editBellScheduleId, setEditBellScheduleId] = useState<string | null>(null)

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

  // ── Month navigation ──
  const prevMonth = () => {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1) }
    else setSelectedMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1) }
    else setSelectedMonth(m => m + 1)
  }

  // ── Date click handler ──
  const handleDateClick = (date: string) => {
    if (isBulkMode) {
      setSelectedDates(prev =>
        prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
      )
    } else {
      setSelectedDate(date === selectedDate ? null : date)
      setSelectedDates([])
    }
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
          setSelectedDates([])
          setIsBulkMode(false)
          setEditBellScheduleId(null)
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
            onClick={() => setIsBulkMode(!isBulkMode)}
            className={isBulkMode ? 'bg-teal-500/10 border-teal-500/30 text-teal-600' : ''}
          >
            <CheckSquare className="w-4 h-4 mr-1.5" />
            {isBulkMode ? 'Exit Bulk' : 'Bulk Edit'}
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
            { label: 'Instructional', value: stats.instructionalDays ?? 0, color: 'text-emerald-600' },
            { label: 'Holidays', value: stats.holidays ?? 0, color: 'text-red-500' },
            { label: 'Non-Instructional', value: stats.nonInstructionalDays ?? 0, color: 'text-gray-400' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] px-4 py-3">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-[rgb(var(--text-tertiary))]">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-[rgb(var(--surface-secondary))] transition-colors">
          <ChevronLeft className="w-5 h-5 text-[rgb(var(--text-secondary))]" />
        </button>
        <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
          {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
        </h3>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-[rgb(var(--surface-secondary))] transition-colors">
          <ChevronRight className="w-5 h-5 text-[rgb(var(--text-secondary))]" />
        </button>
      </div>

      {/* Bulk selection info */}
      {isBulkMode && selectedDates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-4 flex items-center justify-between"
        >
          <span className="text-sm font-medium text-teal-700">
            {selectedDates.length} date{selectedDates.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <select
              value={editEventType}
              onChange={(e) => setEditEventType(e.target.value)}
              className="text-sm rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-primary))] px-3 py-1.5"
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
            <Button size="sm" variant="ghost" onClick={() => { setSelectedDates([]); setIsBulkMode(false) }}>
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {/* Calendar Grid */}
      <MonthlyCalendarGrid
        schoolId={schoolId}
        academicYearId={academicYearId}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onDateClick={handleDateClick}
        selectedDates={isBulkMode ? selectedDates : selectedDate ? [selectedDate] : []}
        isEditable
      />

      {/* Single Date Edit Drawer */}
      <Drawer
        open={!!selectedDate && !isBulkMode}
        onClose={() => setSelectedDate(null)}
        title={`Edit: ${selectedDate || ''}`}
        description="Update this calendar date's event type and properties"
        size="sm"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">Event Type</label>
            <select
              value={editEventType}
              onChange={(e) => {
                setEditEventType(e.target.value)
                setEditIsInstructional(e.target.value === 'instructional_day')
              }}
              className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] px-3 py-2.5"
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
              placeholder="Optional description"
              className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] px-3 py-2.5"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editIsInstructional}
                onChange={(e) => setEditIsInstructional(e.target.checked)}
                className="rounded border-[rgb(var(--border-primary))]"
              />
              <span className="text-[rgb(var(--text-secondary))]">Instructional Day</span>
            </label>
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
                <p className="text-amber-600">Existing dates for this year will be replaced.</p>
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

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-1 py-3 text-xs">
        {LEGEND_ITEMS.map(item => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
            <span className="text-[rgb(var(--text-secondary))] font-medium">{item.label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
