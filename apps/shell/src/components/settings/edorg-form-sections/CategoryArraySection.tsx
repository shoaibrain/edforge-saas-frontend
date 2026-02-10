/**
 * Category Array Section
 *
 * Dynamic form array for Ed-Fi EducationOrganizationCategory entries.
 * Must be used inside a FormProvider context.
 * Categories are required (min 1) on all EdOrg entities.
 */

import { useFieldArray, useFormContext } from '@edforge/forms'
import { Plus, Trash2, Tag } from 'lucide-react'
import { Button } from '@edforge/ui'

interface CategoryArraySectionProps {
  name?: string
}

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-tertiary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors'
const labelClass = 'block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1'
const errorClass = 'mt-0.5 text-[10px] text-red-500'

export function CategoryArraySection({ name = 'categories' }: CategoryArraySectionProps) {
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
          <Tag className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
            Categories <span className="text-red-500">*</span>
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1 text-xs"
          onClick={() =>
            append({ educationOrganizationCategoryDescriptor: '' })
          }
        >
          <Plus className="w-3.5 h-3.5" />
          Add Category
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400 py-2">
          At least one category is required.
        </p>
      )}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="flex items-start gap-3"
        >
          <div className="flex-1">
            <label className={labelClass}>Category Descriptor</label>
            <input
              type="text"
              {...register(`${name}.${index}.educationOrganizationCategoryDescriptor`)}
              placeholder="e.g., uri://ed-fi.org/EducationOrganizationCategoryDescriptor#..."
              className={inputClass}
            />
            {getError(index, 'educationOrganizationCategoryDescriptor') && (
              <p className={errorClass}>
                {getError(index, 'educationOrganizationCategoryDescriptor')}
              </p>
            )}
          </div>
          {fields.length > 1 && (
            <button
              type="button"
              onClick={() => remove(index)}
              className="mt-5 p-1.5 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
