/**
 * Staff Wizard Step Schemas
 *
 * Per-step Zod validation schemas for the staff creation wizard.
 * Each step validates only its own fields on "Continue".
 */

import { z } from 'zod'

// Empty string → undefined for optional UUID fields (prevents silent validation failures)
const optionalUuid = z.preprocess(
  (val) => (val === '' || val === null ? undefined : val),
  z.string().uuid().optional(),
)

// Step 1: Personal Information — core identity fields
export const personalInfoStepSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(75),
  lastSurname: z.string().min(1, 'Last name is required').max(75),
  staffUniqueId: z.string().min(1, 'Staff ID is required').max(50),
  middleName: z.string().max(75).optional(),
  maidenName: z.string().max(75).optional(),
  generationCodeSuffix: z.string().max(10).optional(),
  birthDate: z.string().optional(),
  gender: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say']).optional(),
  ),
  hispanicLatinoEthnicity: z.boolean().optional(),
}).passthrough()

// Step 2: Contact & Address — email required, rest optional
export const contactStepSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  phone: z.string().max(24).optional(),
}).passthrough()

// Step 3: Employment — role, type, and hire date required
export const employmentStepSchema = z.object({
  role: z.enum(
    ['teacher', 'principal', 'vice_principal', 'counselor', 'librarian', 'nurse', 'admin_staff', 'support_staff', 'it_staff', 'substitute', 'contractor'],
    { errorMap: () => ({ message: 'Select a role' }) },
  ),
  employmentType: z.enum(
    ['full_time', 'part_time', 'contract', 'temporary', 'volunteer'],
    { errorMap: () => ({ message: 'Select employment type' }) },
  ),
  hireDate: z.string().min(1, 'Hire date is required'),
  departmentId: optionalUuid,
  title: z.string().max(100).optional(),
  highlyQualifiedTeacher: z.boolean().optional(),
  yearsOfPriorTeachingExperience: z.coerce.number().int().min(0).optional(),
  yearsOfPriorProfessionalExperience: z.coerce.number().int().min(0).optional(),
  createUserAccount: z.boolean().optional(),
  globalRole: z.enum(['TenantAdmin', 'TenantUser']).optional(),
}).passthrough()

// Step 4: School Assignment — primary school required
export const assignmentStepSchema = z.object({
  primarySchoolId: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().uuid('Select a primary school'),
  ),
  primaryAssignmentRole: z.string().optional(),
  primaryAssignmentDepartmentId: optionalUuid,
  primaryAssignmentBeginDate: z.string().optional(),
  primaryAssignmentFte: z.coerce.number().min(0).max(1).optional(),
}).passthrough()

// Step 5: Review — no schema (read-only)
