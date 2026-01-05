/**
 * Person Validation Schemas
 * 
 * Composable Zod schemas for all person types.
 * These schemas can be used for form validation and API type inference.
 */

import { z } from 'zod'

// ============================================================================
// COMMON FIELD SCHEMAS
// ============================================================================

export const nameSchema = z
  .string()
  .min(1, 'Required')
  .max(50, 'Must be 50 characters or less')
  .regex(/^[a-zA-Z\s'-]+$/, 'Only letters, spaces, hyphens, and apostrophes allowed')

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')

export const phoneSchema = z
  .string()
  .regex(/^[\d\s\-+()]+$/, 'Please enter a valid phone number')
  .optional()
  .or(z.literal(''))

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid date (YYYY-MM-DD)')
  .optional()
  .or(z.literal(''))

export const genderSchema = z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional()

export const personStatusSchema = z.enum([
  'active',
  'inactive',
  'pending',
  'on_leave',
  'graduated',
  'suspended',
  'terminated',
])

export const personTypeSchema = z.enum(['student', 'teacher', 'staff', 'guardian', 'admin'])

export const employmentTypeSchema = z.enum(['full_time', 'part_time', 'contract', 'temporary'])

export const guardianRelationshipSchema = z.enum([
  'father',
  'mother',
  'guardian',
  'grandparent',
  'sibling',
  'other',
])

// ============================================================================
// ADDRESS SCHEMA
// ============================================================================

export const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required').max(100),
  street2: z.string().max(100).optional().or(z.literal('')),
  city: z.string().min(1, 'City is required').max(50),
  state: z.string().min(1, 'State is required').max(50),
  postalCode: z.string().min(1, 'Postal code is required').max(20),
  country: z.string().min(1, 'Country is required').max(50),
})

export const addressSchemaOptional = addressSchema.partial().optional()

// ============================================================================
// EMERGENCY CONTACT SCHEMA
// ============================================================================

export const emergencyContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  relationship: z.string().min(1, 'Relationship is required').max(50),
  phone: z.string().min(1, 'Phone is required').max(20),
  email: z.string().email().optional().or(z.literal('')),
})

export const emergencyContactSchemaOptional = emergencyContactSchema.optional()

// ============================================================================
// MEDICAL INFO SCHEMA
// ============================================================================

export const medicalInfoSchema = z.object({
  bloodType: z.string().max(10).optional().or(z.literal('')),
  allergies: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  conditions: z.array(z.string()).optional(),
  notes: z.string().max(500).optional().or(z.literal('')),
})

export const medicalInfoSchemaOptional = medicalInfoSchema.optional()

// ============================================================================
// BASE PERSON SCHEMA
// ============================================================================

export const basePersonSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  middleName: z.string().max(50).optional().or(z.literal('')),
  email: emailSchema,
  phone: phoneSchema,
  secondaryPhone: phoneSchema,
  dateOfBirth: dateSchema,
  gender: genderSchema,
  avatar: z.string().url().optional().or(z.literal('')),
  address: addressSchemaOptional,
  status: personStatusSchema.default('active'),
  notes: z.string().max(1000).optional().or(z.literal('')),
})

// ============================================================================
// STUDENT SCHEMA
// ============================================================================

export const studentSchema = basePersonSchema.extend({
  type: z.literal('student'),
  studentId: z.string().min(1, 'Student ID is required').max(50),
  grade: z.string().min(1, 'Grade is required').max(20),
  section: z.string().max(20).optional().or(z.literal('')),
  enrollmentDate: z.string().min(1, 'Enrollment date is required'),
  expectedGraduationDate: dateSchema,
  guardianIds: z.array(z.string()).min(1, 'At least one guardian is required'),
  primaryGuardianId: z.string().optional(),
  medical: medicalInfoSchemaOptional,
  previousSchool: z.string().max(100).optional().or(z.literal('')),
  transportMode: z.enum(['bus', 'self', 'carpool', 'other']).optional(),
  admissionNumber: z.string().max(50).optional().or(z.literal('')),
})

// ============================================================================
// EMPLOYEE BASE SCHEMA
// ============================================================================

