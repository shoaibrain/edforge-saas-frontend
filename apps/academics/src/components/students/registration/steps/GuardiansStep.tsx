/**
 * Guardians Step
 *
 * Third step of the student registration wizard.
 * Dynamic list of guardians with add/remove capability.
 */

import { useCallback } from 'react'
import { FormProvider } from 'react-hook-form'
import { Plus, Users } from 'lucide-react'
import type { WizardStepProps } from '@edforge/wizard'
import { useWizardForm } from '../../../../hooks/useWizardForm'
import { GuardianForm } from '../GuardianForm'
import type { GuardianFormData } from '../../../../schemas/student.form'
import { useAcademicsI18n } from '../../../../lib/i18n'

const EMPTY_GUARDIAN: GuardianFormData = {
  firstName: '',
  lastName: '',
  relationship: '',
  email: '',
  phone: '',
  phoneType: '',
  alternatePhone: '',
  isPrimary: false,
  hasPortalAccess: false,
  canPickup: true,
  employer: '',
  occupation: '',
}

export function GuardiansStep({
  data,
  updateData,
  errors,
  clearError,
}: WizardStepProps) {
  const { t } = useAcademicsI18n()
  const form = useWizardForm({ data, updateData, errors, clearError })
  const guardians = (data.guardians as GuardianFormData[] | undefined) ?? []

  const addGuardian = useCallback(() => {
    const newGuardian = {
      ...EMPTY_GUARDIAN,
      isPrimary: guardians.length === 0, // First guardian is primary by default
    }
    updateData({ guardians: [...guardians, newGuardian] })
    // Also update the form so RHF stays in sync
    form.setValue('guardians' as never, [...guardians, newGuardian] as never)
  }, [guardians, updateData, form])

  const removeGuardian = useCallback(
    (index: number) => {
      const next = guardians.filter((_, i) => i !== index)
      updateData({ guardians: next })
      form.setValue('guardians' as never, next as never)
    },
    [guardians, updateData, form]
  )

  return (
    <FormProvider {...form}>
      <div className="space-y-6">
        {/* Guardian Cards */}
        {guardians.length > 0 ? (
          <div className="space-y-4">
            {guardians.map((_, index) => (
              <GuardianForm
                key={index}
                index={index}
                onRemove={() => removeGuardian(index)}
                canRemove={guardians.length > 1}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="rounded-xl border-2 border-dashed border-[rgb(var(--border-secondary))] p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-[rgb(var(--background-secondary))] flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-[rgb(var(--text-tertiary))]" />
            </div>
            <h3 className="text-sm font-medium text-[rgb(var(--text-primary))]">
              {t('enrollmentModule.step.guardians.emptyTitle')}
            </h3>
            <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1 mb-4">
              {t('enrollmentModule.step.guardians.emptyDescription')}
            </p>
          </div>
        )}

        {/* Add Guardian Button */}
        {guardians.length < 10 && (
          <button
            type="button"
            onClick={addGuardian}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-[rgb(var(--border-secondary))] text-sm font-medium text-[rgb(var(--action-secondary-fg))] hover:bg-[rgb(var(--state-info-bg)/0.18)] hover:border-[rgb(var(--state-info-border)/0.45)] transition-colors w-full justify-center"
          >
            <Plus className="w-4 h-4" />
            {t('enrollmentModule.step.guardians.addGuardian')}
          </button>
        )}

        {guardians.length >= 10 && (
          <p className="text-xs text-[rgb(var(--text-tertiary))] text-center">
            {t('enrollmentModule.step.guardians.maxReached')}
          </p>
        )}
      </div>
    </FormProvider>
  )
}
