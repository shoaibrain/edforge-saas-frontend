/**
 * BlockDrawer — Create / edit a multi-day CalendarBlock.
 *
 * Right-side `Drawer` (size="md") matching the existing `school-rooms.tsx`
 * pattern. Form fields:
 *   - Block Name (required, max 120)
 *   - Block Descriptor (dropdown, required)
 *   - Start / End Date (BS or Gregorian picker depending on `calendarSystem`)
 *   - Child Event Type (auto-set by descriptor, escape hatch in advanced)
 *   - Description (optional, max 500)
 *   - Sub-events repeater (collapsed; each sub-event has date + name + optional description)
 *
 * Create vs Edit:
 *   - Create: all fields editable. `useCreateCalendarBlock` writes
 *     1 block + N child CalendarDate rows atomically (Sprint C4-followup-2
 *     merge-mode: existing SYSTEM rows in the range are deleted; operator-
 *     edited rows trigger a 409 BLOCK_CONFLICTS_OPERATOR_DATES toast).
 *   - Edit: `startDate` + `endDate` locked. Backend's `updateCalendarBlockSchema`
 *     doesn't include them; range change = delete + recreate (preserves
 *     audit trail). Inline note explains this so the operator isn't
 *     confused by greyed-out date fields.
 *
 * Client-side validation defends against rejected requests:
 *   - endDate >= startDate
 *   - dates within [academicYearStartDate, academicYearEndDate]
 *   - block length <= MAX_BLOCK_DAYS (45 per current backend cap)
 *   - sub-event dates within block range
 *   - sub-event name required + max 80
 */

import { useEffect, useMemo, useState } from 'react'
import { Button, Drawer, DrawerFooter } from '@edforge/ui'
import { DateInput } from '@edforge/ui'
import type {
  CalendarBlockResponseDto,
  CalendarBlockDescriptor,
  CalendarBlockSubEvent,
  CreateCalendarBlockDto,
  UpdateCalendarBlockDto,
  CalendarEventDescriptor,
} from '@aibrains/shared-types'
import {
  useCreateCalendarBlock,
  useUpdateCalendarBlock,
} from '../../hooks/useCalendarBlocks'

// Match the backend's MAX_BLOCK_DAYS = 45 (calendar-block.service.ts:83).
// Defensively gate at the client so we don't push obviously-bad requests.
const MAX_BLOCK_DAYS = 45

const DESCRIPTOR_OPTIONS: { value: CalendarBlockDescriptor; label: string; description: string }[] = [
  {
    value: 'religious_festival',
    label: 'Religious Festival',
    description: 'Dashain, Tihar, Holi, Christmas, etc.',
  },
  {
    value: 'school_vacation',
    label: 'School Vacation',
    description: 'Summer break, winter break, spring break',
  },
  {
    value: 'exam_block',
    label: 'Exam Block',
    description: 'Multi-day exam window (paired with grading period)',
  },
  {
    value: 'national_observance',
    label: 'National Observance',
    description: 'Multi-day national event (rare)',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Anything that doesn\'t fit the above categories',
  },
]

// Child event type — what we write onto each child CalendarDate row.
// The default is descriptor-driven (exam_block → exam_window, else break).
// Operators can override via the advanced disclosure.
const CHILD_EVENT_TYPE_OPTIONS: { value: CalendarEventDescriptor; label: string }[] = [
  { value: 'break', label: 'Break (non-instructional)' },
  { value: 'exam_window', label: 'Exam Window (instructional)' },
  { value: 'school_program', label: 'School Program' },
  { value: 'non_instructional_day', label: 'Non-Instructional Day' },
  { value: 'holiday', label: 'Holiday' },
]

function defaultChildEventType(descriptor: CalendarBlockDescriptor): CalendarEventDescriptor {
  return descriptor === 'exam_block' ? 'exam_window' : 'break'
}

function daysInclusive(startDate: string, endDate: string): number {
  // Date math without timezone surprises — both inputs are wall-clock ISO.
  const start = new Date(startDate + 'T12:00:00')
  const end = new Date(endDate + 'T12:00:00')
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1
}

// ============================================================================
// Form state + validation
// ============================================================================

interface SubEventRow {
  date: string
  name: string
  description: string
}

