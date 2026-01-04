/**
 * New Person Wizard Route
 * 
 * Multi-step wizard for creating new people (students, teachers, staff, guardians).
 * Pre-fills data from Quick Add Modal if available.
 * Dynamically loads wizard steps based on person type.
 * 
 * Uses shared @edforge/wizard package.
 */

import { useMemo } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { WizardContainer } from '@edforge/wizard'
import { 
  getWizardStepsForPersonType, 
  PERSON_TYPE_LABELS,
  type PersonType 
} from '@/config/person-wizard.config'
import { cn } from '@/lib/utils'

// ============================================================================
// WIZARD HEADER COMPONENT
// ============================================================================

function WizardHeader({ personType }: { personType: PersonType }) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-20 bg-[rgb(var(--surface-primary))] border-b border-[rgb(var(--border-primary))]">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate({ to: '/people' as any })}
            className={cn(
              'p-2 rounded-xl',
              'text-[rgb(var(--text-secondary))]',
              'hover:bg-[rgb(var(--interactive-hover))]',
              'transition-colors'
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
              Add New {PERSON_TYPE_LABELS[personType]}
            </h1>
            <p className="text-sm text-[rgb(var(--text-tertiary))]">
              Complete the wizard to create a new profile
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function NewPersonPage() {
  const navigate = useNavigate()
  const search: any = useSearch({ strict: false })

  // Determine person type from search params
  const personType = (search.type || 'student') as PersonType

  // Get wizard steps based on person type
  const wizardSteps = useMemo(() => {
    return getWizardStepsForPersonType(personType)
  }, [personType])

  // Pre-fill data from search params (from Quick Add Modal)
  const initialData = useMemo(() => ({
    firstName: search.firstName || '',
    lastName: search.lastName || '',
    email: search.email || '',
    personType,
  }), [search.firstName, search.lastName, search.email, personType])

  // Handle wizard submission
  const handleSubmit = async (data: Record<string, unknown>) => {
    // TODO: Submit to API
    console.log('Submitting person data:', {
      ...data,
      type: personType,
    })

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Navigate back to people list
    navigate({ to: '/people' as any })
  }

  // Handle wizard cancellation
  const handleCancel = () => {
    navigate({ to: '/people' as any })
  }

  return (
    <WizardContainer
      steps={wizardSteps}
      initialData={initialData}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      header={<WizardHeader personType={personType} />}
      footerVariant="fixed"
      submitText={`Create ${PERSON_TYPE_LABELS[personType]}`}
    />
  )
}
