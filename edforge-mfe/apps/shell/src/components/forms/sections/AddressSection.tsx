/**
 * AddressSection Component
 * 
 * A composable form section for address information.
 * Supports full address with street, city, state, postal code, and country.
 */

import { MapPin, type LucideIcon } from 'lucide-react'
import { TextField, SelectField } from '../fields'
import { FormSection } from './FormSection'

const COUNTRY_OPTIONS = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'JP', label: 'Japan' },
  { value: 'IN', label: 'India' },
]

const US_STATE_OPTIONS = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'IL', label: 'Illinois' },
  { value: 'NY', label: 'New York' },
  { value: 'TX', label: 'Texas' },
  { value: 'WA', label: 'Washington' },
  // Add more as needed
]

export interface AddressSectionProps {
  namePrefix?: string
  showHeader?: boolean
  title?: string
  icon?: LucideIcon
  disabled?: boolean
  required?: boolean
  showSecondLine?: boolean
}

export function AddressSection({
  namePrefix = 'address',
  showHeader = true,
  title = 'Address',
  icon: Icon = MapPin,
  disabled = false,
  required = false,
  showSecondLine = true,
}: AddressSectionProps) {
  const prefix = namePrefix ? `${namePrefix}.` : ''

  return (
    <FormSection
      title={showHeader ? title : undefined}
      icon={showHeader ? Icon : undefined}
      description={showHeader ? 'Physical mailing address' : undefined}
    >
      <div className="space-y-4">
        {/* Street Address */}
        <TextField
          name={`${prefix}street`}
          label="Street Address"
          placeholder="123 Main Street"
          required={required}
          disabled={disabled}
          icon={MapPin}
        />

        {/* Street Line 2 */}
        {showSecondLine && (
          <TextField
            name={`${prefix}street2`}
            label="Apartment, Suite, etc."
            placeholder="Apt 4B"
            disabled={disabled}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* City */}
          <TextField
            name={`${prefix}city`}
            label="City"
            placeholder="San Francisco"
            required={required}
            disabled={disabled}
          />

          {/* State */}
          <SelectField
            name={`${prefix}state`}
            label="State / Province"
            placeholder="Select state"
            options={US_STATE_OPTIONS}
            required={required}
            disabled={disabled}
          />

          {/* Postal Code */}
          <TextField
            name={`${prefix}postalCode`}
            label="Postal Code"
            placeholder="94102"
            required={required}
            disabled={disabled}
          />
        </div>

        {/* Country */}
        <SelectField
          name={`${prefix}country`}
          label="Country"
          placeholder="Select country"
          options={COUNTRY_OPTIONS}
          required={required}
          disabled={disabled}
        />
      </div>
    </FormSection>
  )
}

