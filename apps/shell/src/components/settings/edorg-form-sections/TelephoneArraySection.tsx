/**
 * Telephone Array Section
 *
 * Dynamic form array for Ed-Fi InstitutionTelephone entries.
 * Must be used inside a FormProvider context.
 */

import { useFieldArray, useFormContext, TextField, SelectField } from '@edforge/forms'
import { Plus, Trash2, Phone } from 'lucide-react'
import { Button } from '@edforge/ui'
import { INSTITUTION_TELEPHONE_NUMBER_TYPE_DESCRIPTORS } from '@aibrains/shared-types'

interface TelephoneArraySectionProps {
  name?: string
}

export function TelephoneArraySection({ name = 'telephones' }: TelephoneArraySectionProps) {
  const { control } = useFormContext()
  const { fields, append, remove } = useFieldArray({ control, name })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          <span className="text-sm font-medium text-[rgb(var(--text-primary))]">Telephones</span>
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
          Add Phone
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-xs text-[rgb(var(--text-tertiary))] py-3 text-center">
          No phone numbers added.
        </p>
      )}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="flex items-start gap-3 p-3 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))]"
        >
          <SelectField
            name={`${name}.${index}.institutionTelephoneNumberTypeDescriptor`}
            label="Type"
            options={INSTITUTION_TELEPHONE_NUMBER_TYPE_DESCRIPTORS}
            className="w-40 shrink-0"
          />
          <TextField
            name={`${name}.${index}.telephoneNumber`}
            label="Number"
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
