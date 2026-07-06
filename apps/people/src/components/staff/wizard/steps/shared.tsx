/**
 * Shared Animated Form Components
 *
 * Reusable input/select/checkbox components with Framer Motion animations
 * following the school wizard pattern (AnimatedInput, AnimatedSelect).
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Input, Select } from '@edforge/ui'

// ============================================================================
// ANIMATED INPUT
// ============================================================================

interface AnimatedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string
  error?: string
  icon?: React.ReactNode
  required?: boolean
  helpText?: string
}

export const AnimatedInput = React.forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ label, error, icon, required, helpText, id, className, ...props }, ref) => {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={fieldId} className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
            {label}
            {required && <span className="text-rust-500 ms-0.5">*</span>}
          </label>
        )}
        <Input
          ref={ref}
          id={fieldId}
          invalid={Boolean(error)}
          prefix={icon}
          className={className}
          {...props}
        />
        {helpText && !error && <p className="text-xs text-[rgb(var(--text-tertiary))]">{helpText}</p>}
        {error && <p className="text-xs text-rust-500">{error}</p>}
      </div>
    )
  },
)
AnimatedInput.displayName = 'AnimatedInput'

// ============================================================================
// ANIMATED SELECT
// ============================================================================

interface AnimatedSelectProps {
  label: string
  error?: string
  required?: boolean
  options: { value: string; label: string }[]
  helpText?: string
  id?: string
  value?: string
  onChange?: React.ChangeEventHandler<HTMLSelectElement>
}

export function AnimatedSelect({ label, error, required, options, helpText, id, value, onChange }: AnimatedSelectProps) {
  const fieldId = id || label.toLowerCase().replace(/\s+/g, '-')
  const placeholderOption = options.find((opt) => opt.value === '')
  const selectableOptions = options.filter((opt) => opt.value !== '')

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
          {label}
          {required && <span className="text-rust-500 ms-0.5">*</span>}
        </label>
      )}
      <Select
        controlId={fieldId}
        options={selectableOptions}
        value={value || null}
        onChange={(v) => onChange?.({ target: { value: v ?? '' } } as React.ChangeEvent<HTMLSelectElement>)}
        placeholder={placeholderOption?.label}
        invalid={Boolean(error)}
      />
      {helpText && !error && <p className="text-xs text-[rgb(var(--text-tertiary))]">{helpText}</p>}
      {error && <p className="text-xs text-rust-500">{error}</p>}
    </div>
  )
}
AnimatedSelect.displayName = 'AnimatedSelect'

// ============================================================================
// ANIMATED CHECKBOX
// ============================================================================

interface AnimatedCheckboxProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  helpText?: string
  disabled?: boolean
}

export function AnimatedCheckbox({ label, checked, onChange, helpText, disabled }: AnimatedCheckboxProps) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <motion.div
          animate={{
            backgroundColor: checked ? 'rgb(10, 147, 150)' : 'transparent',
            borderColor: checked ? 'rgb(10, 147, 150)' : 'rgb(var(--border-primary))',
          }}
          transition={{ duration: 0.2 }}
          className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0"
        >
          {checked && (
            <motion.svg
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-3 h-3 text-[rgb(var(--action-primary-fg))]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </motion.svg>
          )}
        </motion.div>
        <button
          type="button"
          onClick={() => !disabled && onChange(!checked)}
          className="text-sm text-[rgb(var(--text-primary))] text-start"
          disabled={disabled}
        >
          {label}
        </button>
      </label>
      {helpText && <p className="text-xs text-[rgb(var(--text-tertiary))] ms-8">{helpText}</p>}
    </div>
  )
}

// ============================================================================
// SECTION HEADER
// ============================================================================

interface SectionHeaderProps {
  title: string
  description?: string
  icon?: React.ReactNode
}

export function SectionHeader({ title, description, icon }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 pb-2 border-b border-[rgb(var(--border-primary))]">
      {icon && <div className="text-[rgb(var(--text-tertiary))]">{icon}</div>}
      <div>
        <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">{title}</h3>
        {description && <p className="text-xs text-[rgb(var(--text-tertiary))]">{description}</p>}
      </div>
    </div>
  )
}
