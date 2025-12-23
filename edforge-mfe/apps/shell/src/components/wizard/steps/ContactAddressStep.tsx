/**
 * Contact & Address Wizard Step
 * 
 * Second step in the person creation wizard.
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Home } from 'lucide-react'
import type { WizardStepProps } from '../WizardContext'
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
  icon?: typeof Mail
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

const COUNTRY_OPTIONS = [
  { value: '', label: 'Select country...' },
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'UK', label: 'United Kingdom' },
]

const US_STATE_OPTIONS = [
  { value: '', label: 'Select state...' },
  { value: 'CA', label: 'California' },
  { value: 'NY', label: 'New York' },
  { value: 'TX', label: 'Texas' },
  { value: 'FL', label: 'Florida' },
]

export function ContactAddressStep({
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

  const handleAddressChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const address = (data.address as Record<string, string>) || {}
    updateData({
      address: {
        ...address,
        [field]: e.target.value,
      },
    })
    clearError(`address.${field}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))] uppercase tracking-wider">
          Email Addresses
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatedInput
            label="Primary Email"
            type="email"
            placeholder="john.doe@example.com"
            icon={Mail}
            required
            value={(data.email as string) || ''}
            onChange={handleChange('email')}
            error={errors.email}
            autoComplete="email"
          />
          <AnimatedInput
            label="Secondary Email"
            type="email"
            placeholder="john.personal@email.com"
            icon={Mail}
            value={(data.secondaryEmail as string) || ''}
            onChange={handleChange('secondaryEmail')}
            error={errors.secondaryEmail}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))] uppercase tracking-wider">
          Phone Numbers
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatedInput
            label="Primary Phone"
            type="tel"
            placeholder="(555) 123-4567"
            icon={Phone}
            value={(data.phone as string) || ''}
            onChange={handleChange('phone')}
            error={errors.phone}
          />
          <AnimatedInput
            label="Secondary Phone"
            type="tel"
            placeholder="(555) 987-6543"
            icon={Phone}
            value={(data.secondaryPhone as string) || ''}
            onChange={handleChange('secondaryPhone')}
            error={errors.secondaryPhone}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))] uppercase tracking-wider">
          Address
        </h3>

        <AnimatedInput
          label="Street Address"
          placeholder="123 Main Street"
          icon={Home}
          value={((data.address as Record<string, string>)?.street as string) || ''}
          onChange={handleAddressChange('street')}
          error={errors['address.street']}
          autoComplete="street-address"
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AnimatedInput
            label="City"
            placeholder="New York"
            icon={MapPin}
            value={((data.address as Record<string, string>)?.city as string) || ''}
            onChange={handleAddressChange('city')}
            error={errors['address.city']}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
              State
            </label>
            <select
              value={((data.address as Record<string, string>)?.state as string) || ''}
              onChange={handleAddressChange('state')}
              className={cn(
                'w-full px-4 py-3 rounded-xl border-2 bg-[rgb(var(--surface-tertiary))]',
                'text-sm text-[rgb(var(--text-primary))]',
                'border-[rgb(var(--border-primary))]',
                'focus:outline-none focus:border-teal-500'
              )}
            >
              {US_STATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <AnimatedInput
            label="ZIP Code"
            placeholder="10001"
            value={((data.address as Record<string, string>)?.postalCode as string) || ''}
            onChange={handleAddressChange('postalCode')}
            error={errors['address.postalCode']}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
              Country
            </label>
            <select
              value={((data.address as Record<string, string>)?.country as string) || 'US'}
              onChange={handleAddressChange('country')}
              className={cn(
                'w-full px-4 py-3 rounded-xl border-2 bg-[rgb(var(--surface-tertiary))]',
                'text-sm text-[rgb(var(--text-primary))]',
                'border-[rgb(var(--border-primary))]',
                'focus:outline-none focus:border-teal-500'
              )}
            >
              {COUNTRY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

