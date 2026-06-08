/**
 * Contact & Address Wizard Step
 * 
 * Second step in the person creation wizard.
 * Captures contact information and address.
 */

import React from 'react'
import { motion } from 'framer-motion'
import {
  Mail,
  Phone,
  MapPin,
} from 'lucide-react'
import type { WizardStepProps } from '@edforge/wizard'
import { Input, Select } from '@edforge/ui'

// ============================================================================
// ANIMATED INPUT COMPONENT
// ============================================================================

interface AnimatedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string
  error?: string
  icon?: React.ReactNode
  required?: boolean
}

const AnimatedInput = React.forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ label, error, icon, required, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
          {label}
          {required && <span className="text-rust-500 ml-0.5">*</span>}
        </label>
        <Input
          ref={ref}
          invalid={Boolean(error)}
          prefix={icon}
          className={className}
          {...props}
        />
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

interface AnimatedSelectProps {
  label: string
  error?: string
  required?: boolean
  options: { value: string; label: string }[]
  value?: string
  onChange?: React.ChangeEventHandler<HTMLSelectElement>
}

function AnimatedSelect({ label, error, required, options, value, onChange }: AnimatedSelectProps) {
  const placeholderOption = options.find((opt) => opt.value === '')
  const selectableOptions = options.filter((opt) => opt.value !== '')

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
        {label}
        {required && <span className="text-rust-500 ml-0.5">*</span>}
      </label>
      <Select
        options={selectableOptions}
        value={value || null}
        onChange={(v) => onChange?.({ target: { value: v ?? '' } } as React.ChangeEvent<HTMLSelectElement>)}
        placeholder={placeholderOption?.label}
        invalid={Boolean(error)}
      />
      {error && (
        <p className="text-xs text-rust-500">{error}</p>
      )}
    </div>
  )
}

AnimatedSelect.displayName = 'AnimatedSelect'

// ============================================================================
// SECTION HEADER
// ============================================================================

function SectionHeader({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>, title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-xl bg-[rgb(var(--state-info-bg)/0.18)]">
        <Icon className="w-4 h-4 text-[rgb(var(--state-info-fg))]" />
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