export const employeeBaseSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required').max(50),
  department: z.string().min(1, 'Department is required').max(100),
  position: z.string().min(1, 'Position is required').max(100),
  hireDate: z.string().min(1, 'Hire date is required'),
  terminationDate: dateSchema,
  employmentType: employmentTypeSchema.default('full_time'),
  salary: z.number().positive().optional(),
  emergencyContact: emergencyContactSchemaOptional,
  qualifications: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  reportsTo: z.string().optional(),
})

// ============================================================================
// TEACHER SCHEMA
// ============================================================================

export const teacherSchema = basePersonSchema.merge(employeeBaseSchema).extend({
  type: z.literal('teacher'),
  subjects: z.array(z.string()).min(1, 'At least one subject is required'),
  grades: z.array(z.string()).min(1, 'At least one grade is required'),
  classroomId: z.string().optional(),
  specializations: z.array(z.string()).optional(),
})

// ============================================================================
// STAFF SCHEMA
// ============================================================================

export const staffSchema = basePersonSchema.merge(employeeBaseSchema).extend({
  type: z.literal('staff'),
  responsibilities: z.array(z.string()).optional(),
})

// ============================================================================
// ADMIN SCHEMA
// ============================================================================

export const adminSchema = basePersonSchema.merge(employeeBaseSchema).extend({
  type: z.literal('admin'),
  accessLevel: z.enum(['school', 'district', 'tenant']).default('school'),
  permissions: z.array(z.string()).optional(),
})

// ============================================================================
// GUARDIAN SCHEMA
// ============================================================================

export const guardianSchema = basePersonSchema.extend({
  type: z.literal('guardian'),
  relationship: guardianRelationshipSchema,
  studentIds: z.array(z.string()).min(1, 'At least one student is required'),
  occupation: z.string().max(100).optional().or(z.literal('')),
  employer: z.string().max(100).optional().or(z.literal('')),
  workPhone: phoneSchema,
  preferredContactMethod: z.enum(['email', 'phone', 'sms']).optional(),
  canPickup: z.boolean().default(true),
  isEmergencyContact: z.boolean().default(true),
})

// ============================================================================
// DISCRIMINATED UNION SCHEMA
// ============================================================================

export const personSchema = z.discriminatedUnion('type', [
  studentSchema,
  teacherSchema,
  staffSchema,
  adminSchema,
  guardianSchema,
])

// ============================================================================
// FORM INPUT SCHEMAS (without server-generated fields)
// ============================================================================

export const studentFormSchema = studentSchema.omit({})
export const teacherFormSchema = teacherSchema.omit({})
export const staffFormSchema = staffSchema.omit({})
export const guardianFormSchema = guardianSchema.omit({})

// ============================================================================
// INVITE SCHEMA
// ============================================================================

export const inviteSchema = z.object({
  emails: z
    .string()
    .min(1, 'At least one email is required')
    .transform((val) => val.split(',').map((e) => e.trim()).filter(Boolean))
    .refine(
      (emails) => emails.every((email) => z.string().email().safeParse(email).success),
      'One or more email addresses are invalid'
    ),
  role: z.enum(['teacher', 'staff', 'admin']),
  department: z.string().min(1, 'Department is required'),
  employmentType: employmentTypeSchema,
  sendWelcomeEmail: z.boolean().default(true),
  message: z.string().max(500).optional().or(z.literal('')),
})

// ============================================================================
// PROFILE UPDATE SCHEMA
// ============================================================================

export const profileUpdateSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  address: addressSchemaOptional,
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type AddressFormValues = z.infer<typeof addressSchema>
export type EmergencyContactFormValues = z.infer<typeof emergencyContactSchema>
export type MedicalInfoFormValues = z.infer<typeof medicalInfoSchema>
export type BasePersonFormValues = z.infer<typeof basePersonSchema>
export type StudentFormValues = z.infer<typeof studentSchema>
export type TeacherFormValues = z.infer<typeof teacherSchema>
export type StaffFormValues = z.infer<typeof staffSchema>
export type GuardianFormValues = z.infer<typeof guardianSchema>
export type PersonFormValues = z.infer<typeof personSchema>
export type InviteFormValues = z.infer<typeof inviteSchema>
export type ProfileUpdateFormValues = z.infer<typeof profileUpdateSchema>

