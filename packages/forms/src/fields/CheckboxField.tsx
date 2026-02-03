/**
 * CheckboxField Component
 * 
 * A composable checkbox that integrates with react-hook-form.
 * Features animated states and accessibility.
 */

import { forwardRef } from 'react'
import { useFormContext, Controller, type RegisterOptions } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn, getNestedError } from '../utils'

export interface CheckboxFieldProps {
  /** Field name (supports dot notation for nested fields) */
  name: string
  /** Field label */
  label?: string
  /** Description text */
  description?: string
  /** Helper text shown below checkbox */
  helperText?: string
  /** Whether field is disabled */
  disabled?: boolean
  /** Whether field is required */
  required?: boolean
  /** Container class name */
  className?: string
  /** Validation rules */
  rules?: RegisterOptions
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
}

// Spring transition configs
const springTransition = { type: 'spring', stiffness: 120, damping: 14 }
const wobblyTransition = { type: 'spring', stiffness: 300, damping: 10 }

export const CheckboxField = forwardRef<HTMLButtonElement, CheckboxFieldProps>(
  (
    {
      name,
      label,
      description,
      helperText,
      disabled = false,
      required = false,
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
    const hasError = !!errorMessage

    const sizeClasses = {
      sm: { box: 'w-4 h-4', icon: 'w-3 h-3' },
      md: { box: 'w-5 h-5', icon: 'w-3.5 h-3.5' },
      lg: { box: 'w-6 h-6', icon: 'w-4 h-4' },
    }[size]

    return (
      <div className={cn('space-y-1.5', className)}>
        <Controller
          name={name}
          control={control}
          rules={rules}
          render={({ field }) => {
            const isChecked = !!field.value

            const backgroundColor = isChecked ? 'rgb(20, 184, 166)' : 'transparent'
            const borderColor = hasError 
              ? 'rgb(239, 68, 68)' 
              : isChecked 
                ? 'rgb(20, 184, 166)' 
                : 'rgb(var(--border-primary))'

            return (
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <motion.button
                  ref={ref}
                  type="button"
                  role="checkbox"
                  aria-checked={isChecked}
                  aria-labelledby={label ? `${name}-label` : undefined}
                  aria-describedby={description ? `${name}-description` : undefined}
                  disabled={disabled}
                  onClick={() => field.onChange(!isChecked)}
                  animate={{ backgroundColor, borderColor }}
                  transition={springTransition}
                  className={cn(
                    'relative inline-flex items-center justify-center shrink-0 rounded-md border-2',
                    'transition-colors duration-200 ease-in-out',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    sizeClasses.box
                  )}
                >
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: isChecked ? 1 : 0, 
                      opacity: isChecked ? 1 : 0 
                    }}
                    transition={wobblyTransition}
                  >
                    <Check className={cn('text-white', sizeClasses.icon)} />
                  </motion.span>
                </motion.button>

                {/* Label and Description */}
                {(label || description) && (
                  <div className="flex-1">
                    {label && (
                      <label
                        id={`${name}-label`}
                        className={cn(
                          'text-sm font-medium cursor-pointer',
                          disabled ? 'text-[rgb(var(--text-tertiary))]' : 'text-[rgb(var(--text-primary))]'
                        )}
                        onClick={() => !disabled && field.onChange(!isChecked)}
                      >
                        {label}
                        {required && <span className="text-rust-500 ml-0.5">*</span>}
                      </label>
                    )}
                    {description && (
                      <p
                        id={`${name}-description`}
                        className="text-sm text-[rgb(var(--text-tertiary))]"
                      >
                        {description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          }}
        />

        {/* Helper Text or Error */}
        {(hasError || helperText) && (
          <div className="min-h-[1.25rem]">
            {hasError ? (
              <p className="text-xs text-rust-500" role="alert">
                {errorMessage}
              </p>
            ) : helperText ? (
              <p className="text-xs text-[rgb(var(--text-tertiary))]">
                {helperText}
              </p>
            ) : null}
          </div>
        )}
      </div>
    )
  }
)

CheckboxField.displayName = 'CheckboxField'
