/**
 * @edforge/forms
 *
 * Shared form components and utilities for the EdForge EMIS platform.
 * Built with React Hook Form, Zod, React Spring, and Framer Motion.
 */

// Utilities
export { cn, getNestedError, getNestedTouched, getNestedDirty } from './utils'

// Fields
export {
  TextField,
  SelectField,
  DateField,
  TextareaField,
  ToggleField,
  CheckboxField,
  RadioGroupField,
  PhoneField,
  type TextFieldProps,
  type SelectFieldProps,
  type SelectOption,
  type DateFieldProps,
  type TextareaFieldProps,
  type ToggleFieldProps,
  type CheckboxFieldProps,
  type RadioGroupFieldProps,
  type RadioOption,
  type PhoneFieldProps,
} from './fields'

// Sections
export {
  FormSection,
  PersonalInfoSection,
  ContactInfoSection,
  AddressSection,
  // Region-aware address forms (Sprint A.8/A.9/A.10)
  AddressFields,
  AddressFieldsNepal,
  AddressFieldsLegacy,
  resolveAddressVariant,
  type FormSectionProps,
  type PersonalInfoSectionProps,
  type ContactInfoSectionProps,
  type AddressSectionProps,
  type AddressFieldsProps,
  type AddressFieldsNepalProps,
  type AddressFieldsLegacyProps,
} from './sections'

// Inputs (higher-level archetype-aware composites)
export {
  PhoneInput,
  buildPhoneInputRules,
  type PhoneInputProps,
} from './inputs'

// Schemas
export {
  // Common
  emailSchema,
  optionalEmailSchema,
  phoneSchema,
  requiredPhoneSchema,
  nameSchema,
  optionalNameSchema,
  dateSchema,
  optionalDateSchema,
  addressSchema,
  requiredAddressSchema,
  emergencyContactSchema,
  contactInfoSchema,
  genderSchema,
  idSchema,
  optionalIdSchema,
  urlSchema,
  optionalUrlSchema,
  // Person
  personTypeSchema,
  personalInfoSchema,
  contactAddressSchema,
  personSchema,
  studentSchema,
  teacherSchema,
  staffSchema,
  guardianSchema,
  PERSON_TYPE_OPTIONS,
  // Types
  type AddressInput,
  type AddressOutput,
  type ContactInfoInput,
  type ContactInfoOutput,
  type Gender,
  type PersonType,
  type PersonalInfoInput,
  type PersonalInfoOutput,
  type ContactAddressInput,
  type ContactAddressOutput,
  type PersonInput,
  type PersonOutput,
  type StudentInput,
  type StudentOutput,
  type TeacherInput,
  type TeacherOutput,
  type StaffInput,
  type StaffOutput,
  type GuardianInput,
  type GuardianOutput,
} from './schemas'

// Hooks
export {
  useFormField,
  useFormSection,
  useTenantContext,
  isNepalShape,
  type UseFormFieldReturn,
  type UseFormSectionOptions,
  type UseFormSectionReturn,
  type TenantContext,
} from './hooks'

// Re-export react-hook-form essentials for convenience
export {
  useForm,
  useFormContext,
  FormProvider,
  Controller,
  useWatch,
  useFieldArray,
  type UseFormReturn,
  type FieldValues,
  type SubmitHandler,
  type ControllerProps,
  type UseFormProps,
} from 'react-hook-form'

// Re-export zod resolver
export { zodResolver } from '@hookform/resolvers/zod'

