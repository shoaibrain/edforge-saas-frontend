/**
 * GuardianSection Component
 * 
 * A composable form section for guardian-specific information.
 * Includes relationship, occupation, and permissions.
 */

import { Users, type LucideIcon } from 'lucide-react'
import { TextField, SelectField, ToggleField } from '../fields'
import { FormSection } from './FormSection'

const RELATIONSHIP_OPTIONS = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'guardian', label: 'Legal Guardian' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'other', label: 'Other' },
]

const CONTACT_METHOD_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone Call' },
  { value: 'sms', label: 'SMS / Text' },
]

export interface GuardianSectionProps {
  namePrefix?: string
  showHeader?: boolean
  title?: string
  icon?: LucideIcon
  disabled?: boolean
  showEmployment?: boolean
  showPermissions?: boolean
}

export function GuardianSection({
  namePrefix = '',
  showHeader = true,
  title = 'Guardian Information',
  icon: Icon = Users,
  disabled = false,
  showEmployment = true,
  showPermissions = true,
}: GuardianSectionProps) {
  const prefix = namePrefix ? `${namePrefix}.` : ''

  return (
    <FormSection
      title={showHeader ? title : undefined}
      icon={showHeader ? Icon : undefined}
      description={showHeader ? 'Guardian relationship and contact preferences' : undefined}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Relationship */}
          <SelectField
            name={`${prefix}relationship`}
            label="Relationship to Student"
            placeholder="Select relationship"
            options={RELATIONSHIP_OPTIONS}
            required
            disabled={disabled}
          />

          {/* Preferred Contact Method */}
          <SelectField
            name={`${prefix}preferredContactMethod`}
            label="Preferred Contact Method"
            placeholder="Select method"
            options={CONTACT_METHOD_OPTIONS}
            disabled={disabled}
          />
        </div>

        {/* Employment Information */}
        {showEmployment && (
          <div className="pt-4 border-t border-[rgb(var(--border-primary))]">
            <h4 className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-4">
              Employment Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                name={`${prefix}occupation`}
                label="Occupation"
                placeholder="e.g., Software Engineer"
                disabled={disabled}
              />
              <TextField
                name={`${prefix}employer`}
                label="Employer"
                placeholder="Company name"
                disabled={disabled}
              />
              <TextField
                name={`${prefix}workPhone`}
                label="Work Phone"
                placeholder="(555) 123-4567"
                disabled={disabled}
              />
            </div>
          </div>
        )}

        {/* Permissions */}
        {showPermissions && (
          <div className="pt-4 border-t border-[rgb(var(--border-primary))]">
            <h4 className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-4">
              Permissions
            </h4>
            <div className="space-y-4">
              <ToggleField
                name={`${prefix}canPickup`}
                label="Authorized for Pickup"
                description="Can pick up the student from school"
                disabled={disabled}
              />
              <ToggleField
                name={`${prefix}isEmergencyContact`}
                label="Emergency Contact"
                description="Can be contacted in case of emergency"
                disabled={disabled}
              />
            </div>
          </div>
        )}
      </div>
    </FormSection>
  )
}

