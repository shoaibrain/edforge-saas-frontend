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

import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, GraduationCap } from 'lucide-react'
import { Modal, ModalFooter, Button } from '@edforge/ui'
import { useCreateEnrollment, useAcademicYears } from '../../hooks'
import { useActiveSchoolId } from '../../stores/app.store'
import {
  ENTRY_TYPE_OPTIONS,
  GRADE_LEVEL_DESCRIPTORS,
  RESIDENCY_STATUS_OPTIONS,
} from '../../schemas/edfi-descriptors'
import { parseApiError } from '../../services/academics.service'
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
// GRADE LEVEL OPTIONS
// ============================================================================

const GRADE_LEVEL_OPTIONS = Object.entries(GRADE_LEVEL_DESCRIPTORS).map(
  ([value, label]) => ({ value, label })
)

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
  const firstInputRef = useRef<HTMLSelectElement>(null)
  const enrollMutation = useCreateEnrollment()

  // Fetch academic years for this school
  const { data: academicYears = [] } = useAcademicYears(schoolId, !!schoolId)
  const activeYears = academicYears.filter(
    (y: any) => y.status === 'active' || y.status === 'current'
  )

  const {
    register,
    handleSubmit,
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

  // Auto-focus first input when modal opens
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

  const inputClass = (hasError: boolean) => `
    w-full px-3 py-2 rounded-lg border
    bg-surface-secondary text-text-primary
    placeholder:text-text-tertiary
    focus:outline-none focus:ring-2 focus:ring-accent-primary/20
    transition-colors
    ${hasError ? 'border-red-500' : 'border-border-secondary'}
  `

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
            <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-teal-500" />
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
        <div>
          <label
            htmlFor="academicYearId"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Academic Year <span className="text-red-500">*</span>
          </label>
          <select
            id="academicYearId"
            {...register('academicYearId')}
            ref={(e) => {
              register('academicYearId').ref(e)
              if (e) firstInputRef.current = e
            }}
            className={inputClass(!!errors.academicYearId)}
            disabled={isSubmitting}
          >
            <option value="">Select academic year...</option>
            {activeYears.map((year: any) => (
              <option key={year.yearId} value={year.yearId}>
                {year.name || year.yearName || `${year.startYear}-${year.endYear}`}
                {year.isCurrent ? ' (Current)' : ''}
              </option>
            ))}
          </select>
          {errors.academicYearId && (
            <p className="mt-1 text-sm text-red-500">
              {errors.academicYearId.message}
            </p>
          )}
          {activeYears.length === 0 && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              No active academic years found. Activate an academic year in
              Settings first.
            </p>
          )}
        </div>

        {/* Entry Date + Grade Level */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="enrollmentDate"
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              Entry Date <span className="text-red-500">*</span>
            </label>
            <input
              id="enrollmentDate"
              type="date"
              {...register('enrollmentDate')}
              className={inputClass(!!errors.enrollmentDate)}
              disabled={isSubmitting}
            />
            {errors.enrollmentDate && (
              <p className="mt-1 text-sm text-red-500">
                {errors.enrollmentDate.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="gradeLevel"
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              Grade Level <span className="text-red-500">*</span>
            </label>
            <select
              id="gradeLevel"
              {...register('gradeLevel')}
              className={inputClass(!!errors.gradeLevel)}
              disabled={isSubmitting}
            >
              <option value="">Select grade...</option>
              {GRADE_LEVEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.gradeLevel && (
              <p className="mt-1 text-sm text-red-500">
                {errors.gradeLevel.message}
              </p>
            )}
          </div>
        </div>

        {/* Enrollment Type + Entry Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="enrollmentType"
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              Enrollment Type <span className="text-red-500">*</span>
            </label>
            <select
              id="enrollmentType"
              {...register('enrollmentType')}
              className={inputClass(!!errors.enrollmentType)}
              disabled={isSubmitting}
            >
              {ENROLLMENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.enrollmentType && (
              <p className="mt-1 text-sm text-red-500">
                {errors.enrollmentType.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="entryTypeDescriptor"
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              Entry Type
            </label>
            <select
              id="entryTypeDescriptor"
              {...register('entryTypeDescriptor')}
              className={inputClass(!!errors.entryTypeDescriptor)}
              disabled={isSubmitting}
            >
              <option value="">Select (optional)...</option>
              {ENTRY_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Primary School + Residency */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 pt-6">
            <input
              id="primarySchool"
              type="checkbox"
              {...register('primarySchool')}
              className="w-4 h-4 rounded border-border-secondary text-teal-500 focus:ring-teal-500/20"
              disabled={isSubmitting}
            />
            <label
              htmlFor="primarySchool"
              className="text-sm font-medium text-text-primary"
            >
              Primary School
            </label>
          </div>
          <div>
            <label
              htmlFor="residencyStatusDescriptor"
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              Residency Status
            </label>
            <select
              id="residencyStatusDescriptor"
              {...register('residencyStatusDescriptor')}
              className={inputClass(false)}
              disabled={isSubmitting}
            >
              <option value="">Select (optional)...</option>
              {RESIDENCY_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isDirty && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
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
            className="min-w-[120px]"
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
