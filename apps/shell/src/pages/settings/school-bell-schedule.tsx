/**
 * School Bell Schedule Page (Task 3.9)
 *
 * Manage class periods / bell schedule for a school.
 * Visual timeline + CRUD form.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  Plus,
  Pencil,
  Trash2,
  X,
  GripVertical,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button, Drawer, DrawerFooter } from '@edforge/ui'
import {
  useClassPeriods,
  useCreateClassPeriod,
  useUpdateClassPeriod,
  useDeleteClassPeriod,
} from '@/hooks/useClassPeriods'
import {
  SettingsSection,
  SettingsAlert,
  SettingsEmptyState,
  staggerChildren,
  fadeInUp,
} from '@/components/settings/SettingsShared'
import type {
  ClassPeriodResponseDto,
  CreateClassPeriodDto,
  UpdateClassPeriodDto,
} from '@aibrains/shared-types'

// ============================================================================
// CONSTANTS
// ============================================================================

const PERIOD_TYPE_OPTIONS = [
  { value: 'regular', label: 'Regular' },
  { value: 'homeroom', label: 'Homeroom' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'recess', label: 'Recess' },
  { value: 'passing', label: 'Passing' },
  { value: 'advisory', label: 'Advisory' },
  { value: 'assembly', label: 'Assembly' },
  { value: 'other', label: 'Other' },
]

const PERIOD_TYPE_COLORS: Record<string, string> = {
  regular: 'bg-teal-500',
  homeroom: 'bg-indigo-500',
  lunch: 'bg-amber-500',
  recess: 'bg-green-500',
  passing: 'bg-slate-400',
  advisory: 'bg-purple-500',
  assembly: 'bg-cyan-500',
  other: 'bg-gray-400',
}

// Common bell schedule presets
const PRESETS = {
  elementary: [
    { name: 'Homeroom', startTime: '08:00', endTime: '08:15', periodType: 'homeroom', sortOrder: 0, isAcademic: false },
    { name: 'Period 1', startTime: '08:15', endTime: '09:00', periodType: 'regular', sortOrder: 1, isAcademic: true },
    { name: 'Period 2', startTime: '09:05', endTime: '09:50', periodType: 'regular', sortOrder: 2, isAcademic: true },
    { name: 'Recess', startTime: '09:50', endTime: '10:10', periodType: 'recess', sortOrder: 3, isAcademic: false },
    { name: 'Period 3', startTime: '10:10', endTime: '10:55', periodType: 'regular', sortOrder: 4, isAcademic: true },
    { name: 'Lunch', startTime: '10:55', endTime: '11:35', periodType: 'lunch', sortOrder: 5, isAcademic: false },
    { name: 'Period 4', startTime: '11:35', endTime: '12:20', periodType: 'regular', sortOrder: 6, isAcademic: true },
    { name: 'Period 5', startTime: '12:25', endTime: '13:10', periodType: 'regular', sortOrder: 7, isAcademic: true },
    { name: 'Period 6', startTime: '13:15', endTime: '14:00', periodType: 'regular', sortOrder: 8, isAcademic: true },
  ],
  highSchool: [
    { name: 'Period 1', startTime: '07:30', endTime: '08:20', periodType: 'regular', sortOrder: 0, isAcademic: true },
    { name: 'Period 2', startTime: '08:25', endTime: '09:15', periodType: 'regular', sortOrder: 1, isAcademic: true },
    { name: 'Period 3', startTime: '09:20', endTime: '10:10', periodType: 'regular', sortOrder: 2, isAcademic: true },
    { name: 'Advisory', startTime: '10:15', endTime: '10:45', periodType: 'advisory', sortOrder: 3, isAcademic: false },
    { name: 'Period 4', startTime: '10:50', endTime: '11:40', periodType: 'regular', sortOrder: 4, isAcademic: true },
    { name: 'Lunch', startTime: '11:40', endTime: '12:20', periodType: 'lunch', sortOrder: 5, isAcademic: false },
    { name: 'Period 5', startTime: '12:25', endTime: '13:15', periodType: 'regular', sortOrder: 6, isAcademic: true },
    { name: 'Period 6', startTime: '13:20', endTime: '14:10', periodType: 'regular', sortOrder: 7, isAcademic: true },
    { name: 'Period 7', startTime: '14:15', endTime: '15:05', periodType: 'regular', sortOrder: 8, isAcademic: true },
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

// ============================================================================
// TIMELINE VISUALIZATION
// ============================================================================

interface TimelineProps {
  periods: ClassPeriodResponseDto[]
  onEdit: (period: ClassPeriodResponseDto) => void
}

function BellTimeline({ periods, onEdit }: TimelineProps) {
  if (!periods.length) return null

  const sorted = [...periods].sort((a, b) => a.sortOrder - b.sortOrder)
  const dayStart = minutesSinceMidnight(sorted[0].startTime) - 15
  const dayEnd = minutesSinceMidnight(sorted[sorted.length - 1].endTime) + 15
  const totalMinutes = dayEnd - dayStart

  return (
    <div className="relative">
      {/* Time axis labels */}
      <div className="flex justify-between text-xs text-[rgb(var(--text-tertiary))] mb-2 px-1">
        <span>{formatTime(sorted[0].startTime)}</span>
        <span>{formatTime(sorted[sorted.length - 1].endTime)}</span>
      </div>

      {/* Timeline bar */}
      <div className="relative h-16 bg-[rgb(var(--surface-secondary))] rounded-xl border border-[rgb(var(--border-primary))] overflow-hidden">
        {sorted.map((period) => {
          const start = minutesSinceMidnight(period.startTime) - dayStart
          const end = minutesSinceMidnight(period.endTime) - dayStart
          const left = (start / totalMinutes) * 100
          const width = ((end - start) / totalMinutes) * 100
          const color = PERIOD_TYPE_COLORS[period.periodType] || 'bg-gray-400'

          return (
            <button
              key={period.periodId}
              onClick={() => onEdit(period)}
              title={`${period.classPeriodName}: ${formatTime(period.startTime)} - ${formatTime(period.endTime)}`}
              className={`absolute top-1 bottom-1 ${color} rounded-lg opacity-80 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center overflow-hidden`}
              style={{ left: `${left}%`, width: `${width}%` }}
            >
              <span className="text-white text-[10px] font-medium truncate px-1">
                {period.classPeriodName}
              </span>
            </button>
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
  periodType: 'regular',
  isAcademic: true,
  description: '',
}

function periodToForm(p: ClassPeriodResponseDto): PeriodFormState {
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface SchoolBellSchedulePageProps {
  schoolId: string
}

export default function SchoolBellSchedulePage({ schoolId }: SchoolBellSchedulePageProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<ClassPeriodResponseDto | null>(null)
  const [form, setForm] = useState<PeriodFormState>(EMPTY_FORM)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showPresets, setShowPresets] = useState(false)

  // Data
  const { data: periodsData, isLoading } = useClassPeriods(schoolId)
  const createMutation = useCreateClassPeriod(schoolId)
  const updateMutation = useUpdateClassPeriod(schoolId)
  const deleteMutation = useDeleteClassPeriod(schoolId)

  const periods = periodsData?.items || []
  const sortedPeriods = [...periods].sort((a, b) => a.sortOrder - b.sortOrder)

  // ── Handlers ──
  const openCreate = () => {
    setEditingPeriod(null)
    setForm({
      ...EMPTY_FORM,
      sortOrder: periods.length,
    })
    setShowForm(true)
  }

  const openEdit = (period: ClassPeriodResponseDto) => {
    setEditingPeriod(period)
    setForm(periodToForm(period))
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
      toast.error('Period name is required')
      return
    }
    if (form.startTime >= form.endTime) {
      toast.error('End time must be after start time')
      return
    }

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
        { periodId: editingPeriod.periodId, data: updates },
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

  const handleDelete = (periodId: string) => {
    deleteMutation.mutate(periodId, {
      onSuccess: () => setShowDeleteConfirm(null),
    })
  }

  const applyPreset = (preset: typeof PRESETS[keyof typeof PRESETS]) => {
    // Create all periods from preset sequentially
    let created = 0
    preset.forEach((p) => {
      createMutation.mutate(
        {
          classPeriodName: p.name,
          startTime: p.startTime,
          endTime: p.endTime,
          sortOrder: p.sortOrder,
          periodType: p.periodType as any,
          isAcademic: p.isAcademic,
        },
        {
          onSuccess: () => {
            created++
            if (created === preset.length) {
              toast.success(`Applied ${preset.length} periods from preset`)
              setShowPresets(false)
            }
          },
        }
      )
    })
  }

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-[rgb(var(--surface-secondary))] rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20">
            <Clock className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Bell Schedule</h2>
            <p className="text-sm text-[rgb(var(--text-tertiary))]">
              {periods.length} period{periods.length !== 1 ? 's' : ''} configured
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {periods.length === 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowPresets(true)}>
              Load Preset
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Period
          </Button>
        </div>
      </div>

      {/* Visual Timeline */}
      {periods.length > 0 && (
        <SettingsSection title="Daily Timeline" icon={Clock} description="Click a block to edit">
          <BellTimeline periods={sortedPeriods} onEdit={openEdit} />
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3">
            {PERIOD_TYPE_OPTIONS.filter(t =>
              periods.some(p => p.periodType === t.value)
            ).map(t => (
              <span key={t.value} className="flex items-center gap-1.5 text-xs">
                <span className={`w-2.5 h-2.5 rounded-full ${PERIOD_TYPE_COLORS[t.value] || 'bg-gray-400'}`} />
                <span className="text-[rgb(var(--text-secondary))]">{t.label}</span>
              </span>
            ))}
          </div>
        </SettingsSection>
      )}

      {/* Period List */}
      {periods.length === 0 ? (
        <SettingsEmptyState
          icon={Clock}
          title="No bell schedule configured"
          description="Add class periods to define your school's daily schedule."
          action={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowPresets(true)}>
                Load Preset
              </Button>
              <Button variant="primary" size="sm" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-1.5" />
                Add Period
              </Button>
            </div>
          }
        />
      ) : (
        <motion.div variants={staggerChildren} initial="initial" animate="animate" className="space-y-2">
          {sortedPeriods.map((period) => (
            <motion.div
              key={period.periodId}
              variants={fadeInUp}
              className="group flex items-center gap-3 p-4 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-primary))] hover:border-[rgb(var(--border-secondary))] transition-colors"
            >
              {/* Sort handle */}
              <GripVertical className="w-4 h-4 text-[rgb(var(--text-tertiary))] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />

              {/* Color dot */}
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${PERIOD_TYPE_COLORS[period.periodType] || 'bg-gray-400'}`} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-[rgb(var(--text-primary))]">
                    {period.classPeriodName}
                  </span>
                  {period.isAcademic && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-teal-500/10 text-teal-600">
                      Academic
                    </span>
                  )}
                </div>
                <div className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
                  {formatTime(period.startTime)} - {formatTime(period.endTime)}
                  <span className="mx-1.5">·</span>
                  {period.durationMinutes} min
                  <span className="mx-1.5">·</span>
                  {PERIOD_TYPE_OPTIONS.find(t => t.value === period.periodType)?.label || period.periodType}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(period)}
                  className="p-1.5 rounded-lg hover:bg-[rgb(var(--surface-secondary))] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(period.periodId)}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-[rgb(var(--text-tertiary))] hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create / Edit Drawer */}
      <Drawer
        open={showForm}
        onClose={closeForm}
        title={editingPeriod ? 'Edit Period' : 'Add Period'}
        description={editingPeriod ? 'Update class period details' : 'Create a new class period'}
        size="sm"
      >
        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">
              Period Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.classPeriodName}
              onChange={(e) => setForm(f => ({ ...f, classPeriodName: e.target.value }))}
              placeholder="e.g., Period 1"
              className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
            />
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm(f => ({ ...f, startTime: e.target.value }))}
                className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm(f => ({ ...f, endTime: e.target.value }))}
                className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Duration preview */}
          {form.startTime && form.endTime && form.startTime < form.endTime && (
            <div className="text-xs text-[rgb(var(--text-tertiary))] bg-[rgb(var(--surface-secondary))] rounded-lg px-3 py-2">
              Duration: {minutesSinceMidnight(form.endTime) - minutesSinceMidnight(form.startTime)} minutes
            </div>
          )}

          {/* Period Type */}
          <div>
            <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">Period Type</label>
            <select
              value={form.periodType}
              onChange={(e) => {
                const type = e.target.value
                setForm(f => ({
                  ...f,
                  periodType: type,
                  isAcademic: type === 'regular',
                }))
              }}
              className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
            >
              {PERIOD_TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">Sort Order</label>
            <input
              type="number"
              min={0}
              max={20}
              value={form.sortOrder}
              onChange={(e) => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
              className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
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
            <span className="text-[rgb(var(--text-secondary))]">Academic period (counts for instruction time)</span>
          </label>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Optional description"
              className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
            />
          </div>

          <DrawerFooter>
            <Button variant="ghost" size="sm" onClick={closeForm}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingPeriod ? 'Update' : 'Create'}
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
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPresets(false)} />
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative w-full max-w-md bg-[rgb(var(--surface-primary))] rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-[rgb(var(--border-primary))]">
                <h3 className="font-semibold text-[rgb(var(--text-primary))]">Load Bell Schedule Preset</h3>
                <button onClick={() => setShowPresets(false)} className="p-1.5 rounded-lg hover:bg-[rgb(var(--surface-secondary))]">
                  <X className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                </button>
              </div>
              <div className="p-6 space-y-3">
                {periods.length > 0 && (
                  <SettingsAlert type="warning" message="Existing periods will NOT be removed. The preset periods will be added alongside them." />
                )}
                <button
                  onClick={() => applyPreset(PRESETS.elementary)}
                  className="w-full text-left p-4 rounded-xl border border-[rgb(var(--border-primary))] hover:border-teal-500/30 hover:bg-teal-500/5 transition-colors"
                >
                  <div className="font-medium text-sm text-[rgb(var(--text-primary))]">Elementary Schedule</div>
                  <div className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
                    9 periods · 8:00 AM - 2:00 PM · Includes homeroom, recess, lunch
                  </div>
                </button>
                <button
                  onClick={() => applyPreset(PRESETS.highSchool)}
                  className="w-full text-left p-4 rounded-xl border border-[rgb(var(--border-primary))] hover:border-teal-500/30 hover:bg-teal-500/5 transition-colors"
                >
                  <div className="font-medium text-sm text-[rgb(var(--text-primary))]">High School Schedule</div>
                  <div className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
                    9 periods · 7:30 AM - 3:05 PM · Includes advisory and lunch
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
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(null)} />
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative w-full max-w-sm bg-[rgb(var(--surface-primary))] rounded-2xl shadow-xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-red-500/10">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="font-semibold text-[rgb(var(--text-primary))]">Delete Period</h3>
              </div>
              <p className="text-sm text-[rgb(var(--text-secondary))]">
                Are you sure you want to delete this class period? Sections referencing it will lose their period assignment.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(showDeleteConfirm)}
                  disabled={deleteMutation.isPending}
                  isLoading={deleteMutation.isPending}
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
