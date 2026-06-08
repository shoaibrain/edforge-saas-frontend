/**
 * CreateLeaveModal Component
 *
 * Modal for creating a new leave request.
 * Uses react-hook-form + zod (createLeaveRequestSchema).
 */

import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Plus } from 'lucide-react'
import { createLeaveRequestSchema, type CreateLeaveRequestDto } from '@aibrains/shared-types'
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

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CreateLeaveRequestDto>({
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

  const inputClass = (hasError: boolean) => `
    w-full px-3 py-2 rounded-lg border
    bg-surface-secondary text-text-primary
    placeholder:text-text-tertiary
    focus:outline-none focus:ring-2 focus:ring-accent-primary/20
    transition-colors disabled:opacity-50 disabled:cursor-not-allowed
    ${hasError ? 'border-[rgb(var(--state-danger-border))]' : 'border-border-secondary'}
  `

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Request Leave"
      description={`Create a leave request for ${staffName}`}
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Leave Type */}
        <div>
          <label htmlFor="leave-type" className="block text-sm font-medium text-text-primary mb-1.5">
            Leave Type <span className="text-[rgb(var(--state-danger-fg))]">*</span>
          </label>
          <select
            id="leave-type"
            {...register('leaveType')}
            ref={(e) => {
              register('leaveType').ref(e)
              if (e) firstInputRef.current = e
            }}
            className={inputClass(!!errors.leaveType)}
            disabled={isSubmitting}
          >
            <option value="">Select leave type...</option>
            {LEAVE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.leaveType && (
            <p className="mt-1 text-sm text-[rgb(var(--state-danger-fg))]">{errors.leaveType.message}</p>
          )}
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="leave-start" className="block text-sm font-medium text-text-primary mb-1.5">
              Start Date <span className="text-[rgb(var(--state-danger-fg))]">*</span>
            </label>
            <input
              id="leave-start"
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
            <label htmlFor="leave-end" className="block text-sm font-medium text-text-primary mb-1.5">
              End Date <span className="text-[rgb(var(--state-danger-fg))]">*</span>
            </label>
            <input
              id="leave-end"
              type="date"
              {...register('endDate')}
              className={inputClass(!!errors.endDate)}
              disabled={isSubmitting}
            />
            {errors.endDate && (
              <p className="mt-1 text-sm text-[rgb(var(--state-danger-fg))]">{errors.endDate.message}</p>
            )}
          </div>
        </div>

        {/* Duration Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="leave-duration" className="block text-sm font-medium text-text-primary mb-1.5">
              Duration Type
            </label>
            <select
              id="leave-duration"
              {...register('durationType')}
              className={inputClass(!!errors.durationType)}
              disabled={isSubmitting}
            >
              {DURATION_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {durationType === 'hours' && (
            <div>
              <label htmlFor="leave-hours" className="block text-sm font-medium text-text-primary mb-1.5">
                Hours
              </label>
              <input
                id="leave-hours"
                type="number"
                step={0.5}
                min={0.5}
                max={24}
                {...register('hours', { valueAsNumber: true })}
                className={inputClass(!!errors.hours)}
                placeholder="e.g., 4"
                disabled={isSubmitting}
              />
              {errors.hours && (
                <p className="mt-1 text-sm text-[rgb(var(--state-danger-fg))]">{errors.hours.message}</p>
              )}
            </div>
          )}
        </div>

        {/* Reason */}
        <div>
          <label htmlFor="leave-reason" className="block text-sm font-medium text-text-primary mb-1.5">
            Reason
          </label>
          <input
            id="leave-reason"
            type="text"
            {...register('reason')}
            className={inputClass(!!errors.reason)}
            placeholder="Brief reason for leave..."
            disabled={isSubmitting}
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="leave-notes" className="block text-sm font-medium text-text-primary mb-1.5">
            Notes
          </label>
          <textarea
            id="leave-notes"
            {...register('notes')}
            className={inputClass(!!errors.notes)}
            rows={2}
            placeholder="Additional details..."
            disabled={isSubmitting}
          />
        </div>

        {/* Emergency Contact */}
        <div className="border-t border-[rgb(var(--border-secondary))] pt-4">
          <h4 className="text-sm font-medium text-text-primary mb-3">Emergency Contact During Leave</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="leave-ec-name" className="block text-xs text-text-tertiary mb-1">
                Name
              </label>
              <input
                id="leave-ec-name"
                type="text"
                {...register('emergencyContact.name')}
                className={inputClass(false)}
                placeholder="Contact name"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="leave-ec-phone" className="block text-xs text-text-tertiary mb-1">
                Phone
              </label>
              <input
                id="leave-ec-phone"
                type="tel"
                {...register('emergencyContact.phone')}
                className={inputClass(false)}
                placeholder="Phone number"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-40">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Submit Request
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
