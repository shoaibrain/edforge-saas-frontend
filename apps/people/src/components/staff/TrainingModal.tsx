/**
 * TrainingModal Component (Sprint B.10c)
 *
 * Create/Edit modal for staff professional development / training records.
 * Mirrors CredentialModal pattern: react-hook-form + zod
 * (`createStaffTrainingSchema` from @aibrains/shared-types 0.36.0).
 */

import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Plus, Save } from 'lucide-react'
import {
  createStaffTrainingSchema,
  type CreateStaffTrainingDto,
  type StaffTrainingResponseDto,
} from '@aibrains/shared-types'
import { Modal, ModalFooter, Button } from '../ui'
import { useCreateStaffTraining, useUpdateStaffTraining } from '../../hooks'
import { parseApiError } from '../../services/people.service'

// ============================================================================
// CONSTANTS — mirror the backend Sprint B Zod enums (CEHRD vocabulary)
// ============================================================================

const TRAINING_TYPE_OPTIONS = [
  { value: 'pedagogical', label: 'Pedagogical' },
  { value: 'subject_matter', label: 'Subject matter' },
  { value: 'technology', label: 'Technology' },
  { value: 'inclusion', label: 'Inclusion / special needs' },
  { value: 'leadership', label: 'Leadership / admin' },
  { value: 'safety', label: 'Safety / first aid' },
  { value: 'assessment', label: 'Assessment / evaluation' },
  { value: 'language', label: 'Language' },
  { value: 'induction', label: 'Induction / onboarding' },
  { value: 'other', label: 'Other' },
] as const

const TRAINING_STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

// ============================================================================
// TYPES
// ============================================================================

