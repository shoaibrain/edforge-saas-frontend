/**
 * @edforge/forms - Validation Schemas
 * 
 * Zod validation schemas for form data.
 */

// Common schemas
export {
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
  type AddressInput,
  type AddressOutput,
  type ContactInfoInput,
  type ContactInfoOutput,
  type Gender,
} from './common.schema'

// Person schemas
export {
  personTypeSchema,
  quickAddPersonSchema,
  personalInfoSchema,
  contactAddressSchema,
  personSchema,
  studentSchema,
  teacherSchema,
  staffSchema,
  guardianSchema,
  PERSON_TYPE_OPTIONS,
  type PersonType,
  type QuickAddPersonInput,
  type QuickAddPersonOutput,
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
} from './person.schema'

