/**
 * TextField Component
 * 
 * A composable text input field that integrates with react-hook-form.
 * Features animated focus states, error handling, and accessibility.
 */

import { forwardRef, type ReactNode } from 'react'
import { useFormContext, type RegisterOptions } from 'react-hook-form'
import { AlertCircle, Check, type LucideIcon } from 'lucide-react'
import { Field, Input } from '@edforge/ui/forms'
import { getNestedError, getNestedTouched, getNestedDirty } from '../utils'

export interface TextFieldProps {
  /** Field name (supports dot notation for nested fields) */
  name: string
  /** Field label (ReactNode so callers can compose inline label hints/tooltips) */
  label?: ReactNode
  /** Placeholder text */
  placeholder?: string
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'url' | 'tel' | 'number'
  /** Leading icon */
  icon?: LucideIcon
  /** Helper text shown below input */
  helperText?: string
  /** Whether field is disabled */
  disabled?: boolean
  /** Whether field is read-only */
  readOnly?: boolean
  /** Whether field is required */
  required?: boolean
  /** Autocomplete attribute */
  autoComplete?: string
  /** Autofocus the input on mount */
  autoFocus?: boolean
  /** Container class name */
  className?: string
  /** Input container class name */
  inputClassName?: string
  /** Validation rules */
  rules?: RegisterOptions
  /** Show checkmark on valid input */
  showSuccessState?: boolean
  /** Suffix content */
  suffix?: ReactNode
  /** Prefix content */
  prefix?: ReactNode
  /** Max character length */
  maxLength?: number
  /** Min value (for number inputs) */
  min?: number
  /** Max value (for number inputs) */
  max?: number
  /** Step value (for number inputs) */
  step?: number
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      name,
      label,
      placeholder,
      type = 'text',
      icon: Icon,
      helperText,
      disabled = false,
      readOnly = false,
      required = false,
      autoComplete,
      autoFocus,
      className,
      inputClassName,
      rules,
      showSuccessState = false,
      suffix,
      prefix,
      maxLength,
      min,
      max,
      step,
    },
    ref
  ) => {
    const {
      register,
      formState: { errors, touchedFields, dirtyFields },
    } = useFormContext()

    // Get nested error (supports "address.city" style paths)
    const error = getNestedError(errors, name)
    const isTouched = getNestedTouched(touchedFields, name)
    const isDirty = getNestedDirty(dirtyFields, name)
    const errorMessage = error?.message as string | undefined
    const hasError = !!errorMessage
    const isValid = showSuccessState && isDirty && isTouched && !hasError

    const { ref: registerRef, ...registerProps } = register(name, rules)
    const mergedPrefix = Icon ? (
      <>
        <Icon className="h-4 w-4" />
        {prefix}
      </>
    ) : (
      prefix
    )
    const statusSuffix = (
      <>
        {suffix}
        {isValid ? <Check className="h-4 w-4 text-[rgb(var(--state-success-fg))]" /> : null}
        {hasError ? <AlertCircle className="h-4 w-4 text-[rgb(var(--state-danger-fg))]" /> : null}
      </>
    )

    return (
      <Field
        className={className}
        label={label}
        controlId={name}
        required={required}
        optionalText={required ? undefined : null}
        helperText={helperText}
        error={errorMessage}
        disabled={disabled}
        readOnly={readOnly}
      >
        <Input
          {...registerProps}
          ref={(element) => {
            registerRef(element)
            if (ref) {
              if (typeof ref === 'function') ref(element)
              else ref.current = element
            }
          }}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          maxLength={maxLength}
          min={min}
          max={max}
          step={step}
          prefix={mergedPrefix}
          suffix={suffix || isValid || hasError ? statusSuffix : undefined}
          className={inputClassName}
        />
      </Field>
    )
  }
)

TextField.displayName = 'TextField'
