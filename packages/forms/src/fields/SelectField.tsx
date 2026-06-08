/**
 * SelectField Component
 * 
 * A composable select dropdown that integrates with react-hook-form.
 * Features animated focus states, error handling, and accessibility.
 */

import { forwardRef, type ReactNode, type Ref } from 'react'
import { Controller, useFormContext, type RegisterOptions } from 'react-hook-form'
import { type LucideIcon } from 'lucide-react'
import { Select } from '@edforge/ui/forms'
import { getNestedError, getNestedTouched, getNestedDirty } from '../utils'

export interface SelectOption {
  value: string
  label: string
  icon?: LucideIcon
  disabled?: boolean
}

export interface SelectFieldProps {
  /** Field name (supports dot notation for nested fields) */
  name: string
  /** Field label */
  label?: string
  /** Placeholder text */
  placeholder?: string
  /** Select options */
  options: SelectOption[]
  /** Leading icon */
  icon?: LucideIcon
  /** Helper text shown below input */
  helperText?: string
  /** Whether field is disabled */
  disabled?: boolean
  /** Whether field is required */
  required?: boolean
  /** Container class name */
  className?: string
  /** Select container class name */
  selectClassName?: string
  /** Validation rules */
  rules?: RegisterOptions
  /** Show checkmark on valid input */
  showSuccessState?: boolean
  /** Prefix content */
  prefix?: ReactNode
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  (
    {
      name,
      label,
      placeholder = 'Select an option',
      options,
      icon: Icon,
      helperText,
      disabled = false,
      required = false,
      className,
      selectClassName,
      rules,
      showSuccessState = false,
      prefix,
    },
    ref
  ) => {
    const {
      control,
      formState: { errors, touchedFields, dirtyFields },
    } = useFormContext()

    // Get nested error
    const error = getNestedError(errors, name)
    const isTouched = getNestedTouched(touchedFields, name)
    const isDirty = getNestedDirty(dirtyFields, name)
    const errorMessage = error?.message as string | undefined
    void (showSuccessState && isDirty && isTouched)
    void prefix
    void Icon

    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field }) => (
          <Select
            ref={ref as Ref<HTMLButtonElement>}
            className={className}
            buttonClassName={selectClassName}
            label={label}
            required={required}
            helperText={helperText}
            error={errorMessage}
            disabled={disabled}
            placeholder={placeholder}
            value={(field.value as string | undefined) || null}
            onChange={(nextValue: string | null) => field.onChange(nextValue ?? '')}
            options={options.map((option) => ({
              value: option.value,
              label: option.label,
              disabled: option.disabled,
              icon: option.icon ? <option.icon className="h-4 w-4" /> : undefined,
            }))}
          />
        )}
      />
    )
  }
)

SelectField.displayName = 'SelectField'
