/**
 * EditStudentModal Component
 *
 * Modal for editing student demographic and contact information.
 * Follows EditStaffModal pattern: react-hook-form + zodResolver,
 * @edforge/ui Modal, dirty form guard, field error mapping.
 *
 * Sprint 8 - EDIT-01
 */

import { useEffect, useRef, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Save } from 'lucide-react'
import { Modal, ModalFooter, Button } from '@edforge/ui'
import { useUpdateStudent } from '../../hooks'
import { parseApiError } from '../../services/academics.service'
import { useActiveSchoolId } from '../../stores/app.store'
import { useSchoolEnabledGradeOptions } from '../../hooks/useGradeOptions'
import { GRADE_LEVEL_OPTIONS } from '../../schemas/course.form'
import type { StudentProfileResponseDto } from '@aibrains/shared-types'

// ============================================================================
// TYPES
// ============================================================================

export interface EditStudentModalProps {
  open: boolean
  onClose: () => void
  student: StudentProfileResponseDto
}

// ============================================================================
// FORM SCHEMA
// ============================================================================

const editStudentFormSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  middleName: z.string().max(50).optional().or(z.literal('')),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  currentGradeLevel: z.string().min(1, 'Grade level is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
})

type EditStudentFormData = z.infer<typeof editStudentFormSchema>

// ============================================================================
// OPTIONS
// ============================================================================

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
] as const

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EditStudentModal({
  open,
  onClose,
  student,
}: EditStudentModalProps) {
  const firstInputRef = useRef<HTMLInputElement>(null)
  const updateMutation = useUpdateStudent()
  const schoolId = useActiveSchoolId()
  const { options: filteredGradeOptions } = useSchoolEnabledGradeOptions(schoolId)

  // Include student's current grade even if outside school range
  const gradeOptions = useMemo(() => {
    const currentGrade = student.currentGradeLevel
    if (!currentGrade) return filteredGradeOptions
    if (filteredGradeOptions.some((o) => o.value === currentGrade)) return filteredGradeOptions
    const extraOpt = GRADE_LEVEL_OPTIONS.find((o) => o.value === currentGrade)
    return extraOpt ? [...filteredGradeOptions, extraOpt] : filteredGradeOptions
  }, [filteredGradeOptions, student.currentGradeLevel])

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EditStudentFormData>({
    resolver: zodResolver(editStudentFormSchema),
  })

  // Reset form when student changes or modal opens
  useEffect(() => {
    if (open && student) {
      reset({
        firstName: student.firstName,
        lastName: student.lastName,
        middleName: student.middleName || '',
        dateOfBirth: student.dateOfBirth || '',
        gender: student.gender as EditStudentFormData['gender'],
        currentGradeLevel: student.currentGradeLevel || '',
        email: student.contactInfo?.email || '',
        phone: student.contactInfo?.phone || '',
      })
    }
  }, [open, student, reset])

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
      await updateMutation.mutateAsync({
        studentId: student.studentId,
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          middleName: data.middleName || undefined,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          currentGradeLevel: data.currentGradeLevel,
          contactInfo: {
            email: data.email || undefined,
            phone: data.phone || undefined,
          },
        },
      })
      onClose()
    } catch (error) {
      const parsed = parseApiError(error as Error)
      if (parsed.fieldErrors) {
        Object.entries(parsed.fieldErrors).forEach(([field, message]) => {
          setError(field as keyof EditStudentFormData, { message })
        })
      }
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
      title="Edit Student"
      description={`Update information for ${student.fullName}`}
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Student Number (read-only) */}
        {student.studentNumber && (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Student Number
            </label>
            <div className="px-3 py-2 rounded-lg border border-border-secondary bg-surface-tertiary text-text-secondary">
              {student.studentNumber}
            </div>
            <p className="mt-1 text-xs text-text-tertiary">
              Student number cannot be changed
            </p>
          </div>
        )}

        {/* Name Row */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-text-primary mb-1.5">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              id="firstName"
              type="text"
              {...register('firstName')}
              ref={(e) => {
                register('firstName').ref(e)
                if (e) firstInputRef.current = e
              }}
              className={inputClass(!!errors.firstName)}
              placeholder="First name"
              disabled={isSubmitting}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-500">{errors.firstName.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="middleName" className="block text-sm font-medium text-text-primary mb-1.5">
              Middle Name
            </label>
            <input
              id="middleName"
              type="text"
              {...register('middleName')}
              className={inputClass(!!errors.middleName)}
              placeholder="Middle name"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-text-primary mb-1.5">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              id="lastName"
              type="text"
              {...register('lastName')}
              className={inputClass(!!errors.lastName)}
              placeholder="Last name"
              disabled={isSubmitting}
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-500">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* DOB + Gender */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-text-primary mb-1.5">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input
              id="dateOfBirth"
              type="date"
              {...register('dateOfBirth')}
              className={inputClass(!!errors.dateOfBirth)}
              disabled={isSubmitting}
            />
            {errors.dateOfBirth && (
              <p className="mt-1 text-sm text-red-500">{errors.dateOfBirth.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-text-primary mb-1.5">
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              id="gender"
              {...register('gender')}
              className={inputClass(!!errors.gender)}
              disabled={isSubmitting}
            >
              {GENDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {errors.gender && (
              <p className="mt-1 text-sm text-red-500">{errors.gender.message}</p>
            )}
          </div>
        </div>

        {/* Grade Level */}
        <div>
          <label htmlFor="currentGradeLevel" className="block text-sm font-medium text-text-primary mb-1.5">
            Grade Level <span className="text-red-500">*</span>
          </label>
          <select
            id="currentGradeLevel"
            {...register('currentGradeLevel')}
            className={inputClass(!!errors.currentGradeLevel)}
            disabled={isSubmitting}
          >
            <option value="">Select grade...</option>
            {gradeOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {errors.currentGradeLevel && (
            <p className="mt-1 text-sm text-red-500">{errors.currentGradeLevel.message}</p>
          )}
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className={inputClass(!!errors.email)}
              placeholder="student@example.com"
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-text-primary mb-1.5">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              {...register('phone')}
              className={inputClass(!!errors.phone)}
              placeholder="+1 (555) 123-4567"
              disabled={isSubmitting}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
            )}
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
            className="min-w-[100px]"
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
