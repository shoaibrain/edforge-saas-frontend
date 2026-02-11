/**
 * Basic Information Step
 *
 * Step 1: School name, code, type, and grade range.
 * All fields in this step are required.
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { WizardStepProps } from '@edforge/wizard'
import {
  SCHOOL_TYPE_OPTIONS,
  GRADE_OPTIONS,
  generateSchoolCode,
} from '../school-wizard.utils'

// ============================================================================
// ANIMATED INPUT (follows PersonalInfoStep pattern)
// ============================================================================

interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  icon?: React.ReactNode
  required?: boolean
  helpText?: string
}

const AnimatedInput = React.forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ label, error, icon, required, helpText, id, className, ...props }, ref) => {
    const [focused, setFocused] = useState(false)
    const fieldId = id || label.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1.5">
        <label htmlFor={fieldId} className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
          {label}
          {required && <span className="text-rust-500 ml-0.5">*</span>}
        </label>
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
          className="relative rounded-xl border-2 bg-[rgb(var(--surface-tertiary))] overflow-hidden"
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
}

const AnimatedSelect = React.forwardRef<HTMLSelectElement, AnimatedSelectProps>(
  ({ label, error, required, options, id, className, ...props }, ref) => {
    const [focused, setFocused] = useState(false)
    const fieldId = id || label.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1.5">
        <label htmlFor={fieldId} className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
          {label}
          {required && <span className="text-rust-500 ml-0.5">*</span>}
        </label>
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
          className="relative rounded-xl border-2 bg-[rgb(var(--surface-tertiary))] overflow-hidden"
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
        {error && <p className="text-xs text-rust-500">{error}</p>}
      </div>
    )
  },
)
AnimatedSelect.displayName = 'AnimatedSelect'

// ============================================================================
// STEP COMPONENT
// ============================================================================

export { AnimatedInput, AnimatedSelect }

export function BasicInfoStep({ data, updateData, errors, clearError }: WizardStepProps) {
  const [codeWasAutoGenerated, setCodeWasAutoGenerated] = useState(true)

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    updateData({ [field]: e.target.value })
    clearError(field)
  }

  // Auto-generate school code from name
  useEffect(() => {
    const name = data.name as string
    if (name && codeWasAutoGenerated) {
      updateData({ schoolCode: generateSchoolCode(name) })
    }
  }, [data.name]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatedInput
          label="School Name"
          required
          placeholder="e.g., Lincoln High School"
          autoComplete="organization"
          value={(data.name as string) || ''}
          onChange={handleChange('name')}
          error={errors.name}
        />
        <AnimatedInput
          label="Short Name"
          placeholder="e.g., Lincoln HS"
          autoComplete="off"
          maxLength={50}
          value={(data.shortName as string) || ''}
          onChange={handleChange('shortName')}
          helpText="Optional display alias"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatedInput
          label="School Code"
          required
          placeholder="e.g., LHS"
          autoComplete="off"
          maxLength={10}
          value={(data.schoolCode as string) || ''}
          onChange={(e) => {
            setCodeWasAutoGenerated(false)
            updateData({ schoolCode: e.target.value.toUpperCase() })
            clearError('schoolCode')
          }}
          error={errors.schoolCode}
          helpText="2–10 characters. Cannot change after creation."
          className="font-mono uppercase"
        />
        <AnimatedSelect
          label="School Type"
          required
          value={(data.schoolType as string) || 'high'}
          onChange={handleChange('schoolType')}
          error={errors.schoolType}
          options={SCHOOL_TYPE_OPTIONS}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1.5">
          Grade Range <span className="text-rust-500">*</span>
        </label>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <AnimatedSelect
              label=""
              id="grade-range-start"
              value={(data['gradeRange.start'] as string) || '9'}
              onChange={handleChange('gradeRange.start')}
              error={errors['gradeRange.start']}
              options={GRADE_OPTIONS}
            />
          </div>
          <span className="text-sm text-[rgb(var(--text-tertiary))] pt-1">to</span>
          <div className="flex-1">
            <AnimatedSelect
              label=""
              id="grade-range-end"
              value={(data['gradeRange.end'] as string) || '12'}
              onChange={handleChange('gradeRange.end')}
              error={errors['gradeRange.end']}
              options={GRADE_OPTIONS}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
