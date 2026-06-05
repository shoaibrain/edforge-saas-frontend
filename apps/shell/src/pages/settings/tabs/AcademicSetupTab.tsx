/**
 * Academic Setup Tab — V2
 *
 * Wizard-style 4-step layout:
 * 1. Academic Years
 * 2. Sessions & Terms
 * 3. Calendar
 * 4. Bell Schedule
 */

import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, AlertCircle, Lock, Star } from 'lucide-react'
import type { School } from '@edforge/types'
import type { CreateAcademicYearDto, UpdateAcademicYearDto } from '@aibrains/shared-types'
import { tenantService, type CreateGradingPeriodDto } from '@/services/tenant.service'
import { DateInput } from '@edforge/ui'
import {
  useAcademicSessions,
  useCalendarStats,
  useCalendarDates,
  useUpdateCalendarDate,
  useGenerateCalendar,
  useLocaleHolidays,
  useCreateAcademicSession,
} from '@/hooks/useCalendar'
import { useBellSchedules, useCreateBellSchedule, useSetDefaultBellSchedule } from '@/hooks/useBellSchedules'
import { useLocaleDefaults } from '@/hooks/useLocaleDefaults'
import { type DayOfWeek, dayToIndex } from '@/utils/localeDefaults'
import { adToBS, BS_MONTH_NAMES_EN } from '@edforge/date-utils'
// Sprint S2.8 — single source of truth for the calendar event-type taxonomy.
import {
  EVENT_TYPE_COLORS,
  OPERATOR_SELECTABLE_TYPES,
  INSTRUCTIONAL_TYPES,
  DAY_TYPE_LEGEND_CHIPS,
} from '@/components/calendar/event-types'
// Sprint C4-FE — multi-day Calendar Blocks (Dashain, vacations, exam windows).
import { BlocksPanel } from '@/components/calendar/BlocksPanel'
// Sprint C4-FE — curated single-day event dropdown (audit Q2). Replaces the
// raw enum dropdown with operator-friendly labelled options (Holiday /
// Staff PD / Early Release — Students / etc.).
import {
  CURATED_OPTIONS_FOR_DROPDOWN,
  decodeCalendarEvent,
  encodeCuratedOption,
  getCuratedMeta,
  type CuratedSingleDayKey,
  type CalendarEventInput,
} from '@/components/calendar/single-day-curated-options'
import type { CalendarEventDescriptor } from '@aibrains/shared-types'

// ============================================================================
// TYPES
// ============================================================================

type WizardStep = 'years' | 'sessions' | 'calendar' | 'bell-schedule'

interface WizardStepConfig {
  id: WizardStep
  label: string
  completed: boolean
}

// ============================================================================
// NEPAL BELL SCHEDULE PRESET
// ============================================================================

const NEPAL_PRESET = [
  { name: 'Assembly', startTime: '10:00', endTime: '10:15', periodType: 'assembly', sortOrder: 0, isAcademic: false },
  { name: 'Period 1', startTime: '10:15', endTime: '11:00', periodType: 'instructional', sortOrder: 1, isAcademic: true },
  { name: 'Period 2', startTime: '11:00', endTime: '11:45', periodType: 'instructional', sortOrder: 2, isAcademic: true },
  { name: 'Recess', startTime: '11:45', endTime: '12:00', periodType: 'recess', sortOrder: 3, isAcademic: false },
  { name: 'Period 3', startTime: '12:00', endTime: '12:45', periodType: 'instructional', sortOrder: 4, isAcademic: true },
  { name: 'Lunch', startTime: '12:45', endTime: '13:30', periodType: 'lunch', sortOrder: 5, isAcademic: false },
  { name: 'Period 4', startTime: '13:30', endTime: '14:15', periodType: 'instructional', sortOrder: 6, isAcademic: true },
  { name: 'Period 5', startTime: '14:15', endTime: '15:00', periodType: 'instructional', sortOrder: 7, isAcademic: true },
  { name: 'Period 6', startTime: '15:00', endTime: '15:45', periodType: 'instructional', sortOrder: 8, isAcademic: true },
] as const

const ELEMENTARY_PRESET = [
  { name: 'Homeroom', startTime: '08:00', endTime: '08:15', periodType: 'homeroom', sortOrder: 0, isAcademic: false },
  { name: 'Period 1', startTime: '08:15', endTime: '09:00', periodType: 'instructional', sortOrder: 1, isAcademic: true },
  { name: 'Period 2', startTime: '09:05', endTime: '09:50', periodType: 'instructional', sortOrder: 2, isAcademic: true },
  { name: 'Recess', startTime: '09:50', endTime: '10:10', periodType: 'recess', sortOrder: 3, isAcademic: false },
  { name: 'Period 3', startTime: '10:10', endTime: '10:55', periodType: 'instructional', sortOrder: 4, isAcademic: true },
  { name: 'Lunch', startTime: '10:55', endTime: '11:35', periodType: 'lunch', sortOrder: 5, isAcademic: false },
  { name: 'Period 4', startTime: '11:35', endTime: '12:20', periodType: 'instructional', sortOrder: 6, isAcademic: true },
  { name: 'Period 5', startTime: '12:25', endTime: '13:10', periodType: 'instructional', sortOrder: 7, isAcademic: true },
  { name: 'Period 6', startTime: '13:15', endTime: '14:00', periodType: 'instructional', sortOrder: 8, isAcademic: true },
] as const

const HIGH_SCHOOL_PRESET = [
  { name: 'Period 1', startTime: '07:30', endTime: '08:20', periodType: 'instructional', sortOrder: 0, isAcademic: true },
  { name: 'Period 2', startTime: '08:25', endTime: '09:15', periodType: 'instructional', sortOrder: 1, isAcademic: true },
  { name: 'Period 3', startTime: '09:20', endTime: '10:10', periodType: 'instructional', sortOrder: 2, isAcademic: true },
  { name: 'Advisory', startTime: '10:15', endTime: '10:45', periodType: 'advisory', sortOrder: 3, isAcademic: false },
  { name: 'Period 4', startTime: '10:50', endTime: '11:40', periodType: 'instructional', sortOrder: 4, isAcademic: true },
  { name: 'Lunch', startTime: '11:40', endTime: '12:20', periodType: 'lunch', sortOrder: 5, isAcademic: false },
  { name: 'Period 5', startTime: '12:25', endTime: '13:15', periodType: 'instructional', sortOrder: 6, isAcademic: true },
  { name: 'Period 6', startTime: '13:20', endTime: '14:10', periodType: 'instructional', sortOrder: 7, isAcademic: true },
  { name: 'Period 7', startTime: '14:15', endTime: '15:05', periodType: 'instructional', sortOrder: 8, isAcademic: true },
] as const

// PABSON exam-day shift — mirrors the backend ARCHETYPE_BELL_PRESETS PABSON
// exam_day preset (two long testing blocks + a midday break). TODO(bell-presets):
// this + NEPAL_PRESET duplicate the backend registry; the planned registry-backed
// template source removes them and the FE/BE drift with them.
const NEPAL_EXAM_PRESET = [
  { name: 'Morning Exam', startTime: '10:00', endTime: '13:00', periodType: 'instructional', sortOrder: 0, isAcademic: true },
  { name: 'Lunch', startTime: '13:00', endTime: '14:00', periodType: 'lunch', sortOrder: 1, isAcademic: false },
  { name: 'Afternoon Exam', startTime: '14:00', endTime: '16:00', periodType: 'instructional', sortOrder: 2, isAcademic: true },
] as const

// ============================================================================
// SHARED UI
// ============================================================================

const inputClass = "w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-xs text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:border-[rgba(55,138,221,0.45)] transition-colors font-[inherit]"

const DAY_LABELS: { key: DayOfWeek; short: string }[] = [
  { key: 'sunday', short: 'S' },
  { key: 'monday', short: 'M' },
  { key: 'tuesday', short: 'T' },
  { key: 'wednesday', short: 'W' },
  { key: 'thursday', short: 'T' },
  { key: 'friday', short: 'F' },
  { key: 'saturday', short: 'S' },
]

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface AcademicSetupTabProps {
  schoolId: string
  school?: School
}

// Extended type for create with grading periods
interface CreateAcademicYearWithTerms extends CreateAcademicYearDto {
  schoolId: string
  generatedTerms?: CreateGradingPeriodDto[]
}

/**
 * Period count for a bell-schedule row, tolerant of the field shapes the API
 * returns (`periodCount`, or the `classPeriods` / `periods` arrays). Single
 * source for the C.4/C.5 "real default" predicate so the step-completion check
 * and the placeholder chip can't drift apart.
 */
function getPeriodCount(schedule: any): number {
  return schedule.periodCount ?? schedule.classPeriods?.length ?? schedule.periods?.length ?? 0
}

