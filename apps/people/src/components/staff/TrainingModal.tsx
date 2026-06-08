/**
 * TrainingModal Component (Sprint B.10c)
 *
 * Create/Edit modal for staff professional development / training records.
 * Mirrors CredentialModal pattern: react-hook-form + zod
 * (`createStaffTrainingSchema` from @aibrains/shared-types 0.36.0).
 */

import { useEffect, useRef } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  createStaffTrainingSchema,
  type CreateStaffTrainingDto,
  type StaffTrainingResponseDto,
} from '@aibrains/shared-types'
import { TextField, SelectField, DateField, TextareaField } from '@edforge/forms'
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

  const methods = useForm<CreateStaffTrainingDto>({
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

  const {
    handleSubmit,
    reset,
    setError,
    formState: { isSubmitting, isDirty },
  } = methods

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
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="space-y-5">
          {/* Row 1 — Title (full width) */}
          <TextField
            ref={firstInputRef}
            name="trainingTitle"
            label="Training Title"
            type="text"
            required
            placeholder="Inclusive Education Workshop"
            disabled={isSubmitting}
          />

          {/* Row 2 — Type / Status / Hours (3-col, all short fixed-shape inputs) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SelectField
              name="trainingType"
              label="Type"
              required
              options={TRAINING_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              disabled={isSubmitting}
            />
            <SelectField
              name="status"
              label="Status"
              required
              options={TRAINING_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              disabled={isSubmitting}
            />
            <TextField
              name="durationHours"
              label="Hours"
              type="number"
              required
              min={0}
              max={9999}
              step={1}
              rules={{ valueAsNumber: true }}
              disabled={isSubmitting}
            />
          </div>

          {/* Row 3 — Provider (col-span 2) + Start / End dates */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <TextField
              className="md:col-span-2"
              name="trainingProvider"
              label="Provider"
              type="text"
              required
              placeholder="CEHRD Bagmati Resource Center"
              disabled={isSubmitting}
            />
            <DateField
              name="startDate"
              label="Start Date"
              required
              disabled={isSubmitting}
            />
            <DateField
              name="endDate"
              label="End Date"
              // empty input → undefined (Zod date refinement on optional
              // field is too strict on empty string otherwise)
              rules={{ setValueAs: (v: string) => (v === '' ? undefined : v) }}
              disabled={isSubmitting}
            />
          </div>

          {/* Row 4 — Certificate Number / URL (optional pair) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              name="certificateNumber"
              label="Certificate Number"
              type="text"
              rules={{ setValueAs: (v: string) => (v === '' ? undefined : v) }}
              placeholder="(optional)"
              disabled={isSubmitting}
            />
            <TextField
              name="certificateUrl"
              label="Certificate URL"
              type="url"
              // CRITICAL: empty string fails z.string().url() even with
              // .optional() because Zod treats '' as a present-but-invalid
              // value. Coerce to undefined so the optional path runs.
              rules={{ setValueAs: (v: string) => (v === '' ? undefined : v) }}
              placeholder="https://… (optional)"
              disabled={isSubmitting}
            />
          </div>

          {/* Row 5 — Notes (full width) */}
          <TextareaField
            name="notes"
            label="Notes"
            rows={3}
            rules={{ setValueAs: (v: string) => (v === '' ? undefined : v) }}
            placeholder="(optional, max 1000 chars)"
            disabled={isSubmitting}
          />

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
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="min-w-32"
            >
              {isEditing ? 'Save Changes' : 'Add Training'}
            </Button>
          </ModalFooter>
        </form>
      </FormProvider>
    </Modal>
  )
}
