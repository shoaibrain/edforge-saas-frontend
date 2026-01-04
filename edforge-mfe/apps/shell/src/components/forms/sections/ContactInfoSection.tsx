/**
 * ContactInfoSection Component
 * 
 * A composable form section for contact information.
 * Includes email, phone, and secondary contact fields.
 */

import { Mail, type LucideIcon } from 'lucide-react'
import { TextField, PhoneField, SelectField } from '../fields'
import { FormSection } from './FormSection'

const CONTACT_METHOD_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'sms', label: 'SMS' },
]

export interface ContactInfoSectionProps {
  namePrefix?: string
  showHeader?: boolean
  title?: string
  icon?: LucideIcon
  disabled?: boolean
  showSecondaryPhone?: boolean
  showPreferredContact?: boolean
  emailRequired?: boolean
}

export function ContactInfoSection({
  namePrefix = '',
  showHeader = true,
  title = 'Contact Information',
  icon: Icon = Mail,
  disabled = false,
  showSecondaryPhone = true,
  showPreferredContact = false,
  emailRequired = true,
}: ContactInfoSectionProps) {
  const prefix = namePrefix ? `${namePrefix}.` : ''

  return (
    <FormSection
      title={showHeader ? title : undefined}
      icon={showHeader ? Icon : undefined}
      description={showHeader ? 'How to reach this person' : undefined}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Email */}
        <TextField
          name={`${prefix}email`}
          label="Email Address"
          type="email"
          placeholder="email@example.com"
          required={emailRequired}
          disabled={disabled}
          icon={Mail}
        />

        {/* Primary Phone */}
        <PhoneField
          name={`${prefix}phone`}
          label="Phone Number"
          placeholder="(555) 123-4567"
          disabled={disabled}
        />

        {/* Secondary Phone */}
        {showSecondaryPhone && (
          <PhoneField
            name={`${prefix}secondaryPhone`}
            label="Secondary Phone"
            placeholder="(555) 123-4567"
            disabled={disabled}
            helperText="Alternative contact number"
          />
        )}

        {/* Preferred Contact Method */}
        {showPreferredContact && (
          <SelectField
            name={`${prefix}preferredContactMethod`}
            label="Preferred Contact Method"
            placeholder="Select method"
            options={CONTACT_METHOD_OPTIONS}
            disabled={disabled}
          />
        )}
      </div>
    </FormSection>
  )
}

