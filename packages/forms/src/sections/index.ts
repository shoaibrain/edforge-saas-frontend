/**
 * @edforge/forms - Section Components
 *
 * Composable form sections that combine multiple fields.
 */

export { FormSection, type FormSectionProps } from './FormSection'
export { PersonalInfoSection, type PersonalInfoSectionProps } from './PersonalInfoSection'
export { ContactInfoSection, type ContactInfoSectionProps } from './ContactInfoSection'

// Region-aware address forms (Sprint A.8/A.9/A.10)
export { AddressFields, resolveAddressVariant, type AddressFieldsProps } from './AddressFields'
export { AddressFieldsNepal, type AddressFieldsNepalProps } from './AddressFieldsNepal'
export { AddressFieldsLegacy, type AddressFieldsLegacyProps } from './AddressFieldsLegacy'

// Backwards-compat alias — deprecated; new callers use AddressFields.
export { AddressSection, type AddressSectionProps } from './AddressSection'
