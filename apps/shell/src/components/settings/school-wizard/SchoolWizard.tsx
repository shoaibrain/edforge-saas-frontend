/**
 * School Creation/Edit Wizard
 *
 * 5-step wizard using @edforge/wizard's WizardContainer.
 * Steps: Basic Info → Location & Contact → Organization → Ed-Fi → Review.
 *
 * Supports both create and edit modes via the `school` prop.
 */

import { useMemo } from 'react'
import { ArrowLeft, Building2, MapPin, Users, Tag, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { WizardContainer } from '@edforge/wizard'
import type { WizardStep, WizardSubmitResult } from '@edforge/wizard'
import type { SchoolResponseDto } from '@aibrains/shared-types'
import { useAuthStore } from '@/stores/auth.store'
import { useShell, useTenant } from '@/lib/shell-context'
import { tenantService } from '@/services/tenant.service'
import {
  transformWizardDataToDto,
  getDefaultGradeRange,
  getDefaultSchoolDays,
  STEP_INDEX_BASIC,
  fieldPathToStepIndex,
  flattenZodPath,
} from './school-wizard.utils'
import { makeBasicInfoSchema, locationContactSchema, edfiComplianceSchema } from './school-wizard.schemas'
import { BasicInfoStep } from './steps/BasicInfoStep'
import { LocationContactStep } from './steps/LocationContactStep'
import { OrganizationStep } from './steps/OrganizationStep'
import { EdFiComplianceStep } from './steps/EdFiComplianceStep'
import { ReviewStep } from './steps/ReviewStep'

// ============================================================================
// STEP CONFIGURATION
// ============================================================================

/**
 * Build the wizard step config with archetype-aware Step 1 schema.
 * PABSON tenants require emisSchoolCode; others keep it optional. The
 * factory pattern avoids re-instantiating Zod on every render — callers
 * should memoize on `archetype`.
 */
function buildSchoolWizardSteps(archetype: string | null): WizardStep[] {
  return [
    {
      id: 'basic',
      title: 'School Identity',
      description: 'Name, code, type, and grade range',
      icon: Building2,
      schema: makeBasicInfoSchema(archetype),
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
}

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
    emisSchoolCode: school.emisSchoolCode || '',
    schoolType: school.schoolType || 'high',
    'gradeRange.start': school.gradeRange?.start || '9',
    'gradeRange.end': school.gradeRange?.end || '12',
    'address.street1': school.address?.street1 || '',
    'address.street2': school.address?.street2 || '',
    'address.city': school.address?.city || '',
    'address.state': school.address?.state || '',
    'address.zipCode': school.address?.zipCode || '',
    'address.country': school.address?.country || 'USA',
    'address.wardNumber': (school.address as any)?.wardNumber || '',
    'address.municipality': (school.address as any)?.municipality || '',
    'address.district': (school.address as any)?.district || '',
    'address.province': (school.address as any)?.province || '',
    'address.region': (school.address as any)?.region || '',
    phone: school.phone || '',
    email: school.email || '',
    website: school.website || '',
    timezone: school.timezone || 'America/Chicago',
    locale: school.locale || 'en-US',
    academicCalendarType: school.academicCalendarType || 'semester',
    calendarSystem: (school as any).calendarSystem || 'gregorian',
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
  const { resolvedSettings, workspaceConfirmedAt } = useShell()
  const { archetype } = useTenant()
  const queryClient = useQueryClient()
  const isEditMode = !!school

  // Archetype-aware step config. Memoized on `archetype` so Zod schemas
  // aren't rebuilt on every render of SchoolWizard; WizardContainer reads
  // the schema at step-validate time (see WizardContext.tsx:100).
  const steps = useMemo(() => buildSchoolWizardSteps(archetype), [archetype])

  const initialData = useMemo(
    () => {
      if (school) {
        return schoolToWizardData(school)
      }
      const defaultRange = getDefaultGradeRange('high')
      // Sprint A.16 — default `address.country` based on tenant archetype.
      // PABSON tenants (Nepal pilot) default to NPL so the country-adaptive
      // address fieldset renders Nepal-shape on first paint instead of US.
      const defaultCountry = archetype === 'PABSON' ? 'NPL' : 'USA'
      return {
        schoolType: 'high',
        'gradeRange.start': defaultRange.start,
        'gradeRange.end': defaultRange.end,
        'address.country': defaultCountry,
        timezone: resolvedSettings.timezone,
        locale: resolvedSettings.locale,
        calendarSystem: resolvedSettings.calendarSystem,
        academicCalendarType: resolvedSettings.calendarSystem === 'bikram_sambat' ? 'annual' : 'semester',
        schoolDays: getDefaultSchoolDays(resolvedSettings.calendarSystem),
        ...(initialLeaId ? { localEducationAgencyId: initialLeaId } : {}),
      }
    },
    [initialLeaId, school, archetype, resolvedSettings.timezone, resolvedSettings.locale, resolvedSettings.calendarSystem],
  )

  const handleSubmit = async (data: Record<string, unknown>): Promise<void | WizardSubmitResult> => {
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
      const errorData = error?.response?.data
      const errorCode = errorData?.errorCode
      const serverDetails = errorData?.details

      // Sprint C Gap 1/3 — PABSON gate rejection has its own errorCode and a
      // tailored message. Surface inline on Step 1 so the user sees the
      // required-field marker exactly where they need to fix it.
      if (errorCode === 'EMIS_CODE_REQUIRED') {
        const msg = 'IEMIS School Code is required for PABSON tenants — 8–10 digits issued by your local municipality.'
        toast.error(msg)
        return {
          serverErrors: { emisSchoolCode: msg },
          targetStepIndex: STEP_INDEX_BASIC,
        }
      }

      // Zod-based BAD_REQUEST responses carry a structured `errors[]` array
      // ({ path, message, code }). Map each to a flat dotted field path and
      // return them — WizardContext surfaces them inline via WizardStepProps.
      if (Array.isArray(errorData?.errors) && errorData.errors.length > 0) {
        const serverErrors: Record<string, string> = {}
        for (const e of errorData.errors as Array<{ path?: unknown; message?: string }>) {
          const path = flattenZodPath(e.path)
          if (path && e.message) serverErrors[path] = e.message
        }
        if (Object.keys(serverErrors).length > 0) {
          const count = Object.keys(serverErrors).length
          const firstField = Object.keys(serverErrors)[0]
          toast.error(`Validation failed — ${count} field${count === 1 ? '' : 's'} need${count === 1 ? 's' : ''} correction`)
          return {
            serverErrors,
            targetStepIndex: fieldPathToStepIndex(firstField),
          }
        }
      }

      // Fallback for non-field server errors (network, 500, unmapped).
      const message = errorData?.message
        || error?.message
        || `Failed to ${isEditMode ? 'update' : 'create'} school. Please try again.`
      const fieldHint = serverDetails?.field ? ` (field: ${serverDetails.field})` : ''
      toast.error(`${message}${fieldHint}`)
      throw error
    }
  }

  return (
    <>
      {!workspaceConfirmedAt && !isEditMode && (
        <div className="max-w-4xl mx-auto px-6 pt-4">
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-300">
              Workspace settings have not been confirmed. School defaults may be incorrect.{' '}
              <a
                href="/settings/workspace"
                className="font-medium underline hover:no-underline"
              >
                Configure workspace settings first →
              </a>
            </div>
          </div>
        </div>
      )}
      <WizardContainer
        steps={steps}
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={onCancel}
        header={<SchoolWizardHeader onCancel={onCancel} isEditMode={isEditMode} />}
        footerVariant="inline"
        submitText={isEditMode ? 'Save Changes' : 'Create School'}
      />
    </>
  )
}