interface BlockFormState {
  blockName: string
  blockDescriptor: CalendarBlockDescriptor
  startDate: string
  endDate: string
  childEventType: CalendarEventDescriptor
  description: string
  subEvents: SubEventRow[]
  childEventTypeManuallySet: boolean
}

function emptyFormState(): BlockFormState {
  return {
    blockName: '',
    blockDescriptor: 'religious_festival',
    startDate: '',
    endDate: '',
    childEventType: 'break',
    description: '',
    subEvents: [],
    childEventTypeManuallySet: false,
  }
}

function blockToFormState(block: CalendarBlockResponseDto): BlockFormState {
  return {
    blockName: block.blockName,
    blockDescriptor: block.blockDescriptor,
    startDate: block.startDate,
    endDate: block.endDate,
    childEventType: block.childEventType,
    description: block.description ?? '',
    subEvents: (block.subEvents ?? []).map((se) => ({
      date: se.date,
      name: se.name,
      description: se.description ?? '',
    })),
    childEventTypeManuallySet: true, // edits keep whatever's stored
  }
}

interface ValidationErrors {
  blockName?: string
  startDate?: string
  endDate?: string
  childEventType?: string
  subEvents?: (string | undefined)[]
  global?: string
}

function validate(
  form: BlockFormState,
  academicYearStartDate: string,
  academicYearEndDate: string,
): ValidationErrors {
  const errors: ValidationErrors = {}

  if (!form.blockName.trim()) {
    errors.blockName = 'Block name is required'
  } else if (form.blockName.length > 120) {
    errors.blockName = 'Max 120 characters'
  }

  if (!form.startDate) {
    errors.startDate = 'Start date is required'
  } else if (form.startDate < academicYearStartDate || form.startDate > academicYearEndDate) {
    errors.startDate = `Must be within the academic year (${academicYearStartDate} to ${academicYearEndDate})`
  }

  if (!form.endDate) {
    errors.endDate = 'End date is required'
  } else if (form.endDate < academicYearStartDate || form.endDate > academicYearEndDate) {
    errors.endDate = `Must be within the academic year (${academicYearStartDate} to ${academicYearEndDate})`
  } else if (form.startDate && form.endDate < form.startDate) {
    errors.endDate = 'End date must be on or after start date'
  } else if (form.startDate && form.endDate) {
    const days = daysInclusive(form.startDate, form.endDate)
    if (days > MAX_BLOCK_DAYS) {
      errors.endDate = `Block spans ${days} days; max is ${MAX_BLOCK_DAYS}.`
    }
  }

  // Sub-event validation
  if (form.subEvents.length > 0) {
    errors.subEvents = form.subEvents.map((se) => {
      if (!se.name.trim()) return 'Sub-event name is required'
      if (se.name.length > 80) return 'Max 80 characters'
      if (!se.date) return 'Sub-event date is required'
      if (form.startDate && form.endDate) {
        if (se.date < form.startDate || se.date > form.endDate) {
          return `Date must fall within ${form.startDate} to ${form.endDate}`
        }
      }
      return undefined
    })
    if (errors.subEvents.every((e) => !e)) delete errors.subEvents
  }

  if (form.description.length > 500) {
    errors.global = 'Description max 500 characters'
  }

  return errors
}

// ============================================================================
// Component
// ============================================================================

export interface BlockDrawerProps {
  open: boolean
  onClose: () => void
  schoolId: string
  academicYearId: string
  academicYearStartDate: string
  academicYearEndDate: string
  calendarSystem: 'gregorian' | 'bikram_sambat'
  /** When provided, drawer opens in edit mode (startDate + endDate locked). */
  blockToEdit?: CalendarBlockResponseDto | null
}

