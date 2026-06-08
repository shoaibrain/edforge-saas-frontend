/**
 * Telephone Array Section
 *
 * Dynamic form array for Ed-Fi InstitutionTelephone entries.
 * Must be used inside a FormProvider context.
 */

import { useFieldArray, useFormContext } from '@edforge/forms'
import { Plus, Trash2, Phone } from 'lucide-react'
import { Button } from '@edforge/ui'
import { INSTITUTION_TELEPHONE_NUMBER_TYPE_DESCRIPTORS } from '@aibrains/shared-types'

interface TelephoneArraySectionProps {
  name?: string
}

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-tertiary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))] transition-colors'
const selectClass = inputClass
const labelClass = 'block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1'
const errorClass = 'mt-0.5 text-xs text-[rgb(var(--state-danger-fg))]'

export function TelephoneArraySection({ name = 'telephones' }: TelephoneArraySectionProps) {
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
          <div className="w-40 shrink-0">
            <label className={labelClass}>Type</label>
            <select
              {...register(`${name}.${index}.institutionTelephoneNumberTypeDescriptor`)}
              className={selectClass}
            >
              {INSTITUTION_TELEPHONE_NUMBER_TYPE_DESCRIPTORS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className={labelClass}>Number</label>
            <input
              type="tel"
              {...register(`${name}.${index}.telephoneNumber`)}
              placeholder="(512) 555-0100"
              className={inputClass}
            />
            {getError(index, 'telephoneNumber') && (
              <p className={errorClass}>{getError(index, 'telephoneNumber')}</p>
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
