/**
 * Shared Animated Form Components
 *
 * Reusable input/select/checkbox components with Framer Motion animations
 * following the school wizard pattern (AnimatedInput, AnimatedSelect).
 */

import React, { useState } from 'react'
import { motion } from 'framer-motion'

// ============================================================================
// ANIMATED INPUT
// ============================================================================

interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  icon?: React.ReactNode
  required?: boolean
  helpText?: string
}

export const AnimatedInput = React.forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ label, error, icon, required, helpText, id, className, ...props }, ref) => {
    const [focused, setFocused] = useState(false)
    const fieldId = id || label.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={fieldId} className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
            {label}
            {required && <span className="text-rust-500 ml-0.5">*</span>}
          </label>
        )}
        <motion.div
          animate={{
            borderColor: error
              ? 'rgb(185, 62, 3)'
              : focused ? 'rgb(10, 147, 150)' : 'rgb(var(--border-primary))',
            boxShadow: error
              ? '0 0 0 3px rgba(185, 62, 3, 0.15)'
              : focused ? '0 0 0 3px rgba(10, 147, 150, 0.15)' : '0 0 0 0px transparent',
          }}
          transition={{ duration: 0.2 }}
          className="relative rounded-xl border-2 bg-[rgb(var(--background-tertiary))] overflow-hidden"
        >
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-tertiary))]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={fieldId}
            {...props}
            onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
            onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
            className={`w-full px-4 py-3 bg-transparent text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none text-sm ${icon ? 'pl-11' : ''} ${className || ''}`}
          />
        </motion.div>
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

interface AnimatedSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  required?: boolean
  options: { value: string; label: string }[]
  helpText?: string
}

export const AnimatedSelect = React.forwardRef<HTMLSelectElement, AnimatedSelectProps>(
  ({ label, error, required, options, helpText, id, className, ...props }, ref) => {
    const [focused, setFocused] = useState(false)
    const fieldId = id || label.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={fieldId} className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
            {label}
            {required && <span className="text-rust-500 ml-0.5">*</span>}
          </label>
        )}
        <motion.div
          animate={{
            borderColor: error
              ? 'rgb(185, 62, 3)'
              : focused ? 'rgb(10, 147, 150)' : 'rgb(var(--border-primary))',
            boxShadow: error
              ? '0 0 0 3px rgba(185, 62, 3, 0.15)'
              : focused ? '0 0 0 3px rgba(10, 147, 150, 0.15)' : '0 0 0 0px transparent',
          }}
          transition={{ duration: 0.2 }}
          className="relative rounded-xl border-2 bg-[rgb(var(--background-tertiary))] overflow-hidden"
        >
          <select
            ref={ref}
            id={fieldId}
            {...props}
            onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
            onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
            className={`w-full px-4 py-3 bg-transparent appearance-none text-[rgb(var(--text-primary))] focus:outline-none text-sm pr-10 ${className || ''}`}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-[rgb(var(--text-tertiary))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </motion.div>
        {helpText && !error && <p className="text-xs text-[rgb(var(--text-tertiary))]">{helpText}</p>}
        {error && <p className="text-xs text-rust-500">{error}</p>}
      </div>
    )
  },
)
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
          className="text-sm text-[rgb(var(--text-primary))] text-left"
          disabled={disabled}
        >
          {label}
        </button>
      </label>
      {helpText && <p className="text-xs text-[rgb(var(--text-tertiary))] ml-8">{helpText}</p>}
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
