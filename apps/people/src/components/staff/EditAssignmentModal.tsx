/**
 * EditAssignmentModal Component
 *
 * Modal for editing an existing staff school assignment.
 * Uses react-hook-form + zod (updateStaffAssignmentSchema).
 */

import { useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { updateStaffAssignmentSchema, type UpdateStaffAssignmentDto, type StaffAssignmentResponseDto } from '@aibrains/shared-types'
import { Modal, ModalFooter, Button } from '../ui'
import { TextField, SelectField, DateField, CheckboxField } from '@edforge/forms'
import { useUpdateAssignment } from '../../hooks'
import { STAFF_ROLE_OPTIONS } from './wizard/staff-wizard.utils'
import { useDepartments } from './wizard/steps/AssignmentStep'
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
  const updateAssignment = useUpdateAssignment()

  const methods = useForm<UpdateStaffAssignmentDto>({
    resolver: zodResolver(updateStaffAssignmentSchema),
  })

  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting, isDirty },
  } = methods

  const fteValue = watch('fullTimeEquivalency')
  const { data: departments = [], isLoading: loadingDepts } = useDepartments(assignment?.schoolId)

  // Populate form when assignment changes
  useEffect(() => {
    if (open && assignment) {
      reset({
        role: assignment.role,
        departmentId: assignment.departmentId ?? '',
        isPrimary: assignment.isPrimary,
        positionTitle: assignment.positionTitle ?? '',
        fullTimeEquivalency: assignment.fullTimeEquivalency ?? 1.0,
        endDate: assignment.endDate ?? '',
      })
    }
  }, [open, assignment, reset])

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

  if (!assignment) return null

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Edit Assignment"
      description={`Update assignment at ${assignment.schoolName || 'school'}`}
      size="lg"
    >
      <FormProvider {...methods}>
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
            <SelectField
              name="role"
              label="Role"
              placeholder="Select role..."
              options={STAFF_ROLE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
              disabled={isSubmitting}
            />
            <SelectField
              name="departmentId"
              label="Department"
              placeholder={loadingDepts ? 'Loading...' : 'Select department...'}
              options={departments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` }))}
              disabled={isSubmitting || loadingDepts}
            />
          </div>

          {/* Position Title */}
          <TextField
            name="positionTitle"
            label="Position Title"
            type="text"
            placeholder="e.g., Lead Teacher"
            disabled={isSubmitting}
          />

          {/* End Date */}
          <DateField
            name="endDate"
            label="End Date"
            helperText="Leave blank for ongoing"
            disabled={isSubmitting}
          />

          {/* FTE Slider */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">
              Full-Time Equivalency (FTE)
            </label>
            <div className="flex items-center gap-4">
              <input
                // allow-native-form-control: range slider has no shared adapter; preserves watch()/setValue() FTE behavior
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
          <CheckboxField
            name="isPrimary"
            label="Set as primary assignment"
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
              disabled={isSubmitting || !isDirty}
              className="min-w-36"
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
      </FormProvider>
    </Modal>
  )
}
