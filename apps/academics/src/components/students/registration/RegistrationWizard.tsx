/**
 * Registration Wizard
 *
 * Full-page wizard for creating a new student and enrollment.
 * Uses @edforge/wizard's WizardProvider directly (not WizardContainer)
 * to properly scope the layout within the shell's content area.
 *
 * Submit flow:
 *  1. POST /academics/students → gets studentId
 *  2. POST /academics/enrollments (if enrollment data provided)
 *  3. Navigate to the new student's profile
 */

import { useCallback, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Phone,
  Users,
  Heart,
  GraduationCap,
  ClipboardCheck,
  Check,
  ArrowLeft,
  ArrowRight,
  Loader2,
  X,
} from 'lucide-react'
import { WizardProvider, useWizard, type WizardStep } from '@edforge/wizard'
import { useCreateStudent, useCreateEnrollment } from '../../../hooks/useStudents'
import { useActiveSchoolId } from '../../../stores/app.store'
import { parseApiError } from '../../../services/academics.service'
import {
  personalInfoStepSchema,
  contactInfoStepSchema,
  guardiansStepSchema,
  medicalStepSchema,
  enrollmentStepSchema,
  defaultStudentFormData,
} from '../../../schemas/student.form'
import { ConfirmationDialog } from '../../common'

import { PersonalInfoStep } from './steps/PersonalInfoStep'
import { ContactInfoStep } from './steps/ContactInfoStep'
import { GuardiansStep } from './steps/GuardiansStep'
import { MedicalStep } from './steps/MedicalStep'
import { EnrollmentStep } from './steps/EnrollmentStep'
import { ReviewStep } from './steps/ReviewStep'

import type { CreateStudentDto, CreateEnrollmentDto } from '../../../services/academics.service'
import type { GuardianFormData } from '../../../schemas/student.form'

// ============================================================================
// WIZARD STEPS CONFIGURATION
// ============================================================================

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'personal',
    title: 'Personal Info',
    description: "Enter the student's basic personal details.",
    icon: User,
    schema: personalInfoStepSchema,
    component: PersonalInfoStep,
  },
  {
    id: 'contact',
    title: 'Contact',
    description: 'Provide contact details and address information.',
    icon: Phone,
    schema: contactInfoStepSchema,
    component: ContactInfoStep,
  },
  {
    id: 'guardians',
    title: 'Guardians',
    description: "Add the student's parents or legal guardians.",
    icon: Users,
    schema: guardiansStepSchema,
    component: GuardiansStep,
    isOptional: true,
  },
  {
    id: 'medical',
    title: 'Medical',
    description: 'Provide health information and demographic details.',
    icon: Heart,
    schema: medicalStepSchema,
    component: MedicalStep,
    isOptional: true,
  },
  {
    id: 'enrollment',
    title: 'Enrollment',
    description: 'Set the enrollment type and date.',
    icon: GraduationCap,
    schema: enrollmentStepSchema,
    component: EnrollmentStep,
    isOptional: true,
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Review all information before creating the student record.',
    icon: ClipboardCheck,
    component: ReviewStep,
  },
]

// ============================================================================
// STEPPER
// ============================================================================

