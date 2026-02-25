/**
 * RadioGroupField Component
 * 
 * A composable radio button group that integrates with react-hook-form.
 * Features animated states and accessibility.
 */

import { forwardRef } from 'react'
import { useFormContext, Controller, type RegisterOptions } from 'react-hook-form'
import { motion } from 'framer-motion'
import { cn, getNestedError } from '../utils'

export interface RadioOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export interface RadioGroupFieldProps {
  /** Field name (supports dot notation for nested fields) */
  name: string
  /** Field label */
  label?: string
  /** Radio options */
  options: RadioOption[]
  /** Helper text shown below group */
  helperText?: string
  /** Whether field is disabled */
  disabled?: boolean
  /** Whether field is required */
  required?: boolean
  /** Container class name */
  className?: string
  /** Validation rules */
  rules?: RegisterOptions
  /** Layout direction */
  direction?: 'horizontal' | 'vertical'
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Override class name for the options container (e.g. "grid grid-cols-2 gap-4") */
  optionsClassName?: string
}

// Spring transition configs
const springTransition = { type: 'spring', stiffness: 120, damping: 14 }
const wobblyTransition = { type: 'spring', stiffness: 300, damping: 10 }

export const RadioGroupField = forwardRef<HTMLDivElement, RadioGroupFieldProps>(
  (
    {
      name,
      label,
      options,
      helperText,
      disabled = false,
      required = false,
      className,
      rules,
      direction = 'vertical',
      size = 'md',
      optionsClassName,
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
      sm: { radio: 'w-4 h-4', dot: 'w-2 h-2' },
      md: { radio: 'w-5 h-5', dot: 'w-2.5 h-2.5' },
      lg: { radio: 'w-6 h-6', dot: 'w-3 h-3' },
    }[size]

    return (
      <div ref={ref} className={cn('space-y-2', className)}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
            {label}
            {required && <span className="text-rust-500 ml-0.5">*</span>}
          </label>
        )}

        {/* Radio Options */}
        <Controller
          name={name}
          control={control}
          rules={rules}
          render={({ field }) => (
            <div
              role="radiogroup"
              aria-labelledby={label ? `${name}-label` : undefined}
              className={cn(
                'gap-4',
                direction === 'vertical' ? 'flex flex-col' : 'flex flex-row flex-wrap',
                optionsClassName
              )}
            >
              {options.map((option) => {
                const isSelected = field.value === option.value
                const isDisabled = disabled || option.disabled

                return (
                  <RadioOptionComponent
                    key={option.value}
                    option={option}
                    isSelected={isSelected}
                    isDisabled={isDisabled || false}
                    hasError={hasError}
                    sizeClasses={sizeClasses}
                    onSelect={() => field.onChange(option.value)}
                  />
                )
              })}
            </div>
          )}
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

RadioGroupField.displayName = 'RadioGroupField'

// Individual Radio Option
interface RadioOptionComponentProps {
  option: RadioOption
  isSelected: boolean
  isDisabled: boolean
  hasError: boolean
  sizeClasses: { radio: string; dot: string }
  onSelect: () => void
}

function RadioOptionComponent({
  option,
  isSelected,
  isDisabled,
  hasError,
  sizeClasses,
  onSelect,
}: RadioOptionComponentProps) {
  const borderColor = hasError
    ? 'rgb(239, 68, 68)'
    : isSelected
      ? 'rgb(20, 184, 166)'
      : 'rgb(var(--border-primary))'

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      disabled={isDisabled}
      onClick={onSelect}
      className={cn(
        'flex items-start gap-3 text-left',
        isDisabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {/* Radio Circle */}
      <motion.span
        animate={{ borderColor }}
        transition={springTransition}
        className={cn(
          'relative inline-flex items-center justify-center shrink-0 rounded-full border-2',
          'transition-colors duration-200',
          'focus:outline-none',
          sizeClasses.radio
        )}
      >
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: isSelected ? 1 : 0, 
            opacity: isSelected ? 1 : 0 
          }}
          transition={wobblyTransition}
          className={cn(
            'rounded-full bg-teal-500',
            sizeClasses.dot
          )}
        />
      </motion.span>

      {/* Label and Description */}
      <div className="flex-1">
        <span
          className={cn(
            'text-sm font-medium',
            isDisabled ? 'text-[rgb(var(--text-tertiary))]' : 'text-[rgb(var(--text-primary))]'
          )}
        >
          {option.label}
        </span>
        {option.description && (
          <p className="text-sm text-[rgb(var(--text-tertiary))]">
            {option.description}
          </p>
        )}
      </div>
    </button>
  )
}
