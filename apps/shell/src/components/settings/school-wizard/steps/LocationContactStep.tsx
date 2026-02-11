/**
 * Location & Contact Step
 *
 * Step 2: Physical address, phone, email, and website.
 * All fields in this step are optional — the step itself is skippable.
 */

import { motion } from 'framer-motion'
import { Phone, Mail, Globe } from 'lucide-react'
import type { WizardStepProps } from '@edforge/wizard'
import { AnimatedInput, AnimatedSelect } from './BasicInfoStep'
import { COUNTRY_OPTIONS } from '../school-wizard.utils'

export function LocationContactStep({ data, updateData, errors, clearError }: WizardStepProps) {
  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    updateData({ [field]: e.target.value })
    clearError(field)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Address */}
      <div className="space-y-4">
        <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wider font-medium">
          Physical Address
        </p>
        <AnimatedInput
          label="Address Line 1"
          placeholder="123 Main Street"
          autoComplete="address-line1"
          value={(data['address.street1'] as string) || ''}
          onChange={handleChange('address.street1')}
          error={errors['address.street1']}
        />
        <AnimatedInput
          label="Address Line 2"
          placeholder="Suite 100, Building A"
          autoComplete="address-line2"
          value={(data['address.street2'] as string) || ''}
          onChange={handleChange('address.street2')}
          helpText="Optional"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatedInput
            label="City"
            placeholder="Springfield"
            autoComplete="address-level2"
            value={(data['address.city'] as string) || ''}
            onChange={handleChange('address.city')}
            error={errors['address.city']}
          />
          <AnimatedInput
            label="State"
            placeholder="IL"
            autoComplete="address-level1"
            maxLength={2}
            value={(data['address.state'] as string) || ''}
            onChange={handleChange('address.state')}
            error={errors['address.state']}
            className="font-mono uppercase"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatedInput
            label="Zip / Postal Code"
            placeholder="62701"
            autoComplete="postal-code"
            value={(data['address.zipCode'] as string) || ''}
            onChange={handleChange('address.zipCode')}
            error={errors['address.zipCode']}
          />
          <AnimatedSelect
            label="Country"
            value={(data['address.country'] as string) || 'USA'}
            onChange={handleChange('address.country')}
            options={COUNTRY_OPTIONS}
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="pt-4 border-t border-[rgb(var(--border-secondary))]">
        <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wider font-medium mb-4">
          Contact Information
        </p>
        <div className="space-y-4">
          <AnimatedInput
            label="Phone Number"
            type="tel"
            placeholder="(555) 123-4567"
            autoComplete="tel"
            icon={<Phone className="w-4 h-4" />}
            value={(data.phone as string) || ''}
            onChange={handleChange('phone')}
            error={errors.phone}
          />
          <AnimatedInput
            label="Email Address"
            type="email"
            placeholder="office@school.edu"
            autoComplete="email"
            icon={<Mail className="w-4 h-4" />}
            value={(data.email as string) || ''}
            onChange={handleChange('email')}
            error={errors.email}
          />
          <AnimatedInput
            label="Website"
            type="url"
            placeholder="https://school.edu"
            autoComplete="url"
            icon={<Globe className="w-4 h-4" />}
            value={(data.website as string) || ''}
            onChange={handleChange('website')}
            error={errors.website}
          />
        </div>
      </div>
    </motion.div>
  )
}
