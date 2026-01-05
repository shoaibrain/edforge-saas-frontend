/**
 * DateField Component
 * 
 * A composable date input that integrates with react-hook-form.
 * Features animated focus states, error handling, and accessibility.
 */

import { forwardRef, useState } from 'react'
import { useFormContext, type RegisterOptions } from 'react-hook-form'
import { motion } from 'framer-motion'
import { AlertCircle, Calendar, Check } from 'lucide-react'
import { cn, getNestedError, getNestedTouched, getNestedDirty } from '../utils'

export interface DateFieldProps {
  /** Field name (supports dot notation for nested fields) */
  name: string
  /** Field label */
  label?: string
  /** Helper text shown below input */
  helperText?: string
  /** Whether field is disabled */
  disabled?: boolean
  /** Whether field is required */
  required?: boolean
  /** Minimum date (YYYY-MM-DD format) */
  min?: string
  /** Maximum date (YYYY-MM-DD format) */
  max?: string
  /** Container class name */
  className?: string
  /** Input container class name */
  inputClassName?: string
  /** Validation rules */
  rules?: RegisterOptions
  /** Show checkmark on valid input */
  showSuccessState?: boolean
}

// Spring transition config
const springTransition = { type: 'spring', stiffness: 120, damping: 14 }

export const DateField = forwardRef<HTMLInputElement, DateFieldProps>(
  (
    {
      name,
      label,
      helperText,
      disabled = false,
      required = false,
      min,
      max,
      className,
      inputClassName,
      rules,
      showSuccessState = false,
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false)
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

    const { ref: registerRef, ...registerProps } = register(name, rules)

    // Computed animation values
    const borderColor = hasError 
      ? 'rgb(239, 68, 68)' 
      : isFocused 
        ? 'rgb(20, 184, 166)' 
        : 'rgb(var(--border-primary))'
    
    const boxShadow = isFocused && !hasError
      ? '0 0 0 3px rgba(20, 184, 166, 0.15)'
      : hasError
        ? '0 0 0 3px rgba(239, 68, 68, 0.1)'
        : '0 0 0 0px transparent'

    const labelColor = hasError 
      ? 'rgb(239, 68, 68)' 
      : isFocused 
        ? 'rgb(20, 184, 166)' 
        : 'rgb(var(--text-secondary))'

    return (
      <div className={cn('space-y-1.5', className)}>
        {/* Label */}
        {label && (
          <motion.label
            htmlFor={name}
            animate={{ color: labelColor }}
            transition={springTransition}
            className="block text-sm font-medium"
          >
            {label}
            {required && <span className="text-rust-500 ml-0.5">*</span>}
          </motion.label>
        )}

        {/* Input Container */}
        <motion.div
          animate={{ borderColor, boxShadow }}
          transition={springTransition}
          className={cn(
            'relative flex items-center rounded-xl border bg-[rgb(var(--surface-secondary))] transition-colors',
            disabled && 'opacity-60 cursor-not-allowed',
            inputClassName
          )}
        >
          {/* Calendar Icon */}
          <div className="pl-3 flex items-center text-[rgb(var(--text-tertiary))]">
            <Calendar className="w-4 h-4" />
          </div>

          {/* Input */}
          <input
            {...registerProps}
            ref={(e) => {
              registerRef(e)
              if (ref) {
                if (typeof ref === 'function') ref(e)
                else ref.current = e
              }
            }}
            id={name}
            type="date"
            disabled={disabled}
            min={min}
            max={max}
            onFocus={() => setIsFocused(true)}
            onBlur={(e) => {
              setIsFocused(false)
              registerProps.onBlur(e)
            }}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${name}-error` : helperText ? `${name}-helper` : undefined}
            className={cn(
              'flex-1 w-full px-3 py-2.5 text-sm bg-transparent',
              'text-[rgb(var(--text-primary))]',
              'focus:outline-none',
              'disabled:cursor-not-allowed',
              'pl-2',
              '[&::-webkit-calendar-picker-indicator]:opacity-0',
              '[&::-webkit-calendar-picker-indicator]:absolute',
              '[&::-webkit-calendar-picker-indicator]:right-0',
              '[&::-webkit-calendar-picker-indicator]:w-full',
              '[&::-webkit-calendar-picker-indicator]:h-full',
              '[&::-webkit-calendar-picker-indicator]:cursor-pointer'
            )}
          />

          {/* Status Icons */}
          <div className="pr-3 flex items-center gap-2">
            {isValid && (
              <Check className="w-4 h-4 text-teal-500" />
            )}
            {hasError && (
              <AlertCircle className="w-4 h-4 text-rust-500" />
            )}
          </div>
        </motion.div>

        {/* Helper Text or Error */}
        <div className="min-h-[1.25rem]">
          {hasError ? (
            <motion.p
              id={`${name}-error`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springTransition}
              className="text-xs text-rust-500 flex items-center gap-1"
              role="alert"
            >
              {errorMessage}
            </motion.p>
          ) : helperText ? (
            <p id={`${name}-helper`} className="text-xs text-[rgb(var(--text-tertiary))]">
              {helperText}
            </p>
          ) : null}
        </div>
      </div>
    )
  }
)

DateField.displayName = 'DateField'
