/**
 * EditAssignmentModal Component
 *
 * Modal for editing an existing staff school assignment.
 * Uses react-hook-form + zod (updateStaffAssignmentSchema).
 */

import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { updateStaffAssignmentSchema, type UpdateStaffAssignmentDto, type StaffAssignmentResponseDto } from '@aibrains/shared-types'
import { Modal, ModalFooter, Button } from '../ui'
import { useUpdateAssignment } from '../../hooks'
import { STAFF_ROLE_OPTIONS } from './wizard/staff-wizard.utils'
import { parseApiError } from '../../services/people.service'

// ============================================================================
// TYPES
// ============================================================================

export interface EditAssignmentModalProps {
  open: boolean
  onClose: () => void
  staffId: string
  assignment: StaffAssignmentResponseDto | null
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EditAssignmentModal({
  open,
  onClose,
  staffId,
  assignment,
}: EditAssignmentModalProps) {
  const firstInputRef = useRef<HTMLSelectElement>(null)
  const updateAssignment = useUpdateAssignment()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateStaffAssignmentDto>({
    resolver: zodResolver(updateStaffAssignmentSchema),
  })

  const fteValue = watch('fullTimeEquivalency')

  // Populate form when assignment changes
  useEffect(() => {
    if (open && assignment) {
      reset({
        role: assignment.role,
        department: assignment.department ?? '',
        isPrimary: assignment.isPrimary,
        positionTitle: assignment.positionTitle ?? '',
        fullTimeEquivalency: assignment.fullTimeEquivalency ?? 1.0,
        endDate: assignment.endDate ?? '',
      })
    }
  }, [open, assignment, reset])

  // Auto-focus first input
  useEffect(() => {
    if (open) {
      setTimeout(() => firstInputRef.current?.focus(), 100)
    }
  }, [open])

  const handleClose = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      )
      if (!confirmed) return
    }
    onClose()
  }

  const onSubmit = handleSubmit(async (data) => {
    if (!assignment) return
    try {
      await updateAssignment.mutateAsync({
        staffId,
        assignmentId: assignment.assignmentId,
        data,
      })
      toast.success('Assignment updated successfully')
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
    ${hasError ? 'border-red-500' : 'border-border-secondary'}
  `

  if (!assignment) return null

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Edit Assignment"
      description={`Update assignment at ${assignment.schoolName || 'school'}`}
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {/* School (read-only) */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            School
          </label>
          <p className="px-3 py-2 rounded-lg border border-border-secondary bg-surface-tertiary text-text-secondary text-sm">
            {assignment.schoolName || assignment.schoolId}
          </p>
        </div>

        {/* Role & Department */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit-assign-role" className="block text-sm font-medium text-text-primary mb-1.5">
              Role
            </label>
            <select
              id="edit-assign-role"
              {...register('role')}
              ref={(e) => {
                register('role').ref(e)
                if (e) firstInputRef.current = e
              }}
              className={inputClass(!!errors.role)}
              disabled={isSubmitting}
            >
              <option value="">Select role...</option>
              {STAFF_ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-500">{errors.role.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="edit-assign-department" className="block text-sm font-medium text-text-primary mb-1.5">
              Department
            </label>
            <input
              id="edit-assign-department"
              type="text"
              {...register('department')}
              className={inputClass(!!errors.department)}
              placeholder="e.g., Mathematics"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Position Title */}
        <div>
          <label htmlFor="edit-assign-positionTitle" className="block text-sm font-medium text-text-primary mb-1.5">
            Position Title
          </label>
          <input
            id="edit-assign-positionTitle"
            type="text"
            {...register('positionTitle')}
            className={inputClass(!!errors.positionTitle)}
            placeholder="e.g., Lead Teacher"
            disabled={isSubmitting}
          />
        </div>

        {/* End Date */}
        <div>
          <label htmlFor="edit-assign-endDate" className="block text-sm font-medium text-text-primary mb-1.5">
            End Date <span className="text-xs text-text-tertiary">(leave blank for ongoing)</span>
          </label>
          <input
            id="edit-assign-endDate"
            type="date"
            {...register('endDate')}
            className={inputClass(!!errors.endDate)}
            disabled={isSubmitting}
          />
        </div>

        {/* FTE Slider */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-text-primary">
            Full-Time Equivalency (FTE)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={fteValue ?? 1}
              onChange={(e) => setValue('fullTimeEquivalency', parseFloat(e.target.value), { shouldDirty: true })}
              className="flex-1 h-2 rounded-full appearance-none bg-[rgb(var(--border-primary))] accent-teal-500"
              disabled={isSubmitting}
            />
            <span className="text-sm font-mono font-medium text-text-primary w-12 text-right">
              {(fteValue ?? 1).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Primary */}
        <div className="flex items-center gap-2">
          <input
            id="edit-assign-isPrimary"
            type="checkbox"
            {...register('isPrimary')}
            className="w-4 h-4 rounded border-border-secondary text-teal-500 focus:ring-2 focus:ring-accent-primary/20"
            disabled={isSubmitting}
          />
          <label htmlFor="edit-assign-isPrimary" className="text-sm text-text-primary">
            Set as primary assignment
          </label>
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
            disabled={isSubmitting || !isDirty}
            className="min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
