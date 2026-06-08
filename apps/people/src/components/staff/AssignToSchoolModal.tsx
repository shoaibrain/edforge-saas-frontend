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
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Plus } from 'lucide-react'
import { assignStaffToSchoolSchema, type AssignStaffToSchoolDto } from '@aibrains/shared-types'
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

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AssignStaffToSchoolDto>({
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
      title="Assign to School"
      description={`Create a new school assignment for ${staffName}`}
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {/* School */}
        <div>
          <label htmlFor="assign-schoolId" className="block text-sm font-medium text-text-primary mb-1.5">
            School <span className="text-[rgb(var(--state-danger-fg))]">*</span>
          </label>
          <select
            id="assign-schoolId"
            {...register('schoolId')}
            ref={(e) => {
              register('schoolId').ref(e)
              if (e) firstInputRef.current = e
            }}
            className={inputClass(!!errors.schoolId)}
            disabled={isSubmitting || loadingSchools}
          >
            <option value="">
              {loadingSchools ? 'Loading schools...' : 'Select a school...'}
            </option>
            {schools.map((school) => (
              <option key={school.schoolId} value={school.schoolId}>
                {school.localEducationAgencyName
                  ? `${school.name} (${school.localEducationAgencyName})`
                  : school.name}
              </option>
            ))}
          </select>
          {errors.schoolId && (
            <p className="mt-1 text-sm text-[rgb(var(--state-danger-fg))]">{errors.schoolId.message}</p>
          )}
        </div>

        {/* Role & Department */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="assign-role" className="block text-sm font-medium text-text-primary mb-1.5">
              Role <span className="text-[rgb(var(--state-danger-fg))]">*</span>
            </label>
            <select
              id="assign-role"
              {...register('role')}
              className={inputClass(!!errors.role)}
              disabled={isSubmitting}
            >
              <option value="">Select role...</option>
              {STAFF_ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-[rgb(var(--state-danger-fg))]">{errors.role.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="assign-departmentId" className="block text-sm font-medium text-text-primary mb-1.5">
              Department
            </label>
            <select
              id="assign-departmentId"
              {...register('departmentId')}
              className={inputClass(!!errors.departmentId)}
              disabled={isSubmitting || !selectedSchoolId || loadingDepts}
            >
              <option value="">
                {!selectedSchoolId ? 'Select a school first...' : loadingDepts ? 'Loading...' : 'Select department...'}
              </option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Position Title */}
        <div>
          <label htmlFor="assign-positionTitle" className="block text-sm font-medium text-text-primary mb-1.5">
            Position Title
          </label>
          <input
            id="assign-positionTitle"
            type="text"
            {...register('positionTitle')}
            className={inputClass(!!errors.positionTitle)}
            placeholder="e.g., Lead Teacher"
            disabled={isSubmitting}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="assign-beginDate" className="block text-sm font-medium text-text-primary mb-1.5">
              Begin Date <span className="text-[rgb(var(--state-danger-fg))]">*</span>
            </label>
            <input
              id="assign-beginDate"
              type="date"
              {...register('beginDate')}
              className={inputClass(!!errors.beginDate)}
              disabled={isSubmitting}
            />
            {errors.beginDate && (
              <p className="mt-1 text-sm text-[rgb(var(--state-danger-fg))]">{errors.beginDate.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="assign-endDate" className="block text-sm font-medium text-text-primary mb-1.5">
              End Date <span className="text-xs text-text-tertiary">(optional)</span>
            </label>
            <input
              id="assign-endDate"
              type="date"
              {...register('endDate')}
              className={inputClass(!!errors.endDate)}
              disabled={isSubmitting}
            />
          </div>
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
            id="assign-isPrimary"
            type="checkbox"
            {...register('isPrimary')}
            className="w-4 h-4 rounded border-border-secondary text-[rgb(var(--action-secondary-fg))] focus:ring-2 focus:ring-accent-primary/20"
            disabled={isSubmitting}
          />
          <label htmlFor="assign-isPrimary" className="text-sm text-text-primary">
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
            disabled={isSubmitting || loadingSchools}
            className="min-w-36"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Assignment
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
