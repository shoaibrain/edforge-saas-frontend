/**
 * Personal Information Wizard Step
 * 
 * First step in the person creation wizard.
 */

import React from 'react'
import { motion } from 'framer-motion'
import { User, Calendar, Camera } from 'lucide-react'
import type { WizardStepProps } from '../WizardContext'
import { Avatar } from '@edforge/ui'
import { cn } from '../../../lib/utils'

function AnimatedInput({
  label,
  error,
  icon: Icon,
  required,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  icon?: typeof User
  required?: boolean
}) {
  const [focused, setFocused] = React.useState(false)

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
        {label}
        {required && <span className="text-rust-500 ml-0.5">*</span>}
      </label>
      <div
        className={cn(
          'relative rounded-xl border-2 bg-[rgb(var(--surface-tertiary))] overflow-hidden transition-colors',
          focused ? 'border-teal-500' : 'border-[rgb(var(--border-primary))]',
          error && 'border-rust-500'
        )}
      >
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-tertiary))]">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          {...props}
          onFocus={(e) => {
            setFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            props.onBlur?.(e)
          }}
          className={cn(
            'w-full px-4 py-3 bg-transparent',
            'text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))]',
            'focus:outline-none text-sm',
            Icon && 'pl-11',
            className
          )}
        />
      </div>
      {error && (
        <p className="text-xs text-rust-500">{error}</p>
      )}
    </div>
  )
}

export function PersonalInfoStep({
  data,
  updateData,
  errors,
  clearError,
}: WizardStepProps) {
  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    updateData({ [field]: e.target.value })
    clearError(field)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex items-start gap-6">
        <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-tertiary))] flex flex-col items-center justify-center cursor-pointer hover:border-teal-500 transition-colors">
          <Camera className="w-6 h-6 text-[rgb(var(--text-tertiary))]" />
          <span className="text-xs text-[rgb(var(--text-tertiary))] mt-2">Upload Photo</span>
        </div>
        
        <div className="flex-1 pt-2">
          <h3 className="text-sm font-medium text-[rgb(var(--text-primary))] mb-1">
            Add a profile photo
          </h3>
          <p className="text-xs text-[rgb(var(--text-tertiary))]">
            A photo helps identify this person.
          </p>
          {typeof data.firstName === 'string' && typeof data.lastName === 'string' && data.firstName && data.lastName && (
            <div className="mt-4 flex items-center gap-3">
              <Avatar
                name={`${data.firstName} ${data.lastName}`}
                size="sm"
                shape="rounded"
              />
              <span className="text-xs text-[rgb(var(--text-tertiary))]">
                Auto-generated avatar
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AnimatedInput
          label="First Name"
          placeholder="John"
          icon={User}
          required
          value={(data.firstName as string) || ''}
          onChange={handleChange('firstName')}
          error={errors.firstName}
          autoComplete="given-name"
        />
        <AnimatedInput
          label="Middle Name"
          placeholder="William"
          icon={User}
          value={(data.middleName as string) || ''}
          onChange={handleChange('middleName')}
          error={errors.middleName}
        />
        <AnimatedInput
          label="Last Name"
          placeholder="Doe"
          icon={User}
          required
          value={(data.lastName as string) || ''}
          onChange={handleChange('lastName')}
          error={errors.lastName}
          autoComplete="family-name"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatedInput
          label="Date of Birth"
          type="date"
          icon={Calendar}
          value={(data.dateOfBirth as string) || ''}
          onChange={handleChange('dateOfBirth')}
          error={errors.dateOfBirth}
          max={new Date().toISOString().split('T')[0]}
        />
        
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
            Gender
          </label>
          <select
            value={(data.gender as string) || ''}
            onChange={handleChange('gender')}
            className={cn(
              'w-full px-4 py-3 rounded-xl border-2 bg-[rgb(var(--surface-tertiary))]',
              'text-sm text-[rgb(var(--text-primary))]',
              'border-[rgb(var(--border-primary))]',
              'focus:outline-none focus:border-teal-500'
            )}
          >
            <option value="">Select gender...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </div>
      </div>
    </motion.div>
  )
}

