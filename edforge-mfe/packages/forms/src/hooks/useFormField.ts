/**
 * useFormField Hook
 * 
 * A custom hook for accessing form field state from react-hook-form context.
 */

import { useFormContext } from 'react-hook-form'
import { getNestedError, getNestedTouched, getNestedDirty } from '../utils'

export interface UseFormFieldReturn {
  /** Whether the field has an error */
  hasError: boolean
  /** Error message if any */
  errorMessage: string | undefined
  /** Whether the field has been touched */
  isTouched: boolean
  /** Whether the field value has changed from initial */
  isDirty: boolean
  /** Whether the field is valid (touched, dirty, no error) */
  isValid: boolean
  /** Register function for the field */
  register: ReturnType<typeof useFormContext>['register']
  /** Field value */
  value: unknown
  /** Set field value */
  setValue: (value: unknown) => void
  /** Clear field error */
  clearError: () => void
}

/**
 * Hook to access form field state and utilities
 * 
 * @param name - Field name (supports dot notation for nested fields)
 * @returns Field state and utilities
 */
export function useFormField(name: string): UseFormFieldReturn {
  const {
    register,
    watch,
    setValue: setFormValue,
    clearErrors,
    formState: { errors, touchedFields, dirtyFields },
  } = useFormContext()

  const error = getNestedError(errors, name)
  const isTouched = getNestedTouched(touchedFields, name)
  const isDirty = getNestedDirty(dirtyFields, name)
  const errorMessage = error?.message as string | undefined
  const hasError = !!errorMessage
  const isValid = isDirty && isTouched && !hasError

  const value = watch(name)

  const setValue = (newValue: unknown) => {
    setFormValue(name, newValue, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    })
  }

  const clearError = () => {
    clearErrors(name)
  }

  return {
    hasError,
    errorMessage,
    isTouched,
    isDirty,
    isValid,
    register,
    value,
    setValue,
    clearError,
  }
}

