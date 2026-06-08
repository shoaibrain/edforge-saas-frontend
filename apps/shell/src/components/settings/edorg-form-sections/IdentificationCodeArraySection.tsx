/**
 * Identification Code Array Section
 *
 * Dynamic form array for Ed-Fi EducationOrganizationIdentificationCode entries.
 * Must be used inside a FormProvider context.
 */

import { useFieldArray, useFormContext } from '@edforge/forms'
import { Plus, Trash2, Hash } from 'lucide-react'
import { Button } from '@edforge/ui'
import { EDUCATION_ORGANIZATION_IDENTIFICATION_SYSTEM_DESCRIPTORS } from '@aibrains/shared-types'

interface IdentificationCodeArraySectionProps {
  name?: string
}

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-tertiary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))] transition-colors'
const selectClass = inputClass
const labelClass = 'block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1'
const errorClass = 'mt-0.5 text-xs text-[rgb(var(--state-danger-fg))]'

export function IdentificationCodeArraySection({ name = 'identificationCodes' }: IdentificationCodeArraySectionProps) {
  const { control, register, formState: { errors } } = useFormContext()
  const { fields, append, remove } = useFieldArray({ control, name })

  const getError = (index: number, field: string) => {
    const arr = (errors as Record<string, any>)[name]
    return arr?.[index]?.[field]?.message as string | undefined
  }

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
          className="flex items-start gap-3 p-3 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))]"
        >
          <div className="w-52 shrink-0">
            <label className={labelClass}>System</label>
            <select
              {...register(`${name}.${index}.educationOrganizationIdentificationSystemDescriptor`)}
              className={selectClass}
            >
              {EDUCATION_ORGANIZATION_IDENTIFICATION_SYSTEM_DESCRIPTORS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className={labelClass}>Code</label>
            <input
              type="text"
              {...register(`${name}.${index}.identificationCode`)}
              placeholder="e.g., 1234567"
              className={inputClass}
            />
            {getError(index, 'identificationCode') && (
              <p className={errorClass}>{getError(index, 'identificationCode')}</p>
            )}
          </div>
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
