/**
 * Organization Step
 *
 * Step 3: District (LEA) assignment and principal information.
 * All fields are optional — the step itself is skippable.
 */

import { motion } from 'framer-motion'
import type { WizardStepProps } from '@edforge/wizard'
import { AnimatedInput, AnimatedSelect } from './BasicInfoStep'
import { useLocalEducationAgencies } from '@/hooks/useEducationOrgs'

export function OrganizationStep({ data, updateData, errors, clearError }: WizardStepProps) {
  const { data: leaList } = useLocalEducationAgencies()
  const leas = leaList?.items || []

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    updateData({ [field]: e.target.value })
    clearError(field)
  }

  const leaOptions = [
    { value: '', label: 'No district assigned' },
    ...leas.map((lea) => ({
      value: lea.id,
      label: lea.nameOfInstitution,
    })),
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* LEA Assignment */}
      <div>
        <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wider font-medium mb-3">
          District Assignment
        </p>
        <AnimatedSelect
          label="Local Education Agency (District)"
          value={(data.localEducationAgencyId as string) || ''}
          onChange={handleChange('localEducationAgencyId')}
          options={leaOptions}
        />
        <p className="mt-1.5 text-xs text-[rgb(var(--text-tertiary))]">
          Assign this school to a district for Ed-Fi reporting.
        </p>
      </div>

      {/* Principal Information */}
      <div className="pt-4 border-t border-[rgb(var(--border-secondary))]">
        <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wider font-medium mb-3">
          Principal Information
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatedInput
            label="Principal Name"
            placeholder="e.g., Dr. Jane Smith"
            autoComplete="name"
            maxLength={100}
            value={(data.principalName as string) || ''}
            onChange={handleChange('principalName')}
            error={errors.principalName}
          />
          <AnimatedInput
            label="Principal Email"
            type="email"
            placeholder="principal@school.edu"
            autoComplete="email"
            value={(data.principalEmail as string) || ''}
            onChange={handleChange('principalEmail')}
            error={errors.principalEmail}
          />
        </div>
      </div>
    </motion.div>
  )
}
