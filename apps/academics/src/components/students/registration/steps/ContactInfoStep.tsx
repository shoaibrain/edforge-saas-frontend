/**
 * Contact Information Step — V2
 *
 * Second step of the student registration wizard.
 * Collects email, phone, physical address, and optional mailing address.
 *
 * V2: Collapsible sections with icons, titles, and completion indicators.
 *
 * Sprint A.13 + A.18: AddressSection → AddressFields, PhoneField → PhoneInput.
 * Both branch on the tenant's archetype + country (read via the
 * useTenantContext hook from @edforge/forms — sourced from the
 * @edforge/config school-context-channel populated by Shell).
 *
 * PABSON tenants (Nepal pilot) see the CEHRD-canonical Province/District/
 * Municipality/Ward layout + +977 phone prefix. GENERIC tenants see the
 * existing US-shaped form unchanged.
 */

import { FormProvider } from 'react-hook-form'
import { Phone, MapPin, Mail } from 'lucide-react'
import {
  TextField,
  SelectField,
  ToggleField,
  AddressFields,
  PhoneInput,
  useTenantContext,
} from '@edforge/forms'
import type { WizardStepProps } from '@edforge/wizard'
import { useWizardForm } from '../../../../hooks/useWizardForm'
import { PHONE_TYPE_OPTIONS } from '../../../../schemas/student.form'
import { CollapsibleSection } from '../CollapsibleSection'

export function ContactInfoStep({
  data,
  updateData,
  errors,
  clearError,
}: WizardStepProps) {
  const form = useWizardForm({ data, updateData, errors, clearError })
  const useMailingAddress = form.watch('contactInfo.useMailingAddress')
  const { archetype, country } = useTenantContext()

  return (
    <FormProvider {...form}>
      <div className="space-y-4">
        {/* Contact Details */}
        <CollapsibleSection
          id="contact-details"
          icon={Phone}
          title="Contact Details"
          description="Email and phone information"
          fields={['contactInfo.email', 'contactInfo.phone', 'contactInfo.phoneType']}
          defaultExpanded
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <TextField
              name="contactInfo.email"
              label="Email Address"
              type="email"
              placeholder="student@example.com"
              helperText="Optional for students"
            />
            <PhoneInput
              name="contactInfo.phone"
              archetype={archetype}
              country={country}
              label="Phone Number"
            />
            <SelectField
              name="contactInfo.phoneType"
              label="Phone Type"
              options={PHONE_TYPE_OPTIONS}
              placeholder="Select type"
            />
          </div>
        </CollapsibleSection>

        {/* Physical Address */}
        <CollapsibleSection
          id="contact-address"
          icon={MapPin}
          title="Physical Address"
          description="Student's primary residential address"
          fields={[
            'contactInfo.address.street1',
            'contactInfo.address.city',
            'contactInfo.address.state',
            'contactInfo.address.zipCode',
            // Nepal-shaped extension fields (Sprint A.1) — populated by
            // PABSON tenants via AddressFieldsNepal.
            'contactInfo.address.province',
            'contactInfo.address.district',
            'contactInfo.address.municipality',
            'contactInfo.address.wardNumber',
          ]}
          defaultExpanded
        >
          <AddressFields
            archetype={archetype}
            country={country}
            namePrefix="contactInfo.address"
            showAddressLine2
            showCountry
          />
        </CollapsibleSection>

        {/* Mailing Address */}
        <CollapsibleSection
          id="contact-mailing"
          icon={Mail}
          title="Mailing Address"
          description="Only if different from physical address"
          fields={['contactInfo.useMailingAddress']}
          defaultExpanded={false}
        >
          <div className="space-y-4">
            <ToggleField
              name="contactInfo.useMailingAddress"
              label="Use a different mailing address"
              description="Enable this if the mailing address is different from the physical address above"
            />

            {useMailingAddress && (
              <AddressFields
                archetype={archetype}
                country={country}
                namePrefix="contactInfo.mailingAddress"
                title="Mailing Address"
                showAddressLine2
                showCountry
              />
            )}
          </div>
        </CollapsibleSection>
      </div>
    </FormProvider>
  )
}
