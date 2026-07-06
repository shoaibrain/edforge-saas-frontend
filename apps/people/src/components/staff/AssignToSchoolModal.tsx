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
import { useTranslation } from '@edforge/i18n'
import { Modal, ModalFooter, Button } from '../ui'
import { useCreateAssignment } from '../../hooks'
import { useSchools } from '../../hooks/useSchools'
import { STAFF_ROLE_OPTIONS } from './wizard/staff-wizard.utils'
import { useDepartments } from './wizard/steps/AssignmentStep'
import { getRoleI18nKey } from './StaffRoleBadge'
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
  const { t } = useTranslation('people')
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
        t('common.unsavedCloseConfirm')
      )
      if (!confirmed) return
    }
    onClose()
  }

  const onSubmit = handleSubmit(async (data) => {
    try {
      await createAssignment.mutateAsync({ staffId, data })
      toast.success(t('assignments.toasts.created'))
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
  const roleOptions = STAFF_ROLE_OPTIONS.map((option) => ({
    value: option.value,
    label: t(`roles.${getRoleI18nKey(option.value)}`, { defaultValue: option.label }),
  }))

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t('assignments.assignTitle')}
      description={t('assignments.assignDescription', { name: staffName })}
      size="lg"
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="space-y-4">
          {/* School */}
          <SelectField
            ref={firstInputRef}
            name="schoolId"
            label={t('wizard.assignment.school')}
            required
            options={schoolOptions}
            placeholder={loadingSchools ? t('wizard.assignment.loadingSchools') : t('wizard.assignment.selectSchool')}
            disabled={isSubmitting || loadingSchools}
          />

          {/* Role & Department */}
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              name="role"
              label={t('fields.role')}
              required
              options={roleOptions}
              placeholder={t('wizard.placeholders.selectRole')}
              disabled={isSubmitting}
            />
            <SelectField
              name="departmentId"
              label={t('fields.department')}
              options={departmentOptions}
              placeholder={!selectedSchoolId ? t('assignments.placeholders.selectSchoolFirst') : loadingDepts ? t('common.loading') : t('wizard.placeholders.selectDepartment')}
              disabled={isSubmitting || !selectedSchoolId || loadingDepts}
            />
          </div>

          {/* Position Title */}
          <TextField
            name="positionTitle"
            label={t('fields.positionTitle')}
            type="text"
            placeholder={t('assignments.placeholders.positionTitle')}
            disabled={isSubmitting}
          />

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <DateField
              name="beginDate"
              label={t('fields.beginDate')}
              required
              disabled={isSubmitting}
            />
            <DateField
              name="endDate"
              label={t('fields.endDate')}
              disabled={isSubmitting}
            />
          </div>

          {/* FTE Slider */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[rgb(var(--text-primary))]">
              {t('wizard.assignment.fte')}
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
              <span className="text-sm font-mono font-medium text-[rgb(var(--text-primary))] w-12 text-end">
                {(fteValue ?? 1).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Primary */}
          <CheckboxField
            name="isPrimary"
            label={t('assignments.setPrimary')}
            disabled={isSubmitting}
          />

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {t('actions.cancel')}
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting || loadingSchools}
              className="min-w-36"
            >
              {t('assignments.createAssignment')}
            </Button>
          </ModalFooter>
        </form>
      </FormProvider>
    </Modal>
  )
}