export default function AcademicSetupTab({ schoolId, school }: AcademicSetupTabProps) {
  const localeDefaults = useLocaleDefaults()
  const queryClient = useQueryClient()

  // Sprint C4 rev-2: bind picker calendar to the SCHOOL being edited, not
  // the user's active-school workspace context. The school-detail page
  // loads `school` via tenantService.getSchool(schoolId) and passes it in;
  // localeDefaults is the fallback for any caller that doesn't pass a
  // school (none in-tree today; defensive).
  const schoolCalendarSystem =
    (school as { calendarSystem?: string } | undefined)?.calendarSystem ||
    localeDefaults.calendarSystem

  // Academic year modal state
  const [isCreateYearOpen, setIsCreateYearOpen] = useState(false)
  const [yearToEdit, setYearToEdit] = useState<any>(null)
  const [yearToActivate, setYearToActivate] = useState<any>(null)

  // Fetch academic years
  const { data: academicYears = [], isLoading: yearsLoading } = useQuery({
    queryKey: ['academicYears', schoolId],
    queryFn: () => tenantService.getAcademicYears(schoolId),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  })

  const years = Array.isArray(academicYears) ? academicYears : (academicYears as any)?.data ?? []
  // `activeYear` is the year we *operate* on (sessions, calendar, bell schedule
  // anchor here). `currentYear` is the one designated for downstream reads
  // (`/academic-years/current`, dashboards, attendance). They CAN diverge —
  // when they do, `driftedActiveYear` carries the year that has `status='active'`
  // without the `isCurrent` flag set, so the UI can surface the recovery path.
  const activeYear = years.find((y: any) => y.status === 'active') || years[0]
  const activeYearId = activeYear?.yearId || activeYear?.id || ''
  const currentYear = years.find((y: any) => y.isCurrent === true)
  const driftedActiveYear = years.find(
    (y: any) => y.status === 'active' && y.isCurrent !== true,
  )

  // Academic year mutations
  const createYearMutation = useMutation({
    mutationFn: async (data: CreateAcademicYearWithTerms) => {
      const { generatedTerms, schoolId: _sid, ...yearData } = data
      const createdYear = await tenantService.createAcademicYear(schoolId, yearData)
      if (generatedTerms?.length && (createdYear as any).id) {
        try {
          await tenantService.createGradingPeriods(schoolId, (createdYear as any).id, generatedTerms)
        } catch { /* year was created, grading periods are optional */ }
      }
      return createdYear
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicYears', schoolId] })
      setIsCreateYearOpen(false)
    },
    onError: () => { /* handled in modal */ },
  })

  const updateYearMutation = useMutation({
    mutationFn: ({ yearId, data }: { yearId: string; data: UpdateAcademicYearDto }) =>
      tenantService.updateAcademicYear(schoolId, yearId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicYears', schoolId] })
      setYearToEdit(null)
    },
  })

  const activateYearMutation = useMutation({
    mutationFn: (yearId: string) =>
      tenantService.updateAcademicYearStatus(schoolId, yearId, { status: 'active' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicYears', schoolId] })
      setYearToActivate(null)
    },
  })

  // Set-as-Current mutation. Flips `isCurrent=true` on the target year and
  // clears it on any other AY for the school (backend enforces the
  // single-current invariant). Invalidates both the local list AND the
  // academics MFE's `['school', 'current-year', schoolId]` cache so the
  // attendance / grades / report-card tabs re-resolve in the same tick.
  const setCurrentYearMutation = useMutation({
    mutationFn: (yearId: string) =>
      tenantService.setCurrentAcademicYear(schoolId, yearId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicYears', schoolId] })
      queryClient.invalidateQueries({ queryKey: ['school', 'current-year', schoolId] })
      toast.success('Academic year set as current')
    },
    // React Query's onError receives whatever was thrown — could be an
    // axios error, a fetch TypeError, a plain object, a string, undefined.
    // The `Error` type annotation is convenience, not a runtime guarantee.
    // Defensively coerce to a string so the toast never renders "undefined".
    onError: (err: unknown) => {
      const fallback = 'Failed to set academic year as current'
      const msg =
        err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string'
          ? (err as { message: string }).message
          : typeof err === 'string'
            ? err
            : fallback
      toast.error(msg || fallback)
    },
  })

  // Fetch sessions for active year
  const { data: sessionsData } = useAcademicSessions(schoolId, activeYearId, !!activeYearId)
  const sessions = (sessionsData as any)?.items || (sessionsData as any)?.data || (Array.isArray(sessionsData) ? sessionsData : [])

  // Fetch calendar stats
  const { data: calendarStats } = useCalendarStats(schoolId, activeYearId, !!activeYearId)

  // Fetch bell schedules
  const { data: bellSchedulesData } = useBellSchedules(schoolId)
  const bellSchedules = (bellSchedulesData as any)?.items || (bellSchedulesData as any)?.data || (Array.isArray(bellSchedulesData) ? bellSchedulesData : [])

  // Wizard step completion
  // C.5 follow-up — the bell-schedule step mirrors the backend C.4 activation
  // predicate exactly (default + multi-period, with active schools
  // grandfathered) so this in-tab checkmark can't disagree with the
  // school-detail activation gate. A loose `length > 0` here showed ✓ while
  // the gate refused activation on a placeholder default — the contradiction
  // the C.5 chip surfaced but didn't resolve.
  const hasRealDefaultBell = bellSchedules.some(
    (b: any) => b.isDefault && getPeriodCount(b) > 1,
  )
  const steps: WizardStepConfig[] = useMemo(() => [
    { id: 'years', label: 'Academic Years', completed: years.length > 0 },
    { id: 'sessions', label: 'Sessions & Terms', completed: sessions.length > 0 },
    { id: 'calendar', label: 'Calendar', completed: (calendarStats as any)?.totalDays > 0 },
    { id: 'bell-schedule', label: 'Bell Schedule', completed: school?.status === 'active' || hasRealDefaultBell },
  ], [years, sessions, calendarStats, hasRealDefaultBell, school?.status])

  // Default to first incomplete step
  const firstIncomplete = steps.find(s => !s.completed)?.id || 'years'
  const [activeStep, setActiveStep] = useState<WizardStep>(firstIncomplete)

  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: '260px 1fr' }}>
      {/* ── Wizard Navigation ── */}
      <div className="bg-[rgb(var(--surface-primary))] border border-[rgba(255,255,255,0.06)] rounded-xl p-3 h-fit sticky top-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--text-tertiary))] px-2.5 pb-2">
          Setup Steps
        </p>
        {steps.map((step, i) => {
          const isActive = activeStep === step.id
          const isDone = step.completed
          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`
                w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium
                mb-0.5 transition-all
                ${isActive
                  ? 'bg-[rgba(55,138,221,0.1)] text-[#378ADD]'
                  : isDone
                    ? 'text-[#1D9E75] hover:bg-[rgba(255,255,255,0.04)]'
                    : 'text-[rgb(var(--text-tertiary))] hover:bg-[rgba(255,255,255,0.04)] hover:text-[rgb(var(--text-secondary))]'
                }
              `}
            >
              <span className={`
                w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center text-[9px] flex-shrink-0
                ${isActive
                  ? 'bg-[rgba(55,138,221,0.1)] border-[#378ADD]'
                  : isDone
                    ? 'bg-[rgba(29,158,117,0.12)] border-[#1D9E75]'
                    : 'border-current'
                }
              `}>
                {isDone ? '✓' : i + 1}
              </span>
              {step.label}
            </button>
          )
        })}

        <div className="h-px bg-[rgba(255,255,255,0.06)] my-2.5" />
        <p className="px-2.5 text-[10px] text-[rgb(var(--text-tertiary))] leading-relaxed">
          Complete these steps in order. Each builds on the previous — you need an academic year before setting up sessions, and sessions before generating a calendar.
        </p>
      </div>

      {/* ── Wizard Content Area ── */}
      <div>
        {activeStep === 'years' && (
          <YearsStep
            years={years}
            isLoading={yearsLoading}
            calendarSystem={schoolCalendarSystem}
            currentYear={currentYear}
            driftedActiveYear={driftedActiveYear}
            onCreateYear={() => setIsCreateYearOpen(true)}
            onEditYear={(year: any) => setYearToEdit(year)}
            onActivateYear={(year: any) => setYearToActivate(year)}
            onSetCurrentYear={(year: any) => {
              const yid = year?.yearId || year?.id
              // Defense-in-depth: should never fire — every AY in the
              // list comes from `tenantService.getAcademicYears` which
              // guarantees `yearId`. But silent failure leaves the
              // operator confused (button click → nothing happens). If
              // a future API change drops the field, surface it.
              if (!yid) {
                toast.error('Unable to update year: missing yearId')
                return
              }
              const otherCurrent = years.find(
                (y: any) => y.isCurrent === true && (y.yearId || y.id) !== yid,
              )
              const message = otherCurrent
                ? `Make "${year.name}" the current academic year? "${otherCurrent.name}" will no longer be marked current.`
                : `Make "${year.name}" the current academic year? Dashboards, attendance, and grades will anchor on this year.`
              if (confirm(message)) {
                setCurrentYearMutation.mutate(yid)
              }
            }}
            setCurrentPending={setCurrentYearMutation.isPending}
          />
        )}
        {activeStep === 'sessions' && (
          <SessionsStep
            schoolId={schoolId}
            activeYear={activeYear}
            sessions={sessions}
            isNepal={localeDefaults.isNepal}
            calendarSystem={schoolCalendarSystem}
          />
        )}
        {activeStep === 'calendar' && (
          <CalendarStep
            schoolId={schoolId}
            activeYear={activeYear}
            calendarStats={calendarStats}
            localeDefaults={localeDefaults}
          />
        )}
        {activeStep === 'bell-schedule' && (
          <BellScheduleStep
            schoolId={schoolId}
            bellSchedules={bellSchedules}
            isNepal={localeDefaults.isNepal}
            activeYear={activeYear}
          />
        )}
      </div>

      {/* Academic Year Modals */}
      <CreateAcademicYearModal
        isOpen={isCreateYearOpen}
        onClose={() => setIsCreateYearOpen(false)}
        onSubmit={(data) => createYearMutation.mutate(data)}
        isLoading={createYearMutation.isPending}
        schoolId={schoolId}
        calendarSystem={schoolCalendarSystem}
      />
      <EditAcademicYearModal
        isOpen={!!yearToEdit}
        year={yearToEdit}
        onClose={() => setYearToEdit(null)}
        onSubmit={(data) => {
          const yid = yearToEdit?.yearId || yearToEdit?.id
          if (yid) updateYearMutation.mutate({ yearId: yid, data })
        }}
        isLoading={updateYearMutation.isPending}
        calendarSystem={schoolCalendarSystem}
      />
      <ActivateConfirmModal
        isOpen={!!yearToActivate}
        year={yearToActivate}
        onClose={() => setYearToActivate(null)}
        onConfirm={() => {
          const yid = yearToActivate?.yearId || yearToActivate?.id
          if (yid) activateYearMutation.mutate(yid)
        }}
        isLoading={activateYearMutation.isPending}
      />
    </div>
  )
}

// ============================================================================
// CREATE ACADEMIC YEAR MODAL
// ============================================================================

function CreateAcademicYearModal({ isOpen, onClose, onSubmit, isLoading, schoolId, calendarSystem = 'gregorian' }: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateAcademicYearWithTerms) => void
  isLoading: boolean
  schoolId: string
  calendarSystem?: string
}) {
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Sprint C4 — same change as in school-academic-years.tsx: AY creation
  // no longer auto-creates sessions. The user picks a template (or creates
  // each one explicitly) on the Sessions & Terms step after the AY exists.

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      schoolId,
      name,
      startDate,
      endDate,
      calendarType: 'semester',
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[rgb(var(--surface-primary))] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-xl p-5">
        <h2 className="text-sm font-bold text-[rgb(var(--text-primary))] mb-3">Create Academic Year</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <DateInput
                label="Start Date"
                value={startDate}
                onChange={(iso: string) => {
                  setStartDate(iso)
                  if (iso && endDate) {
                    try {
                      const sy = new Date(iso).getFullYear()
                      const ey = new Date(endDate).getFullYear()
                      setName(sy === ey ? `${sy}` : `${sy}-${ey}`)
                    } catch { /* ignore */ }
                  }
                }}
                calendarSystem={calendarSystem}
                className="w-full"
              />
            </div>
            <div>
              <DateInput
                label="End Date"
                value={endDate}
                onChange={(iso: string) => {
                  setEndDate(iso)
                  if (startDate && iso) {
                    try {
                      const sy = new Date(startDate).getFullYear()
                      const ey = new Date(iso).getFullYear()
                      setName(sy === ey ? `${sy}` : `${sy}-${ey}`)
                    } catch { /* ignore */ }
                  }
                }}
                calendarSystem={calendarSystem}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[rgb(var(--text-tertiary))] mb-1">Year Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder={calendarSystem === 'bikram_sambat' ? 'e.g., 2082-2083' : 'e.g., 2025-2026'}
              className={inputClass}
            />
          </div>

          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
            <AlertCircle className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))] mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-[rgb(var(--text-tertiary))] leading-relaxed">
              The academic year will be created in "Planning" status with no
              sessions yet. Open the next step (<b>Sessions &amp; Terms</b>) to
              define your terms — pick a template or create them individually,
              then activate the year.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-[11px] font-medium rounded-lg border border-[rgba(255,255,255,0.08)] text-[rgb(var(--text-tertiary))] hover:bg-[rgba(255,255,255,0.04)]">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name || !startDate || !endDate}
              className="px-3 py-1.5 text-[11px] font-medium rounded-lg bg-[#1D9E75] text-white hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Academic Year'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============================================================================
// EDIT ACADEMIC YEAR MODAL
// ============================================================================

