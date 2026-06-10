/**
 * Registration Wizard — V2
 *
 * Full-page wizard for creating a new student and enrollment.
 * Uses @edforge/wizard's WizardProvider directly (not WizardContainer)
 * to properly scope the layout within the shell's content area.
 *
 * V2 changes:
 * - Green stepper (replacing amber/golden gradient)
 * - V2 form card wrapper
 * - Context sidebar (260px, hidden below lg)
 * - Green Continue/Create buttons (replacing brand-gradient-warm)
 * - V2 Back button styling
 * - Form actions separator
 *
 * Submit flow:
 *  1. POST /academics/students → gets studentId
 *  2. POST /academics/enrollments (if enrollment data provided)
 *  3. Navigate to the new student's profile
 */

import { useCallback, useState, useEffect, useRef, useMemo } from 'react'
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
  BookOpen,
  Shield,
  ListChecks,
} from 'lucide-react'
import { WizardProvider, useWizard, type WizardStep } from '@edforge/wizard'
import { useCreateStudent, useCreateEnrollment, useCheckDuplicate } from '../../../hooks/useStudents'
import { useActiveSchoolId } from '../../../stores/app.store'
import { useEnrollmentSummary } from '../../../hooks/useEnrollments'
import { useCurrentAcademicYear } from '../../../hooks'
import { parseApiError } from '../../../services/academics.service'
import type { DuplicateMatch } from '../../../services/academics.service'
import { DuplicateWarning } from './DuplicateWarning'
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

import {
  GRADE_LEVEL_DESCRIPTORS,
  ENROLLMENT_TYPE_DESCRIPTOR_MAP,
} from '../../../schemas/edfi-descriptors'
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
    description: 'Set the enrollment type, academic year, and Ed-Fi details.',
    icon: GraduationCap,
    schema: enrollmentStepSchema,
    component: EnrollmentStep,
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
// EDFI REQUIRED FIELDS
// ============================================================================

const EDFI_REQUIRED_FIELDS = [
  { key: 'firstName', label: 'First name', field: 'firstName', step: 1 },
  { key: 'lastName', label: 'Last name', field: 'lastName', step: 1 },
  { key: 'dateOfBirth', label: 'Date of birth', field: 'dateOfBirth', step: 1 },
  { key: 'gender', label: 'Gender', field: 'gender', step: 1 },
  { key: 'gradeLevel', label: 'Grade level', field: 'currentGradeLevel', step: 1 },
  { key: 'entryDate', label: 'Entry date', field: 'enrollment.enrollmentDate', step: 5 },
]

// ============================================================================
// V2 STEPPER
// ============================================================================

