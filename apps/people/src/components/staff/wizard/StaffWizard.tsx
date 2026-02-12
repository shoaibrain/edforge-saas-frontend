/**
 * Staff Creation Wizard
 *
 * 5-step wizard using @edforge/wizard's WizardContainer.
 * Steps: Personal Info → Contact → Employment → Assignment → Review.
 *
 * Supports atomic staff + user creation via POST /staff/with-user
 * when the user account toggle is enabled in the Employment step.
 */

import { useMemo } from 'react'
import { ArrowLeft, User, Mail, Briefcase, Building2, CheckCircle2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { WizardContainer } from '@edforge/wizard'
import type { WizardStep } from '@edforge/wizard'
import { staffService } from '../../../services/staff.service'
import { staffKeys } from '../../../hooks/useStaff'
import {
  personalInfoStepSchema,
  contactStepSchema,
  employmentStepSchema,
  assignmentStepSchema,
} from './staff-wizard.schemas'
import {
  defaultStaffFormData,
  transformWizardDataToStaffDto,
  getAdditionalAssignments,
} from './staff-wizard.utils'
import {
  PersonalInfoStep,
  ContactStep,
  EmploymentStep,
  AssignmentStep,
  ReviewStep,
} from './steps'

// ============================================================================
// STEP CONFIGURATION
// ============================================================================

const STAFF_WIZARD_STEPS: WizardStep[] = [
  {
    id: 'personal',
    title: 'Personal Info',
    description: 'Name, ID, and demographics',
    icon: User,
    schema: personalInfoStepSchema,
    component: PersonalInfoStep,
  },
  {
    id: 'contact',
    title: 'Contact',
    description: 'Email, phone, addresses, and emergency contacts',
    icon: Mail,
    schema: contactStepSchema,
    isOptional: false,
    component: ContactStep,
  },
  {
    id: 'employment',
    title: 'Employment',
    description: 'Role, type, department, and account setup',
    icon: Briefcase,
    schema: employmentStepSchema,
    component: EmploymentStep,
  },
  {
    id: 'assignment',
    title: 'Assignment',
    description: 'Primary school and additional assignments',
    icon: Building2,
    schema: assignmentStepSchema,
    component: AssignmentStep,
  },
  {
    id: 'review',
    title: 'Review & Create',
    description: 'Confirm details and create staff record',
    icon: CheckCircle2,
    component: ReviewStep,
  },
]

// ============================================================================
// WIZARD HEADER
// ============================================================================

function StaffWizardHeader({ onCancel }: { onCancel: () => void }) {
  return (
    <header className="sticky top-0 z-20 bg-[rgb(var(--surface-primary))] border-b border-[rgb(var(--border-primary))]">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="p-2 rounded-xl text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--interactive-hover))] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
              Add Staff Member
            </h1>
            <p className="text-sm text-[rgb(var(--text-tertiary))]">
              Complete the wizard to create a new staff record
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface StaffWizardProps {
  onCancel: () => void
  onSuccess?: (staffId: string) => void
  initialSchoolId?: string
}

export function StaffWizard({ onCancel, onSuccess, initialSchoolId }: StaffWizardProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const initialData = useMemo(
    () => ({
      ...defaultStaffFormData,
      hireDate: new Date().toISOString().split('T')[0],
      ...(initialSchoolId ? { primarySchoolId: initialSchoolId } : {}),
    }),
    [initialSchoolId],
  )

  const handleSubmit = async (data: Record<string, unknown>) => {
    const dto = transformWizardDataToStaffDto(data)
    const createAccount = data.createUserAccount === true

    let staffId: string

    if (createAccount) {
      const result = await staffService.createStaffWithUser(dto as any)
      staffId = result.staff.staffId
      toast.success('Staff member and user account created successfully')
    } else {
      const result = await staffService.createStaff(dto as any)
      staffId = result.staffId
      toast.success('Staff member created successfully')
    }

    // Create additional school assignments
    const additionalAssignments = getAdditionalAssignments(data)
    for (const assignment of additionalAssignments) {
      try {
        await staffService.createAssignment(staffId, {
          schoolId: assignment.schoolId,
          role: (assignment.role || (data.role as string)) as any,
          beginDate: assignment.beginDate,
          fullTimeEquivalency: assignment.fullTimeEquivalency,
          department: assignment.department || undefined,
          isPrimary: false,
        })
      } catch {
        toast.warning(`Could not create additional assignment. You can add it from the staff profile.`)
      }
    }

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: staffKeys.lists() })
    queryClient.invalidateQueries({ queryKey: ['users'] })

    if (onSuccess) {
      onSuccess(staffId)
    } else {
      navigate({ to: '/staff/$staffId', params: { staffId } })
    }
  }

  return (
    <WizardContainer
      steps={STAFF_WIZARD_STEPS}
      initialData={initialData}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      header={<StaffWizardHeader onCancel={onCancel} />}
      footerVariant="inline"
      submitText="Create Staff Member"
    />
  )
}
