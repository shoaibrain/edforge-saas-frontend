/**
 * AssignToSchoolModal Component
 *
 * Modal for assigning a staff member to a school (Ed-Fi
 * StaffEducationOrganizationAssignmentAssociation).
 *
 * Features:
 * - react-hook-form with zod validation (assignStaffToSchoolSchema)
 * - School dropdown populated from /schools API
 * - FTE slider (0.00 – 1.00)
 * - Dirty-form warning on close
 */

import { useEffect, useRef } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { assignStaffToSchoolSchema, type AssignStaffToSchoolDto } from '@aibrains/shared-types'
import { TextField, SelectField, DateField, CheckboxField } from '@edforge/forms'
import { Modal, ModalFooter, Button } from '../ui'
import { useCreateAssignment } from '../../hooks'
import { useSchools } from '../../hooks/useSchools'
import { STAFF_ROLE_OPTIONS } from './wizard/staff-wizard.utils'
import { useDepartments } from './wizard/steps/AssignmentStep'
import { parseApiError } from '../../services/people.service'

// ============================================================================
// TYPES
// ============================================================================

export interface AssignToSchoolModalProps {
  open: boolean
  onClose: () => void
  staffId: string
  staffName: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AssignToSchoolModal({
  open,
  onClose,
  staffId,
  staffName,
}: AssignToSchoolModalProps) {
  const firstInputRef = useRef<HTMLSelectElement>(null)
  const { schools, isLoading: loadingSchools } = useSchools()
  const createAssignment = useCreateAssignment()

  const methods = useForm<AssignStaffToSchoolDto>({
    resolver: zodResolver(assignStaffToSchoolSchema),
    defaultValues: {
      schoolId: '',
      role: '' as AssignStaffToSchoolDto['role'],
      departmentId: '',
      isPrimary: false,
      beginDate: new Date().toISOString().split('T')[0],
      positionTitle: '',
      fullTimeEquivalency: 1.0,
    },
  })

  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting, isDirty },
  } = methods

  const fteValue = watch('fullTimeEquivalency')
  const selectedSchoolId = watch('schoolId')
  const { data: departments = [], isLoading: loadingDepts } = useDepartments(selectedSchoolId || undefined)

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      reset({
        schoolId: '',
        role: '' as AssignStaffToSchoolDto['role'],
        departmentId: '',
        isPrimary: false,
        beginDate: new Date().toISOString().split('T')[0],
        positionTitle: '',
        fullTimeEquivalency: 1.0,
      })
    }
  }, [open, reset])

  // Auto-focus school dropdown
  useEffect(() => {
    if (open && !loadingSchools) {
      setTimeout(() => firstInputRef.current?.focus(), 100)
    }
  }, [open, loadingSchools])

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
    try {
      await createAssignment.mutateAsync({ staffId, data })
      toast.success('School assignment created successfully')
      onClose()
    } catch (error) {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    }
  })

  const schoolOptions = schools.map((school) => ({
    value: school.schoolId,
    label: school.localEducationAgencyName
      ? `${school.name} (${school.localEducationAgencyName})`
      : school.name,
  }))

  const departmentOptions = departments.map((d) => ({
    value: d.id,
    label: `${d.name} (${d.code})`,
  }))

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Assign to School"
      description={`Create a new school assignment for ${staffName}`}
      size="lg"
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="space-y-4">
          {/* School */}
          <SelectField
            ref={firstInputRef}
            name="schoolId"
            label="School"
            required
            options={schoolOptions}
            placeholder={loadingSchools ? 'Loading schools...' : 'Select a school...'}
            disabled={isSubmitting || loadingSchools}
          />

          {/* Role & Department */}
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              name="role"
              label="Role"
              required
              options={STAFF_ROLE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
              placeholder="Select role..."
              disabled={isSubmitting}
            />
            <SelectField
              name="departmentId"
              label="Department"
              options={departmentOptions}
              placeholder={!selectedSchoolId ? 'Select a school first...' : loadingDepts ? 'Loading...' : 'Select department...'}
              disabled={isSubmitting || !selectedSchoolId || loadingDepts}
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

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <DateField
              name="beginDate"
              label="Begin Date"
              required
              disabled={isSubmitting}
            />
            <DateField
              name="endDate"
              label="End Date"
              disabled={isSubmitting}
            />
          </div>

          {/* FTE Slider */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[rgb(var(--text-primary))]">
              Full-Time Equivalency (FTE)
            </label>
            <div className="flex items-center gap-4">
              <input
                // allow-native-form-control: range slider has no DS adapter equivalent
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={fteValue ?? 1}
                onChange={(e) => setValue('fullTimeEquivalency', parseFloat(e.target.value), { shouldDirty: true })}
                className="flex-1 h-2 rounded-full appearance-none bg-[rgb(var(--border-primary))] accent-teal-500"
                disabled={isSubmitting}
              />
              <span className="text-sm font-mono font-medium text-[rgb(var(--text-primary))] w-12 text-right">
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
              isLoading={isSubmitting}
              disabled={isSubmitting || loadingSchools}
              className="min-w-36"
            >
              Create Assignment
            </Button>
          </ModalFooter>
        </form>
      </FormProvider>
    </Modal>
  )
}
