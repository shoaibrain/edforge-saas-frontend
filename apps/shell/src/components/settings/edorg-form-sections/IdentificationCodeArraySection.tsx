/**
 * Identification Code Array Section
 *
 * Dynamic form array for Ed-Fi EducationOrganizationIdentificationCode entries.
 * Must be used inside a FormProvider context.
 */

import { useFieldArray, useFormContext, TextField, SelectField } from '@edforge/forms'
import { Plus, Trash2, Hash } from 'lucide-react'
import { Button } from '@edforge/ui'
import { EDUCATION_ORGANIZATION_IDENTIFICATION_SYSTEM_DESCRIPTORS } from '@aibrains/shared-types'

interface IdentificationCodeArraySectionProps {
  name?: string
}

export function IdentificationCodeArraySection({ name = 'identificationCodes' }: IdentificationCodeArraySectionProps) {
  const { control } = useFormContext()
  const { fields, append, remove } = useFieldArray({ control, name })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          <span className="text-sm font-medium text-[rgb(var(--text-primary))]">Identification Codes</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1 text-xs"
          onClick={() =>
            append({
              educationOrganizationIdentificationSystemDescriptor: 'SEA',
              identificationCode: '',
            })
          }
        >
          <Plus className="w-3.5 h-3.5" />
          Add Code
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-xs text-[rgb(var(--text-tertiary))] py-3 text-center">
          No identification codes added.
        </p>
      )}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="flex items-start gap-3 p-3 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))]"
        >
          <SelectField
            name={`${name}.${index}.educationOrganizationIdentificationSystemDescriptor`}
            label="System"
            options={EDUCATION_ORGANIZATION_IDENTIFICATION_SYSTEM_DESCRIPTORS}
            className="w-52 shrink-0"
          />
          <TextField
            name={`${name}.${index}.identificationCode`}
            label="Code"
            placeholder="e.g., 1234567"
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
