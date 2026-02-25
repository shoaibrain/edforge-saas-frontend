/**
 * Student Registration Form Schemas
 *
 * Frontend-specific Zod schemas for each wizard step.
 * Derived from CreateStudentDto but with custom error messages
 * and step-scoped validation.
 */

import { z } from 'zod'

// ============================================================================
// CONSTANTS
// ============================================================================

export const GRADE_LEVEL_OPTIONS = [
  { value: 'PK', label: 'Pre-Kindergarten' },
  { value: 'K', label: 'Kindergarten' },
  { value: '1', label: 'Grade 1' },
  { value: '2', label: 'Grade 2' },
  { value: '3', label: 'Grade 3' },
  { value: '4', label: 'Grade 4' },
  { value: '5', label: 'Grade 5' },
  { value: '6', label: 'Grade 6' },
  { value: '7', label: 'Grade 7' },
  { value: '8', label: 'Grade 8' },
  { value: '9', label: 'Grade 9' },
  { value: '10', label: 'Grade 10' },
  { value: '11', label: 'Grade 11' },
  { value: '12', label: 'Grade 12' },
]

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

export const RELATIONSHIP_OPTIONS = [
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'guardian', label: 'Legal Guardian' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'other', label: 'Other' },
]

export const PHONE_TYPE_OPTIONS = [
  { value: 'mobile', label: 'Mobile' },
  { value: 'home', label: 'Home' },
  { value: 'work', label: 'Work' },
]

export const ENROLLMENT_TYPE_OPTIONS = [
  { value: 'new', label: 'New Student' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'returning', label: 'Returning Student' },
  { value: 're_enrollment', label: 'Re-enrollment' },
]

// ============================================================================
// STEP 1: PERSONAL INFORMATION
// ============================================================================

export const personalInfoStepSchema = z.object({
  firstName: z
    .string({ required_error: 'First name is required' })
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z
    .string({ required_error: 'Last name is required' })
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters'),
  middleName: z.string().max(50).optional().or(z.literal('')),
  preferredName: z.string().max(50).optional().or(z.literal('')),
  suffix: z.string().max(10).optional().or(z.literal('')),
  dateOfBirth: z
    .string({ required_error: 'Date of birth is required' })
    .min(1, 'Date of birth is required')
    .refine((val) => {
      if (!val) return false
      const date = new Date(val)
      const now = new Date()
      const age = now.getFullYear() - date.getFullYear()
      return age >= 3 && age <= 22
    }, 'Student must be between 3 and 22 years old'),
  gender: z
    .string({ required_error: 'Gender is required' })
    .min(1, 'Gender is required'),
  currentGradeLevel: z
    .string({ required_error: 'Grade level is required' })
    .min(1, 'Grade level is required'),
})

export type PersonalInfoStepData = z.infer<typeof personalInfoStepSchema>

// ============================================================================
// STEP 2: CONTACT INFORMATION
// ============================================================================

const addressSchema = z.object({
  street1: z.string().max(200).optional().or(z.literal('')),
  street2: z.string().max(200).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  state: z.string().max(100).optional().or(z.literal('')),
  zipCode: z.string().max(20).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
}).refine(
  (data) => {
    const hasAnyField = data.street2 || data.city || data.state || data.zipCode || data.country
    return !hasAnyField || (data.street1 && data.street1.length > 0)
  },
  { message: 'Street address is required when providing address details', path: ['street1'] }
).optional()

export const contactInfoStepSchema = z.object({
  contactInfo: z.object({
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().max(20).optional().or(z.literal('')),
    phoneType: z.string().optional().or(z.literal('')),
    address: addressSchema,
    mailingAddress: addressSchema,
    useMailingAddress: z.boolean().optional(),
  }).optional(),
})

export type ContactInfoStepData = z.infer<typeof contactInfoStepSchema>

// ============================================================================
// STEP 3: GUARDIANS
// ============================================================================

