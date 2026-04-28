/**
 * AddressFieldsLegacy — US/generic-shaped address form (Sprint A.9)
 *
 * Renders the existing fields: street1 / street2 / city / state (50-state
 * select) / zipCode / country. No behavioral change vs the prior
 * `AddressSection` component — this is an extraction so the archetype
 * switch in `<AddressFields>` (Sprint A.10) can pick between this legacy
 * layout and the Nepal-shaped `<AddressFieldsNepal>` (Sprint A.8).
 *
 * Used directly when the tenant archetype is not PABSON. `AddressSection`
 * is preserved as a re-export alias of this component so existing callers
 * continue to work unchanged (no churn outside this package).
 */

import { MapPin, type LucideIcon } from 'lucide-react'
import { TextField, SelectField } from '../fields'
import { FormSection } from './FormSection'

// Common country options
const COUNTRY_OPTIONS = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'IN', label: 'India' },
  { value: 'JP', label: 'Japan' },
  { value: 'CN', label: 'China' },
  { value: 'BR', label: 'Brazil' },
  { value: 'MX', label: 'Mexico' },
  { value: 'OTHER', label: 'Other' },
]

// US State options
const US_STATE_OPTIONS = [
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

export interface AddressFieldsLegacyProps {
  /** Prefix for field names (e.g., "address" → "address.street1") */
  namePrefix?: string
  /** Whether to show the section header */
  showHeader?: boolean
  /** Custom section title */
  title?: string
  /** Custom section icon */
  icon?: LucideIcon
  /** Whether fields are disabled */
  disabled?: boolean
  /** Whether to show address line 2 */
  showAddressLine2?: boolean
  /** Whether to show country selector */
  showCountry?: boolean
  /** Additional class name */
  className?: string
}

export function AddressFieldsLegacy({
  namePrefix = 'address',
  showHeader = true,
  title = 'Address',
  icon: Icon = MapPin,
  disabled = false,
  showAddressLine2 = true,
  showCountry = true,
  className,
}: AddressFieldsLegacyProps) {
  const prefix = namePrefix ? `${namePrefix}.` : ''

  return (
    <FormSection
      title={showHeader ? title : undefined}
      icon={showHeader ? Icon : undefined}
      description={showHeader ? 'Mailing and physical address' : undefined}
      className={className}
    >
      <div className="grid grid-cols-1 gap-4">
        {/* Street Address */}
        <TextField
          name={`${prefix}street1`}
          label="Street Address"
          placeholder="123 Main Street"
          disabled={disabled}
          icon={MapPin}
        />

        {/* Address Line 2 */}
        {showAddressLine2 && (
          <TextField
            name={`${prefix}street2`}
            label="Address Line 2"
            placeholder="Apartment, suite, unit, etc. (optional)"
            disabled={disabled}
          />
        )}

        {/* City, State, Zip Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* City */}
          <TextField
            name={`${prefix}city`}
            label="City"
            placeholder="City"
            disabled={disabled}
          />

          {/* State */}
          <SelectField
            name={`${prefix}state`}
            label="State / Province"
            placeholder="Select state"
            options={US_STATE_OPTIONS}
            disabled={disabled}
          />

          {/* Zip Code */}
          <TextField
            name={`${prefix}zipCode`}
            label="ZIP / Postal Code"
            placeholder="12345"
            disabled={disabled}
            maxLength={10}
          />
        </div>

        {/* Country */}
        {showCountry && (
          <SelectField
            name={`${prefix}country`}
            label="Country"
            placeholder="Select country"
            options={COUNTRY_OPTIONS}
            disabled={disabled}
            className="max-w-xs"
          />
        )}
      </div>
    </FormSection>
  )
}
