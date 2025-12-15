/**
 * New Person Wizard Route
 * 
 * Multi-step wizard for creating new people (students, teachers, staff, guardians).
 * Pre-fills data from Quick Add Modal if available.
 */

import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { ArrowLeft, User, Mail, MapPin, Briefcase, Check } from 'lucide-react'
import { Wizard, type WizardStep } from '@/components/wizard'
import { PersonalInfoStep, ContactAddressStep } from '@/components/wizard/steps'
import { cn } from '@/lib/utils'

// ============================================================================
// ROUTE SEARCH PARAMS VALIDATION
// ============================================================================

const searchParamsSchema = z.object({
  type: z.enum(['student', 'teacher', 'staff', 'guardian']).optional().default('student'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
})

export const Route = createFileRoute('/_protected/people/new')({
  validateSearch: searchParamsSchema,
  component: NewPersonPage,
})

// ============================================================================
// ROLE SPECIFIC STEP (PLACEHOLDER)
// ============================================================================

function RoleSpecificStep({ data }: { data: Record<string, unknown> }) {
  const personType = data.personType as string || 'student'
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="bg-[rgb(var(--surface-tertiary))] rounded-xl p-6 border border-[rgb(var(--border-primary))]">
        <p className="text-[rgb(var(--text-secondary))]">
          Role-specific fields for <span className="font-semibold capitalize">{personType}</span> will be added here.
        </p>
        <p className="text-sm text-[rgb(var(--text-tertiary))] mt-2">
          This step captures information specific to the selected person type.
        </p>
      </div>
    </motion.div>
  )
}

// ============================================================================
// REVIEW STEP (PLACEHOLDER)
// ============================================================================

function ReviewStep({ data }: { data: Record<string, unknown> }) {
  const sections = [
    {
      title: 'Personal Information',
      icon: User,
      fields: [
        { label: 'Name', value: `${data.firstName || ''} ${data.middleName || ''} ${data.lastName || ''}`.trim() },
        { label: 'Date of Birth', value: data.dateOfBirth as string },
        { label: 'Gender', value: data.gender as string },
      ],
    },
    {
      title: 'Contact Information',
      icon: Mail,
      fields: [
        { label: 'Email', value: data.email as string },
        { label: 'Secondary Email', value: data.secondaryEmail as string },
      ],
    },
    {
      title: 'Address',
      icon: MapPin,
      fields: [
        { label: 'Street', value: (data.address as any)?.street },
        { label: 'City', value: (data.address as any)?.city },
        { label: 'State', value: (data.address as any)?.state },
        { label: 'Country', value: (data.address as any)?.country },
      ],
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="bg-teal-500/10 dark:bg-cyan-500/10 rounded-xl p-4 border border-teal-500/20 dark:border-cyan-500/20">
        <p className="text-sm text-teal-700 dark:text-cyan-300">
          Please review the information below before submitting.
        </p>
      </div>

      {sections.map((section) => (
        <div
          key={section.title}
          className="bg-[rgb(var(--surface-secondary))] rounded-xl border border-[rgb(var(--border-primary))] overflow-hidden"
        >
          <div className="px-4 py-3 bg-[rgb(var(--surface-tertiary))] border-b border-[rgb(var(--border-secondary))] flex items-center gap-2">
            <section.icon className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
            <h3 className="text-sm font-medium text-[rgb(var(--text-primary))]">{section.title}</h3>
          </div>
          <div className="p-4 grid grid-cols-2 gap-4">
            {section.fields.map((field) => (
              <div key={field.label}>
                <p className="text-xs text-[rgb(var(--text-tertiary))]">{field.label}</p>
                <p className="text-sm text-[rgb(var(--text-primary))]">{field.value || '-'}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  )
}

// ============================================================================
// WIZARD STEPS CONFIGURATION
// ============================================================================

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'personal',
    title: 'Personal Information',
    description: 'Basic details about the person',
    icon: User,
    component: PersonalInfoStep,
  },
  {
    id: 'contact',
    title: 'Contact & Address',
    description: 'How to reach this person',
    icon: Mail,
    component: ContactAddressStep,
  },
  {
    id: 'role',
    title: 'Role Details',
    description: 'Information specific to their role',
    icon: Briefcase,
    component: RoleSpecificStep as any,
  },
  {
    id: 'review',
    title: 'Review & Confirm',
    description: 'Verify all information',
    icon: Check,
    component: ReviewStep as any,
  },
]

// ============================================================================
// WIZARD HEADER COMPONENT
// ============================================================================

function WizardHeader() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/_protected/people/new' })

  const personTypeLabels: Record<string, string> = {
    student: 'Student',
    teacher: 'Teacher',
    staff: 'Staff',
    guardian: 'Guardian',
  }

  return (
    <header className="sticky top-0 z-20 bg-[rgb(var(--surface-primary))] border-b border-[rgb(var(--border-primary))]">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate({ to: '/people' })}
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
              Add New {personTypeLabels[search.type || 'student']}
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

function NewPersonPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/_protected/people/new' })

  // Pre-fill data from search params
  const initialData = {
    firstName: search.firstName || '',
    lastName: search.lastName || '',
    email: search.email || '',
    personType: search.type || 'student',
  }

  const handleSubmit = async (data: Record<string, unknown>) => {
    // TODO: Submit to API
    console.log('Submitting person data:', data)
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    // Navigate back to people list
    navigate({ to: '/people' })
  }

  return (
    <Wizard
      steps={WIZARD_STEPS}
      initialData={initialData}
      onSubmit={handleSubmit}
      header={<WizardHeader />}
      footerVariant="fixed"
      submitText="Create Person"
    />
  )
}

