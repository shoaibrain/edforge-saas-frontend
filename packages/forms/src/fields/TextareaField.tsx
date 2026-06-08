/**
 * TextareaField Component
 * 
 * A composable textarea that integrates with react-hook-form.
 * Features animated focus states, error handling, and accessibility.
 */

import { forwardRef } from 'react'
import { useFormContext, type RegisterOptions } from 'react-hook-form'
import { Field, Textarea } from '@edforge/ui/forms'
import { getNestedError, getNestedTouched, getNestedDirty } from '../utils'

export interface TextareaFieldProps {
  /** Field name (supports dot notation for nested fields) */
  name: string
  /** Field label */
  label?: string
  /** Placeholder text */
  placeholder?: string
  /** Helper text shown below input */
  helperText?: string
  /** Whether field is disabled */
  disabled?: boolean
  /** Whether field is read-only */
  readOnly?: boolean
  /** Whether field is required */
  required?: boolean
  /** Container class name */
  className?: string
  /** Textarea class name */
  textareaClassName?: string
  /** Validation rules */
  rules?: RegisterOptions
  /** Show checkmark on valid input */
  showSuccessState?: boolean
  /** Number of visible rows */
  rows?: number
  /** Max character length */
  maxLength?: number
  /** Whether to allow resize */
  resize?: 'none' | 'both' | 'horizontal' | 'vertical'
  /** Show character count */
  showCharCount?: boolean
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  (
    {
      name,
      label,
      placeholder,
      helperText,
      disabled = false,
      readOnly = false,
      required = false,
      className,
      textareaClassName,
      rules,
      showSuccessState = false,
      rows = 4,
      maxLength,
      resize = 'vertical',
      showCharCount = false,
    },
    ref
  ) => {
    const {
      register,
      formState: { errors, touchedFields, dirtyFields },
    } = useFormContext()

    // Get nested error
    const error = getNestedError(errors, name)
    const isTouched = getNestedTouched(touchedFields, name)
    const isDirty = getNestedDirty(dirtyFields, name)
    const errorMessage = error?.message as string | undefined
    const hasError = !!errorMessage
    const isValid = showSuccessState && isDirty && isTouched && !hasError
    void isValid

    const { ref: registerRef, ...registerProps } = register(name, rules)

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
        <Textarea
          {...registerProps}
          ref={(element) => {
            registerRef(element)
            if (ref) {
              if (typeof ref === 'function') ref(element)
              else ref.current = element
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          rows={rows}
          maxLength={maxLength}
          resize={resize}
          showCharacterCount={showCharCount}
          className={textareaClassName}
        />
      </Field>
    )
  }
)

TextareaField.displayName = 'TextareaField'