function RegistrationStepper() {
  const { steps, currentStep: _currentStep, getStepStatus, goToStep, canGoToStep } = useWizard()

  return (
    <nav
      aria-label="Registration progress"
      className="w-full max-w-3xl mx-auto px-6 py-6"
    >
      <div className="flex items-center">
        {steps.map((step, index) => {
          const status = getStepStatus(index)
          const Icon = step.icon
          const isClickable = canGoToStep(index)
          const isLast = index === steps.length - 1

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              {/* Step circle + label */}
              <button
                type="button"
                onClick={() => isClickable && goToStep(index)}
                disabled={!isClickable}
                className={`
                  flex flex-col items-center gap-1.5 group relative
                  ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                `}
                aria-current={status === 'current' ? 'step' : undefined}
              >
                {/* Circle */}
                <motion.div
                  initial={false}
                  animate={{
                    scale: status === 'current' ? 1 : 0.9,
                  }}
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center
                    text-xs font-semibold transition-all duration-300 shrink-0
                    ${status === 'completed'
                      ? 'bg-teal-500 text-white shadow-sm shadow-teal-500/30'
                      : status === 'current'
                        ? 'bg-gradient-to-br from-golden-500 to-caramel-500 text-white shadow-md shadow-golden-500/30 ring-[3px] ring-golden-500/20'
                        : 'bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-tertiary))] border border-[rgb(var(--border-primary))]'
                    }
                  `}
                >
                  {status === 'completed' ? (
                    <Check className="w-4 h-4" />
                  ) : status === 'current' ? (
                    <Icon className="w-4 h-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </motion.div>

                {/* Label */}
                <span
                  className={`
                    text-[11px] font-medium text-center leading-tight whitespace-nowrap
                    hidden sm:block
                    ${status === 'current'
                      ? 'text-[rgb(var(--text-primary))]'
                      : status === 'completed'
                        ? 'text-teal-400'
                        : 'text-[rgb(var(--text-tertiary))]'
                    }
                  `}
                >
                  {step.title}
                </span>
              </button>

              {/* Connecting line */}
              {!isLast && (
                <div className="flex-1 mx-2 h-[2px] rounded-full bg-[rgb(var(--border-primary))] relative overflow-hidden">
                  <motion.div
                    initial={false}
                    animate={{ scaleX: status === 'completed' ? 1 : 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    style={{ originX: 0 }}
                    className="absolute inset-0 bg-gradient-to-r from-teal-500 to-teal-400"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}

// ============================================================================
// STEP CONTENT (animated transitions)
// ============================================================================

function StepContent() {
  const {
    currentStep,
    currentStepData,
    formData,
    updateData,
    goToNext,
    goToBack,
    errors,
    clearError,
    steps,
  } = useWizard()

  const StepComponent = currentStepData.component
  const isFirst = currentStep === 0
  const isLast = currentStep === steps.length - 1

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <StepComponent
          data={formData}
          updateData={updateData}
          onNext={goToNext}
          onBack={goToBack}
          isFirst={isFirst}
          isLast={isLast}
          errors={errors}
          clearError={clearError}
        />
      </motion.div>
    </AnimatePresence>
  )
}

// ============================================================================
// FOOTER NAVIGATION (sticky, scoped to content area)
// ============================================================================

function RegistrationFooter() {
  const { currentStep, steps, goToBack, goToNext, submit, isSubmitting, currentStepData } = useWizard()
  const isFirst = currentStep === 0
  const isLast = currentStep === steps.length - 1
  const isOptional = currentStepData?.isOptional

  return (
    <div className="sticky bottom-0 z-10 bg-[rgb(var(--surface-primary))]/95 backdrop-blur-sm border-t border-[rgb(var(--border-secondary))]">
      <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
        <div>
          {!isFirst && (
            <button
              type="button"
              onClick={goToBack}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-secondary))] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Skip button for optional steps */}
          {isOptional && !isLast && (
            <button
              type="button"
              onClick={() => goToNext()}
              className="px-4 py-2 text-sm font-medium text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] transition-colors"
            >
              Skip
            </button>
          )}

          {isLast ? (
            <button
              type="button"
              onClick={() => submit()}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white brand-gradient-warm rounded-xl shadow-md shadow-golden-500/20 hover:opacity-90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Create Student
            </button>
          ) : (
            <button
              type="button"
              onClick={() => goToNext()}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white brand-gradient-warm rounded-xl shadow-md shadow-golden-500/20 hover:opacity-90 hover:shadow-lg transition-all"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// WIZARD LAYOUT (replaces WizardContainer)
// ============================================================================

function WizardLayout({ onCancel }: { onCancel: () => void }) {
  const { currentStep, currentStepData } = useWizard()

  return (
    <div className="flex flex-col min-h-0">
      {/* Header */}
      <div className="border-b border-[rgb(var(--border-secondary))] bg-[rgb(var(--surface-primary))] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-[rgb(var(--text-primary))]">
              Register New Student
            </h1>
            <p className="text-sm text-[rgb(var(--text-tertiary))]">
              Complete the steps below to add a new student.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-secondary))] rounded-lg transition-colors"
            aria-label="Cancel registration"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stepper */}
      <div className="border-b border-[rgb(var(--border-secondary))] bg-[rgb(var(--surface-secondary))]">
        <RegistrationStepper />
      </div>

      {/* Step title */}
      <motion.div
        key={`title-${currentStep}`}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto w-full px-6 pt-8 pb-2"
      >
        <h2 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
          {currentStepData.title}
        </h2>
        {currentStepData.description && (
          <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
            {currentStepData.description}
          </p>
        )}
      </motion.div>

      {/* Step content */}
      <div className="max-w-3xl mx-auto w-full px-6 pb-8 pt-4">
        <StepContent />
      </div>

      {/* Sticky footer — scoped to this content area, not the viewport */}
      <RegistrationFooter />
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RegistrationWizard() {
  const navigate = useNavigate()
  const schoolId = useActiveSchoolId()
  const createStudent = useCreateStudent()
  const createEnrollment = useCreateEnrollment()
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  // Build CreateStudentDto from the flat wizard data
  const buildStudentPayload = useCallback(
    (data: Record<string, unknown>): CreateStudentDto => {
      const guardians = (data.guardians as GuardianFormData[] | undefined)?.filter(
        (g) => g.firstName && g.lastName
      )

      return {
        firstName: data.firstName as string,
        lastName: data.lastName as string,
        middleName: (data.middleName as string) || undefined,
        preferredName: (data.preferredName as string) || undefined,
        suffix: (data.suffix as string) || undefined,
        dateOfBirth: data.dateOfBirth as string,
        gender: data.gender as 'male' | 'female' | 'other' | 'prefer_not_to_say',
        schoolId: schoolId || '',
        currentGradeLevel: data.currentGradeLevel as string,
        contactInfo: data.contactInfo as CreateStudentDto['contactInfo'],
        guardians: guardians && guardians.length > 0
          ? (guardians as CreateStudentDto['guardians'])
          : undefined,
        medicalInfo: data.medicalInfo as CreateStudentDto['medicalInfo'],
        specialPrograms: (data.specialPrograms as string[])?.length
          ? (data.specialPrograms as string[])
          : undefined,
        accommodations: (data.accommodations as string[])?.length
          ? (data.accommodations as string[])
          : undefined,
        ethnicity: (data.ethnicity as string) || undefined,
        primaryLanguage: (data.primaryLanguage as string) || undefined,
        homeLanguage: (data.homeLanguage as string) || undefined,
        countryOfBirth: (data.countryOfBirth as string) || undefined,
        notes: (data.notes as string) || undefined,
      }
    },
    [schoolId]
  )

  // Build CreateEnrollmentDto from enrollment sub-object
  const buildEnrollmentPayload = useCallback(
    (
      data: Record<string, unknown>,
      studentId: string
    ): CreateEnrollmentDto | null => {
      const enrollment = data.enrollment as Record<string, unknown> | undefined
      if (!enrollment || !enrollment.enrollmentDate) return null

      return {
        studentId,
        schoolId: schoolId || '',
        academicYearId: (enrollment.academicYearId as string) || crypto.randomUUID(),
        gradeLevel: data.currentGradeLevel as string,
        enrollmentType:
          (enrollment.enrollmentType as 'new' | 'transfer' | 'returning') || 'new',
        enrollmentDate: enrollment.enrollmentDate as string,
        previousSchoolName: (enrollment.previousSchoolName as string) || undefined,
        previousSchoolAddress:
          (enrollment.previousSchoolAddress as string) || undefined,
        transferReason: (enrollment.transferReason as string) || undefined,
        notes: (enrollment.notes as string) || undefined,
      }
    },
    [schoolId]
  )

  // Submit handler: create student -> optionally create enrollment -> navigate
  const handleSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        const studentPayload = buildStudentPayload(data)
        const student = await createStudent.mutateAsync(studentPayload)

        const enrollmentPayload = buildEnrollmentPayload(data, student.studentId)
        if (enrollmentPayload) {
          try {
            await createEnrollment.mutateAsync(enrollmentPayload)
          } catch (enrollErr) {
            const parsed = parseApiError(enrollErr)
            toast.warning(
              `Student created, but enrollment failed: ${parsed.message}. You can add enrollment later.`
            )
          }
        }

        toast.success(`${student.firstName} ${student.lastName} has been registered!`)
        navigate({ to: `/students/${student.studentId}` })
      } catch (error) {
        const parsed = parseApiError(error)
        toast.error(parsed.message)
        throw error
      }
    },
    [buildStudentPayload, buildEnrollmentPayload, createStudent, createEnrollment, navigate]
  )

  const handleCancel = useCallback(() => {
    setShowCancelDialog(true)
  }, [])

  const handleConfirmCancel = useCallback(() => {
    setShowCancelDialog(false)
    navigate({ to: '/students' })
  }, [navigate])

  return (
    <>
      <WizardProvider
        steps={WIZARD_STEPS}
        initialData={{
          ...defaultStudentFormData,
          schoolId: schoolId || '',
        }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      >
        <WizardLayout onCancel={handleCancel} />
      </WizardProvider>

      <ConfirmationDialog
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleConfirmCancel}
        title="Discard changes?"
        description="You have unsaved student information. Are you sure you want to leave? All entered data will be lost."
        confirmText="Discard"
        cancelText="Keep Editing"
        variant="destructive"
      />
    </>
  )
}
