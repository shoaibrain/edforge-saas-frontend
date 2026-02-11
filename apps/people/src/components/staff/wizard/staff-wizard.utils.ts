/**
 * Staff Wizard Utilities
 *
 * Constants, auto-generation helpers, and DTO transformation
 * for the staff creation wizard.
 */

import type { CreateStaffDto, CreateStaffWithUserDto } from '@aibrains/shared-types'

// ============================================================================
// DROPDOWN OPTIONS
// ============================================================================

export const STAFF_ROLE_OPTIONS = [
  { value: 'teacher', label: 'Teacher' },
  { value: 'principal', label: 'Principal' },
  { value: 'vice_principal', label: 'Vice Principal' },
  { value: 'counselor', label: 'Counselor' },
  { value: 'librarian', label: 'Librarian' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'admin_staff', label: 'Administrative Staff' },
  { value: 'support_staff', label: 'Support Staff' },
  { value: 'it_staff', label: 'IT Staff' },
  { value: 'substitute', label: 'Substitute' },
  { value: 'contractor', label: 'Contractor' },
]

export const STAFF_ROLE_LABELS: Record<string, string> = Object.fromEntries(
  STAFF_ROLE_OPTIONS.map((o) => [o.value, o.label]),
)

export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'volunteer', label: 'Volunteer' },
]

export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  EMPLOYMENT_TYPE_OPTIONS.map((o) => [o.value, o.label]),
)

export const GENDER_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-Binary' },
  { value: 'prefer_not_to_say', label: 'Prefer Not to Say' },
]

export const GENDER_LABELS: Record<string, string> = {
  male: 'Male',
  female: 'Female',
  non_binary: 'Non-Binary',
  prefer_not_to_say: 'Prefer Not to Say',
}

export const GLOBAL_ROLE_OPTIONS = [
  { value: 'TenantUser', label: 'Standard User' },
  { value: 'TenantAdmin', label: 'Tenant Administrator' },
]

export const SUFFIX_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'Jr.', label: 'Jr.' },
  { value: 'Sr.', label: 'Sr.' },
  { value: 'II', label: 'II' },
  { value: 'III', label: 'III' },
  { value: 'IV', label: 'IV' },
]

export const ADDRESS_TYPE_OPTIONS = [
  { value: 'home', label: 'Home' },
  { value: 'mailing', label: 'Mailing' },
  { value: 'work', label: 'Work' },
  { value: 'temporary', label: 'Temporary' },
]

export const PHONE_TYPE_OPTIONS = [
  { value: 'mobile', label: 'Mobile' },
  { value: 'home', label: 'Home' },
  { value: 'work', label: 'Work' },
  { value: 'emergency', label: 'Emergency' },
]

export const RELATIONSHIP_OPTIONS = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'parent', label: 'Parent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'child', label: 'Child' },
  { value: 'friend', label: 'Friend' },
  { value: 'other', label: 'Other' },
]

// Teaching-specific roles that show HQT and experience fields
export const TEACHING_ROLES = ['teacher', 'substitute']

// ============================================================================
// AUTO-GENERATION HELPERS
// ============================================================================

/**
 * Generate a staff unique ID from name.
 * Format: First initial + Last initial + 4 random digits
 * e.g., "John Smith" → "JS4821"
 */
export function generateStaffUniqueId(firstName: string, lastName: string): string {
  const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
  const digits = Math.floor(1000 + Math.random() * 9000).toString()
  return `${initials}${digits}`
}

// ============================================================================
// DEFAULT FORM DATA
// ============================================================================