function EditAcademicYearModal({ isOpen, year, onClose, onSubmit, isLoading, calendarSystem = 'gregorian' }: {
  isOpen: boolean
  year: any
  onClose: () => void
  onSubmit: (data: UpdateAcademicYearDto) => void
  isLoading: boolean
  calendarSystem?: string
}) {
  const [name, setName] = useState(year?.name || '')
  const [startDate, setStartDate] = useState(year?.startDate || '')
  const [endDate, setEndDate] = useState(year?.endDate || '')

  useEffect(() => {
    if (year) {
      setName(year.name || '')
      setStartDate(year.startDate || '')
      setEndDate(year.endDate || '')
    }
  }, [year])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name, startDate, endDate })
  }

  if (!isOpen || !year) return null
  const canEdit = year.status === 'planning'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[rgb(var(--surface-primary))] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[rgb(var(--text-primary))]">
            {canEdit ? 'Edit Academic Year' : 'View Academic Year'}
          </h2>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            year.status === 'planning' ? 'bg-[rgba(239,159,39,0.1)] text-[#EF9F27]'
              : year.status === 'active' ? 'bg-[rgba(29,158,117,0.1)] text-[#1D9E75]'
              : 'bg-[rgba(255,255,255,0.06)] text-[rgb(var(--text-tertiary))]'
          }`}>
            {year.status?.charAt(0).toUpperCase() + year.status?.slice(1)}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-[rgb(var(--text-tertiary))] mb-1">Year Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={!canEdit}
              className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <DateInput
                label="Start Date"
                value={startDate}
                onChange={(iso: string) => setStartDate(iso)}
                calendarSystem={calendarSystem}
                disabled={!canEdit}
                className="w-full"
              />
            </div>
            <div>
              <DateInput
                label="End Date"
                value={endDate}
                onChange={(iso: string) => setEndDate(iso)}
                calendarSystem={calendarSystem}
                disabled={!canEdit}
                className="w-full"
              />
            </div>
          </div>

          {!canEdit && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
              <Lock className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))] mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-[rgb(var(--text-tertiary))]">
                This academic year is {year.status} and cannot be modified. Dates are locked to maintain data integrity.
              </p>
            </div>
          )}

          {canEdit && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
              <AlertCircle className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))] mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-[rgb(var(--text-tertiary))]">
                Once this year is activated, dates will be locked and cannot be changed.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-[11px] font-medium rounded-lg border border-[rgba(255,255,255,0.08)] text-[rgb(var(--text-tertiary))] hover:bg-[rgba(255,255,255,0.04)]">
              {canEdit ? 'Cancel' : 'Close'}
            </button>
            {canEdit && (
              <button
                type="submit"
                disabled={isLoading || !name || !startDate || !endDate}
                className="px-3 py-1.5 text-[11px] font-medium rounded-lg bg-[#1D9E75] text-white hover:opacity-90 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

// ============================================================================
// ACTIVATE CONFIRMATION MODAL
// ============================================================================

function ActivateConfirmModal({ isOpen, year, onClose, onConfirm, isLoading }: {
  isOpen: boolean
  year: any
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
}) {
  if (!isOpen || !year) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[rgb(var(--surface-primary))] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-xl p-5">
        <h2 className="text-sm font-bold text-[rgb(var(--text-primary))] mb-2">Activate Academic Year</h2>
        <p className="text-xs text-[rgb(var(--text-secondary))] mb-3">
          You are about to activate <strong>{year.name}</strong>. This action:
        </p>

        <ul className="space-y-2 text-xs text-[rgb(var(--text-secondary))] mb-4">
          <li className="flex items-start gap-2">
            <Lock className="w-3.5 h-3.5 text-[#EF9F27] mt-0.5 flex-shrink-0" />
            <span>Will lock the start and end dates permanently</span>
          </li>
          <li className="flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-[#EF9F27] mt-0.5 flex-shrink-0" />
            <span>Will deactivate any currently active academic year</span>
          </li>
          <li className="flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-[#E24B4A] mt-0.5 flex-shrink-0" />
            <span className="text-[#E24B4A]">Cannot be reversed back to "Planning"</span>
          </li>
        </ul>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-[11px] font-medium rounded-lg border border-[rgba(255,255,255,0.08)] text-[rgb(var(--text-tertiary))] hover:bg-[rgba(255,255,255,0.04)]">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-3 py-1.5 text-[11px] font-medium rounded-lg bg-[#1D9E75] text-white hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? 'Activating...' : 'Activate Year'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// STEP 1: ACADEMIC YEARS
// ============================================================================

function YearsStep({
  years,
  isLoading,
  calendarSystem,
  currentYear,
  driftedActiveYear,
  onCreateYear,
  onEditYear,
  onActivateYear,
  onSetCurrentYear,
  setCurrentPending,
}: {
  years: any[]
  isLoading: boolean
  calendarSystem: string
  currentYear: any | undefined
  driftedActiveYear: any | undefined
  onCreateYear: () => void
  onEditYear: (year: any) => void
  onActivateYear: (year: any) => void
  onSetCurrentYear: (year: any) => void
  setCurrentPending: boolean
}) {
  const isBikramSambat = calendarSystem === 'bikram_sambat'

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-bold text-[rgb(var(--text-primary))]">Academic Years</h2>
          <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">Define the temporal boundaries for all academic data.</p>
        </div>
        <button onClick={onCreateYear} className="bg-[#1D9E75] text-white text-[11px] font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:opacity-90 transition-opacity">
          <Plus className="w-3.5 h-3.5" /> New Academic Year
        </button>
      </div>

      {/* Drift callout — surfaces the bug where an AY is active but no year
          is designated `isCurrent=true`, leaving `/academic-years/current`
          to 404 and breaking downstream tabs (attendance, grades, etc.).
          One-click recovery via the inline Set as Current button. */}
      {!currentYear && driftedActiveYear && (
        <div className="flex items-start gap-2.5 bg-[rgba(239,159,39,0.08)] border border-[rgba(239,159,39,0.25)] rounded-xl p-3 mb-3">
          <AlertCircle className="w-4 h-4 text-[#EF9F27] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[12px] font-semibold text-[rgb(var(--text-primary))]">
              &quot;{driftedActiveYear.name}&quot; is active but no year is designated as current.
            </p>
            <p className="text-[11px] text-[rgb(var(--text-tertiary))] mt-0.5">
              Dashboards, attendance, and grades depend on a designated current year.
            </p>
            <button
              type="button"
              onClick={() => onSetCurrentYear(driftedActiveYear)}
              disabled={setCurrentPending}
              className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-lg bg-[#1D9E75] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Star className="w-3 h-3" />
              Set as Current
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-24 bg-[rgb(var(--surface-secondary))] rounded-xl" />
        </div>
      ) : years.length === 0 ? (
        <div className="bg-[rgb(var(--surface-primary))] border border-[rgba(255,255,255,0.06)] rounded-xl p-10 text-center">
          <div className="text-3xl opacity-40 mb-3">📅</div>
          <h3 className="text-[13px] font-semibold text-[rgb(var(--text-secondary))] mb-1.5">No academic years yet</h3>
          <p className="text-[11px] text-[rgb(var(--text-tertiary))] max-w-[280px] mx-auto leading-relaxed mb-4">
            Create your first academic year to begin setting up your school's academic structure.
          </p>
          <button onClick={onCreateYear} className="bg-[#1D9E75] text-white text-[11px] font-medium px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity">
            + Create Academic Year
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {years.map((year: any) => {
            const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
              planning: { bg: 'bg-[rgba(239,159,39,0.1)]', text: 'text-[#EF9F27]', label: 'Planning' },
              active: { bg: 'bg-[rgba(29,158,117,0.1)]', text: 'text-[#1D9E75]', label: 'Active' },
              completed: { bg: 'bg-[rgba(255,255,255,0.06)]', text: 'text-[rgb(var(--text-tertiary))]', label: 'Archived' },
            }
            const status = statusConfig[year.status] || statusConfig.planning

            return (
              <div key={year.id} className="bg-[rgb(var(--surface-primary))] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between border-b border-[rgba(255,255,255,0.05)]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[rgba(55,138,221,0.1)] flex items-center justify-center text-sm">📅</div>
                    <div>
                      <div className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                        {isBikramSambat && year.nameBS ? (
                          <>
                            {year.nameBS}
                            <span className="text-[10px] text-[rgb(var(--text-tertiary))] font-normal ml-1.5">{year.name}</span>
                          </>
                        ) : year.name}
                      </div>
                      <div className="text-[10px] text-[rgb(var(--text-tertiary))] mt-0.5">
                        {year.startDate && year.endDate ? (
                          `${new Date(year.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${new Date(year.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                        ) : 'Dates not set'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                      <span className="w-[5px] h-[5px] rounded-full bg-current" />
                      {status.label}
                    </span>
                    {/* `Current` pill — designation for downstream reads. */}
                    {year.isCurrent === true && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[rgba(55,138,221,0.12)] text-[#378ADD]"
                        title="This year anchors dashboards, attendance, and grades."
                      >
                        <Star className="w-2.5 h-2.5" />
                        Current
                      </span>
                    )}
                    {/* Drift pill — active but not designated current. */}
                    {year.status === 'active' && year.isCurrent !== true && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[rgba(239,159,39,0.12)] text-[#EF9F27]"
                        title="This year is active but no year is designated as current. Use 'Set as Current' to fix."
                      >
                        <AlertCircle className="w-2.5 h-2.5" />
                        Not current
                      </span>
                    )}
                    <button onClick={() => onEditYear(year)} className="px-2.5 py-1 text-[10px] font-medium rounded-lg border border-[rgba(255,255,255,0.08)] text-[rgb(var(--text-tertiary))] hover:bg-[rgba(255,255,255,0.04)] transition-all">
                      Edit
                    </button>
                    {/* Set as Current — operator self-recovery for the
                        drift state. Hidden for the year already current
                        and for completed years (operationally invalid). */}
                    {year.isCurrent !== true && year.status !== 'completed' && (
                      <button
                        onClick={() => onSetCurrentYear(year)}
                        disabled={setCurrentPending}
                        className="px-2.5 py-1 text-[10px] font-medium rounded-lg border border-[rgba(55,138,221,0.25)] text-[#378ADD] hover:bg-[rgba(55,138,221,0.06)] transition-all disabled:opacity-50 inline-flex items-center gap-1"
                        title="Designate as the current academic year"
                      >
                        <Star className="w-3 h-3" />
                        Set as Current
                      </button>
                    )}
                    {year.status === 'planning' && (
                      <button onClick={() => onActivateYear(year)} className="px-2.5 py-1 text-[10px] font-medium rounded-lg bg-[#1D9E75] text-white hover:opacity-90 transition-opacity">
                        Activate
                      </button>
                    )}
                  </div>
                </div>
                <div className="px-4 py-2.5">
                  <div className="flex items-start gap-2 bg-[rgba(55,138,221,0.05)] border border-[rgba(55,138,221,0.12)] rounded-lg px-3 py-2 text-[11px] text-[#378ADD]">
                    <span>📌</span>
                    <span>Next step: Add sessions (semesters/trimesters) to this academic year to define grading periods.</span>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Info banner */}
          <div className="flex items-start gap-2 bg-[rgba(55,138,221,0.05)] border border-[rgba(55,138,221,0.12)] rounded-lg px-3 py-2.5 text-[11px] text-[#378ADD]">
            <span>ℹ️</span>
            <span>Academic years cannot be deleted once created. This preserves historical data integrity. Mark completed years as archived to hide them from active views.</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// STEP 2: SESSIONS & TERMS
// ============================================================================

function SessionsStep({ schoolId, activeYear, sessions, isNepal, calendarSystem }: {
  schoolId: string
  activeYear: any
  sessions: any[]
  isNepal: boolean
  // Sprint C4 rev-2: explicit calendarSystem of the SCHOOL being edited.
  // Without this, the inline session form fell back to native HTML5 date
  // picker even on PABSON schools because the picker component was a
  // bare `<input type="date">` (always Gregorian, browser-native).
  calendarSystem: string
}) {
  const [showForm, setShowForm] = useState(sessions.length === 0)
  const [sessionName, setSessionName] = useState('')
  const [termType, setTermType] = useState('')
  const [beginDate, setBeginDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const createSession = useCreateAcademicSession(schoolId)

  // Sprint S2.4 — fetch GradingPeriods for the active year so each session
  // row can render + edit its associated exam window. The data is 1:1 in
  // V1 (every session auto-creates a grading period at backend session-
  // creation time), so the wizard can pair them by academicSessionId.
  const { data: gradingPeriodsData } = useQuery({
    queryKey: ['grading-periods', schoolId, activeYear?.id],
    queryFn: () => tenantService.getGradingPeriods(schoolId, activeYear.id),
    enabled: !!schoolId && !!activeYear?.id,
    staleTime: 30_000,
  })
  const gradingPeriods = Array.isArray(gradingPeriodsData) ? gradingPeriodsData : []

  // Sprint S2.10 — PABSON 4-term template pre-fill. Saves operators the
  // tedium of manually creating + naming each of 4 standard quarters.
  // Visible only when the AY exists, no sessions configured yet, and the
  // tenant is PABSON archetype (isNepal). The "Apply template" button
  // bulk-creates 4 quarter-based sessions in one click.
  const [isTemplateApplying, setIsTemplateApplying] = useState(false)
  const pabsonTemplate = useMemo(() => {
    if (!activeYear?.startDate || !activeYear?.endDate) return null
    // Split the AY into 4 equal quarters by calendar date.
    const start = new Date(activeYear.startDate + 'T12:00:00Z')
    const end = new Date(activeYear.endDate + 'T12:00:00Z')
    const totalMs = end.getTime() - start.getTime()
    const quarterMs = totalMs / 4
    const segments: Array<{ name: string; descriptor: string; beginDate: string; endDate: string }> = []
    const labels = [
      { name: 'First Term (Baisakh–Asar)', descriptor: 'first_quarter' },
      { name: 'Second Term (Shrawan–Ashwin)', descriptor: 'second_quarter' },
      { name: 'Third Term (Kartik–Poush)', descriptor: 'third_quarter' },
      { name: 'Fourth Term (Magh–Chaitra)', descriptor: 'fourth_quarter' },
    ]
    for (let i = 0; i < 4; i++) {
      const segStart = new Date(start.getTime() + i * quarterMs)
      const segEndRaw = new Date(start.getTime() + (i + 1) * quarterMs)
      // Last term ends exactly on AY endDate; intermediate terms end the
      // day BEFORE the next term begins (no overlap, no gap).
      const segEnd = i === 3 ? end : new Date(segEndRaw.getTime() - 24 * 60 * 60 * 1000)
      segments.push({
        name: labels[i].name,
        descriptor: labels[i].descriptor,
        beginDate: segStart.toISOString().split('T')[0],
        endDate: segEnd.toISOString().split('T')[0],
      })
    }
    return segments
  }, [activeYear?.startDate, activeYear?.endDate])

  const showPabsonTemplate = isNepal && sessions.length === 0 && pabsonTemplate

  const handleApplyTemplate = async () => {
    if (!pabsonTemplate || !activeYear?.id || isTemplateApplying) return
    setIsTemplateApplying(true)
    setFormError(null)
    try {
      for (const seg of pabsonTemplate) {
        await new Promise<void>((resolve, reject) => {
          createSession.mutate(
            {
              sessionName: seg.name,
              termDescriptor: seg.descriptor as any,
              beginDate: seg.beginDate,
              endDate: seg.endDate,
              academicYearId: activeYear.id,
            },
            {
              onSuccess: () => resolve(),
              onError: (e: any) => reject(e),
            },
          )
        })
      }
      toast.success('PABSON 4-term template applied — 4 sessions created')
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Template apply failed'
      setFormError(msg)
      toast.error(`Template apply stopped: ${msg}`)
    } finally {
      setIsTemplateApplying(false)
    }
  }

  const handleCreate = () => {
    if (!sessionName || !termType || !beginDate || !endDate || !activeYear?.id) return
    setFormError(null)
    createSession.mutate(
      {
        sessionName,
        termDescriptor: termType as any,
        beginDate,
        endDate,
        academicYearId: activeYear.id,
      },
      {
        onSuccess: () => {
          setSessionName('')
          setTermType('')
          setBeginDate('')
          setEndDate('')
          setShowForm(false)
          setFormError(null)
        },
        onError: (error: any) => {
          const msg = error?.response?.data?.message || error?.message || 'Failed to create session'
          setFormError(msg)
        },
      }
    )
  }

  const prefillNepalSemester = (semester: 'first' | 'second') => {
    if (semester === 'first') {
      setSessionName('First Semester')
      setTermType('fall_semester')
      // Approximate: Baishakh–Ashwin (Apr–Oct)
      if (activeYear?.startDate) setBeginDate(activeYear.startDate.split('T')[0])
    } else {
      setSessionName('Second Semester')
      setTermType('spring_semester')
      // Approximate: Kartik–Chaitra (Oct–Mar)
      if (activeYear?.endDate) setEndDate(activeYear.endDate.split('T')[0])
    }
    setShowForm(true)
  }

  const yearLabel = activeYear?.name || 'Academic Year'

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-bold text-[rgb(var(--text-primary))]">Sessions & Terms</h2>
          <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
            Define semesters, trimesters, or quarters within <strong className="text-[#378ADD]">{yearLabel}</strong>
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#1D9E75] text-white text-[11px] font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" /> Add Session
        </button>
      </div>

      {/* Ed-Fi annotation */}
      <div className="flex items-start gap-2 bg-[rgba(55,138,221,0.05)] border border-[rgba(55,138,221,0.12)] rounded-lg px-3 py-2.5 text-[11px] text-[#378ADD] mb-3">
        <span>ℹ️</span>
        <span>Sessions define grading periods (e.g., "First Semester", "Q1"). Each session maps to Ed-Fi <strong>GradingPeriodDescriptor</strong>. Students receive report cards per session.</span>
      </div>

      {/* Sprint S2.10 — PABSON 4-term template pre-fill.
          Shown only when (a) school is on PABSON archetype (isNepal) and
          (b) no sessions have been created yet. Saves operators the
          tedium of manually creating + naming each of the 4 standard
          PABSON quarters. */}
      {showPabsonTemplate && (
        <div className="bg-[rgba(29,158,117,0.04)] border border-[rgba(29,158,117,0.18)] rounded-xl p-3.5 mb-3">
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div>
              <h3 className="text-xs font-semibold text-[rgb(var(--text-primary))] mb-0.5 flex items-center gap-1.5">
                <span aria-hidden>✨</span>
                PABSON 4-term template
              </h3>
              <p className="text-[10.5px] text-[rgb(var(--text-tertiary))] leading-relaxed">
                One click creates the standard PABSON 4-quarter structure
                aligned to the BS calendar. You can edit names or dates
                afterward. Skip this if your school uses a different
                rhythm.
              </p>
            </div>
            <button
              type="button"
              onClick={handleApplyTemplate}
              disabled={isTemplateApplying}
              className="flex-shrink-0 bg-[#1D9E75] text-white text-[11px] font-medium px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {isTemplateApplying ? 'Applying…' : 'Apply template'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            {pabsonTemplate.map((t, i) => (
              <div
                key={i}
                className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-md px-2.5 py-1.5"
              >
                <div className="font-medium text-[rgb(var(--text-secondary))]">{t.name}</div>
                <div className="text-[9.5px] text-[rgb(var(--text-tertiary))] mt-0.5">
                  {new Date(t.beginDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {' → '}
                  {new Date(t.endDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sessions card */}
      <div className="bg-[rgb(var(--surface-primary))] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.05)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-[26px] h-[26px] rounded-lg bg-[rgba(55,138,221,0.1)] flex items-center justify-center text-[13px]">📋</div>
            <div>
              <h3 className="text-xs font-semibold text-[rgb(var(--text-primary))]">{yearLabel} Sessions</h3>
              <p className="text-[10px] text-[rgb(var(--text-tertiary))]">{sessions.length} sessions configured</p>
            </div>
          </div>
        </div>

        {/* Inline create form */}
        {showForm && (
          <div className="mx-4 my-3 bg-[rgba(55,138,221,0.03)] border border-[rgba(55,138,221,0.1)] rounded-lg p-3.5">
            <h4 className="text-xs font-semibold text-[rgb(var(--text-primary))] mb-2.5">New Session</h4>
            <div className="grid grid-cols-2 gap-2.5 mb-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-[rgb(var(--text-tertiary))]">Session Name <span className="text-red-500">*</span></label>
                <input className={inputClass} value={sessionName} onChange={e => setSessionName(e.target.value)} placeholder="e.g., First Semester" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-[rgb(var(--text-tertiary))]">Term Descriptor <span className="text-red-500">*</span></label>
                <select className={inputClass} value={termType} onChange={e => setTermType(e.target.value)}>
                  <option value="">Select term descriptor...</option>
                  <option value="fall_semester">Fall Semester</option>
                  <option value="spring_semester">Spring Semester</option>
                  <option value="year_round">Year Round</option>
                  <option value="summer">Summer</option>
                  <option value="first_quarter">First Quarter</option>
                  <option value="second_quarter">Second Quarter</option>
                  <option value="third_quarter">Third Quarter</option>
                  <option value="fourth_quarter">Fourth Quarter</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-[rgb(var(--text-tertiary))]">Begin Date <span className="text-red-500">*</span></label>
                <DateInput
                  value={beginDate}
                  onChange={(iso) => { setBeginDate(iso); setFormError(null) }}
                  calendarSystem={calendarSystem}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-[rgb(var(--text-tertiary))]">End Date <span className="text-red-500">*</span></label>
                <DateInput
                  value={endDate}
                  onChange={(iso) => { setEndDate(iso); setFormError(null) }}
                  calendarSystem={calendarSystem}
                />
              </div>
            </div>
            {formError && (
              <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-1">
                {formError}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowForm(false); setFormError(null) }} className="px-3 py-1.5 text-[11px] font-medium rounded-lg border border-[rgba(255,255,255,0.08)] text-[rgb(var(--text-tertiary))] hover:bg-[rgba(255,255,255,0.04)]">Cancel</button>
              <button onClick={handleCreate} disabled={createSession.isPending} className="px-3 py-1.5 text-[11px] font-medium rounded-lg bg-[#1D9E75] text-white hover:opacity-90 disabled:opacity-50">{createSession.isPending ? 'Creating...' : 'Create Session'}</button>
            </div>
          </div>
        )}

        {/* Session list or empty state */}
        {sessions.length > 0 ? (
          <div className="px-4 py-3 space-y-2">
            {/*
              Sprint S2.4 — Each session row now exposes an inline "Set exam
              window" affordance. The session is paired with its auto-created
              GradingPeriod (1:1 in V1) so the operator can configure exam
              dates without leaving the wizard. See SessionRowWithExamForm
              below for the pairing logic + form UX.
            */}
            {sessions.map((session: any) => (
              <SessionRowWithExamForm
                key={session.id}
                session={session}
                schoolId={schoolId}
                yearId={activeYear?.id}
                gradingPeriods={gradingPeriods}
                calendarSystem={calendarSystem}
              />
            ))}
          </div>
        ) : (
          <div className="p-6 text-center">
            <div className="text-2xl opacity-40 mb-2">📋</div>
            <h3 className="text-[13px] font-semibold text-[rgb(var(--text-secondary))] mb-1">No sessions yet</h3>
            <p className="text-[11px] text-[rgb(var(--text-tertiary))] max-w-[280px] mx-auto leading-relaxed">
              Create your first session above — e.g., "First Semester" covering April through September. Sessions define when report cards are generated.
            </p>
          </div>
        )}
      </div>

      {/* Nepal suggestions panel */}
      {isNepal && sessions.length === 0 && (
        <div className="mt-2 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg p-3">
          <p className="text-[11px] font-semibold text-[rgb(var(--text-tertiary))] mb-2">Suggested for Nepal schools (Semester system):</p>
          <div className="space-y-1.5">
            {[
              { label: 'First Semester', detail: 'Baishakh – Ashwin  (Apr – Oct)', type: 'first' as const },
              { label: 'Second Semester', detail: 'Kartik – Chaitra  (Oct – Mar)', type: 'second' as const },
            ].map(s => (
              <div key={s.type} className="flex items-center justify-between px-3 py-2 bg-[rgba(55,138,221,0.04)] border border-[rgba(55,138,221,0.1)] rounded-lg">
                <div>
                  <span className="text-xs font-medium text-[rgb(var(--text-primary))]">{s.label}</span>
                  <span className="text-[10px] text-[rgb(var(--text-tertiary))] ml-2">{s.detail}</span>
                </div>
                <button onClick={() => prefillNepalSemester(s.type)} className="px-2.5 py-1 text-[10px] font-medium rounded-lg border border-[rgba(255,255,255,0.08)] text-[rgb(var(--text-tertiary))] hover:bg-[rgba(255,255,255,0.04)]">
                  + Use
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// CALENDAR MONTH GRID (lightweight inline view)
// ============================================================================

// Sprint S2.8 — event-type taxonomy consolidated into ./calendar/event-types.ts.
// This component imports EVENT_TYPE_COLORS from that single source of truth
// instead of redefining it inline. See top of file for the new import.

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// ============================================================================
// SESSION ROW WITH INLINE EXAM-WINDOW EDIT FORM (Sprint S2.4)
// ============================================================================

/**
 * One row per session inside the Sessions wizard step. Renders the session
 * summary + an inline edit form for the associated GradingPeriod's
 * `examStartDate` / `examEndDate`.
 *
 * Why this lives here (vs a dedicated Term form): V1's session → grading
 * period mapping is 1:1 (every Session auto-creates a GradingPeriod with
 * `academicSessionId` back-reference). Editing the exam window inline on
 * the session row matches the operator's mental model — they think in
 * terms of "Semester 1's exams" not "Grading Period uuid-xxx's exams".
 *
 * Sprint S2.1 — when the server returns `warnings: [{ code, date, holidayName }]`
 * (exam window overlaps a holiday), render a non-blocking advisory banner
 * after a successful save. Operator can choose to keep or change.
 */
function SessionRowWithExamForm({
  session,
  schoolId,
  yearId,
  gradingPeriods,
  calendarSystem,
}: {
  session: any
  schoolId: string
  yearId: string | undefined
  gradingPeriods: any[]
  calendarSystem: string
}) {
  // Pair the session to its grading period. V1 has 1:1 mapping; prefer
  // back-reference from grading-period → session; fall back to forward
  // reference on the session row if present.
  const associatedGp = useMemo(() => {
    if (!session) return null
    return (
      gradingPeriods.find(
        (gp: any) =>
          gp.academicSessionId === session.academicSessionId ||
          gp.academicSessionId === session.id,
      ) ??
      gradingPeriods.find(
        (gp: any) => session.gradingPeriodIds?.includes(gp.id),
      ) ??
      null
    )
  }, [session, gradingPeriods])

  const [isEditing, setIsEditing] = useState(false)
  const [examStart, setExamStart] = useState<string>(associatedGp?.examStartDate ?? '')
  const [examEnd, setExamEnd] = useState<string>(associatedGp?.examEndDate ?? '')
  const [warnings, setWarnings] = useState<Array<{ code: string; date: string; holidayName: string }>>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const updateGp = useMutation({
    mutationFn: () => {
      if (!yearId || !associatedGp?.id) {
        return Promise.reject(new Error('Missing yearId or gradingPeriodId'))
      }
      return tenantService.updateGradingPeriod(schoolId, yearId, associatedGp.id, {
        examStartDate: examStart || undefined,
        examEndDate: examEnd || undefined,
      })
    },
    onSuccess: (result: any) => {
      // Refresh grading periods so the row re-renders with the new dates.
      queryClient.invalidateQueries({ queryKey: ['grading-periods', schoolId, yearId] })
      // Refresh calendar dates so the auto-synced exam_window rows show up
      // immediately on the wizard's inline grid + the SchoolFullCalendar.
      queryClient.invalidateQueries({ queryKey: ['calendar-dates'] })
      setErrorMessage(null)
      setWarnings(result.warnings ?? [])
      // Close the form on save success; the operator can re-open to edit
      // again. Leave warnings visible on the row even after close.
      setIsEditing(false)
      if (!result.warnings || result.warnings.length === 0) {
        toast.success('Exam window saved')
      } else {
        toast.warning(`Exam window saved with ${result.warnings.length} holiday overlap warning(s)`)
      }
    },
    onError: (err: any) => {
      const apiBody = err?.response?.data
      const errorCode = apiBody?.errorCode ?? apiBody?.response?.errorCode
      if (errorCode === 'EXAM_DATES_OUT_OF_TERM_RANGE') {
        setErrorMessage(
          `Exam dates must be inside the session range (${session.beginDate} – ${session.endDate}).`,
        )
      } else {
        setErrorMessage(
          apiBody?.message ?? err?.message ?? 'Failed to save exam window. Try again.',
        )
      }
    },
  })

  // Sync local state when grading period data refreshes
  useEffect(() => {
    setExamStart(associatedGp?.examStartDate ?? '')
    setExamEnd(associatedGp?.examEndDate ?? '')
  }, [associatedGp?.examStartDate, associatedGp?.examEndDate])

  const hasExamDates = !!(associatedGp?.examStartDate && associatedGp?.examEndDate)
  const formatRange = (s?: string, e?: string) =>
    s && e
      ? `${new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → ${new Date(e + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      : 'Not set'

  return (
    <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-lg overflow-hidden">
      {/* Session summary row */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-2 h-2 rounded-full bg-[#378ADD]" />
          <span className="text-xs font-medium text-[rgb(var(--text-primary))]">
            {session.sessionName || session.name}
          </span>
          <span className="text-[10px] text-[rgb(var(--text-tertiary))]">
            {session.beginDate && session.endDate
              ? `${new Date(session.beginDate).toLocaleDateString()} – ${new Date(session.endDate).toLocaleDateString()}`
              : ''}
          </span>
          {hasExamDates && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{
                background: 'rgba(249,115,22,0.08)',
                color: '#F97316',
                border: '1px solid rgba(249,115,22,0.2)',
              }}
              title="Exam window — auto-syncs to the calendar"
            >
              Exam: {formatRange(associatedGp.examStartDate, associatedGp.examEndDate)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-1.5 py-px rounded border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.04)] text-[rgb(var(--text-tertiary))]">
            {session.termDescriptor || session.termType || 'Session'}
          </span>
          {associatedGp && (
            <button
              type="button"
              onClick={() => {
                setIsEditing(p => !p)
                setErrorMessage(null)
              }}
              className="text-[10px] font-medium text-[#378ADD] hover:underline"
            >
              {isEditing ? 'Close' : hasExamDates ? 'Edit exam window' : 'Set exam window'}
            </button>
          )}
        </div>
      </div>

      {/* Inline edit form */}
      {isEditing && associatedGp && (
        <div className="px-3 py-3 border-t border-[rgba(55,138,221,0.12)] bg-[rgba(55,138,221,0.03)]">
          <p className="text-[10px] text-[rgb(var(--text-tertiary))] mb-2">
            Exam dates must be inside the session range ({session.beginDate} – {session.endDate}).
            Saving auto-generates orange exam-window markers on the calendar.
          </p>
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[rgb(var(--text-tertiary))]">
                Exam Start Date
              </label>
              <DateInput
                value={examStart}
                onChange={(iso) => {
                  setExamStart(iso)
                  setErrorMessage(null)
                }}
                calendarSystem={calendarSystem}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[rgb(var(--text-tertiary))]">
                Exam End Date
              </label>
              <DateInput
                value={examEnd}
                onChange={(iso) => {
                  setExamEnd(iso)
                  setErrorMessage(null)
                }}
                calendarSystem={calendarSystem}
              />
            </div>
          </div>
          {errorMessage && (
            <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-2">
              {errorMessage}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false)
                setErrorMessage(null)
                setExamStart(associatedGp?.examStartDate ?? '')
                setExamEnd(associatedGp?.examEndDate ?? '')
              }}
              className="px-3 py-1.5 text-[11px] font-medium rounded-lg border border-[rgba(255,255,255,0.08)] text-[rgb(var(--text-tertiary))] hover:bg-[rgba(255,255,255,0.04)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => updateGp.mutate()}
              disabled={updateGp.isPending || !examStart || !examEnd}
              className="px-3 py-1.5 text-[11px] font-medium rounded-lg bg-[#1D9E75] text-white hover:opacity-90 disabled:opacity-50"
            >
              {updateGp.isPending ? 'Saving…' : 'Save exam dates'}
            </button>
          </div>
        </div>
      )}

      {/* Holiday-overlap warnings (S2.1 consumer) */}
      {warnings.length > 0 && !isEditing && (
        <div className="px-3 py-2.5 border-t border-[rgba(239,159,39,0.18)] bg-[rgba(239,159,39,0.05)]">
          <p className="text-[11px] font-medium text-[#EF9F27] mb-1 flex items-center gap-1.5">
            <span aria-hidden>⚠</span>
            Heads up — {warnings.length} date{warnings.length > 1 ? 's' : ''} in this exam window
            overlap{warnings.length > 1 ? '' : 's'} a holiday:
          </p>
          <ul className="text-[10.5px] text-[rgb(var(--text-secondary))] space-y-0.5 ml-4 list-disc">
            {warnings.map(w => (
              <li key={w.date}>
                <strong>{new Date(w.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>{' '}
                — {w.holidayName}
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-[rgb(var(--text-tertiary))] mt-1.5">
            Saved as-is. Adjust dates above or clear the warning by setting the exam window outside the holidays.
          </p>
        </div>
      )}
    </div>
  )
}

function CalendarMonthGrid({ currentMonth, onMonthChange, dateMap, selectedDate, onSelectDate, startDate, endDate, calendarSystem }: {
  currentMonth: Date
  onMonthChange: (d: Date) => void
  dateMap: Map<string, any>
  selectedDate: string | null
  onSelectDate: (d: string | null) => void
  startDate?: string
  endDate?: string
  calendarSystem?: 'gregorian' | 'bikram_sambat'
}) {
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const isBSCalendar = calendarSystem === 'bikram_sambat'

  // Build grid cells for the month
  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => onMonthChange(new Date(year, month - 1, 1))
  const nextMonth = () => onMonthChange(new Date(year, month + 1, 1))

  // Determine if month is within academic year range
  const yearStart = startDate ? new Date(startDate) : null
  const yearEnd = endDate ? new Date(endDate) : null

  // Compute BS title for Nepal schools
  let bsTitle = ''
  if (isBSCalendar) {
    try {
      const startBS = adToBS(new Date(year, month, 8))
      const endBS = adToBS(new Date(year, month, daysInMonth - 7 > 0 ? daysInMonth - 7 : daysInMonth))
      const monthNames = BS_MONTH_NAMES_EN
      if (startBS.month === endBS.month && startBS.year === endBS.year) {
        bsTitle = `${monthNames[startBS.month - 1]} ${startBS.year}`
      } else if (startBS.year === endBS.year) {
        bsTitle = `${monthNames[startBS.month - 1]} – ${monthNames[endBS.month - 1]} ${startBS.year}`
      } else {
        bsTitle = `${monthNames[startBS.month - 1]} ${startBS.year} – ${monthNames[endBS.month - 1]} ${endBS.year}`
      }
    } catch { /* ignore */ }
  }

  const cells: { day: number; dateStr: string; entry: any; inRange: boolean; bsDay?: number }[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d)
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const entry = dateMap.get(dateStr) || null
    const inRange = (!yearStart || dt >= yearStart) && (!yearEnd || dt <= yearEnd)
    let bsDay: number | undefined
    if (isBSCalendar) {
      try { bsDay = adToBS(dt).day } catch { /* ignore */ }
    }
    cells.push({ day: d, dateStr, entry, inRange, bsDay })
  }

  return (
    <div className="bg-[rgb(var(--surface-primary))] border border-[rgba(255,255,255,0.06)] rounded-xl mb-3 overflow-hidden">
      {/* Month navigation */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-[rgba(255,255,255,0.05)]">
        <button onClick={prevMonth} className="px-2 py-1 text-[11px] font-medium rounded-lg border border-[rgba(255,255,255,0.08)] text-[rgb(var(--text-tertiary))] hover:bg-[rgba(255,255,255,0.04)]">
          ← Prev
        </button>
        <div className="text-center">
          {isBSCalendar && bsTitle && (
            <h3 className="text-xs font-bold text-[rgb(var(--text-primary))]">{bsTitle}</h3>
          )}
          <h3 className={`font-bold text-[rgb(var(--text-${isBSCalendar ? 'tertiary' : 'primary'}))] ${isBSCalendar ? 'text-[10px]' : 'text-xs'}`}>
            {MONTH_NAMES[month]} {year}
          </h3>
        </div>
        <button onClick={nextMonth} className="px-2 py-1 text-[11px] font-medium rounded-lg border border-[rgba(255,255,255,0.08)] text-[rgb(var(--text-tertiary))] hover:bg-[rgba(255,255,255,0.04)]">
          Next →
        </button>
      </div>

      {/* Day of week headers */}
      <div className="grid grid-cols-7 px-3 pt-2 pb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-[9px] font-bold uppercase text-center text-[rgb(var(--text-tertiary))] py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 px-3 pb-3 gap-px">
        {/* Empty cells for days before month start */}
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} className="h-8" />
        ))}

        {/* Day cells */}
        {cells.map(({ day, dateStr, entry, inRange, bsDay }) => {
          // Pick the most-specific event so overlay event types (exam_window,
          // school_program, holiday) win the cell color over an underlying
          // baseline instructional_day. Mirrors getPrimaryEventType in
          // fullcalendar-utils.ts; consolidate in S1.5 follow-up.
          const events = entry?.calendarEvents ?? []
          const specific = events.find((e: any) => e.eventType !== 'instructional_day' && e.eventType !== 'non_instructional_day')
          const eventType = specific?.eventType ?? events[0]?.eventType ?? (entry?.isWeekend ? 'weekend' : null)
          const isWeekend = entry?.isWeekend
          const isSelected = selectedDate === dateStr
          const colorCfg = eventType ? (EVENT_TYPE_COLORS as Record<string, { bg: string; dot: string; label: string }>)[eventType] : null

          // Sprint C4-FE — block-overlay metadata. Backend denormalizes
          // blockId/blockName/subEventName onto each child date row
          // (PR A). Use them for a browser tooltip on hover so the
          // operator can scan the grid and see which dates belong to
          // which block without clicking each one. Avoids visual
          // clutter — no inline text label inside the small cells.
          const blockName: string | undefined = entry?.blockName
          const subEventName: string | undefined = entry?.subEventName
          const cellTitle = blockName
            ? subEventName
              ? `${blockName} · ${subEventName}`
              : blockName
            : undefined

          return (
            <button
              key={dateStr}
              title={cellTitle}
              onClick={() => inRange && entry ? onSelectDate(isSelected ? null : dateStr) : undefined}
              disabled={!inRange || !entry}
              className={`${isBSCalendar ? 'h-10' : 'h-8'} rounded-md text-[11px] font-medium relative flex ${isBSCalendar ? 'flex-col' : ''} items-center justify-center transition-all ${
                !inRange ? 'opacity-20 cursor-default'
                  : isSelected ? 'ring-1 ring-[#378ADD] bg-[rgba(55,138,221,0.15)] text-[#378ADD]'
                  : isWeekend ? 'text-[rgb(var(--text-tertiary))] opacity-50'
                  : entry ? 'hover:bg-[rgba(255,255,255,0.06)] cursor-pointer text-[rgb(var(--text-secondary))]'
                  : 'text-[rgb(var(--text-tertiary))] opacity-30 cursor-default'
              }`}
              style={colorCfg && !isSelected ? { background: colorCfg.bg } : undefined}
            >
              {isBSCalendar && bsDay != null ? (
                <>
                  <span className="text-[11px] font-semibold leading-none">{bsDay}</span>
                  <span className="text-[8px] opacity-50 leading-none">{day}</span>
                </>
              ) : (
                day
              )}
              {colorCfg && (
                <span
                  className="absolute bottom-0.5 w-1 h-1 rounded-full"
                  style={{ background: colorCfg.dot }}
                />
              )}
              {/* Block indicator — small ring at the top-right when this
                  date belongs to a multi-day block. Visible accent
                  without consuming cell space. Click + DateEditPanel
                  shows the full block context pill. */}
              {blockName && !isSelected && (
                <span
                  className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full"
                  style={{ background: 'rgba(127,119,221,0.7)' }}
                  aria-hidden
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Quick stats for this month */}
      <div className="px-4 py-2 border-t border-[rgba(255,255,255,0.04)] flex gap-3 text-[10px] text-[rgb(var(--text-tertiary))]">
        <span>{cells.filter(c => c.entry?.isInstructionalDay).length} instructional</span>
        <span>{cells.filter(c => c.entry?.isHoliday).length} holidays</span>
        <span>{cells.filter(c => c.entry?.isWeekend).length} weekends</span>
      </div>
    </div>
  )
}

// ============================================================================
// DATE EDIT PANEL (inline, below calendar grid)
// ============================================================================

// Sprint S2.8 + S2.5 — operator-selectable types now come from the single
// source of truth in ./calendar/event-types.ts. exam_window is correctly
// excluded because it's server-managed (auto-synced from
// GradingPeriod.examStartDate/examEndDate); if the operator manually
// picked it, the auto-sync wouldn't know to clean it up later.
const CALENDAR_EVENT_TYPES = OPERATOR_SELECTABLE_TYPES

// Pick the most-specific event type from a CalendarDate row. Prefers
// overlay events (exam_window, school_program, holiday, etc.) over the
// underlying instructional baseline so the operator sees the meaningful
// event preselected when they click on an exam day.
function pickSpecificEventType(dateEntry: any, fallback = 'instructional_day'): string {
  const events = (dateEntry?.calendarEvents ?? []) as Array<{ eventType: string }>
  if (events.length === 0) return fallback
  const specific = events.find(e => e.eventType !== 'instructional_day' && e.eventType !== 'non_instructional_day')
  return specific?.eventType ?? events[0].eventType ?? fallback
}

// Sprint C4-FE — return the full most-specific event (with audience,
// category, description) so the curated dropdown can decode the
// (eventType, audience) triple correctly on edit-open. Pre-seeded
// PABSON holidays carry `category: 'religious'`; without seeing the
// full event the curated dropdown would fall through to "Other".
function pickSpecificEvent(dateEntry: any): CalendarEventInput | undefined {
  const events = (dateEntry?.calendarEvents ?? []) as CalendarEventInput[]
  if (events.length === 0) return undefined
  const specific = events.find(
    e => e.eventType !== 'instructional_day' && e.eventType !== 'non_instructional_day',
  )
  return specific ?? events[0]
}

function DateEditPanel({ dateEntry, onClose, onSave, isSaving, calendarSystem }: {
  dateEntry: any
  onClose: () => void
  /**
   * Sprint C4-FE expanded signature — caller receives the full encoded
   * calendar event (eventType + optional audience/category/description)
   * plus the instructional flag. Maps directly onto
   * `UpdateCalendarDateDto.calendarEvents[0]`.
   */
  onSave: (event: CalendarEventInput, isInstructional: boolean) => void
  isSaving: boolean
  calendarSystem?: 'gregorian' | 'bikram_sambat'
}) {
  const currentEvent = pickSpecificEvent(dateEntry)
  const currentEventType = pickSpecificEventType(dateEntry)
  const currentCuratedKey = decodeCalendarEvent(currentEvent)
  const [curatedKey, setCuratedKey] = useState<CuratedSingleDayKey>(currentCuratedKey)
  // "Other" reveals a raw eventType picker; default to the existing event's
  // type so the operator sees what's currently stored.
  const [rawOverride, setRawOverride] = useState<CalendarEventDescriptor>(
    currentEventType as CalendarEventDescriptor,
  )
  const [isInstructional, setIsInstructional] = useState(dateEntry?.isInstructionalDay ?? true)
  const [description, setDescription] = useState<string>(currentEvent?.description ?? '')

  // Derive the actual eventType that will land server-side from the
  // current curated selection (used by the preview swatch + the
  // auto-instructional toggle).
  const effectiveEventType: CalendarEventDescriptor =
    curatedKey === 'other' ? rawOverride : getCuratedMeta(curatedKey).eventType

  // Reset when dateEntry changes
  useEffect(() => {
    const evt = pickSpecificEvent(dateEntry)
    const key = decodeCalendarEvent(evt)
    setCuratedKey(key)
    setRawOverride((evt?.eventType as CalendarEventDescriptor) ?? 'non_instructional_day')
    setDescription(evt?.description ?? '')
    setIsInstructional(dateEntry?.isInstructionalDay ?? true)
  }, [dateEntry?.date])

  const dateObj = dateEntry?.date ? new Date(dateEntry.date + 'T12:00:00') : null
  const dateLabel = dateObj
    ? dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : ''

  // BS date for Nepal schools
  let bsDateLabel = ''
  if (calendarSystem === 'bikram_sambat' && dateObj) {
    try {
      const bs = adToBS(dateObj)
      const monthName = BS_MONTH_NAMES_EN[bs.month - 1] || ''
      bsDateLabel = `${monthName} ${bs.day}, ${bs.year} BS`
    } catch { /* ignore */ }
  }

  const colorCfg = (EVENT_TYPE_COLORS as Record<string, { bg: string; dot: string; label: string }>)[effectiveEventType] || EVENT_TYPE_COLORS.other

  // Description from the most-specific event (matches the eventType chosen
  // above), falling back to events[0] then empty string.
  const specificForLabel = (dateEntry?.calendarEvents ?? []).find((e: any) =>
    e.eventType === effectiveEventType,
  )
  const holidayName = specificForLabel?.description || dateEntry?.calendarEvents?.[0]?.description || ''
  const isWeekend = dateEntry?.isWeekend
  const isWeekendWithHoliday = isWeekend && dateEntry?.calendarEvents?.[0]?.eventType === 'holiday'

  // Determine the display title
  const displayTitle = isWeekendWithHoliday
    ? 'Weekend'
    : holidayName || colorCfg.label

  // Info card border color
  const infoBorderColor = isWeekendWithHoliday || isWeekend
    ? 'rgba(148,163,184,0.2)'
    : currentEventType === 'holiday'
      ? 'rgba(226,75,74,0.2)'
      : currentEventType === 'instructional_day'
        ? 'rgba(29,158,117,0.2)'
        : 'rgba(55,138,221,0.15)'

  return (
    <div className="bg-[rgb(var(--surface-primary))] border border-[rgba(55,138,221,0.15)] rounded-xl mb-3 p-3.5">
      {/* Header with close button */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: isWeekendWithHoliday ? 'rgb(var(--text-tertiary))' : colorCfg.dot }} />
          <h4 className="text-xs font-semibold text-[rgb(var(--text-primary))]">{displayTitle}</h4>
        </div>
        <button onClick={onClose} className="text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] text-sm">✕</button>
      </div>

      {/* Date Info Card */}
      <div className="rounded-lg px-3 py-2 mb-2.5" style={{ background: isWeekendWithHoliday || isWeekend ? 'rgba(148,163,184,0.06)' : colorCfg.bg, border: `1px solid ${infoBorderColor}` }}>
        {/* Date display */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-medium text-[rgb(var(--text-secondary))]">{dateLabel}</span>
          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ background: colorCfg.bg, color: colorCfg.dot }}>
            {colorCfg.label}
          </span>
        </div>

        {/* BS date for Nepal schools */}
        {bsDateLabel && (
          <p className="text-[11px] font-medium text-teal-600 dark:text-teal-400 mb-1">{bsDateLabel}</p>
        )}

        {/* Holiday name — shown prominently for proper holidays */}
        {!isWeekend && holidayName && currentEventType === 'holiday' && (
          <p className="text-[11px] font-medium text-[rgb(var(--text-primary))]">{holidayName}</p>
        )}

        {/* Weekend + Holiday overlap explanation */}
        {isWeekendWithHoliday && holidayName && (
          <p className="text-[10px] text-[rgb(var(--text-tertiary))] mt-0.5">
            {holidayName} falls on this {dateEntry.dayOfWeek} — counted as weekend, not holiday
          </p>
        )}

        {/* Day metadata */}
        <div className="flex items-center gap-2 text-[10px] text-[rgb(var(--text-tertiary))] mt-1">
          {dateEntry?.dayOfWeek && (
            <span>{dateEntry.dayOfWeek.charAt(0).toUpperCase() + dateEntry.dayOfWeek.slice(1)}{isWeekend ? ' (Weekend)' : ''}</span>
          )}
          {dateEntry?.dayNumber != null && <span>Day {dateEntry.dayNumber}</span>}
          {dateEntry?.instructionalDayNumber != null && <span>Instructional #{dateEntry.instructionalDayNumber}</span>}
          {dateEntry?.gradingPeriodName && <span>{dateEntry.gradingPeriodName}</span>}
        </div>
      </div>

      {/* Edit section divider */}
      <div className="relative mb-2.5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[rgba(255,255,255,0.06)]" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-2 text-[9px] font-medium uppercase tracking-wider text-[rgb(var(--text-tertiary))] bg-[rgb(var(--surface-primary))]">Edit</span>
        </div>
      </div>

      {/* Sprint C4-FE — block-context info pill (when this date is part
          of a multi-day block). Server-side denormalization (PR A)
          exposes blockId/blockName on the date row. */}
      {dateEntry?.blockId && (
        <div className="bg-[rgba(127,119,221,0.06)] border border-[rgba(127,119,221,0.15)] rounded-lg px-3 py-2 mb-2.5 text-[11px] text-[rgb(var(--text-secondary))]">
          <span className="font-medium">Part of:</span> {dateEntry.blockName ?? 'Multi-day block'}
          {dateEntry.subEventName && (
            <span className="text-[rgb(var(--text-tertiary))]"> · {dateEntry.subEventName}</span>
          )}
          <p className="text-[10px] text-[rgb(var(--text-tertiary))] mt-0.5">
            Saving an override here keeps the block link but customizes this single day.
          </p>
        </div>
      )}

      {/* Sprint C4-FE — curated event-type dropdown (audit Q2). Operators
          see labelled options like "Staff Professional Development" /
          "Early Release — Students Only" instead of raw `teacher_only` /
          `early_release` enum jargon. Mapping handled in
          single-day-curated-options.ts. */}
      <div className="grid grid-cols-2 gap-2.5 mb-2.5">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-[rgb(var(--text-tertiary))]">Event Type</label>
          <select
            className={inputClass}
            value={curatedKey}
            onChange={e => {
              const newKey = e.target.value as CuratedSingleDayKey
              setCuratedKey(newKey)
              // Auto-set instructional from the underlying eventType the
              // curated key resolves to.
              const newType =
                newKey === 'other'
                  ? rawOverride
                  : getCuratedMeta(newKey).eventType
              setIsInstructional(
                (INSTRUCTIONAL_TYPES as string[]).includes(newType) ||
                  getCuratedMeta(newKey).autoInstructional,
              )
            }}
          >
            {CURATED_OPTIONS_FOR_DROPDOWN.map(opt => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
            <option key="other" value="other">────────</option>
            <option key="other-real" value="other">Other (advanced)…</option>
          </select>
          <p className="text-[10px] text-[rgb(var(--text-tertiary))] leading-tight">
            {curatedKey === 'other' ? 'Pick a raw type below' : getCuratedMeta(curatedKey).description}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-[rgb(var(--text-tertiary))]">Instructional Day</label>
          <label className="flex items-center gap-2 py-1.5">
            <input
              type="checkbox"
              checked={isInstructional}
              onChange={e => setIsInstructional(e.target.checked)}
              className="w-3.5 h-3.5 rounded"
            />
            <span className="text-[11px] text-[rgb(var(--text-secondary))]">
              {isInstructional ? 'Yes — counts toward instruction hours' : 'No — non-instructional'}
            </span>
          </label>
        </div>
      </div>

      {/* "Other" escape hatch — raw eventType dropdown */}
      {curatedKey === 'other' && (
        <div className="mb-2.5">
          <label className="text-[11px] font-medium text-[rgb(var(--text-tertiary))] block mb-1">
            Raw Event Type
          </label>
          <select
            className={inputClass}
            value={rawOverride}
            onChange={e => {
              const newType = e.target.value as CalendarEventDescriptor
              setRawOverride(newType)
              setIsInstructional((INSTRUCTIONAL_TYPES as string[]).includes(newType))
            }}
          >
            {CALENDAR_EVENT_TYPES.map(t => (
              <option key={t} value={t}>{EVENT_TYPE_COLORS[t]?.label || t}</option>
            ))}
          </select>
        </div>
      )}

      {/* Optional description (operator notes — stored as the event's
          `description` field; appears in tooltips and reports). */}
      <div className="flex flex-col gap-1 mb-2.5">
        <label className="text-[11px] font-medium text-[rgb(var(--text-tertiary))]">
          Description (optional)
        </label>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="e.g., Mid-term Conference Day, Quarter 2 Inservice"
          maxLength={255}
          className={inputClass}
        />
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-3 py-1.5 text-[11px] font-medium rounded-lg border border-[rgba(255,255,255,0.08)] text-[rgb(var(--text-tertiary))] hover:bg-[rgba(255,255,255,0.04)]">
          Cancel
        </button>
        <button
          onClick={() => onSave(
            encodeCuratedOption(
              curatedKey,
              description,
              curatedKey === 'other' ? rawOverride : undefined,
            ),
            isInstructional,
          )}
          disabled={
            isSaving ||
            // No-op detection: same curated key, same instructional flag,
            // unchanged description, and (if "other") same raw override.
            (curatedKey === currentCuratedKey &&
              isInstructional === dateEntry?.isInstructionalDay &&
              description === (currentEvent?.description ?? '') &&
              (curatedKey !== 'other' || rawOverride === (currentEvent?.eventType ?? rawOverride)))
          }
          className="px-3 py-1.5 text-[11px] font-medium rounded-lg bg-[#1D9E75] text-white hover:opacity-90 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// STEP 3: CALENDAR
// ============================================================================

function CalendarStep({ schoolId, activeYear, calendarStats, localeDefaults }: {
  schoolId: string
  activeYear: any
  calendarStats: any
  localeDefaults: ReturnType<typeof useLocaleDefaults>
}) {
  const [weekendOption, setWeekendOption] = useState(
    localeDefaults.weekendDays.length === 1 ? 'sat' : 'sat-sun'
  )
  const [calSchoolDays, setCalSchoolDays] = useState<number[]>(localeDefaults.schoolDayIndices)
  const [showConfirm, setShowConfirm] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (activeYear?.startDate) return new Date(activeYear.startDate)
    return new Date()
  })
  const [showGenPanel, setShowGenPanel] = useState(false)
  const [generationWarnings, setGenerationWarnings] = useState<string[]>([])

  const generateCalendar = useGenerateCalendar(schoolId)

  const yearLabel = activeYear?.name || 'Academic Year'
  const totalDays = (calendarStats as any)?.totalDays || 0
  const instructionalDays = (calendarStats as any)?.instructionalDays || 0
  const holidays = (calendarStats as any)?.holidays || 0
  const calendarExists = totalDays > 0

  const yearId = activeYear?.yearId || activeYear?.id
  const startDate = activeYear?.startDate?.split('T')[0]
  const endDate = activeYear?.endDate?.split('T')[0]

  // Fetch locale holidays from backend for calendar generation
  const localeCode = localeDefaults.isNepal ? 'np' : ''
  const { data: localeHolidayData } = useLocaleHolidays(
    schoolId,
    localeCode,
    startDate || '',
    endDate || '',
    !!localeCode && !!startDate && !!endDate,
  )
  const localeHolidays = localeHolidayData?.holidays || []

  // Show gen panel by default when no calendar exists
  useEffect(() => {
    if (!calendarExists) setShowGenPanel(true)
  }, [calendarExists])

  // Fetch calendar dates when calendar has been generated
  const { data: calendarDatesData } = useCalendarDates(schoolId, {
    academicYearId: yearId || '',
    limit: 400,
  }, calendarExists && !!yearId)

  const calendarDates = useMemo(() => {
    if (!calendarDatesData) return []
    const items = (calendarDatesData as any)?.items || (calendarDatesData as any)?.data || []
    return Array.isArray(items) ? items : Array.isArray(calendarDatesData) ? calendarDatesData : []
  }, [calendarDatesData])

  // Build lookup map: date string -> calendar date entry
  const dateMap = useMemo(() => {
    const map = new Map<string, any>()
    calendarDates.forEach((d: any) => {
      const key = d.date?.split('T')[0]
      if (key) map.set(key, d)
    })
    return map
  }, [calendarDates])

  const updateCalendarDate = useUpdateCalendarDate(schoolId)

  const handleGenerate = () => {
    if (!yearId || !startDate || !endDate) return
    const schoolDays = calSchoolDays.map(i => {
      const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      return days[i]
    })
    generateCalendar.mutate(
      {
        yearId,
        data: {
          academicYearId: yearId,
          startDate,
          endDate,
          includeWeekends: false,
          schoolDays,
          holidays: localeHolidays.length > 0
            ? localeHolidays.map(h => ({ date: h.date, name: h.name, eventType: h.eventType as any }))
            : undefined,
        },
      },
      {
        onSuccess: (result) => {
          setShowConfirm(false)
          setShowGenPanel(false)
          setGenerationWarnings(result.warnings || [])
        },
      }
    )
  }

  const toggleCalDay = (idx: number) => {
    setCalSchoolDays(prev =>
      prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx].sort()
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-bold text-[rgb(var(--text-primary))]">School Calendar</h2>
          <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">{yearLabel} Calendar Management</p>
        </div>
        <div className="flex gap-2 items-center">
          <button className="px-3 py-1.5 text-[11px] font-medium rounded-lg border border-[rgba(255,255,255,0.09)] bg-[rgba(255,255,255,0.05)] text-[rgb(var(--text-tertiary))] hover:bg-[rgba(255,255,255,0.08)]">
            Sessions
          </button>
          {calendarExists ? (
            /*
              Sprint S2.2a — Regenerate Calendar is a DESTRUCTIVE action
              that wipes all 364 calendar dates (including operator overrides).
              It used to live here in the wizard, one click + one confirmation
              away from data loss. V1 validation (F-V1-STRUCT-001) flagged
              this as a structural smell.
              Moved behind a typed-confirmation Danger Zone on the
              Configuration tab. The wizard now shows a passive status pill
              only — no destructive action exposed.
            */
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-medium text-[#1D9E75] bg-[rgba(29,158,117,0.08)] border border-[rgba(29,158,117,0.2)] rounded-md px-2.5 py-1"
              title="To reset the calendar, use Configuration → Danger Zone"
            >
              <span aria-hidden>✓</span>
              Calendar generated{totalDays ? ` · ${totalDays} days` : ''}
            </span>
          ) : (
            <button
              onClick={() => setShowGenPanel(true)}
              disabled={!yearId || generateCalendar.isPending}
              className="bg-[#1D9E75] text-white text-[11px] font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50"
            >
              Generate Calendar
            </button>
          )}
        </div>
      </div>

      {/* Calendar Stats */}
      <div className="bg-[rgb(var(--surface-primary))] border border-[rgba(255,255,255,0.06)] rounded-xl mb-3">
        <div className="grid grid-cols-3 gap-2 p-3.5">
          <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-lg px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[rgb(var(--text-tertiary))] mb-1">Academic Year</p>
            <p className="text-[13px] font-semibold text-[rgb(var(--text-primary))]">{yearLabel}</p>
            <p className="text-[10px] text-[rgb(var(--text-tertiary))] mt-0.5">0 of {totalDays} days elapsed</p>
          </div>
          <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-lg px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[rgb(var(--text-tertiary))] mb-1">Instructional Days</p>
            <p className="text-xl font-semibold text-[#378ADD]">{instructionalDays}</p>
            <p className="text-[10px] text-[rgb(var(--text-tertiary))] mt-0.5">0 completed · {instructionalDays} remaining</p>
          </div>
          <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-lg px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[rgb(var(--text-tertiary))] mb-1">Holidays</p>
            <p className="text-xl font-semibold text-[#EF9F27]">{holidays}</p>
            <p className="text-[10px] text-[rgb(var(--text-tertiary))] mt-0.5">{holidays === 0 ? 'No holidays scheduled' : `${holidays} scheduled`}</p>
          </div>
        </div>
      </div>

      {/* Generation Warnings */}
      {generationWarnings.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {generationWarnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 bg-[rgba(217,119,6,0.06)] border border-[rgba(217,119,6,0.15)] rounded-lg p-2.5 text-[11px] text-[#D97706] leading-relaxed">
              <span className="shrink-0 mt-0.5">&#9888;</span>
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Calendar Month Grid — visible when calendar has been generated */}
      {calendarExists && calendarDates.length > 0 && (
        <CalendarMonthGrid
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          dateMap={dateMap}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          startDate={startDate}
          endDate={endDate}
          calendarSystem={localeDefaults.calendarSystem}
        />
      )}

      {/* Multi-Day Event Blocks (Sprint C4-FE) — operator-self-serve UI for
          Dashain / Tihar / Summer Vacation / exam windows / etc. Gated on
          calendarExists because the AY date range is required for the
          block date pickers' min/max + because a fresh tenant has nothing
          to attach blocks to. */}
      {calendarExists && yearId && startDate && endDate && (
        <BlocksPanel
          schoolId={schoolId}
          academicYearId={yearId}
          academicYearStartDate={startDate}
          academicYearEndDate={endDate}
          calendarSystem={localeDefaults.calendarSystem}
        />
      )}

      {/* Inline Date Edit Panel */}
      {selectedDate && dateMap.has(selectedDate) && (
        <DateEditPanel
          dateEntry={dateMap.get(selectedDate)}
          onClose={() => setSelectedDate(null)}
          /* Sprint C4-FE — onSave now receives the full encoded
             CalendarEvent (eventType + optional audience/category/
             description) from the curated dropdown. Passes through
             as-is to the calendarEvents[0] in the PATCH payload. */
          onSave={(event, isInstructional) => {
            updateCalendarDate.mutate(
              {
                date: selectedDate,
                data: {
                  calendarEvents: [
                    {
                      eventType: event.eventType,
                      isAllDay: event.isAllDay ?? true,
                      ...(event.description ? { description: event.description } : {}),
                      ...(event.audience ? { audience: event.audience } : {}),
                      ...(event.category ? { category: event.category } : {}),
                    } as any,
                  ],
                  isInstructionalDay: isInstructional,
                },
              },
              { onSuccess: () => setSelectedDate(null) }
            )
          }}
          isSaving={updateCalendarDate.isPending}
          calendarSystem={localeDefaults.calendarSystem}
        />
      )}

      {/*
        Sprint S2.2a — wizard's inline Generate Panel is now FIRST-TIME ONLY.
        When a calendar already exists, the panel won't open from the wizard
        (the Regenerate button was removed). Destructive reset moved to
        Configuration → Danger Zone with typed-confirmation.
        Defense in depth: `showGenPanel && !calendarExists` so even if state
        flips through some other path, the panel stays closed.
      */}
      {showGenPanel && !calendarExists && (
        <div className="bg-[rgba(55,138,221,0.04)] border border-[rgba(55,138,221,0.12)] rounded-xl p-3.5 mb-3">
          <h3 className="text-xs font-semibold text-[rgb(var(--text-primary))] mb-1">
            Generate Calendar
          </h3>
          <p className="text-[11px] text-[rgb(var(--text-tertiary))] mb-3 leading-relaxed">
            Auto-generate instructional and non-instructional days for this academic year based on your school's locale and schedule configuration.
          </p>

          {/* Locale chip — accurate description, no false BS claim */}
          <div className="inline-flex items-center gap-1.5 text-[10px] text-[#378ADD] bg-[rgba(55,138,221,0.08)] border border-[rgba(55,138,221,0.15)] rounded-md px-2 py-1 mb-3">
            {localeDefaults.isNepal
              ? `Detected locale: Nepal (NP) · Saturday weekend · ${localeHolidays.length} public holidays loaded`
              : 'Detected locale: International · Gregorian calendar'}
          </div>

          {/* Locale row */}
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[rgb(var(--text-tertiary))]">Country / Locale</label>
              <select className={inputClass} defaultValue={localeDefaults.isNepal ? 'NP' : 'US'}>
                <option value="NP">Nepal (NP)</option>
                <option value="US">United States (US)</option>
                <option value="IN">India (IN)</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[rgb(var(--text-tertiary))]">Weekends</label>
              <select
                className={inputClass}
                value={weekendOption}
                onChange={e => {
                  setWeekendOption(e.target.value)
                  const weekendMap: Record<string, number[]> = {
                    'sat': [6],
                    'sat-sun': [0, 6],
                    'fri-sat': [5, 6],
                    'sun': [0],
                  }
                  const weekends = weekendMap[e.target.value] || [0, 6]
                  setCalSchoolDays([0,1,2,3,4,5,6].filter(d => !weekends.includes(d)))
                }}
              >
                <option value="sat">Saturday only (Nepal default)</option>
                <option value="sat-sun">Saturday & Sunday</option>
                <option value="fri-sat">Friday & Saturday</option>
                <option value="sun">Sunday only</option>
              </select>
            </div>
          </div>

          {/* School days picker */}
          <div className="mb-3">
            <label className="text-[11px] font-medium text-[rgb(var(--text-tertiary))] mb-1.5 block">School Days</label>
            <div className="flex gap-1.5">
              {DAY_LABELS.map((day, i) => {
                const dayIndex = dayToIndex(day.key)
                const isActive = calSchoolDays.includes(dayIndex)
                return (
                  <button
                    key={`cal-${day.key}-${i}`}
                    onClick={() => toggleCalDay(dayIndex)}
                    className={`w-8 h-8 rounded-lg border text-[11px] font-semibold flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-[rgba(55,138,221,0.15)] border-[rgba(55,138,221,0.3)] text-[#378ADD]'
                        : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)] text-[rgb(var(--text-tertiary))]'
                    }`}
                  >
                    {day.short}
                  </button>
                )
              })}
            </div>
            <p className="text-[10px] text-[rgb(var(--text-tertiary))] mt-1.5">{localeDefaults.weekendHint}</p>
          </div>

          {/* Preview */}
          {activeYear && (
            <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] rounded-lg p-3 mb-3 text-[11px] text-[rgb(var(--text-tertiary))] leading-relaxed">
              <strong className="text-[rgb(var(--text-primary))]">Preview:</strong>{' '}
              Will generate dates from{' '}
              <strong className="text-[#378ADD]">{activeYear.startDate ? new Date(activeYear.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '...'}</strong>{' '}
              to{' '}
              <strong className="text-[#378ADD]">{activeYear.endDate ? new Date(activeYear.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '...'}</strong>
              <br />
              ✔ Active days → Instructional days<br />
              ✔ Weekend days → Non-instructional (weekend)<br />
              {localeHolidays.length > 0
                ? <>✔ {localeHolidays.length} national holidays from {localeDefaults.isNepal ? 'Nepal' : 'locale'} public holiday calendar will be applied<br /></>
                : <>&#9888; No locale holiday calendar available — holidays can be added manually after generation<br /></>
              }
              ⚠ Existing dates for this year will be replaced
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowGenPanel(false)}
              className="px-3 py-1.5 text-[11px] font-medium rounded-lg border border-[rgba(255,255,255,0.08)] text-[rgb(var(--text-tertiary))] hover:bg-[rgba(255,255,255,0.04)]"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={!yearId || generateCalendar.isPending}
              className="px-3 py-1.5 text-[11px] font-medium rounded-lg text-white hover:opacity-90 disabled:opacity-50 bg-[#1D9E75]"
            >
              Generate Calendar
            </button>
          </div>
        </div>
      )}

      {/*
        Confirmation dialog. Sprint S2.2a — destructive branch removed.
        Only first-time-create confirmation is reachable from the wizard.
        Regenerate (destructive) is gated behind the Danger Zone on the
        Configuration tab with typed-confirmation.
      */}
      {showConfirm && !calendarExists && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative w-full max-w-md bg-[rgb(var(--surface-primary))] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-xl p-5">
            <h3 className="text-sm font-bold text-[rgb(var(--text-primary))] mb-2">
              Generate Calendar
            </h3>
            <p className="text-xs text-[rgb(var(--text-secondary))] mb-3 leading-relaxed">
              This will generate calendar dates for <strong>{yearLabel}</strong> from{' '}
              <strong className="text-[#378ADD]">
                {startDate ? new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '...'}
              </strong>{' '}to{' '}
              <strong className="text-[#378ADD]">
                {endDate ? new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '...'}
              </strong>.
            </p>
            <div className="space-y-1.5 text-[11px] text-[rgb(var(--text-tertiary))] mb-4">
              <p>✔ Active days will be marked as instructional</p>
              <p>✔ Weekend days will be marked as non-instructional</p>
              {localeHolidays.length > 0 && (
                <p>✔ {localeHolidays.length} public holidays will be applied</p>
              )}
              <p>✔ Session instructional day counts will be updated automatically</p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3 py-1.5 text-[11px] font-medium rounded-lg border border-[rgba(255,255,255,0.08)] text-[rgb(var(--text-tertiary))] hover:bg-[rgba(255,255,255,0.04)]"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={generateCalendar.isPending}
                className="px-3 py-1.5 text-[11px] font-medium rounded-lg text-white hover:opacity-90 disabled:opacity-50 bg-[#1D9E75]"
              >
                {generateCalendar.isPending ? 'Generating...' : 'Confirm & Generate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Day type legend — Sprint S2.8 derives chips from event-types.ts.
          DAY_TYPE_LEGEND_CHIPS automatically excludes server-managed types
          (exam_window) per S2.5 so operators only see types they can pick. */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-[10px] text-[rgb(var(--text-tertiary))] mr-1">Day types:</span>
        {DAY_TYPE_LEGEND_CHIPS.map(dt => (
          <span
            key={dt.label}
            className="text-[9px] font-medium px-1.5 py-0.5 rounded"
            style={{ background: dt.color, color: dt.text, border: `1px solid ${dt.border}` }}
          >
            {dt.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// STEP 4: BELL SCHEDULE
// ============================================================================

function BellScheduleStep({ schoolId, bellSchedules, isNepal, activeYear }: {
  schoolId: string
  bellSchedules: any[]
  isNepal: boolean
  activeYear: any
}) {
  // P1 — single predicate used by auto-promote-on-apply, the "no usable
  // default" banner, AND the setup/manage page mode (below).
  const hasRealDefaultBell = bellSchedules.some(
    (b: any) => b.isDefault && getPeriodCount(b) > 1,
  )

  // Setup vs Manage mode. Until the school has a *usable* default the page is
  // in first-run setup: templates lead, the explainer is offered. Once a real
  // default exists it's a management surface — templates + explainer collapse
  // behind their buttons so the schedule list is the focus. Overrides (null =
  // follow the data-driven default) let the operator re-open either on demand.
  // Deriving from live `bellSchedules` rather than a useState captured at mount
  // also fixes the stale-initial bug where the async-loading empty list left
  // both panels expanded for schools that already had schedules.
  const isSetupMode = !hasRealDefaultBell
  const [showHowItWorksOverride, setShowHowItWorksOverride] = useState<boolean | null>(null)
  const showHowItWorks = showHowItWorksOverride ?? (bellSchedules.length === 0)
  const [showTemplatesOverride, setShowTemplatesOverride] = useState<boolean | null>(null)
  const showTemplates = showTemplatesOverride ?? isSetupMode
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newName, setNewName] = useState('')
  const createBellSchedule = useCreateBellSchedule(schoolId)
  const setDefaultBell = useSetDefaultBellSchedule(schoolId)

  // Fetch school config for default period times
  const { data: schoolConfig } = useQuery<any>({
    queryKey: ['schoolConfiguration', schoolId],
    queryFn: () => tenantService.getSchoolConfiguration(schoolId),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  })
  const defaultStartTime = schoolConfig?.startTime || '08:00'
  const defaultPeriodDuration = schoolConfig?.periodDuration || 45

  const applyTemplate = (name: string, preset: readonly any[], dayType: 'regular' | 'testing' = 'regular') => {
    createBellSchedule.mutate({
      bellScheduleName: name,
      dayType,
      effectiveDate: new Date().toISOString().split('T')[0],
      // P1 — auto-promote when there is no *real* default yet. Pre-P1 this
      // checked only `length === 0`, so applying Nepal Standard with a
      // single-period "Regular Day" placeholder already present left the
      // placeholder as the default. The backend's clear-old-when-set-new
      // semantics handle the demotion safely.
      isDefault: !hasRealDefaultBell,
      isActive: true,
      classPeriods: preset.map((p, i) => {
        const [sh, sm] = p.startTime.split(':').map(Number)
        const [eh, em] = p.endTime.split(':').map(Number)
        return {
          classPeriodName: p.name,
          periodNumber: i,
          periodType: p.periodType,
          startTime: p.startTime,
          endTime: p.endTime,
          durationMinutes: (eh * 60 + em) - (sh * 60 + sm),
          isAcademic: p.isAcademic,
        }
      }),
    })
  }

  // Templates are governance-body-relevant only: a Nepal/PABSON school sees
  // PABSON shifts, a US school sees the US shifts. Pre-this-change the US
  // templates were shown to every school (isNepal only changed their *order*),
  // which surfaced "Elementary Schedule (US)" on a Nepal PABSON pilot — noise
  // and a wrong-governance-body signal. `isNepal` is the operative V1 signal
  // (PABSON ⟺ Nepal); the registry-backed follow-up keys on archetype and
  // sources these from the backend ARCHETYPE_BELL_PRESETS so name + structure
  // match what school-create seeds.
  const templates: {
    key: string; name: string; desc: string; preset: readonly any[];
    primary: boolean; dayType?: 'regular' | 'testing';
  }[] = isNepal
    ? [
        {
          key: 'nepal',
          name: 'Nepal Standard (Sun–Fri)',
          desc: '9 periods · 10:00 AM – 3:45 PM · Includes assembly, lunch, recess',
          preset: NEPAL_PRESET,
          primary: true,
        },
        {
          key: 'nepal-exam',
          name: 'PABSON Exam Day',
          desc: '2 exam blocks · 10:00 AM – 4:00 PM · Morning & afternoon exams',
          preset: NEPAL_EXAM_PRESET,
          dayType: 'testing',
          primary: false,
        },
      ]
    : [
        {
          key: 'elementary',
          name: 'Elementary Schedule (US)',
          desc: '9 periods · 8:00 AM – 2:00 PM · Includes homeroom, recess, lunch',
          preset: ELEMENTARY_PRESET,
          primary: false,
        },
        {
          key: 'highschool',
          name: 'High School Schedule (US)',
          desc: '9 periods · 7:30 AM – 3:05 PM · Includes advisory and lunch',
          preset: HIGH_SCHOOL_PRESET,
          primary: false,
        },
      ]

  const periodTypeColors: Record<string, { bg: string; text: string }> = {
    instructional: { bg: 'rgba(55,138,221,0.1)', text: '#378ADD' },
    homeroom: { bg: 'rgba(127,119,221,0.1)', text: '#7F77DD' },
    assembly: { bg: 'rgba(239,159,39,0.08)', text: '#EF9F27' },
    lunch: { bg: 'rgba(29,158,117,0.08)', text: '#1D9E75' },
    recess: { bg: 'rgba(239,159,39,0.08)', text: '#EF9F27' },
    break: { bg: 'rgba(239,159,39,0.08)', text: '#EF9F27' },
    advisory: { bg: 'rgba(127,119,221,0.1)', text: '#7F77DD' },
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-bold text-[rgb(var(--text-primary))]">Bell Schedule</h2>
          <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">Define class periods and time slots for each type of school day.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTemplatesOverride(!showTemplates)} className="px-3 py-1.5 text-[11px] font-medium rounded-lg border border-[rgba(255,255,255,0.09)] bg-[rgba(255,255,255,0.05)] text-[rgb(var(--text-tertiary))] hover:bg-[rgba(255,255,255,0.08)]">
            Use Template
          </button>
          <button onClick={() => setShowCreateForm(true)} className="bg-[#1D9E75] text-white text-[11px] font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:opacity-90 transition-opacity">
            <Plus className="w-3.5 h-3.5" /> New Schedule
          </button>
        </div>
      </div>

      {/* How it works — collapsible */}
      <div className="bg-[rgb(var(--surface-primary))] border border-[rgba(255,255,255,0.06)] rounded-xl mb-3 overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between border-b border-[rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-2.5">
            <div className="w-[26px] h-[26px] rounded-lg bg-[rgba(239,159,39,0.1)] flex items-center justify-center text-[13px]">💡</div>
            <h3 className="text-xs font-semibold text-[rgb(var(--text-primary))]">How bell schedules work</h3>
          </div>
          <button onClick={() => setShowHowItWorksOverride(!showHowItWorks)} className="px-2.5 py-1 text-[10px] font-medium rounded-lg border border-[rgba(255,255,255,0.08)] text-[rgb(var(--text-tertiary))]">
            {showHowItWorks ? '▲ Collapse' : '▼ Expand'}
          </button>
        </div>
        {showHowItWorks && (
          <div className="p-4 grid grid-cols-3 gap-2.5">
            {[
              { step: '1️⃣', title: 'Create a schedule', desc: '"Regular Day", "Early Release"' },
              { step: '2️⃣', title: 'Add periods to it', desc: 'Class times, lunch, homeroom' },
              { step: '3️⃣', title: 'Assign to calendar', desc: 'Which days use which schedule' },
            ].map(s => (
              <div key={s.step} className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg p-3 text-center">
                <div className="text-lg mb-1.5">{s.step}</div>
                <div className="text-[11px] font-semibold text-[rgb(var(--text-primary))] mb-0.5">{s.title}</div>
                <div className="text-[10px] text-[rgb(var(--text-tertiary))]">{s.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inline Create Form */}
      {showCreateForm && (
        <div className="bg-[rgb(var(--surface-primary))] border border-[rgba(255,255,255,0.06)] rounded-xl mb-3 p-4">
          <h4 className="text-xs font-semibold text-[rgb(var(--text-primary))] mb-2.5">New Bell Schedule</h4>
          <div className="flex flex-col gap-1 mb-2.5">
            <label className="text-[11px] font-medium text-[rgb(var(--text-tertiary))]">Schedule Name <span className="text-red-500">*</span></label>
            <input className={inputClass} value={newName} onChange={e => setNewName(e.target.value)} placeholder='e.g., "Regular Day", "Early Release"' />
          </div>
          <p className="text-[10px] text-[rgb(var(--text-tertiary))] mb-2.5">
            Create an empty schedule, then add periods to it. Or use a template above to start with pre-built periods.
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowCreateForm(false); setNewName('') }} className="px-3 py-1.5 text-[11px] font-medium rounded-lg border border-[rgba(255,255,255,0.08)] text-[rgb(var(--text-tertiary))] hover:bg-[rgba(255,255,255,0.04)]">Cancel</button>
            <button
              onClick={() => {
                if (!newName.trim()) return
                createBellSchedule.mutate({
                  bellScheduleName: newName.trim(),
                  dayType: 'regular',
                  effectiveDate: activeYear?.startDate?.split('T')[0] || new Date().toISOString().split('T')[0],
                  // P1 — same auto-promote rule as applyTemplate.
                  isDefault: !hasRealDefaultBell,
                  isActive: true,
                  classPeriods: [{
                    classPeriodName: 'Period 1',
                    periodNumber: 0,
                    periodType: 'instructional',
                    startTime: defaultStartTime,
                    endTime: (() => {
                      const [h, m] = defaultStartTime.split(':').map(Number)
                      const total = h * 60 + m + defaultPeriodDuration
                      return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
                    })(),
                    durationMinutes: defaultPeriodDuration,
                    isAcademic: true,
                  }],
                }, {
                  onSuccess: () => { setShowCreateForm(false); setNewName('') },
                })
              }}
              disabled={!newName.trim() || createBellSchedule.isPending}
              className="px-3 py-1.5 text-[11px] font-medium rounded-lg bg-[#1D9E75] text-white hover:opacity-90 disabled:opacity-50"
            >
              {createBellSchedule.isPending ? 'Creating...' : 'Create Schedule'}
            </button>
          </div>
        </div>
      )}

      {/* Template Picker */}
      {showTemplates && (
      <div className="bg-[rgb(var(--surface-primary))] border border-[rgba(255,255,255,0.06)] rounded-xl mb-3 overflow-hidden">
        <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-2.5">
            <div className="w-[26px] h-[26px] rounded-lg bg-[rgba(55,138,221,0.1)] flex items-center justify-center text-[13px]">📄</div>
            <div>
              <h3 className="text-xs font-semibold text-[rgb(var(--text-primary))]">Start from Template</h3>
              <p className="text-[10px] text-[rgb(var(--text-tertiary))]">Pre-built schedules — edit after applying</p>
            </div>
          </div>
        </div>
        <div className="p-4 space-y-2">
          {templates.map(t => {
            const alreadyApplied = bellSchedules.some((s: any) => s.bellScheduleName === t.name)
            return (
            <div key={t.key} className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${
              alreadyApplied
                ? 'bg-[rgba(29,158,117,0.04)] border-[rgba(29,158,117,0.15)]'
                : t.primary
                  ? 'bg-[rgba(55,138,221,0.04)] border-[rgba(55,138,221,0.1)]'
                  : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)]'
            }`}>
              <div>
                <div className="text-xs font-semibold text-[rgb(var(--text-primary))]">{t.name}</div>
                <div className="text-[10px] text-[rgb(var(--text-tertiary))] mt-0.5">{t.desc}</div>
              </div>
              {alreadyApplied ? (
                <span className="px-3 py-1.5 text-[11px] font-medium text-[#1D9E75]">✓ Applied</span>
              ) : (
              <button
                onClick={() => applyTemplate(t.name, t.preset, t.dayType ?? 'regular')}
                disabled={createBellSchedule.isPending}
                className={`px-3 py-1.5 text-[11px] font-medium rounded-lg transition-all ${
                  t.primary
                    ? 'bg-[#1D9E75] text-white hover:opacity-90'
                    : 'border border-[rgba(255,255,255,0.08)] text-[rgb(var(--text-tertiary))] hover:bg-[rgba(255,255,255,0.04)]'
                } disabled:opacity-50`}
              >
                Apply
              </button>
              )}
            </div>
            )
          })}
        </div>
      </div>
      )}

      {/* Bell Schedule list or empty state */}
      {bellSchedules.length > 0 ? (
        <div className="space-y-2">
          {!hasRealDefaultBell && (
            <div
              data-testid="bell-schedule-no-default-banner"
              className="bg-[rgba(239,159,39,0.06)] border border-[rgba(239,159,39,0.35)] text-[#EF9F27] rounded-lg px-3 py-2.5 flex items-start gap-2 text-[11px] leading-relaxed"
            >
              <span aria-hidden className="text-sm leading-none mt-px">⚠</span>
              <div className="flex-1">
                <span className="font-semibold">No usable default bell schedule.</span>{' '}
                Activation will be refused until a real (multi-period) schedule is marked as the school's default.
                Use <span className="font-semibold">Set as default</span> on a schedule below.
              </div>
            </div>
          )}
          {bellSchedules.map((sched: any) => {
            // C.5 — flag a default bell-schedule that's a single-period
            // placeholder (e.g. "Regular Day"). The backend C.4 predicate
            // rejects such rows from satisfying the bell_schedule activation
            // gate, so giving the operator a visible cue here lets them fix
            // it before they hit the activation refusal. Predicate mirrors
            // backend exactly: isDefault && periodCount <= 1.
            const isPlaceholderDefault = sched.isDefault && getPeriodCount(sched) <= 1
            return (
            <div key={sched.bellScheduleId || sched.id} className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-lg overflow-hidden">
              <div className="px-3 py-2.5 flex items-center justify-between border-b border-[rgba(255,255,255,0.04)]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[rgb(var(--text-primary))]">{sched.bellScheduleName || sched.name}</span>
                  {sched.isDefault && (
                    <span className="text-[9px] font-medium px-1.5 py-px rounded bg-[rgba(29,158,117,0.08)] text-[#1D9E75] border border-[rgba(29,158,117,0.2)]">Default</span>
                  )}
                  {isPlaceholderDefault && (
                    <span
                      data-testid="bell-schedule-placeholder-chip"
                      title="This default schedule has only one period. Set a real schedule before activating the academic year."
                      className="text-[9px] font-medium px-1.5 py-px rounded bg-[rgba(239,159,39,0.12)] text-[#EF9F27] border border-[rgba(239,159,39,0.35)]"
                    >
                      Placeholder — set a real schedule before activating AY
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* P1 — "Set as default" only appears on rows that aren't already
                      the default AND have a real schedule shape (multi-period).
                      Without the periodCount guard, the operator could promote a
                      placeholder, which the backend C.4 gate would still refuse. */}
                  {!sched.isDefault && getPeriodCount(sched) > 1 && (
                    <button
                      data-testid="bell-schedule-set-default-button"
                      type="button"
                      onClick={() => {
                        const id = sched.bellScheduleId || sched.id
                        if (id) setDefaultBell.mutate(id)
                      }}
                      disabled={setDefaultBell.isPending}
                      className="text-[10px] font-medium px-2 py-0.5 rounded bg-[rgba(29,158,117,0.08)] text-[#1D9E75] border border-[rgba(29,158,117,0.25)] hover:bg-[rgba(29,158,117,0.14)] disabled:opacity-50 transition-colors"
                    >
                      Set as default
                    </button>
                  )}
                  <span className="text-[10px] text-[rgb(var(--text-tertiary))]">{sched.dayType || 'Regular'}</span>
                </div>
              </div>
              {(sched.classPeriods || sched.periods)?.length > 0 && (
                <div className="py-1.5">
                  {(sched.classPeriods || sched.periods).map((period: any, idx: number) => {
                    const colors = periodTypeColors[period.periodType] || periodTypeColors.instructional
                    return (
                      <div key={idx} className="flex items-center gap-2.5 px-3 py-1.5">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: colors.text }} />
                        <span className="text-[11px] text-[rgb(var(--text-secondary))] min-w-[80px]">{period.classPeriodName || period.name}</span>
                        <span className="text-[11px] text-[rgb(var(--text-tertiary))] tabular-nums">{period.startTime} – {period.endTime}</span>
                        <span
                          className="text-[9px] font-medium px-1.5 py-px rounded ml-auto"
                          style={{ background: colors.bg, color: colors.text }}
                        >
                          {period.periodType}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-[rgb(var(--surface-primary))] border border-[rgba(255,255,255,0.06)] rounded-xl">
          <div className="p-10 text-center">
            <div className="text-3xl opacity-40 mb-3">🕐</div>
            <h3 className="text-[13px] font-semibold text-[rgb(var(--text-secondary))] mb-1.5">No bell schedules yet</h3>
            <p className="text-[11px] text-[rgb(var(--text-tertiary))] max-w-[280px] mx-auto leading-relaxed mb-4">
              Apply a template above or create your first schedule to define how each type of school day is structured.
            </p>
            <button className="bg-[#1D9E75] text-white text-[11px] font-medium px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity">
              + Create First Schedule
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
