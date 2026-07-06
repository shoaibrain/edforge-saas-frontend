/**
 * School Bell Schedule Page (Task 3.9)
 *
 * Manage class periods / bell schedule for a school.
 * Visual timeline + CRUD form.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Star,
  CalendarDays,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@edforge/i18n'
import { Button, Drawer, DrawerFooter, Dropdown } from '@edforge/ui'
import type { DropdownOption } from '@edforge/ui'
import {
  useClassPeriods,
  useCreateClassPeriod,
  useUpdateClassPeriod,
  useDeleteClassPeriod,
} from '@/hooks/useClassPeriods'
import {
  useBellSchedules,
  useCreateBellSchedule,
  useUpdateBellSchedule,
  useDeleteBellSchedule,
  useSetDefaultBellSchedule,
} from '@/hooks/useBellSchedules'
import {
  SettingsAlert,
  SettingsEmptyState,
  staggerChildren,
  fadeInUp,
} from '@/components/settings/SettingsShared'
import type {
  ClassPeriodResponseDto,
  CreateClassPeriodDto,
  UpdateClassPeriodDto,
  BellScheduleResponseDto,
  CreateBellScheduleDto,
  UpdateBellScheduleDto,
  ClassPeriodDto,
} from '@aibrains/shared-types'

// ============================================================================
// CONSTANTS
// ============================================================================

const PERIOD_TYPE_OPTIONS = [
  { value: 'instructional', label: 'Instructional' },
  { value: 'homeroom', label: 'Homeroom' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'recess', label: 'Recess' },
  { value: 'passing', label: 'Passing' },
  { value: 'advisory', label: 'Advisory' },
  { value: 'assembly', label: 'Assembly' },
  { value: 'study_hall', label: 'Study Hall' },
  { value: 'extracurricular', label: 'Extracurricular' },
]

const PERIOD_TYPE_COLORS: Record<string, string> = {
  instructional: 'bg-[rgb(var(--action-primary-bg))]',
  homeroom: 'bg-[rgb(var(--state-info-fg))]',
  lunch: 'bg-amber-500',
  recess: 'bg-[rgb(var(--state-success-bg)/0.18)]0',
  passing: 'bg-[rgb(var(--text-tertiary))]',
  advisory: 'bg-[rgb(var(--state-info-bg)/0.18)]0',
  assembly: 'bg-[rgb(var(--state-info-fg))]',
  study_hall: 'bg-[rgb(var(--state-info-bg)/0.18)]0',
  extracurricular: 'bg-[rgb(var(--state-danger-fg))]',
}

const PERIOD_TYPE_DROPDOWN_OPTIONS: DropdownOption[] = [
  { id: 'instructional', label: 'Instructional', description: 'Regular class period' },
  { id: 'homeroom', label: 'Homeroom', description: 'Morning check-in' },
  { id: 'lunch', label: 'Lunch', description: 'Lunch break' },
  { id: 'recess', label: 'Recess', description: 'Outdoor break' },
  { id: 'passing', label: 'Passing', description: 'Between classes' },
  { id: 'advisory', label: 'Advisory', description: 'Student advisory' },
  { id: 'assembly', label: 'Assembly', description: 'School assembly' },
  { id: 'study_hall', label: 'Study Hall', description: 'Supervised study' },
  { id: 'extracurricular', label: 'Extracurricular', description: 'After-school activity' },
]

const DAY_TYPE_OPTIONS: DropdownOption[] = [
  { id: 'regular', label: 'Regular', description: 'Standard school day' },
  { id: 'early_release', label: 'Early Release', description: 'Shortened afternoon' },
  { id: 'late_start', label: 'Late Start', description: 'Delayed morning start' },
  { id: 'assembly', label: 'Assembly', description: 'Assembly schedule' },
  { id: 'testing', label: 'Testing', description: 'Testing day schedule' },
  { id: 'half_day', label: 'Half Day', description: 'Half day schedule' },
  { id: 'special', label: 'Special', description: 'Special schedule' },
]

const DAY_TYPE_COLORS: Record<string, string> = {
  regular: 'bg-[rgb(var(--action-primary-bg))]/10 text-[rgb(var(--action-secondary-fg))]',
  early_release: 'bg-amber-500/10 text-amber-600',
  late_start: 'bg-[rgb(var(--state-info-bg)/0.18)]0/10 text-[rgb(var(--state-info-fg))]',
  assembly: 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))]',
  testing: 'bg-[rgb(var(--state-danger-bg)/0.18)]0/10 text-[rgb(var(--state-danger-fg))]',
  half_day: 'bg-[rgb(var(--state-warning-bg)/0.18)]0/10 text-[rgb(var(--state-warning-fg))]',
  special: 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))]',
}

// Common bell schedule presets
const PRESETS = {
  elementary: [
    { name: 'Homeroom', startTime: '08:00', endTime: '08:15', periodType: 'homeroom', sortOrder: 0, isAcademic: false },
    { name: 'Period 1', startTime: '08:15', endTime: '09:00', periodType: 'instructional', sortOrder: 1, isAcademic: true },
    { name: 'Period 2', startTime: '09:05', endTime: '09:50', periodType: 'instructional', sortOrder: 2, isAcademic: true },
    { name: 'Recess', startTime: '09:50', endTime: '10:10', periodType: 'recess', sortOrder: 3, isAcademic: false },
    { name: 'Period 3', startTime: '10:10', endTime: '10:55', periodType: 'instructional', sortOrder: 4, isAcademic: true },
    { name: 'Lunch', startTime: '10:55', endTime: '11:35', periodType: 'lunch', sortOrder: 5, isAcademic: false },
    { name: 'Period 4', startTime: '11:35', endTime: '12:20', periodType: 'instructional', sortOrder: 6, isAcademic: true },
    { name: 'Period 5', startTime: '12:25', endTime: '13:10', periodType: 'instructional', sortOrder: 7, isAcademic: true },
    { name: 'Period 6', startTime: '13:15', endTime: '14:00', periodType: 'instructional', sortOrder: 8, isAcademic: true },
  ],
  highSchool: [
    { name: 'Period 1', startTime: '07:30', endTime: '08:20', periodType: 'instructional', sortOrder: 0, isAcademic: true },
    { name: 'Period 2', startTime: '08:25', endTime: '09:15', periodType: 'instructional', sortOrder: 1, isAcademic: true },
    { name: 'Period 3', startTime: '09:20', endTime: '10:10', periodType: 'instructional', sortOrder: 2, isAcademic: true },
    { name: 'Advisory', startTime: '10:15', endTime: '10:45', periodType: 'advisory', sortOrder: 3, isAcademic: false },
    { name: 'Period 4', startTime: '10:50', endTime: '11:40', periodType: 'instructional', sortOrder: 4, isAcademic: true },
    { name: 'Lunch', startTime: '11:40', endTime: '12:20', periodType: 'lunch', sortOrder: 5, isAcademic: false },
    { name: 'Period 5', startTime: '12:25', endTime: '13:15', periodType: 'instructional', sortOrder: 6, isAcademic: true },
    { name: 'Period 6', startTime: '13:20', endTime: '14:10', periodType: 'instructional', sortOrder: 7, isAcademic: true },
    { name: 'Period 7', startTime: '14:15', endTime: '15:05', periodType: 'instructional', sortOrder: 8, isAcademic: true },
  ],
} as const

// ============================================================================
// HELPERS
// ============================================================================

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`
}

function minutesSinceMidnight(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function addMinutesToTime(time: string, minutes: number): string {
  const total = minutesSinceMidnight(time) + minutes
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

function formatDuration(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function computeScheduleStats(periods: DisplayPeriod[]) {
  if (!periods.length) return null
  const sorted = [...periods].sort((a, b) => a.sortOrder - b.sortOrder)
  const dayStart = formatTime(sorted[0].startTime)
  const dayEnd = formatTime(sorted[sorted.length - 1].endTime)
  const instructionalMin = periods
    .filter(p => p.isAcademic)
    .reduce((sum, p) => sum + (p.durationMinutes || 0), 0)
  const nonInstructionalMin = periods
    .filter(p => !p.isAcademic)
    .reduce((sum, p) => sum + (p.durationMinutes || 0), 0)

  return {
    totalPeriods: periods.length,
    daySpan: `${dayStart} – ${dayEnd}`,
    instructionalTime: formatDuration(instructionalMin),
    nonInstructionalTime: formatDuration(nonInstructionalMin),
  }
}

// ============================================================================
// DISPLAY PERIOD ABSTRACTION
// ============================================================================

interface DisplayPeriod {
  id: string
  index: number
  classPeriodName: string
  startTime: string
  endTime: string
  sortOrder: number
  periodType: string
  isAcademic: boolean
  durationMinutes: number
  description?: string
  source: 'schedule' | 'standalone'
}

function embeddedToDisplay(p: ClassPeriodDto, index: number): DisplayPeriod {
  return {
    id: `embedded-${index}`,
    index,
    classPeriodName: p.classPeriodName,
    startTime: p.startTime,
    endTime: p.endTime,
    sortOrder: p.periodNumber,
    periodType: p.periodType || 'instructional',
    isAcademic: p.isAcademic ?? true,
    durationMinutes: p.durationMinutes,
    description: p.description,
    source: 'schedule',
  }
}

function standaloneToDisplay(p: ClassPeriodResponseDto, index: number): DisplayPeriod {
  return {
    id: p.periodId,
    index,
    classPeriodName: p.classPeriodName,
    startTime: p.startTime,
    endTime: p.endTime,
    sortOrder: p.sortOrder,
    periodType: p.periodType,
    isAcademic: p.isAcademic,
    durationMinutes: p.durationMinutes,
    description: p.description,
    source: 'standalone',
  }
}

function displayPeriodToForm(p: DisplayPeriod): PeriodFormState {
  return {
    classPeriodName: p.classPeriodName,
    startTime: p.startTime,
    endTime: p.endTime,
    sortOrder: p.sortOrder,
    periodType: p.periodType,
    isAcademic: p.isAcademic,
    description: p.description || '',
  }
}

function formToEmbeddedPeriod(f: PeriodFormState): ClassPeriodDto {
  return {
    classPeriodName: f.classPeriodName,
    periodNumber: f.sortOrder,
    periodType: f.periodType as any,
    startTime: f.startTime,
    endTime: f.endTime,
    durationMinutes: minutesSinceMidnight(f.endTime) - minutesSinceMidnight(f.startTime),
    isAcademic: f.isAcademic,
    description: f.description || undefined,
  }
}

// ============================================================================
// TIMELINE VISUALIZATION
// ============================================================================

interface TimelineProps {
  periods: DisplayPeriod[]
  onEdit: (period: DisplayPeriod) => void
}

function BellTimeline({ periods, onEdit }: TimelineProps) {
  if (!periods.length) return null

  const sorted = [...periods].sort((a, b) => a.sortOrder - b.sortOrder)
  const dayStart = minutesSinceMidnight(sorted[0].startTime) - 20
  const dayEnd = minutesSinceMidnight(sorted[sorted.length - 1].endTime) + 20
  const totalMinutes = dayEnd - dayStart

  // Hourly tick marks
  const firstHour = Math.ceil(dayStart / 60) * 60
  const hourTicks: number[] = []
  for (let m = firstHour; m < dayEnd; m += 60) {
    hourTicks.push(m)
  }

  return (
    <div className="space-y-0">
      {/* Period blocks — floating above the axis */}
      <div className="relative h-14 mx-1">
        {sorted.map((period) => {
          const start = minutesSinceMidnight(period.startTime) - dayStart
          const end = minutesSinceMidnight(period.endTime) - dayStart
          const left = (start / totalMinutes) * 100
          const width = ((end - start) / totalMinutes) * 100
          const color = PERIOD_TYPE_COLORS[period.periodType] || 'bg-[rgb(var(--text-tertiary))]'

          return (
            <button
              key={period.id}
              onClick={() => onEdit(period)}
              title={`${period.classPeriodName}: ${formatTime(period.startTime)} – ${formatTime(period.endTime)}`}
              className={`absolute top-0 bottom-0 ${color} rounded-lg shadow-sm hover:shadow-md hover:brightness-110 transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden`}
              style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
            >
              <span className="text-[rgb(var(--action-primary-fg))] text-xs font-semibold truncate px-1.5 leading-tight drop-shadow-sm">
                {period.classPeriodName}
              </span>
              <span className="text-[rgb(var(--action-primary-fg))]/80 text-xs truncate px-1 leading-tight">
                {formatTime(period.startTime)}–{formatTime(period.endTime)}
              </span>
            </button>
          )
        })}
      </div>

      {/* Time axis */}
      <div className="relative h-5 mx-1">
        <div className="absolute top-0 left-0 right-0 h-px bg-[rgb(var(--border-primary))] opacity-60" />
        {hourTicks.map((tickMin) => {
          const left = ((tickMin - dayStart) / totalMinutes) * 100
          const hour = Math.floor(tickMin / 60)
          const ampm = hour >= 12 ? 'PM' : 'AM'
          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
          return (
            <div
              key={tickMin}
              className="absolute top-0"
              style={{ left: `${left}%` }}
            >
              <div className="w-px h-1.5 bg-[rgb(var(--text-tertiary))] opacity-40" />
              <span className="absolute top-2 text-xs text-[rgb(var(--text-tertiary))] -translate-x-1/2 whitespace-nowrap tabular-nums">
                {displayHour}{ampm}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// PERIOD FORM
// ============================================================================

interface PeriodFormState {
  classPeriodName: string
  startTime: string
  endTime: string
  sortOrder: number
  periodType: string
  isAcademic: boolean
  description: string
}

const EMPTY_FORM: PeriodFormState = {
  classPeriodName: '',
  startTime: '08:00',
  endTime: '08:50',
  sortOrder: 0,
  periodType: 'instructional',
  isAcademic: true,
  description: '',
}

// ============================================================================
// SCHEDULE FORM
// ============================================================================

interface ScheduleFormState {
  bellScheduleName: string
  dayType: string
  alternateDayName: string
  effectiveDate: string
  endDate: string
  isDefault: boolean
  description: string
}

const EMPTY_SCHEDULE_FORM: ScheduleFormState = {
  bellScheduleName: '',
  dayType: 'regular',
  alternateDayName: '',
  effectiveDate: new Date().toISOString().split('T')[0],
  endDate: '',
  isDefault: false,
  description: '',
}

function scheduleToForm(s: BellScheduleResponseDto): ScheduleFormState {
  return {
    bellScheduleName: s.bellScheduleName,
    dayType: s.dayType,
    alternateDayName: s.alternateDayName || '',
    effectiveDate: s.effectiveDate,
    endDate: s.endDate || '',
    isDefault: s.isDefault,
    description: s.description || '',
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface SchoolBellSchedulePageProps {
  schoolId: string
}

export default function SchoolBellSchedulePage({ schoolId }: SchoolBellSchedulePageProps) {
  const { t } = useTranslation('settings')
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<DisplayPeriod | null>(null)
  const [form, setForm] = useState<PeriodFormState>(EMPTY_FORM)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showPresets, setShowPresets] = useState(false)
  const [isApplyingPreset, setIsApplyingPreset] = useState(false)

  // Schedule-level state
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null)
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<BellScheduleResponseDto | null>(null)
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormState>(EMPTY_SCHEDULE_FORM)
  const [showScheduleDeleteConfirm, setShowScheduleDeleteConfirm] = useState<string | null>(null)

  // Data
  const { data: periodsData, isLoading } = useClassPeriods(schoolId)
  const { data: schedulesData, isLoading: schedulesLoading } = useBellSchedules(schoolId)
  const createMutation = useCreateClassPeriod(schoolId)
  const updateMutation = useUpdateClassPeriod(schoolId)
  const deleteMutation = useDeleteClassPeriod(schoolId)
  const createScheduleMutation = useCreateBellSchedule(schoolId)
  const updateScheduleMutation = useUpdateBellSchedule(schoolId)
  const deleteScheduleMutation = useDeleteBellSchedule(schoolId)
  const setDefaultMutation = useSetDefaultBellSchedule(schoolId)

  const standalonePeriods = periodsData?.items || []
  const bellSchedules = schedulesData?.items || []
  const selectedSchedule = bellSchedules.find(s => s.bellScheduleId === selectedScheduleId) || null
  const periodTypeDropdownOptions = PERIOD_TYPE_DROPDOWN_OPTIONS.map((option) => ({
    ...option,
    label: t(`schoolBellSchedule.periodTypes.${option.id}.label`, { defaultValue: option.label }),
    description: t(`schoolBellSchedule.periodTypes.${option.id}.description`, { defaultValue: option.description }),
  }))
  const dayTypeOptions = DAY_TYPE_OPTIONS.map((option) => ({
    ...option,
    label: t(`schoolBellSchedule.dayTypes.${option.id}.label`, { defaultValue: option.label }),
    description: t(`schoolBellSchedule.dayTypes.${option.id}.description`, { defaultValue: option.description }),
  }))
  const getPeriodTypeLabel = (type: string) =>
    t(`schoolBellSchedule.periodTypes.${type}.label`, {
      defaultValue: PERIOD_TYPE_OPTIONS.find((option) => option.value === type)?.label || type,
    })
  const getDayTypeLabel = (type: string) =>
    t(`schoolBellSchedule.dayTypes.${type}.label`, {
      defaultValue: DAY_TYPE_OPTIONS.find((option) => option.id === type)?.label || type,
    })

  // Unified display periods: from selected schedule or standalone
  const displayPeriods: DisplayPeriod[] = selectedSchedule
    ? selectedSchedule.classPeriods.map((p, i) => embeddedToDisplay(p, i))
    : standalonePeriods.map((p, i) => standaloneToDisplay(p, i))
  const sortedPeriods = [...displayPeriods].sort((a, b) => a.sortOrder - b.sortOrder)

  // Auto-select default schedule on initial load
  useEffect(() => {
    if (bellSchedules.length > 0 && !selectedScheduleId) {
      const defaultSchedule = bellSchedules.find(s => s.isDefault)
      setSelectedScheduleId(defaultSchedule?.bellScheduleId || bellSchedules[0].bellScheduleId)
    }
  }, [bellSchedules, selectedScheduleId])

  // ── Handlers ──
  const openCreate = () => {
    const lastPeriod = sortedPeriods.length > 0 ? sortedPeriods[sortedPeriods.length - 1] : null
    const startTime = lastPeriod?.endTime || '08:00'
    const endTime = addMinutesToTime(startTime, 50)

    setEditingPeriod(null)
    setForm({
      ...EMPTY_FORM,
      startTime,
      endTime,
      sortOrder: displayPeriods.length,
    })
    setShowForm(true)
  }

  const openEdit = (period: DisplayPeriod) => {
    setEditingPeriod(period)
    setForm(displayPeriodToForm(period))
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingPeriod(null)
    setForm(EMPTY_FORM)
  }

  const handleSave = () => {
    // Validate
    if (!form.classPeriodName.trim()) {
      toast.error(t('schoolBellSchedule.validation.periodNameRequired'))
      return
    }
    if (form.startTime >= form.endTime) {
      toast.error(t('schoolBellSchedule.validation.endAfterStart'))
      return
    }

    // Schedule-based period management
    if (selectedSchedule) {
      const newPeriod = formToEmbeddedPeriod(form)
      let updatedPeriods: ClassPeriodDto[]

      if (editingPeriod) {
        // Replace the period at the editing index
        updatedPeriods = selectedSchedule.classPeriods.map((p, i) =>
          i === editingPeriod.index ? newPeriod : p
        )
      } else {
        // Append new period
        updatedPeriods = [...selectedSchedule.classPeriods, newPeriod]
      }

      updateScheduleMutation.mutate(
        {
          bellScheduleId: selectedSchedule.bellScheduleId,
          data: { classPeriods: updatedPeriods },
        },
        { onSuccess: closeForm }
      )
      return
    }

    // Standalone ClassPeriod fallback
    if (editingPeriod) {
      const updates: UpdateClassPeriodDto = {}
      if (form.classPeriodName !== editingPeriod.classPeriodName) updates.classPeriodName = form.classPeriodName
      if (form.startTime !== editingPeriod.startTime) updates.startTime = form.startTime
      if (form.endTime !== editingPeriod.endTime) updates.endTime = form.endTime
      if (form.sortOrder !== editingPeriod.sortOrder) updates.sortOrder = form.sortOrder
      if (form.periodType !== editingPeriod.periodType) updates.periodType = form.periodType as any
      if (form.isAcademic !== editingPeriod.isAcademic) updates.isAcademic = form.isAcademic
      if (form.description !== (editingPeriod.description || '')) updates.description = form.description || undefined

      updateMutation.mutate(
        { periodId: editingPeriod.id, data: updates },
        { onSuccess: closeForm }
      )
    } else {
      const createData: CreateClassPeriodDto = {
        classPeriodName: form.classPeriodName,
        startTime: form.startTime,
        endTime: form.endTime,
        sortOrder: form.sortOrder,
        periodType: form.periodType as any,
        isAcademic: form.isAcademic,
        description: form.description || undefined,
      }
      createMutation.mutate(createData, { onSuccess: closeForm })
    }
  }

  const handleDelete = (displayPeriodId: string) => {
    if (selectedSchedule) {
      // Find the index from the display ID
      const period = displayPeriods.find(p => p.id === displayPeriodId)
      if (!period) return
      const updatedPeriods = selectedSchedule.classPeriods.filter((_, i) => i !== period.index)
      updateScheduleMutation.mutate(
        {
          bellScheduleId: selectedSchedule.bellScheduleId,
          data: { classPeriods: updatedPeriods },
        },
        { onSuccess: () => setShowDeleteConfirm(null) }
      )
    } else {
      // Standalone ClassPeriod delete
      deleteMutation.mutate(displayPeriodId, {
        onSuccess: () => setShowDeleteConfirm(null),
      })
    }
  }

  const applyPreset = async (presetKey: 'elementary' | 'highSchool') => {
    const preset = PRESETS[presetKey]
    const name = presetKey === 'elementary' ? 'Elementary Schedule' : 'High School Schedule'
    setIsApplyingPreset(true)
    try {
      const classPeriods: ClassPeriodDto[] = preset.map((p, i) => ({
        classPeriodName: p.name,
        periodNumber: i,
        periodType: p.periodType as any,
        startTime: p.startTime,
        endTime: p.endTime,
        durationMinutes: minutesSinceMidnight(p.endTime) - minutesSinceMidnight(p.startTime),
        isAcademic: p.isAcademic,
      }))
      createScheduleMutation.mutate(
        {
          bellScheduleName: name,
          dayType: 'regular',
          effectiveDate: new Date().toISOString().split('T')[0],
          isDefault: bellSchedules.length === 0,
          isActive: true,
          classPeriods,
        },
        {
          onSuccess: (data) => {
            if (data?.bellScheduleId) {
              setSelectedScheduleId(data.bellScheduleId)
            }
            setShowPresets(false)
          },
        }
      )
    } catch {
      toast.error(t('schoolBellSchedule.toasts.templateFailed'))
    } finally {
      setIsApplyingPreset(false)
    }
  }

  const migrateStandalonePeriods = () => {
    if (standalonePeriods.length === 0) return
    const classPeriods: ClassPeriodDto[] = standalonePeriods
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((p, i) => ({
        classPeriodName: p.classPeriodName,
        periodNumber: i,
        periodType: p.periodType as any,
        startTime: p.startTime,
        endTime: p.endTime,
        durationMinutes: p.durationMinutes,
        isAcademic: p.isAcademic,
        description: p.description,
      }))
    createScheduleMutation.mutate(
      {
        bellScheduleName: 'Regular Day',
        dayType: 'regular',
        effectiveDate: new Date().toISOString().split('T')[0],
        isDefault: true,
        isActive: true,
        classPeriods,
      },
      {
        onSuccess: (data) => {
          if (data?.bellScheduleId) {
            setSelectedScheduleId(data.bellScheduleId)
          }
          toast.success(t('schoolBellSchedule.toasts.createdFromExisting'))
        },
      }
    )
  }

  // ── Schedule Handlers ──
  const openScheduleCreate = () => {
    setEditingSchedule(null)
    setScheduleForm(EMPTY_SCHEDULE_FORM)
    setShowScheduleForm(true)
  }

  const openScheduleEdit = (schedule: BellScheduleResponseDto) => {
    setEditingSchedule(schedule)
    setScheduleForm(scheduleToForm(schedule))
    setShowScheduleForm(true)
  }

  const closeScheduleForm = () => {
    setShowScheduleForm(false)
    setEditingSchedule(null)
    setScheduleForm(EMPTY_SCHEDULE_FORM)
  }

  const handleScheduleSave = () => {
    if (!scheduleForm.bellScheduleName.trim()) {
      toast.error(t('schoolBellSchedule.validation.scheduleNameRequired'))
      return
    }
    if (!scheduleForm.effectiveDate) {
      toast.error(t('schoolBellSchedule.validation.effectiveDateRequired'))
      return
    }

    if (editingSchedule) {
      const updates: UpdateBellScheduleDto = {}
      if (scheduleForm.bellScheduleName !== editingSchedule.bellScheduleName) updates.bellScheduleName = scheduleForm.bellScheduleName
      if (scheduleForm.dayType !== editingSchedule.dayType) updates.dayType = scheduleForm.dayType as any
      if (scheduleForm.alternateDayName !== (editingSchedule.alternateDayName || '')) updates.alternateDayName = scheduleForm.alternateDayName || undefined
      if (scheduleForm.effectiveDate !== editingSchedule.effectiveDate) updates.effectiveDate = scheduleForm.effectiveDate
      if (scheduleForm.endDate !== (editingSchedule.endDate || '')) updates.endDate = scheduleForm.endDate || undefined
      if (scheduleForm.isDefault !== editingSchedule.isDefault) updates.isDefault = scheduleForm.isDefault
      if (scheduleForm.description !== (editingSchedule.description || '')) updates.description = scheduleForm.description || undefined

      updateScheduleMutation.mutate(
        { bellScheduleId: editingSchedule.bellScheduleId, data: updates },
        { onSuccess: closeScheduleForm }
      )
    } else {
      const createData: CreateBellScheduleDto = {
        bellScheduleName: scheduleForm.bellScheduleName,
        dayType: scheduleForm.dayType as any,
        classPeriods: [],
        effectiveDate: scheduleForm.effectiveDate,
        isDefault: scheduleForm.isDefault,
        isActive: true,
        alternateDayName: scheduleForm.alternateDayName || undefined,
        endDate: scheduleForm.endDate || undefined,
        description: scheduleForm.description || undefined,
      }
      createScheduleMutation.mutate(createData, {
        onSuccess: (data) => {
          closeScheduleForm()
          if (data?.bellScheduleId) {
            setSelectedScheduleId(data.bellScheduleId)
          }
        },
      })
    }
  }

  const handleScheduleDelete = (bellScheduleId: string) => {
    deleteScheduleMutation.mutate(bellScheduleId, {
      onSuccess: () => {
        setShowScheduleDeleteConfirm(null)
        if (selectedScheduleId === bellScheduleId) {
          const remaining = bellSchedules.filter(s => s.bellScheduleId !== bellScheduleId)
          setSelectedScheduleId(remaining.length > 0 ? remaining[0].bellScheduleId : null)
        }
      },
    })
  }

  const handleSetDefault = (bellScheduleId: string) => {
    setDefaultMutation.mutate(bellScheduleId)
  }

  // ── Loading state ──
  if (isLoading || schedulesLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-[rgb(var(--background-secondary))] rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[rgb(var(--state-info-fg))]/10 to-violet-500/10 border border-[rgb(var(--state-info-border)/0.35)]">
            <Clock className="w-5 h-5 text-[rgb(var(--state-info-fg))]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">{t('schoolBellSchedule.title')}</h2>
            <p className="text-sm text-[rgb(var(--text-tertiary))]">
              {t('schoolBellSchedule.description')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {bellSchedules.length === 0 && standalonePeriods.length === 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowPresets(true)}>
              {t('schoolBellSchedule.actions.startFromTemplate')}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={openScheduleCreate}>
            <Plus className="w-4 h-4 me-1.5" />
            {t('schoolBellSchedule.actions.newSchedule')}
          </Button>
          {(selectedSchedule || standalonePeriods.length > 0) && (
            <Button variant="outline" size="sm" onClick={openCreate}>
              <Plus className="w-4 h-4 me-1.5" />
              {t('schoolBellSchedule.actions.addPeriod')}
            </Button>
          )}
        </div>
      </div>

      {/* How It Works — collapsible guide */}
      <div className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))]/50 overflow-hidden">
        <button
          onClick={() => setShowHowItWorks(v => !v)}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-start hover:bg-[rgb(var(--background-secondary))] transition-colors"
        >
          <Info className="w-4 h-4 text-[rgb(var(--action-secondary-fg))] flex-shrink-0" />
          <span className="text-sm font-medium text-[rgb(var(--text-secondary))] flex-1">{t('schoolBellSchedule.howItWorks.title')}</span>
          {showHowItWorks
            ? <ChevronUp className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
            : <ChevronDown className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          }
        </button>
        <AnimatePresence>
          {showHowItWorks && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3">
                {/* Visual hierarchy */}
                <div className="p-3 rounded-lg bg-[rgb(var(--background-primary))] border border-[rgb(var(--border-primary))] text-xs font-mono text-[rgb(var(--text-tertiary))] leading-relaxed">
                  <div className="flex items-center gap-1.5 mb-2">
                    <CalendarDays className="w-3.5 h-3.5 text-[rgb(var(--action-secondary-fg))] flex-shrink-0" />
                    <span className="text-xs font-sans font-medium text-[rgb(var(--text-primary))]">{t('schoolBellSchedule.examples.regularDay')}</span>
                    <span className="text-xs font-sans px-1.5 py-0.5 rounded bg-[rgb(var(--action-primary-bg))]/10 text-[rgb(var(--action-secondary-fg))]">{t('schoolBellSchedule.howItWorks.scheduleEqualsDay')}</span>
                  </div>
                  <div className="ps-4 border-s-2 border-[rgb(var(--border-focus)/0.35)] ms-1.5 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[rgb(var(--state-info-fg))] flex-shrink-0" />
                      <span>Homeroom &nbsp;&nbsp;8:00 – 8:15</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[rgb(var(--action-primary-bg))] flex-shrink-0" />
                      <span>Period 1 &nbsp;&nbsp;&nbsp;8:15 – 9:00</span>
                      <span className="text-xs font-sans px-1 rounded bg-[rgb(var(--action-primary-bg))]/10 text-[rgb(var(--action-secondary-fg))]">{t('schoolBellSchedule.badges.academic')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[rgb(var(--action-primary-bg))] flex-shrink-0" />
                      <span>Period 2 &nbsp;&nbsp;&nbsp;9:05 – 9:50</span>
                      <span className="text-xs font-sans px-1 rounded bg-[rgb(var(--action-primary-bg))]/10 text-[rgb(var(--action-secondary-fg))]">{t('schoolBellSchedule.badges.academic')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                      <span>Lunch &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;11:30 – 12:00</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[rgb(var(--action-primary-bg))] flex-shrink-0" />
                      <span>Period 5 &nbsp;&nbsp;&nbsp;1:00 – 1:50</span>
                      <span className="text-xs font-sans px-1 rounded bg-[rgb(var(--action-primary-bg))]/10 text-[rgb(var(--action-secondary-fg))]">{t('schoolBellSchedule.badges.academic')}</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-[rgb(var(--border-primary))] text-[rgb(var(--text-tertiary))] font-sans text-xs">
                    <span className="w-2 h-2 rounded-full bg-[rgb(var(--action-primary-bg))] inline-block me-1" /> {t('schoolBellSchedule.howItWorks.periodsInsideSchedule')}
                  </div>
                </div>

                {/* Step-by-step */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { step: '1', label: t('schoolBellSchedule.howItWorks.steps.create.label'), sub: t('schoolBellSchedule.howItWorks.steps.create.sub') },
                    { step: '2', label: t('schoolBellSchedule.howItWorks.steps.periods.label'), sub: t('schoolBellSchedule.howItWorks.steps.periods.sub') },
                    { step: '3', label: t('schoolBellSchedule.howItWorks.steps.calendar.label'), sub: t('schoolBellSchedule.howItWorks.steps.calendar.sub') },
                  ].map(s => (
                    <div key={s.step} className="p-2 rounded-lg bg-[rgb(var(--background-primary))] border border-[rgb(var(--border-primary))]">
                      <div className="w-5 h-5 rounded-full bg-[rgb(var(--action-primary-bg))]/10 text-[rgb(var(--action-secondary-fg))] text-xs font-bold flex items-center justify-center mx-auto mb-1">{s.step}</div>
                      <div className="text-xs font-medium text-[rgb(var(--text-secondary))]">{s.label}</div>
                      <div className="text-xs text-[rgb(var(--text-tertiary))]">{s.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Schedule Selector */}
      {bellSchedules.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {bellSchedules.map(schedule => (
            <button
              key={schedule.bellScheduleId}
              onClick={() => setSelectedScheduleId(schedule.bellScheduleId)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                selectedScheduleId === schedule.bellScheduleId
                  ? 'bg-[rgb(var(--action-primary-bg))]/10 text-[rgb(var(--action-secondary-fg))] border border-[rgb(var(--border-focus)/0.35)]'
                  : 'bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-secondary))] border border-transparent hover:border-[rgb(var(--border-primary))]'
              }`}
            >
              {schedule.bellScheduleName}
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${DAY_TYPE_COLORS[schedule.dayType] || 'bg-[rgb(var(--background-tertiary))]0/10 text-[rgb(var(--text-secondary))]'}`}>
                {getDayTypeLabel(schedule.dayType)}
              </span>
              {schedule.isDefault && (
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              )}
            </button>
          ))}
          <button
            onClick={openScheduleCreate}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--background-secondary))] transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('schoolBellSchedule.actions.newSchedule')}
          </button>
        </div>
      )}

      {/* Selected Schedule — unified info + timeline card */}
      {selectedSchedule && (
        <div className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] overflow-hidden">
          {/* Header */}
          <div className="px-5 pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base font-semibold text-[rgb(var(--text-primary))]">
                  {selectedSchedule.bellScheduleName}
                </h3>
                {selectedSchedule.alternateDayName && (
                  <span className="text-xs text-[rgb(var(--text-tertiary))]">({selectedSchedule.alternateDayName})</span>
                )}
                {selectedSchedule.isDefault && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    {t('schoolBellSchedule.badges.default')}
                  </span>
                )}
                {!selectedSchedule.isActive && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[rgb(var(--state-danger-bg)/0.18)]0/10 text-[rgb(var(--state-danger-fg))] border border-[rgb(var(--state-danger-border)/0.35)]">
                    {t('schoolBellSchedule.badges.inactive')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-0.5">
                {!selectedSchedule.isDefault && (
                  <button
                    onClick={() => handleSetDefault(selectedSchedule.bellScheduleId)}
                    title={t('schoolBellSchedule.actions.setAsDefault')}
                    className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-500/10 text-[rgb(var(--text-tertiary))] hover:text-amber-600 transition-colors"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => openScheduleEdit(selectedSchedule)}
                  className="p-1.5 rounded-lg hover:bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowScheduleDeleteConfirm(selectedSchedule.bellScheduleId)}
                  className="p-1.5 rounded-lg hover:bg-[rgb(var(--state-danger-bg)/0.18)] dark:hover:bg-[rgb(var(--state-danger-bg)/0.18)]0/10 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--state-danger-fg))] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Inline stats */}
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-[rgb(var(--text-tertiary))]">
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3 h-3" />
                {t('schoolBellSchedule.summary.effective', { date: selectedSchedule.effectiveDate })}{selectedSchedule.endDate ? ` - ${selectedSchedule.endDate}` : ''}
              </span>
              <span className="w-px h-3 bg-[rgb(var(--border-primary))]" />
              <span>{t('schoolBellSchedule.summary.periodCount', { count: selectedSchedule.periodCount })}</span>
              {displayPeriods.length > 0 && (() => {
                const stats = computeScheduleStats(displayPeriods)
                if (!stats) return null
                return (
                  <>
                    <span className="w-px h-3 bg-[rgb(var(--border-primary))]" />
                    <span>{stats.daySpan}</span>
                    <span className="w-px h-3 bg-[rgb(var(--border-primary))]" />
                    <span className="text-[rgb(var(--action-secondary-fg))] font-medium">{t('schoolBellSchedule.summary.instructionalTime', { duration: stats.instructionalTime })}</span>
                    {stats.nonInstructionalTime !== '0m' && (
                      <>
                        <span className="w-px h-3 bg-[rgb(var(--border-primary))]" />
                        <span>{t('schoolBellSchedule.summary.otherTime', { duration: stats.nonInstructionalTime })}</span>
                      </>
                    )}
                  </>
                )
              })()}
            </div>
          </div>

          {/* Embedded timeline */}
          {displayPeriods.length > 0 && (
            <div className="px-5 pb-4 pt-1">
              <BellTimeline periods={sortedPeriods} onEdit={openEdit} />
              {/* Inline legend */}
              <div className="flex flex-wrap items-center gap-3 mt-1 px-1">
                {PERIOD_TYPE_OPTIONS.filter(t =>
                  displayPeriods.some(p => p.periodType === t.value)
                ).map(t => (
                  <span key={t.value} className="flex items-center gap-1 text-xs">
                    <span className={`w-1.5 h-1.5 rounded-full ${PERIOD_TYPE_COLORS[t.value] || 'bg-[rgb(var(--text-tertiary))]'}`} />
                    <span className="text-[rgb(var(--text-tertiary))]">{getPeriodTypeLabel(t.value)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Migration Banner — standalone periods exist but no bell schedules */}
      {bellSchedules.length === 0 && standalonePeriods.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-[rgb(var(--text-primary))]">
                {t('schoolBellSchedule.migration.title', { count: standalonePeriods.length })}
              </div>
              <div className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
                {t('schoolBellSchedule.migration.description')}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={migrateStandalonePeriods}
              disabled={createScheduleMutation.isPending}
              isLoading={createScheduleMutation.isPending}
            >
              {t('schoolBellSchedule.actions.createFromExisting')}
            </Button>
          </div>
        </div>
      )}

      {/* Period List */}
      {displayPeriods.length === 0 ? (
        <SettingsEmptyState
          icon={Clock}
          title={selectedSchedule ? t('schoolBellSchedule.empty.noPeriodsTitle') : t('schoolBellSchedule.empty.getStartedTitle')}
          description={selectedSchedule
            ? t('schoolBellSchedule.empty.noPeriodsDescription', { schedule: selectedSchedule.bellScheduleName })
            : bellSchedules.length === 0
              ? t('schoolBellSchedule.empty.getStartedDescription')
              : t('schoolBellSchedule.empty.selectScheduleDescription')
          }
          action={
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-2">
                {!selectedSchedule && bellSchedules.length === 0 && (
                  <Button variant="outline" size="sm" onClick={() => setShowPresets(true)}>
                    {t('schoolBellSchedule.actions.startFromTemplate')}
                  </Button>
                )}
                {selectedSchedule ? (
                  <Button variant="outline" size="sm" onClick={openCreate}>
                    <Plus className="w-4 h-4 me-1.5" />
                    {t('schoolBellSchedule.actions.addFirstPeriod')}
                  </Button>
                ) : bellSchedules.length === 0 ? (
                  <Button variant="outline" size="sm" onClick={openScheduleCreate}>
                    <Plus className="w-4 h-4 me-1.5" />
                    {t('schoolBellSchedule.actions.createFirstSchedule')}
                  </Button>
                ) : null}
              </div>
              {selectedSchedule && (
                <p className="text-xs text-[rgb(var(--text-tertiary))]">
                  {t('schoolBellSchedule.empty.tip')}
                </p>
              )}
            </div>
          }
        />
      ) : (
        <motion.div
          variants={staggerChildren}
          initial="initial"
          animate="animate"
          className="rounded-xl border border-[rgb(var(--border-primary))] overflow-hidden"
        >
          {sortedPeriods.map((period, index) => {
            const prevPeriod = index > 0 ? sortedPeriods[index - 1] : null
            const gapMinutes = prevPeriod
              ? minutesSinceMidnight(period.startTime) - minutesSinceMidnight(prevPeriod.endTime)
              : 0
            const isLast = index === sortedPeriods.length - 1

            return (
              <motion.div key={period.id} variants={fadeInUp}>
                {/* Gap indicator */}
                {gapMinutes > 0 && (
                  <div className="flex items-center gap-2 px-5 py-1 bg-amber-500/5">
                    <div className="flex-1 border-t border-dashed border-amber-300/40" />
                    <span className="text-xs font-medium text-amber-500 whitespace-nowrap">
                      {t('schoolBellSchedule.list.gap', { minutes: gapMinutes })}
                    </span>
                    <div className="flex-1 border-t border-dashed border-amber-300/40" />
                  </div>
                )}

                <div
                  className={`group flex items-center gap-4 px-5 py-3.5 hover:bg-[rgb(var(--background-secondary))]/50 transition-colors ${
                    !isLast ? 'border-b border-[rgb(var(--border-secondary))]' : ''
                  }`}
                >
                  {/* Color accent bar */}
                  <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${PERIOD_TYPE_COLORS[period.periodType] || 'bg-[rgb(var(--text-tertiary))]'}`} />

                  {/* Time column */}
                  <div className="w-24 flex-shrink-0">
                    <div className="text-sm font-medium text-[rgb(var(--text-primary))] tabular-nums">
                      {formatTime(period.startTime)}
                    </div>
                    <div className="text-xs text-[rgb(var(--text-tertiary))] tabular-nums">
                      {formatTime(period.endTime)}
                    </div>
                  </div>

                  {/* Name + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-[rgb(var(--text-primary))]">
                        {period.classPeriodName}
                      </span>
                      {period.isAcademic && (
                        <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-[rgb(var(--action-primary-bg))]/10 text-[rgb(var(--action-secondary-fg))]">
                          {t('schoolBellSchedule.badges.academic')}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
                      {t('schoolBellSchedule.list.duration', { minutes: period.durationMinutes })}
                      <span className="mx-1">·</span>
                      {getPeriodTypeLabel(period.periodType)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(period)}
                      className="p-1.5 rounded-lg hover:bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(period.id)}
                      className="p-1.5 rounded-lg hover:bg-[rgb(var(--state-danger-bg)/0.18)] dark:hover:bg-[rgb(var(--state-danger-bg)/0.18)]0/10 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--state-danger-fg))] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Create / Edit Drawer */}
      <Drawer
        open={showForm}
        onClose={closeForm}
        title={editingPeriod ? t('schoolBellSchedule.periodForm.editTitle') : t('schoolBellSchedule.periodForm.addTitle')}
        description={
          selectedSchedule
            ? t(editingPeriod ? 'schoolBellSchedule.periodForm.editInSchedule' : 'schoolBellSchedule.periodForm.addInSchedule', { schedule: selectedSchedule.bellScheduleName })
            : t(editingPeriod ? 'schoolBellSchedule.periodForm.editStandalone' : 'schoolBellSchedule.periodForm.addStandalone')
        }
        size="sm"
      >
        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">
              {t('schoolBellSchedule.periodForm.periodName')} <span className="text-[rgb(var(--state-danger-fg))]">*</span>
            </label>
            <input
              type="text"
              value={form.classPeriodName}
              onChange={(e) => setForm(f => ({ ...f, classPeriodName: e.target.value }))}
              placeholder={t('schoolBellSchedule.periodForm.periodNamePlaceholder')}
              className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))]"
            />
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">
                {t('schoolBellSchedule.periodForm.startTime')} <span className="text-[rgb(var(--state-danger-fg))]">*</span>
              </label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm(f => ({ ...f, startTime: e.target.value }))}
                className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">
                {t('schoolBellSchedule.periodForm.endTime')} <span className="text-[rgb(var(--state-danger-fg))]">*</span>
              </label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm(f => ({ ...f, endTime: e.target.value }))}
                className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))]"
              />
            </div>
          </div>

          {/* Duration preview */}
          {form.startTime && form.endTime && form.startTime < form.endTime && (
            <div className="text-xs text-[rgb(var(--text-tertiary))] bg-[rgb(var(--background-secondary))] rounded-lg px-3 py-2">
              {t('schoolBellSchedule.periodForm.durationPreview', { minutes: minutesSinceMidnight(form.endTime) - minutesSinceMidnight(form.startTime) })}
            </div>
          )}

          {/* Period Type */}
          <div>
            <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">{t('schoolBellSchedule.periodForm.periodType')}</label>
            <Dropdown
              options={periodTypeDropdownOptions}
              value={form.periodType}
              onChange={(type) => {
                setForm(f => ({
                  ...f,
                  periodType: type,
                  isAcademic: type === 'instructional',
                }))
              }}
              placeholder={t('schoolBellSchedule.periodForm.periodTypePlaceholder')}
              buttonClassName="rounded-xl py-2.5"
            />
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">{t('schoolBellSchedule.periodForm.sortOrder')}</label>
            <input
              type="number"
              min={0}
              max={20}
              value={form.sortOrder}
              onChange={(e) => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
              className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))]"
            />
          </div>

          {/* Is Academic */}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.isAcademic}
              onChange={(e) => setForm(f => ({ ...f, isAcademic: e.target.checked }))}
              className="rounded border-[rgb(var(--border-primary))]"
            />
            <span className="text-[rgb(var(--text-secondary))]">{t('schoolBellSchedule.periodForm.academic')}</span>
          </label>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">{t('schoolBellSchedule.periodForm.description')}</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder={t('schoolBellSchedule.periodForm.descriptionPlaceholder')}
              className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))]"
            />
          </div>

          {/* Concept footer */}
          <div className="rounded-lg bg-[rgb(var(--background-secondary))]/50 px-3 py-2.5 space-y-1">
            <p className="text-xs uppercase tracking-wider font-medium text-[rgb(var(--text-tertiary))]">{t('schoolBellSchedule.periodForm.whatIsPeriodTitle')}</p>
            <p className="text-xs text-[rgb(var(--text-tertiary))] leading-relaxed">
              {t('schoolBellSchedule.periodForm.whatIsPeriodPrefix')}{' '}
              <strong className="text-[rgb(var(--text-secondary))]">{t('schoolBellSchedule.periodForm.singleTimeSlot')}</strong>{' '}
              {t('schoolBellSchedule.periodForm.whatIsPeriodSuffix')}
            </p>
          </div>

          <DrawerFooter>
            <Button variant="outline" size="sm" onClick={closeForm}>{t('common.cancel')}</Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending || updateScheduleMutation.isPending}
              isLoading={createMutation.isPending || updateMutation.isPending || updateScheduleMutation.isPending}
            >
              {editingPeriod ? t('common.update') : t('common.create')}
            </Button>
          </DrawerFooter>
        </div>
      </Drawer>

      {/* Preset Modal */}
      <AnimatePresence>
        {showPresets && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-[rgb(var(--background-overlay)/0.50)] backdrop-blur-sm" onClick={() => setShowPresets(false)} />
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative w-full max-w-md bg-[rgb(var(--background-primary))] rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-[rgb(var(--border-primary))]">
                <h3 className="font-semibold text-[rgb(var(--text-primary))]">{t('schoolBellSchedule.templates.title')}</h3>
                <button onClick={() => setShowPresets(false)} className="p-1.5 rounded-lg hover:bg-[rgb(var(--background-secondary))]">
                  <X className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                </button>
              </div>
              <div className="p-6 space-y-3">
                {bellSchedules.length > 0 && (
                  <SettingsAlert type="warning" message={t('schoolBellSchedule.templates.existingWarning')} />
                )}
                <button
                  onClick={() => applyPreset('elementary')}
                  disabled={isApplyingPreset || createScheduleMutation.isPending}
                  className="w-full text-start p-4 rounded-xl border border-[rgb(var(--border-primary))] hover:border-[rgb(var(--border-focus)/0.35)] hover:bg-[rgb(var(--action-primary-bg))]/5 transition-colors disabled:opacity-50"
                >
                  <div className="font-medium text-sm text-[rgb(var(--text-primary))]">{t('schoolBellSchedule.templates.elementary.title')}</div>
                  <div className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
                    {t('schoolBellSchedule.templates.elementary.description')}
                  </div>
                </button>
                <button
                  onClick={() => applyPreset('highSchool')}
                  disabled={isApplyingPreset || createScheduleMutation.isPending}
                  className="w-full text-start p-4 rounded-xl border border-[rgb(var(--border-primary))] hover:border-[rgb(var(--border-focus)/0.35)] hover:bg-[rgb(var(--action-primary-bg))]/5 transition-colors disabled:opacity-50"
                >
                  <div className="font-medium text-sm text-[rgb(var(--text-primary))]">{t('schoolBellSchedule.templates.highSchool.title')}</div>
                  <div className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
                    {t('schoolBellSchedule.templates.highSchool.description')}
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-[rgb(var(--background-overlay)/0.50)] backdrop-blur-sm" onClick={() => setShowDeleteConfirm(null)} />
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative w-full max-w-sm bg-[rgb(var(--background-primary))] rounded-2xl shadow-xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-[rgb(var(--state-danger-bg)/0.18)]0/10">
                  <AlertCircle className="w-5 h-5 text-[rgb(var(--state-danger-fg))]" />
                </div>
                <h3 className="font-semibold text-[rgb(var(--text-primary))]">{t('schoolBellSchedule.deletePeriod.title')}</h3>
              </div>
              <p className="text-sm text-[rgb(var(--text-secondary))]">
                {selectedSchedule
                  ? t('schoolBellSchedule.deletePeriod.scheduleDescription')
                  : t('schoolBellSchedule.deletePeriod.standaloneDescription')
                }
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(null)}>{t('common.cancel')}</Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(showDeleteConfirm)}
                  disabled={deleteMutation.isPending || updateScheduleMutation.isPending}
                  isLoading={deleteMutation.isPending || updateScheduleMutation.isPending}
                >
                  {t('common.delete')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Create / Edit Drawer */}
      <Drawer
        open={showScheduleForm}
        onClose={closeScheduleForm}
        title={editingSchedule ? t('schoolBellSchedule.scheduleForm.editTitle') : t('schoolBellSchedule.scheduleForm.newTitle')}
        description={editingSchedule
          ? t('schoolBellSchedule.scheduleForm.editDescription')
          : t('schoolBellSchedule.scheduleForm.newDescription')
        }
        size="sm"
      >
        <div className="space-y-5">
          {/* Schedule Name */}
          <div>
            <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">
              {t('schoolBellSchedule.scheduleForm.scheduleName')} <span className="text-[rgb(var(--state-danger-fg))]">*</span>
            </label>
            <input
              type="text"
              value={scheduleForm.bellScheduleName}
              onChange={(e) => setScheduleForm(f => ({ ...f, bellScheduleName: e.target.value }))}
              placeholder={t('schoolBellSchedule.scheduleForm.scheduleNamePlaceholder')}
              className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))]"
            />
          </div>

          {/* Day Type */}
          <div>
            <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">{t('schoolBellSchedule.scheduleForm.dayType')}</label>
            <Dropdown
              options={dayTypeOptions}
              value={scheduleForm.dayType}
              onChange={(type) => setScheduleForm(f => ({ ...f, dayType: type }))}
              placeholder={t('schoolBellSchedule.scheduleForm.dayTypePlaceholder')}
              buttonClassName="rounded-xl py-2.5"
            />
          </div>

          {/* Alternate Day Name */}
          <div>
            <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">
              {t('schoolBellSchedule.scheduleForm.alternateDayName')}
            </label>
            <input
              type="text"
              value={scheduleForm.alternateDayName}
              onChange={(e) => setScheduleForm(f => ({ ...f, alternateDayName: e.target.value }))}
              placeholder={t('schoolBellSchedule.scheduleForm.alternateDayNamePlaceholder')}
              className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))]"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">
                {t('schoolBellSchedule.scheduleForm.effectiveDate')} <span className="text-[rgb(var(--state-danger-fg))]">*</span>
              </label>
              <input
                type="date"
                value={scheduleForm.effectiveDate}
                onChange={(e) => setScheduleForm(f => ({ ...f, effectiveDate: e.target.value }))}
                className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">
                {t('schoolBellSchedule.scheduleForm.endDate')}
              </label>
              <input
                type="date"
                value={scheduleForm.endDate}
                onChange={(e) => setScheduleForm(f => ({ ...f, endDate: e.target.value }))}
                className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))]"
              />
            </div>
          </div>

          {/* Is Default */}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={scheduleForm.isDefault}
              onChange={(e) => setScheduleForm(f => ({ ...f, isDefault: e.target.checked }))}
              className="rounded border-[rgb(var(--border-primary))]"
            />
            <span className="text-[rgb(var(--text-secondary))]">{t('schoolBellSchedule.scheduleForm.setAsDefault')}</span>
          </label>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">{t('schoolBellSchedule.scheduleForm.description')}</label>
            <input
              type="text"
              value={scheduleForm.description}
              onChange={(e) => setScheduleForm(f => ({ ...f, description: e.target.value }))}
              placeholder={t('schoolBellSchedule.scheduleForm.descriptionPlaceholder')}
              className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))]"
            />
          </div>

          {/* Concept footer */}
          <div className="rounded-lg bg-[rgb(var(--background-secondary))]/50 px-3 py-2.5 space-y-1.5">
            <p className="text-xs uppercase tracking-wider font-medium text-[rgb(var(--text-tertiary))]">{t('schoolBellSchedule.scheduleForm.whatIsScheduleTitle')}</p>
            <p className="text-xs text-[rgb(var(--text-tertiary))] leading-relaxed">
              {t('schoolBellSchedule.scheduleForm.whatIsSchedulePrefix')}{' '}
              <strong className="text-[rgb(var(--text-secondary))]">{t('schoolBellSchedule.scheduleForm.dailyTimetable')}</strong>{' '}
              {t('schoolBellSchedule.scheduleForm.whatIsScheduleSuffix')}
            </p>
            <div className="text-xs text-[rgb(var(--text-tertiary))] font-mono leading-relaxed ps-1">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="w-3 h-3 text-[rgb(var(--action-secondary-fg))] flex-shrink-0" />
                <span className="text-[rgb(var(--text-secondary))]">{t('schoolBellSchedule.examples.regularDay')}</span>
                <span className="text-[rgb(var(--text-tertiary))]">{t('schoolBellSchedule.scheduleForm.exampleScheduleHint')}</span>
              </div>
              <div className="ps-4 border-s border-[rgb(var(--border-primary))] ms-1.5 mt-1 space-y-0.5">
                <div>├ Period 1 &nbsp;8:00 – 8:50</div>
                <div>├ Period 2 &nbsp;8:55 – 9:45</div>
                <div>├ Lunch &nbsp;&nbsp;&nbsp;&nbsp;11:30 – 12:00</div>
                <div>└ Period 5 &nbsp;1:00 – 1:50 &nbsp;← these are periods</div>
              </div>
            </div>
          </div>

          <DrawerFooter>
            <Button variant="ghost" size="sm" onClick={closeScheduleForm}>{t('common.cancel')}</Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleScheduleSave}
              disabled={createScheduleMutation.isPending || updateScheduleMutation.isPending}
              isLoading={createScheduleMutation.isPending || updateScheduleMutation.isPending}
            >
              {editingSchedule ? t('common.update') : t('common.create')}
            </Button>
          </DrawerFooter>
        </div>
      </Drawer>

      {/* Schedule Delete Confirmation */}
      <AnimatePresence>
        {showScheduleDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-[rgb(var(--background-overlay)/0.50)] backdrop-blur-sm" onClick={() => setShowScheduleDeleteConfirm(null)} />
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative w-full max-w-sm bg-[rgb(var(--background-primary))] rounded-2xl shadow-xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-[rgb(var(--state-danger-bg)/0.18)]0/10">
                  <AlertCircle className="w-5 h-5 text-[rgb(var(--state-danger-fg))]" />
                </div>
                <h3 className="font-semibold text-[rgb(var(--text-primary))]">{t('schoolBellSchedule.deleteSchedule.title')}</h3>
              </div>
              <p className="text-sm text-[rgb(var(--text-secondary))]">
                {t('schoolBellSchedule.deleteSchedule.description')}
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowScheduleDeleteConfirm(null)}>{t('common.cancel')}</Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleScheduleDelete(showScheduleDeleteConfirm)}
                  disabled={deleteScheduleMutation.isPending}
                  isLoading={deleteScheduleMutation.isPending}
                >
                  {t('common.delete')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
