/**
 * LEA Creation Wizard
 *
 * 4-step wizard for creating a Local Education Agency (district).
 * Steps: Org Type -> Details -> Connections -> Review.
 *
 * Uses @edforge/wizard WizardModal for dialog-based multi-step flow.
 */

import { useMemo } from 'react'
import { Building2, FileText, Network, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { WizardModal } from '@edforge/wizard'
import type { WizardStep } from '@edforge/wizard'
import type { CreateLocalEducationAgencyDto } from '@aibrains/shared-types'
import { useCreateLea, useStateEducationAgency } from '@/hooks/useEducationOrgs'
import {
  orgTypeStepSchema,
  detailsStepSchema,
  connectionsStepSchema,
} from './lea-wizard.schemas'
import { OrgTypeStep, DetailsStep, ConnectionsStep, ReviewStep } from './steps'

// ============================================================================
// STEP CONFIGURATION
// ============================================================================

const LEA_WIZARD_STEPS: WizardStep[] = [
  {
    id: 'org-type',
    title: 'Type',
    description: 'Choose the type of district',
    icon: Building2,
    schema: orgTypeStepSchema,
    component: OrgTypeStep,
  },
  {
    id: 'details',
    title: 'Details',
    description: 'Name, ID, and configuration',
    icon: FileText,
    schema: detailsStepSchema,
    component: DetailsStep,
  },
  {
    id: 'connections',
    title: 'Connections',
    description: 'Reporting hierarchy',
    icon: Network,
    schema: connectionsStepSchema,
    component: ConnectionsStep,
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Confirm and create',
    icon: CheckCircle2,
    component: ReviewStep,
  },
]

// ============================================================================
// COMPONENT
// ============================================================================

interface LEAWizardProps {
  open: boolean
  onClose: () => void
  defaultSeaId?: string
  defaultEscId?: string
}

export function LEAWizard({ open, onClose, defaultSeaId, defaultEscId }: LEAWizardProps) {
  const createMutation = useCreateLea()
  const { data: sea } = useStateEducationAgency()

  const initialData = useMemo(
    () => ({
      leaCategoryDescriptor: 'Independent',
      operationalStatusDescriptor: 'Active',
      stateEducationAgencyId: defaultSeaId || sea?.id || '',
      educationServiceCenterId: defaultEscId || '',
      parentLocalEducationAgencyId: '',
      categories: [
        {
          educationOrganizationCategoryDescriptor:
            'uri://ed-fi.org/EducationOrganizationCategoryDescriptor#Local Education Agency',
        },
      ],
    }),
    [defaultSeaId, defaultEscId, sea?.id],
  )

  const handleSubmit = async (data: Record<string, unknown>) => {
    const dto: CreateLocalEducationAgencyDto = {
      localEducationAgencyId: data.localEducationAgencyId as number,
      nameOfInstitution: data.nameOfInstitution as string,
      leaCategoryDescriptor: data.leaCategoryDescriptor as string,
      operationalStatusDescriptor: data.operationalStatusDescriptor as string,
      shortNameOfInstitution: (data.shortNameOfInstitution as string) || undefined,
      webSite: (data.webSite as string) || undefined,
      charterStatusDescriptor: (data.charterStatusDescriptor as string) || undefined,
      stateEducationAgencyId: (data.stateEducationAgencyId as string) || undefined,
      educationServiceCenterId: (data.educationServiceCenterId as string) || undefined,
      parentLocalEducationAgencyId:
        (data.parentLocalEducationAgencyId as string) || undefined,
      categories: [
        {
          educationOrganizationCategoryDescriptor:
            'uri://ed-fi.org/EducationOrganizationCategoryDescriptor#Local Education Agency',
        },
      ],
    }

    return new Promise<void>((resolve, reject) => {
      createMutation.mutate(dto, {
        onSuccess: () => {
          onClose()
          resolve()
        },
        onError: (error) => {
          toast.error('Failed to create district')
          reject(error)
        },
      })
    })
  }

  return (
    <WizardModal
      open={open}
      onClose={onClose}
      steps={LEA_WIZARD_STEPS}
      initialData={initialData}
      onSubmit={handleSubmit}
      title="Create District (LEA)"
      description="Set up a new Local Education Agency in 4 easy steps."
      submitText="Create District"
      size="lg"
    />
  )
}
