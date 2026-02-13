/**
 * Contact Information Step
 *
 * Second step of the student registration wizard.
 * Collects email, phone, physical address, and optional mailing address.
 */

import { FormProvider } from 'react-hook-form'
import { TextField, PhoneField, SelectField, ToggleField, AddressSection } from '@edforge/forms'
import type { WizardStepProps } from '@edforge/wizard'
import { useWizardForm } from '../../../../hooks/useWizardForm'
import { PHONE_TYPE_OPTIONS } from '../../../../schemas/student.form'

export function ContactInfoStep({
  data,
  updateData,
  errors,
  clearError,
}: WizardStepProps) {
  const form = useWizardForm({ data, updateData, errors, clearError })
  const useMailingAddress = form.watch('contactInfo.useMailingAddress')

  return (
    <FormProvider {...form}>
      <div className="space-y-8">
        {/* Email & Phone */}
        <div>
          <h3 className="text-sm font-semibold text-[rgb(var(--text-secondary))] uppercase tracking-wider mb-4">
            Contact Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <TextField
              name="contactInfo.email"
              label="Email Address"
              type="email"
              placeholder="student@example.com"
              helperText="Optional for students"
            />
            <PhoneField
              name="contactInfo.phone"
              label="Phone Number"
              placeholder="(555) 123-4567"
            />
            <SelectField
              name="contactInfo.phoneType"
              label="Phone Type"
              options={PHONE_TYPE_OPTIONS}
              placeholder="Select type"
            />
          </div>
        </div>

        {/* Physical Address */}
        <AddressSection
          namePrefix="contactInfo.address"
          title="Physical Address"
          showAddressLine2
          showCountry
        />

        {/* Mailing Address Toggle */}
        <div className="border-t border-[rgb(var(--border-secondary))] pt-6">
          <ToggleField
            name="contactInfo.useMailingAddress"
            label="Use a different mailing address"
            description="Enable this if the mailing address is different from the physical address above"
          />
        </div>

        {/* Conditional Mailing Address */}
        {useMailingAddress && (
          <AddressSection
            namePrefix="contactInfo.mailingAddress"
            title="Mailing Address"
            showAddressLine2
            showCountry
          />
        )}
      </div>
    </FormProvider>
  )
}