function RegistrationStepper() {
  const { steps, getStepStatus, goToStep, canGoToStep } = useWizard()

  return (
    <nav
      aria-label="Registration progress"
      className="w-full rounded-[10px] px-5 py-3.5 bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-primary)/0.35)]"
    >
      <div className="flex items-center">
        {steps.map((step, index) => {
          const status = getStepStatus(index)
          const isClickable = canGoToStep(index)
          const isLast = index === steps.length - 1

          const dotCls =
            status === 'completed'
              ? 'bg-[#1D9E75] text-[#fff]'
              : status === 'current'
                ? 'bg-[rgb(var(--accent-enrollment)/0.2)] border-2 border-[#1D9E75] text-[#1D9E75]'
                : 'bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-disabled))]'
          const labelCls =
            status === 'completed'
              ? 'text-[#1D9E75]'
              : status === 'current'
                ? 'text-[rgb(var(--text-secondary))]'
                : 'text-[rgb(var(--text-disabled))]'

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => isClickable && goToStep(index)}
                disabled={!isClickable}
                className={`flex flex-col items-center gap-1 group relative ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {/* Step dot */}
                <div className={`flex items-center justify-center shrink-0 w-6 h-6 rounded-full text-3xs font-semibold ${dotCls}`}>
                  {status === 'completed' ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Label */}
                <span className={`hidden sm:block text-center leading-tight whitespace-nowrap text-4xs font-medium mt-1 ${labelCls}`}>
                  {step.title}
                </span>
              </button>

              {/* Connecting line */}
              {!isLast && (
                <div className={`flex-1 mx-2 h-px ${status === 'completed' ? 'bg-[#1D9E75]' : 'bg-[rgb(var(--border-primary)/0.35)]'}`} />
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}

// ============================================================================
// STEP CONTENT (animated transitions + de-dup check after Step 1)
// ============================================================================

function StepContent({
  duplicateMatches,
  isDuplicateCheckLoading,
  onDismissDuplicates,
}: {
  duplicateMatches: DuplicateMatch[]
  isDuplicateCheckLoading: boolean
  onDismissDuplicates: () => void
}) {
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

  const showDuplicateWarning = currentStep === 1 && (isDuplicateCheckLoading || duplicateMatches.length > 0)

  return (
    <>
      {showDuplicateWarning && (
        <DuplicateWarning
          matches={duplicateMatches}
          isLoading={isDuplicateCheckLoading}
          onDismiss={onDismissDuplicates}
        />
      )}
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
    </>
  )
}

// ============================================================================
// V2 FOOTER NAVIGATION
// ============================================================================

function RegistrationFooter() {
  const { currentStep, steps, goToBack, goToNext, submit, isSubmitting, currentStepData } = useWizard()
  const isFirst = currentStep === 0
  const isLast = currentStep === steps.length - 1
  const isOptional = currentStepData?.isOptional

  return (
    <div className="sticky bottom-0 z-10 backdrop-blur-sm bg-[rgb(var(--background-secondary))] border-t border-[rgb(var(--border-primary)/0.35)] mt-5 pt-4">
      <div className="flex items-center justify-between">
        <div>
          {!isFirst && (
            <button
              type="button"
              onClick={goToBack}
              className="flex items-center gap-2 transition-colors hover:opacity-80 bg-transparent border border-[rgb(var(--border-primary)/0.35)] rounded-lg px-4 py-2 text-xs text-[rgb(var(--text-tertiary))]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isOptional && !isLast && (
            <button
              type="button"
              onClick={() => goToNext()}
              className="px-4 py-2 text-xs font-medium transition-colors hover:opacity-80 text-[rgb(var(--text-tertiary))]"
            >
              Skip
            </button>
          )}

          {isLast ? (
            <button
              type="button"
              onClick={() => submit()}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-[rgb(var(--action-primary-fg))] rounded-[8px] transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed bg-[rgb(var(--action-primary-bg))]"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Create Student
            </button>
          ) : (
            <button
              type="button"
              onClick={() => goToNext()}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-[rgb(var(--action-primary-fg))] rounded-[8px] transition-all hover:opacity-90 bg-[rgb(var(--action-primary-bg))]"
            >
              Continue
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// V2 CONTEXT SIDEBAR
// ============================================================================

// Theme-aware sidebar card chrome (was a dark-only #161b27 island).
const SIDEBAR_CARD =
  'rounded-[10px] p-3.5 bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-primary)/0.35)]'

function ContextSidebar() {
  const { steps, getStepStatus, formData, currentStep } = useWizard()
  const schoolId = useActiveSchoolId() || ''
  const { data: currentYear } = useCurrentAcademicYear(schoolId)
  const { data: summary } = useEnrollmentSummary({
    schoolId,
    yearId: currentYear?.yearId || '',
    enabled: !!schoolId && !!currentYear?.yearId,
  })

  const gradeLevelCount = Object.keys(summary?.byGradeLevel || {}).length

  // Check EdFi fields — step-aware status
  const edfiStatus = useMemo(() => {
    return EDFI_REQUIRED_FIELDS.map((f) => {
      const parts = f.field.split('.')
      let val: unknown = formData
      for (const p of parts) {
        val = (val as Record<string, unknown>)?.[p]
      }
      return { ...f, filled: !!val }
    })
  }, [formData])

  return (
    <div className="hidden lg:flex flex-col gap-3 shrink-0" style={{ width: 260 }}>
      {/* Card 1: Enrollment Context */}
      <div className={SIDEBAR_CARD}>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-3.5 h-3.5 text-[#1D9E75]" />
          <span className="text-2xs font-medium text-[rgb(var(--text-secondary))]">
            Enrollment Context
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-3xs text-[rgb(var(--text-tertiary))]">Academic Year</span>
            <span className="text-2xs font-medium text-[rgb(var(--text-secondary))]">
              {currentYear?.name ?? '--'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-3xs text-[rgb(var(--text-tertiary))]">Enrolled</span>
            <span className="text-2xs font-medium text-[rgb(var(--text-secondary))]">
              {summary?.totalEnrolled ?? '--'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-3xs text-[rgb(var(--text-tertiary))]">Grade Levels</span>
            <span className="text-2xs font-medium text-[rgb(var(--text-secondary))]">
              {gradeLevelCount || '--'}
            </span>
          </div>
        </div>
      </div>

      {/* Card 2: Required for EdFi */}
      <div className={SIDEBAR_CARD}>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-3.5 h-3.5 text-[#1D9E75]" />
          <span className="text-2xs font-medium text-[rgb(var(--text-secondary))]">
            Required for EdFi
          </span>
        </div>
        <div>
          {edfiStatus.map((f, i) => (
            <div
              key={f.key}
              className="flex items-center justify-between py-1"
              style={{ borderBottom: i < edfiStatus.length - 1 ? '1px solid rgb(var(--border-primary) / 0.2)' : 'none' }}
            >
              <span className="text-3xs text-[rgb(var(--text-tertiary))]">{f.label}</span>
              {f.filled ? (
                <span className="text-2xs font-medium text-[#1D9E75]">Filled</span>
              ) : f.step === currentStep + 1 ? (
                <span className="text-2xs font-medium text-[rgb(var(--state-warning-fg))]">Required</span>
              ) : (
                <span className="text-2xs font-medium text-[rgb(var(--state-warning-fg))]">Step {f.step}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Card 3: Progress */}
      <div className={SIDEBAR_CARD}>
        <div className="flex items-center gap-2 mb-3">
          <ListChecks className="w-3.5 h-3.5 text-[#1D9E75]" />
          <span className="text-2xs font-medium text-[rgb(var(--text-secondary))]">
            Progress
          </span>
        </div>
        <div className="space-y-1.5">
          {steps.map((step, i) => {
            const status = getStepStatus(i)
            const progressLabelCls =
              status === 'completed'
                ? 'text-[#1D9E75]'
                : status === 'current'
                  ? 'text-[rgb(var(--text-secondary))]'
                  : 'text-[rgb(var(--text-disabled))]'
            return (
              <div key={step.id} className="flex items-center gap-2">
                {status === 'completed' ? (
                  <div className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#1D9E75]">
                    <Check className="w-2.5 h-2.5 text-[rgb(var(--action-primary-fg))]" />
                  </div>
                ) : status === 'current' ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-[#1D9E75] bg-transparent" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full bg-[rgb(var(--background-tertiary))]" />
                )}
                <span className={`text-3xs ${progressLabelCls}`}>
                  {step.title}
                </span>
                <span className={`ml-auto text-4xs ${status === 'completed' ? 'text-[#1D9E75]' : status === 'current' ? 'text-[rgb(var(--text-tertiary))]' : 'text-[rgb(var(--text-disabled))]'}`}>
                  {status === 'completed' ? 'Done' : status === 'current' ? 'Current' : ''}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// WIZARD LAYOUT (V2)
// ============================================================================

function WizardLayout({
  schoolId,
}: {
  schoolId: string
}) {
  const { currentStep, currentStepData, formData } = useWizard()
  const checkDuplicate = useCheckDuplicate()
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatch[]>([])
  const [isDuplicateCheckLoading, setIsDuplicateCheckLoading] = useState(false)
  const [duplicateDismissed, setDuplicateDismissed] = useState(false)
  const prevStepRef = useRef(0)

  // Trigger de-dup check when user moves from step 0 → step 1
  useEffect(() => {
    if (prevStepRef.current === 0 && currentStep === 1 && !duplicateDismissed) {
      const firstName = formData.firstName as string
      const lastName = formData.lastName as string
      const dateOfBirth = formData.dateOfBirth as string

      if (firstName && lastName && dateOfBirth && schoolId) {
        setIsDuplicateCheckLoading(true)
        checkDuplicate.mutate(
          { firstName, lastName, dateOfBirth, schoolId },
          {
            onSuccess: (result) => {
              setDuplicateMatches(result.matches || [])
              setIsDuplicateCheckLoading(false)
            },
            onError: () => {
              setDuplicateMatches([])
              setIsDuplicateCheckLoading(false)
            },
          },
        )
      }
    }
    prevStepRef.current = currentStep
  }, [currentStep, formData, schoolId, checkDuplicate, duplicateDismissed])

  const handleDismissDuplicates = useCallback(() => {
    setDuplicateMatches([])
    setDuplicateDismissed(true)
  }, [])

  return (
    <div className="flex flex-col min-h-0">
      {/* Stepper */}
      <div className="px-6 py-4">
        <RegistrationStepper />
      </div>

      {/* Screen reader step announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Step {currentStep + 1} of {WIZARD_STEPS.length}: {currentStepData.title}
      </div>

      {/* Main content area: Form + Sidebar */}
      <div className="flex gap-5 px-6 pb-6 pt-2 min-h-0">
        {/* Form Card */}
        <div className="flex-1 min-w-0">
          <div className="bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-primary)/0.35)] rounded-xl p-6">
            {/* Section title */}
            <motion.div
              key={`title-${currentStep}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5"
            >
              <h2 className="font-semibold text-sm tracking-[-0.2px] text-[rgb(var(--text-primary))]">
                {currentStepData.title}
              </h2>
              {currentStepData.description && (
                <p className="mt-1 text-2xs text-[rgb(var(--text-tertiary))]">
                  {currentStepData.description}
                </p>
              )}
            </motion.div>

            {/* Step content */}
            <StepContent
              duplicateMatches={duplicateMatches}
              isDuplicateCheckLoading={isDuplicateCheckLoading}
              onDismissDuplicates={handleDismissDuplicates}
            />

            {/* Footer */}
            <RegistrationFooter />
          </div>
        </div>

        {/* Context Sidebar */}
        <ContextSidebar />
      </div>
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

  const cleanAddress = useCallback(
    (addr: Record<string, unknown> | undefined) => {
      if (!addr) return undefined
      const cleaned: Record<string, string | undefined> = {
        street1: (addr.street1 as string) || (addr.street as string) || undefined,
        street2: (addr.street2 as string) || undefined,
        city: (addr.city as string) || undefined,
        state: (addr.state as string) || undefined,
        zipCode: (addr.zipCode as string) || (addr.postalCode as string) || undefined,
        country: (addr.country as string) || undefined,
      }
      const result = Object.fromEntries(
        Object.entries(cleaned).filter(([, v]) => v !== undefined && v !== '')
      )
      return Object.keys(result).length > 0 ? result : undefined
    },
    []
  )

  const buildStudentPayload = useCallback(
    (data: Record<string, unknown>): CreateStudentDto => {
      const guardians = (data.guardians as GuardianFormData[] | undefined)?.filter(
        (g) => g.firstName && g.lastName
      )

      const rawContact = data.contactInfo as Record<string, unknown> | undefined
      const contactInfo = rawContact
        ? {
            email: (rawContact.email as string) || undefined,
            phone: (rawContact.phone as string) || undefined,
            phoneType: (rawContact.phoneType as string) || undefined,
            address: cleanAddress(rawContact.address as Record<string, unknown> | undefined),
            mailingAddress: cleanAddress(rawContact.mailingAddress as Record<string, unknown> | undefined),
            useMailingAddress: rawContact.useMailingAddress as boolean | undefined,
          }
        : undefined

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
        contactInfo: contactInfo as CreateStudentDto['contactInfo'],
        guardians: guardians && guardians.length > 0
          ? (guardians as CreateStudentDto['guardians'])
          : undefined,
        medicalInfo: data.medicalInfo as CreateStudentDto['medicalInfo'],
        ethnicity: (data.ethnicity as string) || undefined,
        primaryLanguage: (data.primaryLanguage as string) || undefined,
        homeLanguage: (data.homeLanguage as string) || undefined,
        countryOfBirth: (data.countryOfBirth as string) || undefined,
        notes: (data.notes as string) || undefined,
      }
    },
    [schoolId, cleanAddress]
  )

  const buildEnrollmentPayload = useCallback(
    (
      data: Record<string, unknown>,
      studentId: string
    ): CreateEnrollmentDto | null => {
      const enrollment = data.enrollment as Record<string, unknown> | undefined
      if (!enrollment || !enrollment.enrollmentDate) return null

      const academicYearId = enrollment.academicYearId as string
      if (!academicYearId) return null

      const gradeLevel = data.currentGradeLevel as string
      const enrollmentType =
        (enrollment.enrollmentType as 'new' | 'transfer' | 'returning' | 're_enrollment') || 'new'

      return {
        studentId,
        schoolId: schoolId || '',
        academicYearId,
        gradeLevel,
        enrollmentType,
        enrollmentDate: enrollment.enrollmentDate as string,
        previousSchoolName: (enrollment.previousSchoolName as string) || undefined,
        previousSchoolAddress:
          (enrollment.previousSchoolAddress as string) || undefined,
        transferReason: (enrollment.transferReason as string) || undefined,
        notes: (enrollment.notes as string) || undefined,
        entryGradeLevelDescriptor: GRADE_LEVEL_DESCRIPTORS[gradeLevel] || undefined,
        entryTypeDescriptor: (enrollment.entryTypeDescriptor as string) || undefined,
        enrollmentTypeDescriptor: ENROLLMENT_TYPE_DESCRIPTOR_MAP[enrollmentType] || undefined,
        residencyStatusDescriptor: (enrollment.residencyStatusDescriptor as string) || undefined,
        primarySchool: enrollment.primarySchool as boolean ?? true,
        fullTimeEquivalency: (enrollment.fullTimeEquivalency as number) ?? 1.0,
        repeatGradeIndicator: (enrollment.repeatGradeIndicator as boolean) ?? false,
      }
    },
    [schoolId]
  )

  const handleSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        const studentPayload = buildStudentPayload(data)
        const student = await createStudent.mutateAsync(studentPayload)

        const enrollmentPayload = buildEnrollmentPayload(data, student.studentId)
        if (enrollmentPayload) {
          try {
            await createEnrollment.mutateAsync(enrollmentPayload)
            toast.success(`${student.firstName} ${student.lastName} has been registered and enrolled!`)
          } catch (enrollErr) {
            const parsed = parseApiError(enrollErr)
            if (parsed.statusCode === 409) {
              toast.warning(
                `Student created. Enrollment conflict: ${parsed.message}. The student may already be enrolled.`
              )
            } else {
              toast.warning(
                `Student created, but enrollment failed: ${parsed.message}. You can add enrollment from the student profile.`
              )
            }
          }
        } else {
          toast.success(`${student.firstName} ${student.lastName} has been registered!`)
        }

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
        autoSaveKey={schoolId ? `edforge:student-registration:${schoolId}` : undefined}
      >
        <WizardLayout schoolId={schoolId || ''} />
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