export function BlockDrawer({
  open,
  onClose,
  schoolId,
  academicYearId,
  academicYearStartDate,
  academicYearEndDate,
  calendarSystem,
  blockToEdit,
}: BlockDrawerProps) {
  const isEdit = !!blockToEdit
  const createMutation = useCreateCalendarBlock()
  const updateMutation = useUpdateCalendarBlock(schoolId)

  const [form, setForm] = useState<BlockFormState>(emptyFormState())
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Reset form when drawer opens (or switches between create/edit)
  useEffect(() => {
    if (open) {
      setForm(blockToEdit ? blockToFormState(blockToEdit) : emptyFormState())
      setShowAdvanced(false)
    }
  }, [open, blockToEdit])

  // Auto-set child event type when descriptor changes (unless operator
  // has manually overridden it via the advanced disclosure).
  useEffect(() => {
    if (form.childEventTypeManuallySet) return
    const def = defaultChildEventType(form.blockDescriptor)
    if (form.childEventType !== def) {
      setForm((f) => ({ ...f, childEventType: def }))
    }
  }, [form.blockDescriptor, form.childEventTypeManuallySet, form.childEventType])

  const errors = useMemo(
    () => validate(form, academicYearStartDate, academicYearEndDate),
    [form, academicYearStartDate, academicYearEndDate],
  )

  const hasErrors =
    Object.keys(errors).filter((k) => k !== 'subEvents').length > 0 ||
    (errors.subEvents?.some((e) => !!e) ?? false)

  const dayCount =
    form.startDate && form.endDate && form.endDate >= form.startDate
      ? daysInclusive(form.startDate, form.endDate)
      : 0

  // ----- Sub-event row handlers -----
  function addSubEvent() {
    setForm((f) => ({
      ...f,
      subEvents: [...f.subEvents, { date: f.startDate || '', name: '', description: '' }],
    }))
  }

  function updateSubEvent(idx: number, patch: Partial<SubEventRow>) {
    setForm((f) => ({
      ...f,
      subEvents: f.subEvents.map((se, i) => (i === idx ? { ...se, ...patch } : se)),
    }))
  }

  function removeSubEvent(idx: number) {
    setForm((f) => ({
      ...f,
      subEvents: f.subEvents.filter((_, i) => i !== idx),
    }))
  }

  // ----- Submit -----
  async function handleSubmit() {
    if (hasErrors) return

    const subEvents: CalendarBlockSubEvent[] = form.subEvents.map((se) => ({
      date: se.date,
      name: se.name.trim(),
      ...(se.description.trim() ? { description: se.description.trim() } : {}),
    }))

    if (isEdit && blockToEdit) {
      const data: UpdateCalendarBlockDto = {
        blockName: form.blockName.trim(),
        blockDescriptor: form.blockDescriptor,
        ...(form.description.trim() ? { description: form.description.trim() } : { description: '' }),
        subEvents,
      }
      await updateMutation.mutateAsync({ blockId: blockToEdit.blockId, data })
    } else {
      const data: CreateCalendarBlockDto = {
        schoolId,
        academicYearId,
        blockName: form.blockName.trim(),
        blockDescriptor: form.blockDescriptor,
        startDate: form.startDate,
        endDate: form.endDate,
        childEventType: form.childEventType,
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
        ...(subEvents.length > 0 ? { subEvents } : {}),
      }
      await createMutation.mutateAsync(data)
    }
    onClose()
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Calendar Block' : 'New Calendar Block'}
      description={
        isEdit
          ? 'Update block metadata. Date range is locked — delete and recreate to change the range.'
          : 'Declare a multi-day event (Dashain, exam window, vacation, etc.). The backend creates one block plus one child date row per day in the range.'
      }
      size="md"
    >
      <div className="space-y-5">
        {/* Block name */}
        <div>
          <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">
            Block Name <span className="text-[rgb(var(--state-danger-fg))]">*</span>
          </label>
          <input
            type="text"
            value={form.blockName}
            onChange={(e) => setForm((f) => ({ ...f, blockName: e.target.value }))}
            placeholder="e.g., Dashain 2082, Summer Vacation, Term 1 Final Exam"
            maxLength={120}
            className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))]"
          />
          {errors.blockName && (
            <p className="mt-1 text-xs text-[rgb(var(--state-danger-fg))]">{errors.blockName}</p>
          )}
        </div>

        {/* Descriptor */}
        <div>
          <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">
            Block Type <span className="text-[rgb(var(--state-danger-fg))]">*</span>
          </label>
          <select
            value={form.blockDescriptor}
            onChange={(e) =>
              setForm((f) => ({ ...f, blockDescriptor: e.target.value as CalendarBlockDescriptor }))
            }
            className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))]"
          >
            {DESCRIPTOR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-[rgb(var(--text-tertiary))]">
            {DESCRIPTOR_OPTIONS.find((o) => o.value === form.blockDescriptor)?.description}
          </p>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <DateInput
              label="Start Date *"
              value={form.startDate}
              onChange={(d) => setForm((f) => ({ ...f, startDate: d }))}
              calendarSystem={calendarSystem}
              disabled={isEdit}
              error={errors.startDate}
            />
          </div>
          <div>
            <DateInput
              label="End Date *"
              value={form.endDate}
              onChange={(d) => setForm((f) => ({ ...f, endDate: d }))}
              calendarSystem={calendarSystem}
              disabled={isEdit}
              error={errors.endDate}
            />
          </div>
        </div>
        {dayCount > 0 && !errors.endDate && (
          <p className="text-xs text-[rgb(var(--text-tertiary))] -mt-2">
            {dayCount} day{dayCount === 1 ? '' : 's'} (inclusive)
          </p>
        )}
        {isEdit && (
          <p className="text-xs text-[rgb(var(--text-tertiary))] -mt-2 italic">
            Date range is locked. To change the range, delete this block and create a new one — per-day notes on the existing dates will be lost.
          </p>
        )}

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Shown in the calendar grid hover tooltip"
            maxLength={500}
            rows={2}
            className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))] resize-none"
          />
        </div>

        {/* Advanced: child event type */}
        <details
          className="border border-[rgb(var(--border-primary))] rounded-xl px-3 py-2"
          open={showAdvanced}
          onToggle={(e) => setShowAdvanced((e.currentTarget as HTMLDetailsElement).open)}
        >
          <summary className="text-xs font-medium text-[rgb(var(--text-secondary))] cursor-pointer">
            Advanced — child event type
          </summary>
          <div className="mt-3">
            <select
              value={form.childEventType}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  childEventType: e.target.value as CalendarEventDescriptor,
                  childEventTypeManuallySet: true,
                }))
              }
              disabled={isEdit}
              className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))] disabled:opacity-60"
            >
              {CHILD_EVENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-[rgb(var(--text-tertiary))]">
              Written onto each child date in the block range. Defaults to{' '}
              <strong>break</strong> (or <strong>exam_window</strong> for exam blocks).
              {isEdit && ' Locked on edit — only mutable at create time.'}
            </p>
          </div>
        </details>

        {/* Sub-events */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-[rgb(var(--text-secondary))]">
              Named Sub-Events
            </label>
            <button
              type="button"
              onClick={addSubEvent}
              disabled={form.subEvents.length >= 50}
              className="text-xs font-medium text-[rgb(var(--action-secondary-fg))] hover:underline disabled:opacity-50"
            >
              + Add sub-event
            </button>
          </div>
          {form.subEvents.length === 0 && (
            <p className="text-xs text-[rgb(var(--text-tertiary))] italic">
              Optional. Use for named days within a block — e.g., Dashain Day 8 (Mahaastami), Day 9 (Nawami), Day 10 (Vijaya Dashami).
            </p>
          )}
          <div className="space-y-2">
            {form.subEvents.map((se, idx) => (
              <div
                key={idx}
                className="border border-[rgb(var(--border-primary))] rounded-xl p-2.5"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-36">
                    <DateInput
                      value={se.date}
                      onChange={(d) => updateSubEvent(idx, { date: d })}
                      calendarSystem={calendarSystem}
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={se.name}
                      onChange={(e) => updateSubEvent(idx, { name: e.target.value })}
                      placeholder="Sub-event name (e.g., Mahaastami)"
                      maxLength={80}
                      className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSubEvent(idx)}
                    className="flex-shrink-0 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--state-danger-fg))] px-2 py-1"
                    aria-label="Remove sub-event"
                  >
                    ✕
                  </button>
                </div>
                {errors.subEvents?.[idx] && (
                  <p className="mt-1.5 text-xs text-[rgb(var(--state-danger-fg))]">{errors.subEvents[idx]}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {errors.global && (
          <p className="text-xs text-[rgb(var(--state-danger-fg))]">{errors.global}</p>
        )}

        <DrawerFooter>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSubmit}
            disabled={hasErrors || isSubmitting}
            isLoading={isSubmitting}
          >
            {isEdit ? 'Save Changes' : 'Create Block'}
          </Button>
        </DrawerFooter>
      </div>
    </Drawer>
  )
}
