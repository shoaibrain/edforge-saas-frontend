/**
 * Person Validation Schemas
 * 
 * Zod schemas for person entity validation.
 */

import { z } from 'zod'
import {
  nameSchema,
  optionalNameSchema,
  emailSchema,
  phoneSchema,
  optionalDateSchema,
  genderSchema,
  addressSchema,
  emergencyContactSchema,
} from './common.schema'

// ============================================================================
// PERSON TYPE ENUM
// ============================================================================

export const personTypeSchema = z.enum(['student', 'teacher', 'staff', 'guardian', 'admin'])

export type PersonType = z.infer<typeof personTypeSchema>

// ============================================================================
// PERSONAL INFO STEP SCHEMA
// ============================================================================

export const personalInfoSchema = z.object({
  firstName: nameSchema,
  middleName: optionalNameSchema,
  lastName: nameSchema,
  dateOfBirth: optionalDateSchema,
  gender: genderSchema.optional(),
  avatar: z.string().url().optional().or(z.literal('')),
})

export type PersonalInfoInput = z.input<typeof personalInfoSchema>
export type PersonalInfoOutput = z.output<typeof personalInfoSchema>

// ============================================================================
// CONTACT & ADDRESS STEP SCHEMA
// ============================================================================

export const contactAddressSchema = z.object({
  email: emailSchema,
  phone: phoneSchema,
  secondaryEmail: z.string().email().optional().or(z.literal('')),
  secondaryPhone: phoneSchema,
  preferredContact: z.enum(['email', 'phone', 'sms']).optional(),
  address: addressSchema,
  emergencyContact: emergencyContactSchema.optional(),
})

export type ContactAddressInput = z.input<typeof contactAddressSchema>
export type ContactAddressOutput = z.output<typeof contactAddressSchema>

// ============================================================================
// FULL PERSON SCHEMA
// ============================================================================

export const personSchema = z.object({
  type: personTypeSchema,
  status: z.enum(['active', 'inactive', 'pending']).default('active'),
  
  // Personal Info
  firstName: nameSchema,
  middleName: optionalNameSchema,
  lastName: nameSchema,
  dateOfBirth: optionalDateSchema,
  gender: genderSchema.optional(),
  avatar: z.string().url().optional().or(z.literal('')),
  
  // Contact
  email: emailSchema,
  phone: phoneSchema,
  secondaryEmail: z.string().email().optional().or(z.literal('')),
  secondaryPhone: phoneSchema,
  
  // Address
  address: addressSchema,
  
  // Emergency Contact
  emergencyContact: emergencyContactSchema.optional(),
})

export type PersonInput = z.input<typeof personSchema>
export type PersonOutput = z.output<typeof personSchema>

// ============================================================================
// STUDENT-SPECIFIC SCHEMA
// ============================================================================

export const studentSchema = personSchema.extend({
  type: z.literal('student'),
  
  // Academic Info
  gradeLevel: z.string().optional(),
  section: z.string().optional(),
  enrollmentDate: optionalDateSchema,
  studentId: z.string().optional(),
  
  // Guardian References
  guardianIds: z.array(z.string().uuid()).optional(),
})

export type StudentInput = z.input<typeof studentSchema>
export type StudentOutput = z.output<typeof studentSchema>

// ============================================================================
// TEACHER-SPECIFIC SCHEMA
// ============================================================================

export const teacherSchema = personSchema.extend({
  type: z.literal('teacher'),
  
  // Employment Info
  employeeId: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  startDate: optionalDateSchema,
  
  // Teacher-specific
  subjects: z.array(z.string()).optional(),
  qualifications: z.array(z.string()).optional(),
  classroomIds: z.array(z.string().uuid()).optional(),
})

export type TeacherInput = z.input<typeof teacherSchema>
export type TeacherOutput = z.output<typeof teacherSchema>

// ============================================================================
// STAFF-SPECIFIC SCHEMA
// ============================================================================

export const staffSchema = personSchema.extend({
  type: z.literal('staff'),
  
  // Employment Info
  employeeId: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  startDate: optionalDateSchema,
  salary: z.number().positive().optional(),
})

export type StaffInput = z.input<typeof staffSchema>
export type StaffOutput = z.output<typeof staffSchema>

// ============================================================================
// GUARDIAN-SPECIFIC SCHEMA
// ============================================================================

export const guardianSchema = personSchema.extend({
  type: z.literal('guardian'),
  
  // Guardian-specific
  relationship: z.string().optional(),
  occupation: z.string().optional(),
  employer: z.string().optional(),
  
  // Student References
  studentIds: z.array(z.string().uuid()).optional(),
  
  // Permissions
  canPickup: z.boolean().default(true),
  canReceiveReports: z.boolean().default(true),
  isPrimaryContact: z.boolean().default(false),
})

export type GuardianInput = z.input<typeof guardianSchema>
export type GuardianOutput = z.output<typeof guardianSchema>

// ============================================================================
// PERSON TYPE OPTIONS (for UI)
// ============================================================================

export const PERSON_TYPE_OPTIONS = [
  {
    value: 'student' as const,
    label: 'Student',
    icon: 'GraduationCap',
    description: 'A student enrolled in the school',
  },
  {
    value: 'teacher' as const,
    label: 'Teacher',
    icon: 'User',
    description: 'A faculty member who teaches classes',
  },
  {
    value: 'staff' as const,
    label: 'Staff',
    icon: 'Users',
    description: 'Non-teaching school staff',
  },
  {
    value: 'guardian' as const,
    label: 'Guardian',
    icon: 'Heart',
    description: 'A parent or guardian of a student',
  },
] as const

