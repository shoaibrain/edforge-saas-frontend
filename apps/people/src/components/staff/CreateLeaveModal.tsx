/**
 * CreateLeaveModal Component
 *
 * Modal for creating a new leave request.
 * Uses react-hook-form + zod (createLeaveRequestSchema).
 */

import { useEffect, useRef } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createLeaveRequestSchema, type CreateLeaveRequestDto } from '@aibrains/shared-types'
import { TextField, SelectField, DateField, TextareaField } from '@edforge/forms'
import { Modal, ModalFooter, Button } from '../ui'
import { useCreateLeaveRequest } from '../../hooks'
import { parseApiError } from '../../services/people.service'

// ============================================================================
// CONSTANTS
// ============================================================================

const LEAVE_TYPE_OPTIONS = [
  { value: 'annual', label: 'Annual / PTO' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'personal', label: 'Personal Day' },
  { value: 'bereavement', label: 'Bereavement' },
  { value: 'maternity', label: 'Maternity' },
  { value: 'paternity', label: 'Paternity' },
  { value: 'family_medical', label: 'Family Medical (FMLA)' },
  { value: 'jury_duty', label: 'Jury Duty' },
  { value: 'military', label: 'Military' },
  { value: 'professional_development', label: 'Professional Development' },
  { value: 'sabbatical', label: 'Sabbatical' },
  { value: 'unpaid', label: 'Unpaid Leave' },
  { value: 'other', label: 'Other' },
]

const DURATION_TYPE_OPTIONS = [
  { value: 'full_day', label: 'Full Day' },
  { value: 'half_day_am', label: 'Half Day (AM)' },
  { value: 'half_day_pm', label: 'Half Day (PM)' },
  { value: 'hours', label: 'Hours' },
]

// ============================================================================
// TYPES
// ============================================================================

export interface CreateLeaveModalProps {
  open: boolean
  onClose: () => void
  staffId: string
  staffName: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CreateLeaveModal({
  open,
  onClose,
  staffId,
  staffName,
}: CreateLeaveModalProps) {
  const firstInputRef = useRef<HTMLSelectElement>(null)
  const createLeave = useCreateLeaveRequest()

  const methods = useForm<CreateLeaveRequestDto>({
    resolver: zodResolver(createLeaveRequestSchema),
    defaultValues: {
      leaveType: '' as CreateLeaveRequestDto['leaveType'],
      startDate: '',
      endDate: '',
      durationType: 'full_day',
      reason: '',
      notes: '',
    },
  })

  const {
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting, isDirty },
  } = methods

  const durationType = watch('durationType')

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      reset({
        leaveType: '' as CreateLeaveRequestDto['leaveType'],
        startDate: '',
        endDate: '',
        durationType: 'full_day',
        reason: '',
        notes: '',
      })
    }
  }, [open, reset])

  // Auto-focus
  useEffect(() => {
    if (open) {
      setTimeout(() => firstInputRef.current?.focus(), 100)
    }
  }, [open])

  const handleClose = () => {
    if (isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?')
      if (!confirmed) return
    }
    onClose()
  }

  const onSubmit = handleSubmit(async (data) => {
    try {
      await createLeave.mutateAsync({ staffId, data })
      toast.success('Leave request created successfully')
      onClose()
    } catch (error) {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    }
  })

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Request Leave"
      description={`Create a leave request for ${staffName}`}
      size="lg"
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Leave Type */}
          <SelectField
            ref={firstInputRef}
            name="leaveType"
            label="Leave Type"
            required
            options={LEAVE_TYPE_OPTIONS}
            placeholder="Select leave type..."
            disabled={isSubmitting}
          />

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <DateField
              name="startDate"
              label="Start Date"
              required
              disabled={isSubmitting}
            />
            <DateField
              name="endDate"
              label="End Date"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Duration Type */}
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              name="durationType"
              label="Duration Type"
              options={DURATION_TYPE_OPTIONS}
              disabled={isSubmitting}
            />
            {durationType === 'hours' && (
              <TextField
                name="hours"
                label="Hours"
                type="number"
                step={0.5}
                min={0.5}
                max={24}
                rules={{ valueAsNumber: true }}
                placeholder="e.g., 4"
                disabled={isSubmitting}
              />
            )}
          </div>

          {/* Reason */}
          <TextField
            name="reason"
            label="Reason"
            type="text"
            placeholder="Brief reason for leave..."
            disabled={isSubmitting}
          />

          {/* Notes */}
          <TextareaField
            name="notes"
            label="Notes"
            rows={2}
            placeholder="Additional details..."
            disabled={isSubmitting}
          />

          {/* Emergency Contact */}
          <div className="border-t border-[rgb(var(--border-secondary))] pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))] mb-3">Emergency Contact During Leave</h4>
            <div className="grid grid-cols-2 gap-4">
              <TextField
                name="emergencyContact.name"
                label="Name"
                type="text"
                placeholder="Contact name"
                disabled={isSubmitting}
              />
              <TextField
                name="emergencyContact.phone"
                label="Phone"
                type="tel"
                placeholder="Phone number"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting} className="min-w-40">
              Submit Request
            </Button>
          </ModalFooter>
        </form>
      </FormProvider>
    </Modal>
  )
}
