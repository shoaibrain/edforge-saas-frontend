/**
 * ContactInfoSection Component
 * 
 * A composable form section for contact information.
 * Can be used standalone or embedded in larger forms.
 */

import { Mail, Phone, type LucideIcon } from 'lucide-react'
import { TextField, PhoneField, SelectField } from '../fields'
import { FormSection } from './FormSection'

const PREFERRED_CONTACT_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'sms', label: 'SMS' },
]

export interface ContactInfoSectionProps {
  /** Prefix for field names (e.g., "contact" → "contact.email") */
  namePrefix?: string
  /** Whether to show the section header */
  showHeader?: boolean
  /** Custom section title */
  title?: string
  /** Custom section icon */
  icon?: LucideIcon
  /** Whether fields are disabled */
  disabled?: boolean
  /** Whether to show secondary email */
  showSecondaryEmail?: boolean
  /** Whether to show secondary phone */
  showSecondaryPhone?: boolean
  /** Whether to show preferred contact method */
  showPreferredContact?: boolean
  /** Whether to show emergency contact section */
  showEmergencyContact?: boolean
  /** Additional class name */
  className?: string
}

export function ContactInfoSection({
  namePrefix = '',
  showHeader = true,
  title = 'Contact Information',
  icon: Icon = Mail,
  disabled = false,
  showSecondaryEmail = false,
  showSecondaryPhone = false,
  showPreferredContact = false,
  showEmergencyContact = false,
  className,
}: ContactInfoSectionProps) {
  const prefix = namePrefix ? `${namePrefix}.` : ''

  return (
    <FormSection
      title={showHeader ? title : undefined}
      icon={showHeader ? Icon : undefined}
      description={showHeader ? 'How to reach this person' : undefined}
      className={className}
    >
      <div className="space-y-6">
        {/* Primary Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Primary Email */}
          <TextField
            name={`${prefix}email`}
            label="Email Address"
            placeholder="name@example.com"
            type="email"
            required
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

          {/* Secondary Email */}
          {showSecondaryEmail && (
            <TextField
              name={`${prefix}secondaryEmail`}
              label="Secondary Email"
              placeholder="name@example.com"
              type="email"
              disabled={disabled}
              icon={Mail}
            />
          )}

          {/* Secondary Phone */}
          {showSecondaryPhone && (
            <PhoneField
              name={`${prefix}secondaryPhone`}
              label="Secondary Phone"
              placeholder="(555) 123-4567"
              disabled={disabled}
            />
          )}
        </div>

        {/* Preferred Contact Method */}
        {showPreferredContact && (
          <SelectField
            name={`${prefix}preferredContact`}
            label="Preferred Contact Method"
            placeholder="Select preferred method"
            options={PREFERRED_CONTACT_OPTIONS}
            disabled={disabled}
            className="max-w-xs"
          />
        )}

        {/* Emergency Contact */}
        {showEmergencyContact && (
          <div className="pt-4 border-t border-[rgb(var(--border-secondary))]">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="w-4 h-4 text-teal-500" />
              <h4 className="text-sm font-medium text-[rgb(var(--text-primary))]">
                Emergency Contact
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TextField
                name={`${prefix}emergencyContact.name`}
                label="Contact Name"
                placeholder="Emergency contact name"
                disabled={disabled}
              />
              <PhoneField
                name={`${prefix}emergencyContact.phone`}
                label="Contact Phone"
                placeholder="(555) 123-4567"
                disabled={disabled}
              />
              <TextField
                name={`${prefix}emergencyContact.relationship`}
                label="Relationship"
                placeholder="e.g., Parent, Spouse"
                disabled={disabled}
              />
            </div>
          </div>
        )}
      </div>
    </FormSection>
  )
}

