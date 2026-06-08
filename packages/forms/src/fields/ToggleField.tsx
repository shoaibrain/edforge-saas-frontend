/**
 * ToggleField Component
 * 
 * A composable toggle switch that integrates with react-hook-form.
 * Features animated states and accessibility.
 */

import { forwardRef } from 'react'
import { useFormContext, Controller, type RegisterOptions } from 'react-hook-form'
import { Field, Switch } from '@edforge/ui/forms'
import { getNestedError } from '../utils'

export interface ToggleFieldProps {
  /** Field name (supports dot notation for nested fields) */
  name: string
  /** Field label */
  label?: string
  /** Description text */
  description?: string
  /** Helper text shown below toggle */
  helperText?: string
  /** Whether field is disabled */
  disabled?: boolean
  /** Container class name */
  className?: string
  /** Validation rules */
  rules?: RegisterOptions
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
}

export const ToggleField = forwardRef<HTMLButtonElement, ToggleFieldProps>(
  (
    {
      name,
      label,
      description,
      helperText,
      disabled = false,
      className,
      rules,
      size = 'md',
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
      <Field className={className} helperText={helperText} error={errorMessage}>
        <Controller
          name={name}
          control={control}
          rules={rules}
          render={({ field }) => {
            const isOn = !!field.value

            return (
              <Switch
                ref={ref}
                id={name}
                checked={isOn}
                onChange={field.onChange}
                disabled={disabled}
                label={label}
                description={description}
                size={size}
              />
            )
          }}
        />
      </Field>
    )
  }
)

ToggleField.displayName = 'ToggleField'
