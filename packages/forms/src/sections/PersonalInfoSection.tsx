/**
 * PersonalInfoSection Component
 * 
 * A composable form section for personal information.
 * Can be used standalone or embedded in larger forms.
 */

import { User, Camera, type LucideIcon } from 'lucide-react'
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
  /** Whether to show date of birth */
  showDateOfBirth?: boolean
  /** Whether to show gender */
  showGender?: boolean
  /** Additional class name */
  className?: string
}

export function PersonalInfoSection({
  namePrefix = '',
  showHeader = true,
  title = 'Personal Information',
  icon: Icon = User,
  disabled = false,
  showMiddleName = true,
  showAvatar = false,
  showDateOfBirth = true,
  showGender = true,
  className,
}: PersonalInfoSectionProps) {
  const prefix = namePrefix ? `${namePrefix}.` : ''

  return (
    <FormSection
      title={showHeader ? title : undefined}
      icon={showHeader ? Icon : undefined}
      description={showHeader ? 'Basic details about the person' : undefined}
      className={className}
    >
      {/* Avatar Upload (optional) */}
      {showAvatar && (
        <div className="mb-6">
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-[rgb(var(--background-tertiary))] border-2 border-dashed border-[rgb(var(--border-primary))] flex items-center justify-center">
                <Camera className="w-6 h-6 text-[rgb(var(--text-tertiary))]" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                Profile Photo
                <span className="text-[rgb(var(--text-tertiary))] font-normal ml-1">(optional)</span>
              </p>
              <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
                Upload a photo to help identify this person. JPG, PNG, or GIF up to 5MB.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* First Name */}
        <TextField
          name={`${prefix}firstName`}
          label="First Name"
          placeholder="Enter first name"
          required
          disabled={disabled}
          icon={User}
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

        {/* Last Name */}
        <TextField
          name={`${prefix}lastName`}
          label="Last Name"
          placeholder="Enter last name"
          required
          disabled={disabled}
        />

        {/* Date of Birth */}
        {showDateOfBirth && (
          <DateField
            name={`${prefix}dateOfBirth`}
            label="Date of Birth"
            max={new Date().toISOString().split('T')[0]}
            disabled={disabled}
          />
        )}

        {/* Gender */}
        {showGender && (
          <SelectField
            name={`${prefix}gender`}
            label="Gender"
            placeholder="Select gender"
            options={GENDER_OPTIONS}
            disabled={disabled}
          />
        )}
      </div>
    </FormSection>
  )
}

