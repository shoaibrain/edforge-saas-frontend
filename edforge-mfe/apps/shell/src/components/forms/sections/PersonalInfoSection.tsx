/**
 * PersonalInfoSection Component
 * 
 * A composable form section for personal information.
 * Can be used standalone or embedded in larger forms.
 */

import { User, type LucideIcon } from 'lucide-react'
import { TextField, SelectField, DateField } from '../fields'
import { FormSection } from './FormSection'

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

export interface PersonalInfoSectionProps {
  /** Prefix for field names (e.g., "personal" → "personal.firstName") */
  namePrefix?: string
  /** Whether to show the section header */
  showHeader?: boolean
  /** Custom section title */
  title?: string
  /** Custom section icon */
  icon?: LucideIcon
  /** Whether fields are disabled */
  disabled?: boolean
  /** Whether to show middle name field */
  showMiddleName?: boolean
  /** Whether to show avatar field */
  showAvatar?: boolean
}

export function PersonalInfoSection({
  namePrefix = '',
  showHeader = true,
  title = 'Personal Information',
  icon: Icon = User,
  disabled = false,
  showMiddleName = true,
  showAvatar = false,
}: PersonalInfoSectionProps) {
  const prefix = namePrefix ? `${namePrefix}.` : ''

  return (
    <FormSection
      title={showHeader ? title : undefined}
      icon={showHeader ? Icon : undefined}
      description={showHeader ? 'Basic personal details' : undefined}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Name */}
        <TextField
          name={`${prefix}firstName`}
          label="First Name"
          placeholder="Enter first name"
          required
          disabled={disabled}
        />

        {/* Last Name */}
        <TextField
          name={`${prefix}lastName`}
          label="Last Name"
          placeholder="Enter last name"
          required
          disabled={disabled}
        />

        {/* Middle Name */}
        {showMiddleName && (
          <TextField
            name={`${prefix}middleName`}
            label="Middle Name"
            placeholder="Enter middle name (optional)"
            disabled={disabled}
          />
        )}

        {/* Date of Birth */}
        <DateField
          name={`${prefix}dateOfBirth`}
          label="Date of Birth"
          max={new Date().toISOString().split('T')[0]}
          disabled={disabled}
        />

        {/* Gender */}
        <SelectField
          name={`${prefix}gender`}
          label="Gender"
          placeholder="Select gender"
          options={GENDER_OPTIONS}
          disabled={disabled}
        />

        {/* Avatar URL */}
        {showAvatar && (
          <TextField
            name={`${prefix}avatar`}
            label="Avatar URL"
            type="url"
            placeholder="https://example.com/avatar.jpg"
            disabled={disabled}
          />
        )}
      </div>
    </FormSection>
  )
}

