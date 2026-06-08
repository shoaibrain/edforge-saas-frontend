/**
 * SelectField Component
 * 
 * A composable select dropdown that integrates with react-hook-form.
 * Features animated focus states, error handling, and accessibility.
 */

import { forwardRef, useState, type ReactNode } from 'react'
import { useFormContext, type RegisterOptions } from 'react-hook-form'
import { motion } from 'framer-motion'
import { AlertCircle, ChevronDown, type LucideIcon } from 'lucide-react'
import { cn, getNestedError, getNestedTouched, getNestedDirty } from '../utils'

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

// Spring transition config
const springTransition = { type: 'spring', stiffness: 120, damping: 14 }

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
    void (showSuccessState && isDirty && isTouched) // Suppress unused vars

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

        {/* Select Container */}
        <motion.div
          animate={{ borderColor, boxShadow }}
          transition={springTransition}
          className={cn(
            'relative flex items-center rounded-xl border bg-[rgb(var(--background-secondary))] transition-colors',
            disabled && 'opacity-60 cursor-not-allowed',
            selectClassName
          )}
        >
          {/* Prefix / Icon */}
          {(Icon || prefix) && (
            <div className="pl-3 flex items-center text-[rgb(var(--text-tertiary))]">
              {Icon && <Icon className="w-4 h-4" />}
              {prefix}
            </div>
          )}

          {/* Select */}
          <select
            {...registerProps}
            ref={(e) => {
              registerRef(e)
              if (ref) {
                if (typeof ref === 'function') ref(e)
                else ref.current = e
              }
            }}
            id={name}
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={(e) => {
              setIsFocused(false)
              registerProps.onBlur(e)
            }}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${name}-error` : helperText ? `${name}-helper` : undefined}
            className={cn(
              'flex-1 w-full px-3 py-2.5 text-sm bg-transparent appearance-none',
              'text-[rgb(var(--text-primary))]',
              'focus:outline-none',
              'disabled:cursor-not-allowed',
              Icon || prefix ? 'pl-2' : 'pl-3',
              'pr-10' // Space for chevron
            )}
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* Chevron Icon */}
          <div className="absolute right-3 pointer-events-none flex items-center">
            {hasError ? (
              <AlertCircle className="w-4 h-4 text-rust-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
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

SelectField.displayName = 'SelectField'
