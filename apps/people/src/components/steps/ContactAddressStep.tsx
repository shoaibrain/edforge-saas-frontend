/**
 * Contact & Address Wizard Step
 * 
 * Second step in the person creation wizard.
 * Captures contact information and address.
 */

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Mail,
  Phone,
  MapPin,
} from 'lucide-react'
import type { WizardStepProps } from '@edforge/wizard'
import { cn } from '@/lib/utils'

// ============================================================================
// ANIMATED INPUT COMPONENT
// ============================================================================

interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  icon?: React.ReactNode
  required?: boolean
}

const AnimatedInput = React.forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ label, error, icon, required, className, ...props }, ref) => {
    const [focused, setFocused] = useState(false)

    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
          {label}
          {required && <span className="text-rust-500 ml-0.5">*</span>}
        </label>
        <motion.div
          animate={{
            borderColor: error
              ? 'rgb(185, 62, 3)'
              : focused
              ? 'rgb(10, 147, 150)'
              : 'rgb(var(--border-primary))',
            boxShadow: error
              ? '0 0 0 3px rgba(185, 62, 3, 0.15)'
              : focused
              ? '0 0 0 3px rgba(10, 147, 150, 0.15)'
              : '0 0 0 0px transparent',
          }}
          transition={{ duration: 0.2 }}
          className="relative rounded-xl border-2 bg-[rgb(var(--surface-tertiary))] overflow-hidden transition-colors"
        >
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-tertiary))]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
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
              'focus:outline-none',
              'text-sm',
              icon && 'pl-11',
              className
            )}
          />
        </motion.div>
        {error && (
          <p className="text-xs text-rust-500">{error}</p>
        )}
      </div>
    )
  }
)

AnimatedInput.displayName = 'AnimatedInput'

// ============================================================================
// ANIMATED SELECT COMPONENT
// ============================================================================

interface AnimatedSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  required?: boolean
  options: { value: string; label: string }[]
}

const AnimatedSelect = React.forwardRef<HTMLSelectElement, AnimatedSelectProps>(
  ({ label, error, required, options, className, ...props }, ref) => {
    const [focused, setFocused] = useState(false)

    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
          {label}
          {required && <span className="text-rust-500 ml-0.5">*</span>}
        </label>
        <motion.div
          animate={{
            borderColor: error
              ? 'rgb(185, 62, 3)'
              : focused
              ? 'rgb(10, 147, 150)'
              : 'rgb(var(--border-primary))',
            boxShadow: error
              ? '0 0 0 3px rgba(185, 62, 3, 0.15)'
              : focused
              ? '0 0 0 3px rgba(10, 147, 150, 0.15)'
              : '0 0 0 0px transparent',
          }}
          transition={{ duration: 0.2 }}
          className="relative rounded-xl border-2 bg-[rgb(var(--surface-tertiary))] overflow-hidden transition-colors"
        >
          <select
            ref={ref}
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
              'w-full px-4 py-3 bg-transparent appearance-none',
              'text-[rgb(var(--text-primary))]',
              'focus:outline-none',
              'text-sm pr-10',
              className
            )}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-[rgb(var(--text-tertiary))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </motion.div>
        {error && (
          <p className="text-xs text-rust-500">{error}</p>
        )}
      </div>
    )
  }
)

AnimatedSelect.displayName = 'AnimatedSelect'

// ============================================================================
// SECTION HEADER
// ============================================================================

function SectionHeader({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>, title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-xl bg-teal-500/10 dark:bg-cyan-500/15">
        <Icon className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
      </div>
      <h3 className="text-base font-semibold text-[rgb(var(--text-primary))]">{title}</h3>
    </div>
  )
}

// ============================================================================
// US STATES LIST
// ============================================================================

const US_STATES = [
  { value: '', label: 'Select state...' },
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
]

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ContactAddressStep({
  data,
  updateData,
  errors,
  clearError,
}: WizardStepProps) {
  const address = (data.address as Record<string, string>) || {}

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    updateData({ [field]: e.target.value })
    clearError(field)
  }

  const handleAddressChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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
      {/* Contact Information */}
      <div>
        <SectionHeader icon={Mail} title="Contact Information" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatedInput
            label="Email Address"
            type="email"
            placeholder="john.doe@example.com"
            icon={<Mail className="w-4 h-4" />}
            required
            value={(data.email as string) || ''}
            onChange={handleChange('email')}
            error={errors.email}
            autoComplete="email"
          />
          <AnimatedInput
            label="Phone Number"
            type="tel"
            placeholder="(555) 123-4567"
            icon={<Phone className="w-4 h-4" />}
            value={(data.phone as string) || ''}
            onChange={handleChange('phone')}
            error={errors.phone}
            autoComplete="tel"
          />
          <AnimatedInput
            label="Secondary Email"
            type="email"
            placeholder="alternate@example.com"
            icon={<Mail className="w-4 h-4" />}
            value={(data.secondaryEmail as string) || ''}
            onChange={handleChange('secondaryEmail')}
            error={errors.secondaryEmail}
          />
          <AnimatedInput
            label="Secondary Phone"
            type="tel"
            placeholder="(555) 987-6543"
            icon={<Phone className="w-4 h-4" />}
            value={(data.secondaryPhone as string) || ''}
            onChange={handleChange('secondaryPhone')}
            error={errors.secondaryPhone}
          />
        </div>
      </div>

      {/* Address */}
      <div>
        <SectionHeader icon={MapPin} title="Address" />
        <div className="space-y-4">
          <AnimatedInput
            label="Street Address"
            placeholder="123 Main Street"
            icon={<MapPin className="w-4 h-4" />}
            value={address.street || ''}
            onChange={handleAddressChange('street')}
            error={errors['address.street']}
            autoComplete="street-address"
          />
          <AnimatedInput
            label="Apartment, Suite, etc."
            placeholder="Apt 4B (optional)"
            value={address.street2 || ''}
            onChange={handleAddressChange('street2')}
            error={errors['address.street2']}
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2 md:col-span-1">
              <AnimatedInput
                label="City"
                placeholder="New York"
                value={address.city || ''}
                onChange={handleAddressChange('city')}
                error={errors['address.city']}
                autoComplete="address-level2"
              />
            </div>
            <AnimatedSelect
              label="State"
              value={address.state || ''}
              onChange={handleAddressChange('state')}
              error={errors['address.state']}
              options={US_STATES}
            />
            <AnimatedInput
              label="ZIP Code"
              placeholder="10001"
              value={address.zipCode || ''}
              onChange={handleAddressChange('zipCode')}
              error={errors['address.zipCode']}
              autoComplete="postal-code"
              maxLength={10}
            />
            <AnimatedSelect
              label="Country"
              value={address.country || 'US'}
              onChange={handleAddressChange('country')}
              error={errors['address.country']}
              options={[
                { value: 'US', label: 'United States' },
                { value: 'CA', label: 'Canada' },
                { value: 'MX', label: 'Mexico' },
                { value: 'OTHER', label: 'Other' },
              ]}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
