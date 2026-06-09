/**
 * EnrollExistingStudentModal Component
 *
 * Modal for enrolling an existing student in an academic year.
 * Follows EditStaffModal pattern: react-hook-form + zodResolver,
 * @edforge/ui Modal, dirty form guard, field error mapping.
 *
 * Ed-Fi aligned: Creates a StudentSchoolAssociation with required
 * entry descriptors and enrollment metadata.
 *
 * Sprint 8 - ENRL-02
 */

import { useEffect, useRef, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, GraduationCap } from 'lucide-react'
import { Modal, ModalFooter, Button, Field, Input, Select, Checkbox } from '@edforge/ui'
import { useCreateEnrollment, useAcademicYears } from '../../hooks'
import { useActiveSchoolId } from '../../stores/app.store'
import {
  ENTRY_TYPE_OPTIONS,
  GRADE_LEVEL_DESCRIPTORS,
  RESIDENCY_STATUS_OPTIONS,
} from '../../schemas/edfi-descriptors'
import { parseApiError } from '../../services/academics.service'
import { useSchoolEnabledGradeOptions } from '../../hooks/useGradeOptions'
import { GRADE_LEVEL_OPTIONS } from '../../schemas/course.form'
import type { StudentProfileResponseDto } from '@aibrains/shared-types'

// ============================================================================
// TYPES
// ============================================================================

export interface EnrollExistingStudentModalProps {
  open: boolean
  onClose: () => void
  student: StudentProfileResponseDto
}

// ============================================================================
// FORM SCHEMA
// ============================================================================

const enrollFormSchema = z.object({
  academicYearId: z.string().uuid('Please select an academic year'),
  enrollmentDate: z.string().min(1, 'Entry date is required'),
  gradeLevel: z.string().min(1, 'Grade level is required'),
  enrollmentType: z.enum(['new', 'transfer', 'returning', 're_enrollment']),
  entryTypeDescriptor: z.string().optional(),
  primarySchool: z.boolean(),
  residencyStatusDescriptor: z.string().optional(),
})

type EnrollFormData = z.infer<typeof enrollFormSchema>

// ============================================================================
// ENROLLMENT TYPE OPTIONS
// ============================================================================

