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
  type FormSectionProps,
  type PersonalInfoSectionProps,
  type ContactInfoSectionProps,
  type AddressSectionProps,
} from './sections'

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
  type UseFormFieldReturn,
  type UseFormSectionOptions,
  type UseFormSectionReturn,
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

