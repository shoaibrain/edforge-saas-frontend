/**
 * School Creation Wizard
 *
 * 5-step wizard using @edforge/wizard's WizardContainer.
 * Steps: Basic Info → Location & Contact → Organization → Ed-Fi → Review.
 */

import { useMemo } from 'react'
import { ArrowLeft, Building2, MapPin, Users, Tag, CheckCircle2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { WizardContainer } from '@edforge/wizard'
import type { WizardStep } from '@edforge/wizard'
import { useAuthStore } from '@/stores/auth.store'
import { tenantService } from '@/services/tenant.service'
import { transformWizardDataToDto } from './school-wizard.utils'
import { basicInfoSchema, locationContactSchema } from './school-wizard.schemas'
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

function SchoolWizardHeader({ onCancel }: { onCancel: () => void }) {
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
              Create New School
            </h1>
            <p className="text-sm text-[rgb(var(--text-tertiary))]">
              Complete the wizard to add a school to your organization
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

interface SchoolWizardProps {
  onCancel: () => void
  onSuccess: () => void
  initialLeaId?: string
}

export function SchoolWizard({ onCancel, onSuccess, initialLeaId }: SchoolWizardProps) {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const initialData = useMemo(
    () => ({
      schoolType: 'high',
      'gradeRange.start': '9',
      'gradeRange.end': '12',
      'address.country': 'USA',
      ...(initialLeaId ? { localEducationAgencyId: initialLeaId } : {}),
    }),
    [initialLeaId],
  )

  const handleSubmit = async (data: Record<string, unknown>) => {
    const dto = transformWizardDataToDto(data)
    await tenantService.createSchool(dto)
    queryClient.invalidateQueries({ queryKey: ['schools', user?.tenantId] })
    onSuccess()
  }

  return (
    <WizardContainer
      steps={SCHOOL_WIZARD_STEPS}
      initialData={initialData}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      header={<SchoolWizardHeader onCancel={onCancel} />}
      footerVariant="inline"
      submitText="Create School"
    />
  )
}
