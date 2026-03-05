/**
 * School Creation/Edit Wizard
 *
 * 5-step wizard using @edforge/wizard's WizardContainer.
 * Steps: Basic Info → Location & Contact → Organization → Ed-Fi → Review.
 *
 * Supports both create and edit modes via the `school` prop.
 */

import { useMemo } from 'react'
import { ArrowLeft, Building2, MapPin, Users, Tag, CheckCircle2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { WizardContainer } from '@edforge/wizard'
import type { WizardStep } from '@edforge/wizard'
import type { SchoolResponseDto } from '@aibrains/shared-types'
import { useAuthStore } from '@/stores/auth.store'
import { tenantService } from '@/services/tenant.service'
import { transformWizardDataToDto, getDefaultGradeRange } from './school-wizard.utils'
import { basicInfoSchema, locationContactSchema, edfiComplianceSchema } from './school-wizard.schemas'
import { BasicInfoStep } from './steps/BasicInfoStep'
import { LocationContactStep } from './steps/LocationContactStep'
import { OrganizationStep } from './steps/OrganizationStep'
import { EdFiComplianceStep } from './steps/EdFiComplianceStep'
import { ReviewStep } from './steps/ReviewStep'

// ============================================================================
// STEP CONFIGURATION
// ============================================================================

const SCHOOL_WIZARD_STEPS: WizardStep[] = [
  {
    id: 'basic',
    title: 'School Identity',
    description: 'Name, code, type, and grade range',
    icon: Building2,
    schema: basicInfoSchema,
    component: BasicInfoStep,
  },
  {
    id: 'location-contact',
    title: 'Location & Contact',
    description: 'Physical address, phone, email, and website',
    icon: MapPin,
    isOptional: true,
    schema: locationContactSchema,
    component: LocationContactStep,
  },
  {
    id: 'organization',
    title: 'Organization',
    description: 'District assignment and principal',
    icon: Users,
    isOptional: true,
    component: OrganizationStep,
  },
  {
    id: 'edfi',
    title: 'Ed-Fi Compliance',
    description: 'Categories, descriptors, and classification',
    icon: Tag,
    isOptional: true,
    schema: edfiComplianceSchema,
    component: EdFiComplianceStep,
  },
  {
    id: 'review',
    title: 'Review & Create',
    description: 'Confirm details and create school',
    icon: CheckCircle2,
    component: ReviewStep,
  },
]

// ============================================================================
// WIZARD HEADER
// ============================================================================

function SchoolWizardHeader({ onCancel, isEditMode }: { onCancel: () => void; isEditMode: boolean }) {
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
              {isEditMode ? 'Edit School' : 'Create New School'}
            </h1>
            <p className="text-sm text-[rgb(var(--text-tertiary))]">
              {isEditMode
                ? 'Update school details and configuration'
                : 'Complete the wizard to add a school to your organization'}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}

// ============================================================================
// HELPERS
// ============================================================================

/** Flatten a SchoolResponseDto into flat wizard data keys */
function schoolToWizardData(school: SchoolResponseDto): Record<string, unknown> {
  return {
    name: school.name || '',
    shortName: school.shortName || '',
    schoolCode: school.schoolCode || '',
    schoolType: school.schoolType || 'high',
    'gradeRange.start': school.gradeRange?.start || '9',
    'gradeRange.end': school.gradeRange?.end || '12',
    'address.street1': school.address?.street1 || '',
    'address.street2': school.address?.street2 || '',
    'address.city': school.address?.city || '',
    'address.state': school.address?.state || '',
    'address.zipCode': school.address?.zipCode || '',
    'address.country': school.address?.country || 'USA',
    phone: school.phone || '',
    email: school.email || '',
    website: school.website || '',
    timezone: school.timezone || 'America/Chicago',
    academicCalendarType: school.academicCalendarType || 'semester',
    principalName: school.principalName || '',
    principalEmail: school.principalEmail || '',
    localEducationAgencyId: school.localEducationAgencyId || '',
    schoolCategories: school.schoolCategories || [],
    schoolTypeDescriptor: school.schoolTypeDescriptor || '',
    gradeLevels: school.gradeLevels || [],
    charterStatusDescriptor: school.charterStatusDescriptor || '',
    administrativeFundingControlDescriptor: school.administrativeFundingControlDescriptor || '',
    titleIPartASchoolDesignationDescriptor: school.titleIPartASchoolDesignationDescriptor || '',
    identificationCodes: school.identificationCodes || [],
    institutionTelephones: school.institutionTelephones || [],
    accountabilityRatings: school.accountabilityRatings || [],
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface SchoolWizardProps {
  onCancel: () => void
  onSuccess: () => void
  initialLeaId?: string
  /** If provided, the wizard runs in edit mode */
  school?: SchoolResponseDto
}

export function SchoolWizard({ onCancel, onSuccess, initialLeaId, school }: SchoolWizardProps) {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const isEditMode = !!school

  const initialData = useMemo(
    () => {
      if (school) {
        return schoolToWizardData(school)
      }
      const defaultRange = getDefaultGradeRange('high')
      return {
        schoolType: 'high',
        'gradeRange.start': defaultRange.start,
        'gradeRange.end': defaultRange.end,
        'address.country': 'USA',
        ...(initialLeaId ? { localEducationAgencyId: initialLeaId } : {}),
      }
    },
    [initialLeaId, school],
  )

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      if (isEditMode && school) {
        const dto = transformWizardDataToDto(data)
        await tenantService.updateSchool(school.schoolId, dto as any)
        queryClient.invalidateQueries({ queryKey: ['schools', user?.tenantId] })
        toast.success('School updated successfully')
      } else {
        const dto = transformWizardDataToDto(data)
        await tenantService.createSchool(dto)
        queryClient.invalidateQueries({ queryKey: ['schools', user?.tenantId] })
        toast.success('School created successfully')
      }
      onSuccess()
    } catch (error: any) {
      const message = error?.response?.data?.message
        || error?.message
        || `Failed to ${isEditMode ? 'update' : 'create'} school. Please try again.`
      toast.error(message)
      throw error
    }
  }

  return (
    <WizardContainer
      steps={SCHOOL_WIZARD_STEPS}
      initialData={initialData}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      header={<SchoolWizardHeader onCancel={onCancel} isEditMode={isEditMode} />}
      footerVariant="inline"
      submitText={isEditMode ? 'Save Changes' : 'Create School'}
    />
  )
}