const ENROLLMENT_TYPE_OPTIONS = [
  { value: 'new', label: 'New Enrollment' },
  { value: 'returning', label: 'Returning Student' },
  { value: 'transfer', label: 'Transfer' },
  { value: 're_enrollment', label: 'Re-enrollment' },
] as const

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EnrollExistingStudentModal({
  open,
  onClose,
  student,
}: EnrollExistingStudentModalProps) {
  const schoolId = useActiveSchoolId() || ''
  const firstFieldRef = useRef<HTMLButtonElement>(null)
  const enrollMutation = useCreateEnrollment()
  const { options: filteredGradeOptions } = useSchoolEnabledGradeOptions(schoolId || null)

  // Include student's current grade even if outside school range
  const gradeOptions = useMemo(() => {
    const currentGrade = student.currentGradeLevel
    if (!currentGrade) return filteredGradeOptions
    if (filteredGradeOptions.some((o) => o.value === currentGrade)) return filteredGradeOptions
    const extraOpt = GRADE_LEVEL_OPTIONS.find((o) => o.value === currentGrade)
    return extraOpt ? [...filteredGradeOptions, extraOpt] : filteredGradeOptions
  }, [filteredGradeOptions, student.currentGradeLevel])

  // Fetch academic years for this school
  const { data: academicYears = [] } = useAcademicYears(schoolId, !!schoolId)
  const activeYears = academicYears.filter(
    (y: any) => y.status === 'active' || y.status === 'current'
  )

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EnrollFormData>({
    resolver: zodResolver(enrollFormSchema),
    defaultValues: {
      academicYearId: '',
      enrollmentDate: new Date().toISOString().split('T')[0],
      gradeLevel: student.currentGradeLevel || '',
      enrollmentType: 'new',
      entryTypeDescriptor: '',
      primarySchool: true,
      residencyStatusDescriptor: '',
    },
  })

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      reset({
        academicYearId: activeYears.length === 1 ? activeYears[0].yearId : '',
        enrollmentDate: new Date().toISOString().split('T')[0],
        gradeLevel: student.currentGradeLevel || '',
        enrollmentType: 'new',
        entryTypeDescriptor: '',
        primarySchool: true,
        residencyStatusDescriptor: '',
      })
    }
  }, [open, student.currentGradeLevel, activeYears.length])

  // Auto-focus first field when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => firstFieldRef.current?.focus(), 100)
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
    try {
      await enrollMutation.mutateAsync({
        studentId: student.studentId,
        schoolId,
        academicYearId: data.academicYearId,
        gradeLevel: data.gradeLevel,
        enrollmentType: data.enrollmentType,
        enrollmentDate: data.enrollmentDate,
        entryTypeDescriptor: data.entryTypeDescriptor || undefined,
        entryGradeLevelDescriptor:
          GRADE_LEVEL_DESCRIPTORS[data.gradeLevel] || undefined,
        primarySchool: data.primarySchool,
        fullTimeEquivalency: 1.0,
        repeatGradeIndicator: false,
        residencyStatusDescriptor:
          data.residencyStatusDescriptor || undefined,
      })
      onClose()
    } catch (error) {
      const parsed = parseApiError(error as Error)
      if (parsed.statusCode === 409) {
        setError('academicYearId', {
          message: 'Student is already enrolled for this academic year',
        })
      } else if (parsed.message?.includes('active')) {
        setError('academicYearId', {
          message: 'Academic year must be active before enrolling students',
        })
      } else if (parsed.fieldErrors) {
        Object.entries(parsed.fieldErrors).forEach(([field, message]) => {
          setError(field as keyof EnrollFormData, { message })
        })
      }
      // General errors are handled by useCreateEnrollment's onError toast
    }
  })

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="School Enrollment"
      description={`Enroll ${student.fullName} at this school for an academic year`}
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Read-only student info */}
        <div className="p-3 rounded-lg bg-surface-secondary border border-border-secondary">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[rgb(var(--state-info-bg)/0.18)] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-[rgb(var(--action-secondary-fg))]" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">
                {student.fullName}
              </p>
              <p className="text-xs text-text-tertiary">
                {student.studentNumber ? `#${student.studentNumber}` : 'Student'}
                {student.currentGradeLevel &&
                  ` · Grade ${student.currentGradeLevel}`}
              </p>
            </div>
          </div>
        </div>

        {/* Academic Year */}
        <Controller
          name="academicYearId"
          control={control}
          render={({ field, fieldState }) => (
            <Select
              ref={firstFieldRef}
              label="Academic Year"
              required
              value={field.value ?? ''}
              onChange={field.onChange}
              disabled={isSubmitting}
              error={fieldState.error?.message}
              placeholder="Select academic year..."
              helperText={
                activeYears.length === 0
                  ? 'No active academic years found. Activate an academic year in Settings first.'
                  : undefined
              }
              options={activeYears.map((year: any) => ({
                value: year.yearId,
                label: `${year.name || year.yearName || `${year.startYear}-${year.endYear}`}${year.isCurrent ? ' (Current)' : ''}`,
              }))}
            />
          )}
        />

        {/* Entry Date + Grade Level */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Entry Date" required error={errors.enrollmentDate?.message}>
            <Input type="date" {...register('enrollmentDate')} disabled={isSubmitting} />
          </Field>
          <Controller
            name="gradeLevel"
            control={control}
            render={({ field, fieldState }) => (
              <Select
                label="Grade Level"
                required
                value={field.value ?? ''}
                onChange={field.onChange}
                disabled={isSubmitting}
                error={fieldState.error?.message}
                placeholder="Select grade..."
                options={gradeOptions}
              />
            )}
          />
        </div>

        {/* Enrollment Type + Entry Type */}
        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="enrollmentType"
            control={control}
            render={({ field, fieldState }) => (
              <Select
                label="Enrollment Type"
                required
                value={field.value}
                onChange={field.onChange}
                disabled={isSubmitting}
                error={fieldState.error?.message}
                options={ENROLLMENT_TYPE_OPTIONS}
              />
            )}
          />
          <Controller
            name="entryTypeDescriptor"
            control={control}
            render={({ field }) => (
              <Select
                label="Entry Type"
                optionalText={null}
                clearable
                value={field.value ?? ''}
                onChange={(v) => field.onChange(v ?? '')}
                disabled={isSubmitting}
                placeholder="Select (optional)..."
                options={ENTRY_TYPE_OPTIONS}
              />
            )}
          />
        </div>

        {/* Primary School + Residency */}
        <div className="grid grid-cols-2 gap-4">
          <div className="pt-7">
            <Controller
              name="primarySchool"
              control={control}
              render={({ field }) => (
                <Checkbox
                  label="Primary School"
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  disabled={isSubmitting}
                />
              )}
            />
          </div>
          <Controller
            name="residencyStatusDescriptor"
            control={control}
            render={({ field }) => (
              <Select
                label="Residency Status"
                optionalText={null}
                clearable
                value={field.value ?? ''}
                onChange={(v) => field.onChange(v ?? '')}
                disabled={isSubmitting}
                placeholder="Select (optional)..."
                options={RESIDENCY_STATUS_OPTIONS}
              />
            )}
          />
        </div>

        {isDirty && (
          <p className="text-sm text-[rgb(var(--state-warning-fg))]">
            You have unsaved changes
          </p>
        )}

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
            className="min-w-32"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enrolling...
              </>
            ) : (
              <>
                <GraduationCap className="w-4 h-4 mr-2" />
                Enroll at School
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
