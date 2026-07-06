/**
 * PersonForm Component
 * 
 * A composable, type-aware form for creating/editing people.
 * Dynamically shows relevant fields based on person type.
 */

import { useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  GraduationCap, 
  Briefcase, 
  Users,
  Shield,
  Save,
  X,
  type LucideIcon
} from 'lucide-react'
import { Button } from '@edforge/ui'
import { SelectField } from './fields'
import {
  PersonalInfoSection,
  ContactInfoSection,
  AddressSection,
  EmploymentSection,
  StudentSection,
  GuardianSection,
  TeacherSection,
} from './sections'
import {
  personSchema,
  type PersonFormValues,
} from '../../schemas/person.schema'

// ============================================================================
// TYPE CONFIGURATION
// ============================================================================

type PersonType = 'student' | 'teacher' | 'staff' | 'guardian' | 'admin'

interface TypeConfig {
  label: string
  icon: LucideIcon
  color: string
}

const TYPE_CONFIG: Record<PersonType, TypeConfig> = {
  student: {
    label: 'Student',
    icon: GraduationCap,
    color: 'text-golden-500',
  },
  teacher: {
    label: 'Teacher',
    icon: User,
    color: 'text-[rgb(var(--action-secondary-fg))]',
  },
  staff: {
    label: 'Staff',
    icon: Briefcase,
    color: 'text-aqua-500',
  },
  guardian: {
    label: 'Guardian',
    icon: Users,
    color: 'text-vanilla-600',
  },
  admin: {
    label: 'Administrator',
    icon: Shield,
    color: 'text-caramel-500',
  },
}

const TYPE_OPTIONS = Object.entries(TYPE_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
  icon: config.icon,
}))

// ============================================================================
// PERSON FORM PROPS
// ============================================================================

export interface PersonFormProps {
  /** Initial values for editing */
  defaultValues?: Record<string, any>
  /** Lock the person type (for editing) */
  lockedType?: PersonType
  /** Callback when form is submitted */
  onSubmit: (data: Record<string, any>) => void
  /** Callback when form is cancelled */
  onCancel?: () => void
  /** Whether form is submitting */
  isSubmitting?: boolean
  /** Mode: create or edit */
  mode?: 'create' | 'edit'
}

// ============================================================================
// PERSON FORM COMPONENT
// ============================================================================

export function PersonForm({
  defaultValues,
  lockedType,
  onSubmit,
  onCancel,
  isSubmitting = false,
  mode = 'create',
}: PersonFormProps) {
  // Initialize form with react-hook-form
  const methods = useForm({
    resolver: zodResolver(personSchema),
    defaultValues: {
      type: lockedType || 'student',
      status: 'active',
      ...defaultValues,
    },
    mode: 'onChange',
  })

  const {
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = methods

  const selectedType = watch('type') as PersonType
  const typeConfig = TYPE_CONFIG[selectedType]

  // Reset form when type changes (except when locked)
  useEffect(() => {
    if (!lockedType && mode === 'create') {
      const currentType = selectedType
      reset({
        type: currentType,
        status: 'active',
      } as PersonFormValues)
    }
  }, [selectedType, lockedType, mode, reset])

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Type Selector */}
        {!lockedType && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-primary))]"
          >
            <SelectField
              name="type"
              label="Person Type"
              placeholder="Select type"
              options={TYPE_OPTIONS}
              required
              helperText="Select the type of person you want to add"
            />

            {/* Type Indicator */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-[rgb(var(--background-tertiary))]"
            >
              <typeConfig.icon className={`w-5 h-5 ${typeConfig.color}`} />
              <span className="text-sm text-[rgb(var(--text-secondary))]">
                Adding a new <strong className="text-[rgb(var(--text-primary))]">{typeConfig.label}</strong>
              </span>
            </motion.div>
          </motion.div>
        )}

        {/* Dynamic Form Sections */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedType}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Common Sections */}
            <PersonalInfoSection />
            <ContactInfoSection 
              showPreferredContact={selectedType === 'guardian'}
            />
            <AddressSection />

            {/* Type-Specific Sections */}
            {selectedType === 'student' && (
              <StudentSection showMedical showTransport />
            )}

            {selectedType === 'teacher' && (
              <>
                <EmploymentSection />
                <TeacherSection showClassroom showQualifications />
              </>
            )}

            {selectedType === 'staff' && (
              <EmploymentSection showSalary />
            )}

            {selectedType === 'admin' && (
              <EmploymentSection showSalary />
            )}

            {selectedType === 'guardian' && (
              <GuardianSection showEmployment showPermissions />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Form Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-end gap-3 pt-4 border-t border-[rgb(var(--border-primary))]"
        >
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 me-2" />
              Cancel
            </Button>
          )}
          
          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="min-w-32"
          >
            {isSubmitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-[rgb(var(--border-secondary))] border-t-white rounded-full"
              />
            ) : (
              <>
                <Save className="w-4 h-4 me-2" />
                {mode === 'create' ? 'Create Person' : 'Save Changes'}
              </>
            )}
          </Button>
        </motion.div>

        {/* Debug: Show errors in development */}
        {import.meta.env.DEV && Object.keys(errors).length > 0 && (
          <div className="p-4 rounded-xl bg-rust-500/10 border border-rust-500/20">
            <p className="text-sm font-medium text-rust-500 mb-2">Form Errors:</p>
            <pre className="text-xs text-rust-400 overflow-auto">
              {JSON.stringify(errors, null, 2)}
            </pre>
          </div>
        )}
      </form>
    </FormProvider>
  )
}