export interface TrainingModalProps {
  open: boolean
  onClose: () => void
  staffId: string
  training?: StaffTrainingResponseDto | null
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TrainingModal({
  open,
  onClose,
  staffId,
  training,
}: TrainingModalProps) {
  const firstInputRef = useRef<HTMLInputElement>(null)
  const isEditing = !!training
  const createTraining = useCreateStaffTraining()
  const updateTraining = useUpdateStaffTraining()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CreateStaffTrainingDto>({
    resolver: zodResolver(createStaffTrainingSchema),
    defaultValues: {
      trainingTitle: '',
      trainingType: 'pedagogical',
      trainingProvider: '',
      startDate: '',
      durationHours: 0,
      status: 'completed',
    },
  })

  // Populate when editing
  useEffect(() => {
    if (open && training) {
      reset({
        trainingTitle: training.trainingTitle,
        trainingType: training.trainingType,
        trainingProvider: training.trainingProvider,
        startDate: training.startDate,
        endDate: training.endDate,
        durationHours: training.durationHours,
        status: training.status,
        certificateNumber: training.certificateNumber,
        certificateUrl: training.certificateUrl,
        notes: training.notes,
      })
    } else if (open && !training) {
      // New record — reset to defaults
      reset({
        trainingTitle: '',
        trainingType: 'pedagogical',
        trainingProvider: '',
        startDate: '',
        durationHours: 0,
        status: 'completed',
      })
    }
  }, [open, training, reset])

  // Auto-focus on open
  useEffect(() => {
    if (open) {
      setTimeout(() => firstInputRef.current?.focus(), 100)
    }
  }, [open])

  const handleClose = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to close?',
      )
      if (!confirmed) return
    }
    onClose()
  }

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Coerce empty strings on optional fields → undefined so the
      // backend Zod doesn't see them as malformed values.
      const payload: CreateStaffTrainingDto = {
        ...data,
        endDate: data.endDate || undefined,
        certificateNumber: data.certificateNumber || undefined,
        certificateUrl: data.certificateUrl || undefined,
        notes: data.notes || undefined,
      }
      if (isEditing && training) {
        await updateTraining.mutateAsync({
          staffId,
          trainingId: training.trainingId,
          data: payload,
        })
        toast.success('Training updated')
      } else {
        await createTraining.mutateAsync({ staffId, data: payload })
        toast.success('Training added')
      }
      onClose()
    } catch (error) {
      const parsed = parseApiError(error)
      if (parsed.fieldErrors) {
        Object.entries(parsed.fieldErrors).forEach(([field, message]) => {
          setError(field as keyof CreateStaffTrainingDto, { message })
        })
      } else {
        toast.error(parsed.message)
      }
    }
  })

  const inputClass = (hasError: boolean) =>
    `w-full px-3 py-2 rounded-lg border bg-surface-secondary text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-colors ${hasError ? 'border-[rgb(var(--state-danger-border))]' : 'border-border-secondary'}`

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditing ? 'Edit Training' : 'Add Training'}
      description={
        isEditing
          ? 'Update this professional development record'
          : 'Record a professional development / training event'
      }
      size="2xl"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {/* Row 1 — Title (full width) */}
        <div>
          <label htmlFor="trainingTitle" className="block text-sm font-medium text-text-primary mb-1.5">
            Training Title <span className="text-[rgb(var(--state-danger-fg))]">*</span>
          </label>
          <input
            id="trainingTitle"
            type="text"
            {...register('trainingTitle')}
            ref={(e) => {
              register('trainingTitle').ref(e)
              if (e) firstInputRef.current = e
            }}
            className={inputClass(!!errors.trainingTitle)}
            placeholder="Inclusive Education Workshop"
            disabled={isSubmitting}
          />
          {errors.trainingTitle && (
            <p className="mt-1 text-sm text-[rgb(var(--state-danger-fg))]">{errors.trainingTitle.message}</p>
          )}
        </div>

        {/* Row 2 — Type / Status / Hours (3-col, all short fixed-shape inputs) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="trainingType" className="block text-sm font-medium text-text-primary mb-1.5">
              Type <span className="text-[rgb(var(--state-danger-fg))]">*</span>
            </label>
            <select
              id="trainingType"
              {...register('trainingType')}
              className={inputClass(!!errors.trainingType)}
              disabled={isSubmitting}
            >
              {TRAINING_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {errors.trainingType && (
              <p className="mt-1 text-sm text-[rgb(var(--state-danger-fg))]">{errors.trainingType.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-text-primary mb-1.5">
              Status <span className="text-[rgb(var(--state-danger-fg))]">*</span>
            </label>
            <select
              id="status"
              {...register('status')}
              className={inputClass(!!errors.status)}
              disabled={isSubmitting}
            >
              {TRAINING_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-[rgb(var(--state-danger-fg))]">{errors.status.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="durationHours" className="block text-sm font-medium text-text-primary mb-1.5">
              Hours <span className="text-[rgb(var(--state-danger-fg))]">*</span>
            </label>
            <input
              id="durationHours"
              type="number"
              min={0}
              max={9999}
              step={1}
              {...register('durationHours', { valueAsNumber: true })}
              className={inputClass(!!errors.durationHours)}
              disabled={isSubmitting}
            />
            {errors.durationHours && (
              <p className="mt-1 text-sm text-[rgb(var(--state-danger-fg))]">{errors.durationHours.message}</p>
            )}
          </div>
        </div>

        {/* Row 3 — Provider (col-span 2) + Start / End dates */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="trainingProvider" className="block text-sm font-medium text-text-primary mb-1.5">
              Provider <span className="text-[rgb(var(--state-danger-fg))]">*</span>
            </label>
            <input
              id="trainingProvider"
              type="text"
              {...register('trainingProvider')}
              className={inputClass(!!errors.trainingProvider)}
              placeholder="CEHRD Bagmati Resource Center"
              disabled={isSubmitting}
            />
            {errors.trainingProvider && (
              <p className="mt-1 text-sm text-[rgb(var(--state-danger-fg))]">{errors.trainingProvider.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-text-primary mb-1.5">
              Start Date <span className="text-[rgb(var(--state-danger-fg))]">*</span>
            </label>
            <input
              id="startDate"
              type="date"
              {...register('startDate')}
              className={inputClass(!!errors.startDate)}
              disabled={isSubmitting}
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-[rgb(var(--state-danger-fg))]">{errors.startDate.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-text-primary mb-1.5">
              End Date
            </label>
            <input
              id="endDate"
              type="date"
              {...register('endDate', {
                // empty input → undefined (Zod date refinement on optional
                // field is too strict on empty string otherwise)
                setValueAs: (v: string) => (v === '' ? undefined : v),
              })}
              className={inputClass(!!errors.endDate)}
              disabled={isSubmitting}
            />
            {errors.endDate && (
              <p className="mt-1 text-sm text-[rgb(var(--state-danger-fg))]">{errors.endDate.message}</p>
            )}
          </div>
        </div>

        {/* Row 4 — Certificate Number / URL (optional pair) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="certificateNumber" className="block text-sm font-medium text-text-primary mb-1.5">
              Certificate Number
            </label>
            <input
              id="certificateNumber"
              type="text"
              {...register('certificateNumber', {
                setValueAs: (v: string) => (v === '' ? undefined : v),
              })}
              className={inputClass(!!errors.certificateNumber)}
              placeholder="(optional)"
              disabled={isSubmitting}
            />
            {errors.certificateNumber && (
              <p className="mt-1 text-sm text-[rgb(var(--state-danger-fg))]">{errors.certificateNumber.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="certificateUrl" className="block text-sm font-medium text-text-primary mb-1.5">
              Certificate URL
            </label>
            <input
              id="certificateUrl"
              type="url"
              {...register('certificateUrl', {
                // CRITICAL: empty string fails z.string().url() even with
                // .optional() because Zod treats '' as a present-but-invalid
                // value. Coerce to undefined so the optional path runs.
                setValueAs: (v: string) => (v === '' ? undefined : v),
              })}
              className={inputClass(!!errors.certificateUrl)}
              placeholder="https://… (optional)"
              disabled={isSubmitting}
            />
            {errors.certificateUrl && (
              <p className="mt-1 text-sm text-[rgb(var(--state-danger-fg))]">{errors.certificateUrl.message}</p>
            )}
          </div>
        </div>

        {/* Row 5 — Notes (full width) */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-text-primary mb-1.5">
            Notes
          </label>
          <textarea
            id="notes"
            rows={3}
            {...register('notes', {
              setValueAs: (v: string) => (v === '' ? undefined : v),
            })}
            className={inputClass(!!errors.notes)}
            placeholder="(optional, max 1000 chars)"
            disabled={isSubmitting}
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-[rgb(var(--state-danger-fg))]">{errors.notes.message}</p>
          )}
        </div>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Training
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
