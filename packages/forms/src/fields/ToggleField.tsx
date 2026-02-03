/**
 * ToggleField Component
 * 
 * A composable toggle switch that integrates with react-hook-form.
 * Features animated states and accessibility.
 */

import { forwardRef } from 'react'
import { useFormContext, Controller, type RegisterOptions } from 'react-hook-form'
import { motion } from 'framer-motion'
import { cn, getNestedError } from '../utils'

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

// Spring transition configs
const springTransition = { type: 'spring', stiffness: 120, damping: 14 }
const wobblyTransition = { type: 'spring', stiffness: 300, damping: 10 }

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
    const hasError = !!errorMessage

    const sizeClasses = {
      sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translateOn: 16, translateOff: 2 },
      md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translateOn: 20, translateOff: 2 },
      lg: { track: 'w-14 h-7', thumb: 'w-6 h-6', translateOn: 28, translateOff: 2 },
    }[size]

    return (
      <div className={cn('space-y-1.5', className)}>
        <Controller
          name={name}
          control={control}
          rules={rules}
          render={({ field }) => {
            const isOn = !!field.value

            const backgroundColor = isOn ? 'rgb(20, 184, 166)' : 'rgb(var(--surface-tertiary))'
            const translateX = isOn ? sizeClasses.translateOn : sizeClasses.translateOff

            return (
              <div className="flex items-start gap-3">
                {/* Toggle Switch */}
                <motion.button
                  ref={ref}
                  type="button"
                  role="switch"
                  aria-checked={isOn}
                  aria-labelledby={label ? `${name}-label` : undefined}
                  aria-describedby={description ? `${name}-description` : undefined}
                  disabled={disabled}
                  onClick={() => field.onChange(!isOn)}
                  animate={{ backgroundColor }}
                  transition={springTransition}
                  className={cn(
                    'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent',
                    'transition-colors duration-200 ease-in-out',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    sizeClasses.track
                  )}
                >
                  <span className="sr-only">{label}</span>
                  <motion.span
                    animate={{ x: translateX }}
                    transition={wobblyTransition}
                    className={cn(
                      'pointer-events-none inline-block rounded-full bg-white shadow-lg ring-0',
                      sizeClasses.thumb
                    )}
                  />
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
                        onClick={() => !disabled && field.onChange(!isOn)}
                      >
                        {label}
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

ToggleField.displayName = 'ToggleField'
