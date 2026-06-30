/**
 * Category Array Section
 *
 * Dynamic form array for Ed-Fi EducationOrganizationCategory entries.
 * Must be used inside a FormProvider context.
 * Categories are required (min 1) on all EdOrg entities.
 *
 * Uses a friendly dropdown instead of raw URI text input.
 * Supports auto-populating the default category based on org type.
 */

import { useEffect } from 'react'
import { useFieldArray, useFormContext, SelectField } from '@edforge/forms'
import { Plus, Trash2, Tag, Info } from 'lucide-react'
import { Button, Tooltip } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import {
  EDUCATION_ORGANIZATION_CATEGORY_DESCRIPTORS,
  ORG_TYPE_DEFAULT_CATEGORY,
} from '@aibrains/shared-types'

interface CategoryArraySectionProps {
  name?: string
  /** Org type shorthand (sea, lea, esc, school, network) — auto-populates default category */
  orgType?: 'sea' | 'lea' | 'esc' | 'school' | 'network'
}

export function CategoryArraySection({ name = 'categories', orgType }: CategoryArraySectionProps) {
  const { t } = useTranslation('settings')
  const { control, setValue, getValues } = useFormContext()
  const { fields, append, remove } = useFieldArray({ control, name })
  const categoryOptions = EDUCATION_ORGANIZATION_CATEGORY_DESCRIPTORS.map((option) => ({
    ...option,
    label: t(`organization.descriptors.educationOrganizationCategory.${option.label}`, { defaultValue: option.label }),
  }))

  // Auto-populate default category when orgType is provided and the first field is empty
  useEffect(() => {
    if (orgType && fields.length > 0) {
      const defaultUri = ORG_TYPE_DEFAULT_CATEGORY[orgType]
      if (defaultUri) {
        const currentValue = getValues(`${name}.0.educationOrganizationCategoryDescriptor`)
        if (!currentValue || currentValue === '') {
          setValue(`${name}.0.educationOrganizationCategoryDescriptor`, defaultUri)
        }
      }
    }
  }, [orgType, fields.length, name, setValue, getValues])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
            {t('organization.form.categories')} <span className="text-[rgb(var(--state-danger-fg))]">*</span>
          </span>
          <Tooltip content={t('organization.form.categoryHelp')} side="right">
            <Info className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))] cursor-help" />
          </Tooltip>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1 text-xs"
          onClick={() =>
            append({ educationOrganizationCategoryDescriptor: orgType ? (ORG_TYPE_DEFAULT_CATEGORY[orgType] || '') : '' })
          }
        >
          <Plus className="w-3.5 h-3.5" />
          {t('organization.actions.addCategory')}
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400 py-2">
          {t('organization.form.categoryRequired')}
        </p>
      )}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="flex items-start gap-3"
        >
          <div className="flex-1">
            <SelectField
              name={`${name}.${index}.educationOrganizationCategoryDescriptor`}
              label={t('organization.form.categoryDescriptor')}
              placeholder={t('organization.form.selectCategory')}
              options={categoryOptions}
            />
          </div>
          {fields.length > 1 && (
            <button
              type="button"
              onClick={() => remove(index)}
              className="mt-5 p-1.5 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--state-danger-fg))] hover:bg-[rgb(var(--state-danger-bg)/0.18)]0/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
