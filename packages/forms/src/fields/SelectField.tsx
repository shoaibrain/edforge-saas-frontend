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
import { getNestedError } from '../utils'

export interface SelectOption {
  value: string
  label: string
  icon?: LucideIcon
  disabled?: boolean
}

export interface SelectFieldProps {
  /** Field name (supports dot notation for nested fields) */
  name: string
  /** Field label (ReactNode so callers can compose inline label hints/tooltips) */
  label?: ReactNode
  /** Placeholder text */
  placeholder?: string
  /** Select options */
  options: readonly SelectOption[]
  /** Leading icon */
  icon?: LucideIcon
  /** Helper text shown below input */
  helperText?: string
  /** Whether field is disabled */
  disabled?: boolean
  /** Whether field is required */
  required?: boolean
  /** Show a clear ("none") affordance for optional selects */
  clearable?: boolean
  /**
   * Value stored when nothing is selected / the field is cleared. Defaults to
   * `''`. Optional reference selects validated by `z.string().uuid().optional()`
   * or `.enum(...).optional()` must use `undefined` so an empty selection
   * doesn't fail validation as a non-uuid/non-enum empty string.
   */
  emptyValue?: string | undefined
  /** Container class name */
  className?: string
  /** Select container class name */
  selectClassName?: string
  /** Validation rules */
  rules?: RegisterOptions
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
      clearable = false,
      emptyValue = '',
      className,
      selectClassName,
      rules,
    },
    ref
  ) => {
    const {
      control,
      formState: { errors },
    } = useFormContext()

    // Get nested error
    const error = getNestedError(errors, name)
    const errorMessage = error?.message as string | undefined

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
            leadingIcon={Icon ? <Icon className="h-4 w-4" /> : undefined}
            label={label}
            required={required}
            helperText={helperText}
            error={errorMessage}
            disabled={disabled}
            clearable={clearable}
            placeholder={placeholder}
            value={(field.value as string | undefined) || null}
            onChange={(nextValue: string | null) => field.onChange(nextValue ?? emptyValue)}
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