const guardianFormSchema = z.object({
  firstName: z
    .string({ required_error: 'First name is required' })
    .min(1, 'First name is required')
    .max(50),
  lastName: z
    .string({ required_error: 'Last name is required' })
    .min(1, 'Last name is required')
    .max(50),
  relationship: z
    .string({ required_error: 'Relationship is required' })
    .min(1, 'Relationship is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  phoneType: z.string().optional().or(z.literal('')),
  alternatePhone: z.string().max(20).optional().or(z.literal('')),
  isPrimary: z.boolean().default(false),
  hasPortalAccess: z.boolean().default(false),
  canPickup: z.boolean().default(true),
  employer: z.string().max(100).optional().or(z.literal('')),
  occupation: z.string().max(100).optional().or(z.literal('')),
}).refine(
  (data) => !data.hasPortalAccess || (data.email && data.email.length > 0),
  { message: 'Email is required when Portal Access is enabled', path: ['email'] }
)

export const guardiansStepSchema = z.object({
  guardians: z.array(guardianFormSchema).max(10).optional(),
})

export type GuardiansStepData = z.infer<typeof guardiansStepSchema>
export type GuardianFormData = z.infer<typeof guardianFormSchema>

// ============================================================================
// STEP 4: MEDICAL INFORMATION
// ============================================================================

export const medicalStepSchema = z.object({
  medicalInfo: z.object({
    allergies: z.array(z.string()).optional(),
    medications: z.array(z.string()).optional(),
    conditions: z.array(z.string()).optional(),
    dietaryRestrictions: z.array(z.string()).optional(),
    bloodType: z.string().max(10).optional().or(z.literal('')),
    notes: z.string().max(1000).optional().or(z.literal('')),
    physicianName: z.string().max(100).optional().or(z.literal('')),
    physicianPhone: z.string().max(20).optional().or(z.literal('')),
    insuranceProvider: z.string().max(100).optional().or(z.literal('')),
    insurancePolicyNumber: z.string().max(50).optional().or(z.literal('')),
  }).optional(),
  ethnicity: z.string().max(50).optional().or(z.literal('')),
  primaryLanguage: z.string().max(50).optional().or(z.literal('')),
  homeLanguage: z.string().max(50).optional().or(z.literal('')),
  countryOfBirth: z.string().max(100).optional().or(z.literal('')),
})

export type MedicalStepData = z.infer<typeof medicalStepSchema>

// ============================================================================
// STEP 5: ENROLLMENT
// ============================================================================

export const enrollmentStepSchema = z.object({
  enrollment: z.object({
    enrollmentType: z.string().default('new'),
    enrollmentDate: z.string().min(1, 'Enrollment date is required'),
    academicYearId: z.string().min(1, 'Please select an academic year'),
    previousSchoolName: z.string().max(200).optional().or(z.literal('')),
    previousSchoolAddress: z.string().max(500).optional().or(z.literal('')),
    transferReason: z.string().max(500).optional().or(z.literal('')),
    notes: z.string().max(2000).optional().or(z.literal('')),
    // Ed-Fi descriptor fields
    entryTypeDescriptor: z.string().max(100).optional().or(z.literal('')),
    residencyStatusDescriptor: z.string().max(200).optional().or(z.literal('')),
    primarySchool: z.boolean().default(true),
    fullTimeEquivalency: z.coerce.number().min(0).max(1).default(1.0),
    repeatGradeIndicator: z.boolean().default(false),
  }).refine(
    (data) => data.enrollmentType !== 'transfer' || (data.previousSchoolName && data.previousSchoolName.length > 0),
    { message: 'Previous school name is required for transfers', path: ['previousSchoolName'] }
  ),
})

export type EnrollmentStepData = z.infer<typeof enrollmentStepSchema>

// ============================================================================
// STEP 6: REVIEW (no validation needed)
// ============================================================================

// Review step has no schema — it just displays data

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const defaultStudentFormData: Record<string, unknown> = {
  // Personal Info
  firstName: '',
  lastName: '',
  middleName: '',
  preferredName: '',
  suffix: '',
  dateOfBirth: '',
  gender: '',
  currentGradeLevel: '',
  // Contact Info
  contactInfo: {
    email: '',
    phone: '',
    phoneType: '',
    address: {
      street1: '',
      street2: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    mailingAddress: {
      street1: '',
      street2: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    useMailingAddress: false,
  },
  // Guardians
  guardians: [],
  // Medical
  medicalInfo: {
    allergies: [],
    medications: [],
    conditions: [],
    dietaryRestrictions: [],
    bloodType: '',
    notes: '',
    physicianName: '',
    physicianPhone: '',
    insuranceProvider: '',
    insurancePolicyNumber: '',
  },
  ethnicity: '',
  primaryLanguage: '',
  homeLanguage: '',
  countryOfBirth: '',
  // Enrollment
  enrollment: {
    enrollmentType: 'new',
    enrollmentDate: new Date().toISOString().split('T')[0],
    academicYearId: '',
    previousSchoolName: '',
    previousSchoolAddress: '',
    transferReason: '',
    notes: '',
    // Ed-Fi descriptor fields
    entryTypeDescriptor: '',
    residencyStatusDescriptor: '',
    primarySchool: true,
    fullTimeEquivalency: 1.0,
    repeatGradeIndicator: false,
  },
}
