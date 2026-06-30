/**
 * Telephone Array Section
 *
 * Dynamic form array for Ed-Fi InstitutionTelephone entries.
 * Must be used inside a FormProvider context.
 */

import { useFieldArray, useFormContext, TextField, SelectField } from '@edforge/forms'
import { Plus, Trash2, Phone } from 'lucide-react'
import { Button } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import { INSTITUTION_TELEPHONE_NUMBER_TYPE_DESCRIPTORS } from '@aibrains/shared-types'

interface TelephoneArraySectionProps {
  name?: string
}

export function TelephoneArraySection({ name = 'telephones' }: TelephoneArraySectionProps) {
  const { t } = useTranslation('settings')
  const { control } = useFormContext()
  const { fields, append, remove } = useFieldArray({ control, name })
  const telephoneTypeOptions = INSTITUTION_TELEPHONE_NUMBER_TYPE_DESCRIPTORS.map((option) => ({
    ...option,
    label: t(`organization.descriptors.telephoneType.${option.value}`, { defaultValue: option.label }),
  }))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          <span className="text-sm font-medium text-[rgb(var(--text-primary))]">{t('organization.form.telephones')}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1 text-xs"
          onClick={() =>
            append({
              institutionTelephoneNumberTypeDescriptor: 'Main',
              telephoneNumber: '',
            })
          }
        >
          <Plus className="w-3.5 h-3.5" />
          {t('organization.actions.addPhone')}
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-xs text-[rgb(var(--text-tertiary))] py-3 text-center">
          {t('organization.form.noTelephones')}
        </p>
      )}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="flex items-start gap-3 p-3 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))]"
        >
          <SelectField
            name={`${name}.${index}.institutionTelephoneNumberTypeDescriptor`}
            label={t('organization.form.type')}
            options={telephoneTypeOptions}
            className="w-40 shrink-0"
          />
          <TextField
            name={`${name}.${index}.telephoneNumber`}
            label={t('organization.form.number')}
            type="tel"
            placeholder="(512) 555-0100"
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => remove(index)}
            className="mt-5 p-1.5 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--state-danger-fg))] hover:bg-[rgb(var(--state-danger-bg)/0.18)]0/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
