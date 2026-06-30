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
import { useTranslation } from '@edforge/i18n'
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
  const { t } = useTranslation('people')
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
      const confirmed = window.confirm(t('common.unsavedCloseConfirm'))
      if (!confirmed) return
    }
    onClose()
  }

  const onSubmit = handleSubmit(async (data) => {
    try {
      await createLeave.mutateAsync({ staffId, data })
      toast.success(t('leave.toasts.created'))
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
      title={t('leave.actions.request')}
      description={t('leave.modal.description', { name: staffName })}
      size="lg"
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Leave Type */}
          <SelectField
            ref={firstInputRef}
            name="leaveType"
            label={t('leave.fields.leaveType')}
            required
            options={LEAVE_TYPE_OPTIONS.map((option) => ({
              ...option,
              label: t(`leave.typesFull.${option.value}`, { defaultValue: option.label }),
            }))}
            placeholder={t('leave.placeholders.selectLeaveType')}
            disabled={isSubmitting}
          />

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <DateField
              name="startDate"
              label={t('fields.startDate')}
              required
              disabled={isSubmitting}
            />
            <DateField
              name="endDate"
              label={t('fields.endDate')}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Duration Type */}
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              name="durationType"
              label={t('leave.fields.durationType')}
              options={DURATION_TYPE_OPTIONS.map((option) => ({
                ...option,
                label: t(`leave.durationTypes.${option.value}`, { defaultValue: option.label }),
              }))}
              disabled={isSubmitting}
            />
            {durationType === 'hours' && (
              <TextField
                name="hours"
                label={t('leave.fields.hours')}
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
            label={t('leave.table.reason')}
            type="text"
            placeholder={t('leave.placeholders.reason')}
            disabled={isSubmitting}
          />

          {/* Notes */}
          <TextareaField
            name="notes"
            label={t('employmentHistory.fields.notes')}
            rows={2}
            placeholder={t('common.additionalDetails')}
            disabled={isSubmitting}
          />

          {/* Emergency Contact */}
          <div className="border-t border-[rgb(var(--border-secondary))] pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))] mb-3">{t('leave.modal.emergencyContact')}</h4>
            <div className="grid grid-cols-2 gap-4">
              <TextField
                name="emergencyContact.name"
                label={t('fields.name')}
                type="text"
                placeholder={t('leave.placeholders.contactName')}
                disabled={isSubmitting}
              />
              <TextField
                name="emergencyContact.phone"
                label={t('fields.phone')}
                type="tel"
                placeholder={t('leave.placeholders.phoneNumber')}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting} className="min-w-40">
              {t('leave.actions.submitRequest')}
            </Button>
          </ModalFooter>
        </form>
      </FormProvider>
    </Modal>
  )
}