export const defaultStaffFormData: Record<string, unknown> = {
  // Step 1: Personal
  firstName: '',
  lastSurname: '',
  staffUniqueId: '',
  middleName: '',
  maidenName: '',
  generationCodeSuffix: '',
  birthDate: '',
  gender: undefined,
  hispanicLatinoEthnicity: false,

  // Step 2: Contact
  email: '',
  phone: '',
  addresses: [],
  telephones: [],
  emergencyContacts: [],

  // Step 3: Employment
  role: '',
  employmentType: 'full_time',
  hireDate: new Date().toISOString().split('T')[0],
  department: '',
  title: '',
  highlyQualifiedTeacher: false,
  yearsOfPriorTeachingExperience: undefined,
  yearsOfPriorProfessionalExperience: undefined,
  createUserAccount: false,
  globalRole: 'TenantUser',

  // Step 4: Assignment
  primarySchoolId: '',
  primaryAssignmentRole: '',
  primaryAssignmentDepartment: '',
  primaryAssignmentBeginDate: '',
  primaryAssignmentFte: 1.0,
  additionalAssignments: [],
}

// ============================================================================
// DTO TRANSFORMATION
// ============================================================================

interface AdditionalAssignment {
  schoolId: string
  role: string
  beginDate: string
  fullTimeEquivalency: number
  department?: string
}

/**
 * Transform flat wizard data into the CreateStaffDto or CreateStaffWithUserDto structure.
 */
export function transformWizardDataToStaffDto(
  data: Record<string, unknown>,
): CreateStaffDto | CreateStaffWithUserDto {
  const createAccount = data.createUserAccount === true

  const addresses = (data.addresses as Array<Record<string, string>> | undefined)?.filter(
    (a) => a.streetNumberName || a.city,
  )
  const telephones = (data.telephones as Array<Record<string, string>> | undefined)?.filter(
    (t) => t.telephoneNumber,
  )
  const emergencyContacts = (
    data.emergencyContacts as Array<Record<string, string>> | undefined
  )?.filter((c) => c.name && c.phone)

  const base: CreateStaffDto = {
    staffUniqueId: data.staffUniqueId as string,
    firstName: data.firstName as string,
    lastSurname: data.lastSurname as string,
    middleName: (data.middleName as string) || undefined,
    generationCodeSuffix: (data.generationCodeSuffix as string) || undefined,
    maidenName: (data.maidenName as string) || undefined,
    birthDate: (data.birthDate as string) || undefined,
    gender: (data.gender as CreateStaffDto['gender']) || undefined,
    hispanicLatinoEthnicity:
      data.hispanicLatinoEthnicity === true ? true : undefined,
    primarySchoolId: data.primarySchoolId as string,
    role: data.role as CreateStaffDto['role'],
    employmentType: (data.employmentType as CreateStaffDto['employmentType']) || 'full_time',
    hireDate: data.hireDate as string,
    email: data.email as string,
    phone: (data.phone as string) || undefined,
    addresses: addresses?.length ? addresses as CreateStaffDto['addresses'] : undefined,
    telephones: telephones?.length ? telephones as unknown as CreateStaffDto['telephones'] : undefined,
    department: (data.department as string) || undefined,
    title: (data.title as string) || undefined,
    highlyQualifiedTeacher:
      data.highlyQualifiedTeacher === true ? true : undefined,
    yearsOfPriorTeachingExperience:
      typeof data.yearsOfPriorTeachingExperience === 'number'
        ? data.yearsOfPriorTeachingExperience
        : undefined,
    yearsOfPriorProfessionalExperience:
      typeof data.yearsOfPriorProfessionalExperience === 'number'
        ? data.yearsOfPriorProfessionalExperience
        : undefined,
    emergencyContacts: emergencyContacts?.length
      ? emergencyContacts as CreateStaffDto['emergencyContacts']
      : undefined,
  }

  if (createAccount) {
    return {
      ...base,
      createUserAccount: true,
      globalRole: (data.globalRole as 'TenantAdmin' | 'TenantUser') || 'TenantUser',
      temporaryPassword: (data.temporaryPassword as string) || undefined,
    } satisfies CreateStaffWithUserDto
  }

  return base
}

/**
 * Build additional assignment DTOs from wizard data.
 * These are created via separate POST calls after staff creation.
 */
export function getAdditionalAssignments(
  data: Record<string, unknown>,
): AdditionalAssignment[] {
  const assignments = data.additionalAssignments as AdditionalAssignment[] | undefined
  if (!assignments?.length) return []
  return assignments.filter((a) => a.schoolId)
}
