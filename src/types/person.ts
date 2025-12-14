/**
 * Person Entity Types
 * 
 * A composable type system for all people in the EMIS system.
 * Uses discriminated unions for type-safe handling of different person types.
 */

import type { Address, EmergencyContact, MedicalInfo } from './address'

// ============================================================================
// BASE TYPES
// ============================================================================

export type PersonType = 'student' | 'teacher' | 'staff' | 'guardian' | 'admin'

export type PersonStatus = 
  | 'active' 
  | 'inactive' 
  | 'pending'
  | 'on_leave' 
  | 'graduated' 
  | 'suspended'
  | 'terminated'

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say'

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'temporary'

export type GuardianRelationship = 
  | 'father' 
  | 'mother' 
  | 'guardian' 
  | 'grandparent' 
  | 'sibling'
  | 'other'

// ============================================================================
// BASE PERSON INTERFACE
// ============================================================================

/**
 * Core attributes shared by all person types
 */
export interface BasePerson {
  id: string
  firstName: string
  lastName: string
  middleName?: string
  email: string
  phone?: string
  secondaryPhone?: string
  dateOfBirth?: string
  gender?: Gender
  avatar?: string
  address?: Address
  status: PersonStatus
  notes?: string
  createdAt: string
  updatedAt: string
  createdBy?: string
}

// ============================================================================
// STUDENT TYPE
// ============================================================================

export interface StudentData {
  type: 'student'
  studentId: string
  grade: string
  section?: string
  enrollmentDate: string
  expectedGraduationDate?: string
  guardianIds: string[]
  primaryGuardianId?: string
  medical?: MedicalInfo
  previousSchool?: string
  transportMode?: 'bus' | 'self' | 'carpool' | 'other'
  admissionNumber?: string
}

export type Student = BasePerson & StudentData

// ============================================================================
// EMPLOYEE TYPES (Teacher, Staff, Admin)
// ============================================================================

export interface EmployeeBase {
  employeeId: string
  department: string
  position: string
  hireDate: string
  terminationDate?: string
  employmentType: EmploymentType
  salary?: number
  emergencyContact?: EmergencyContact
  qualifications?: string[]
  certifications?: string[]
  reportsTo?: string
}

export interface TeacherData extends EmployeeBase {
  type: 'teacher'
  subjects: string[]
  grades: string[]
  classroomId?: string
  specializations?: string[]
}

export interface StaffData extends EmployeeBase {
  type: 'staff'
  responsibilities?: string[]
}

export interface AdminData extends EmployeeBase {
  type: 'admin'
  accessLevel: 'school' | 'district' | 'tenant'
  permissions?: string[]
}

export type Teacher = BasePerson & TeacherData
export type Staff = BasePerson & StaffData
export type Admin = BasePerson & AdminData

// ============================================================================
// GUARDIAN TYPE
// ============================================================================

export interface GuardianData {
  type: 'guardian'
  relationship: GuardianRelationship
  studentIds: string[]
  occupation?: string
  employer?: string
  workPhone?: string
  preferredContactMethod?: 'email' | 'phone' | 'sms'
  canPickup: boolean
  isEmergencyContact: boolean
}

export type Guardian = BasePerson & GuardianData

// ============================================================================
// DISCRIMINATED UNION
// ============================================================================

/**
 * Union type representing any person in the system
 * TypeScript will narrow the type based on the `type` field
 */
export type Person = Student | Teacher | Staff | Admin | Guardian

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isStudent(person: Person): person is Student {
  return person.type === 'student'
}

export function isTeacher(person: Person): person is Teacher {
  return person.type === 'teacher'
}

export function isStaff(person: Person): person is Staff {
  return person.type === 'staff'
}

export function isAdmin(person: Person): person is Admin {
  return person.type === 'admin'
}

export function isGuardian(person: Person): person is Guardian {
  return person.type === 'guardian'
}

export function isEmployee(person: Person): person is Teacher | Staff | Admin {
  return ['teacher', 'staff', 'admin'].includes(person.type)
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Form input type (without server-generated fields)
 */
export type PersonFormInput = Omit<Person, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>

/**
 * Type-specific form inputs
 */
export type StudentFormInput = Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
export type TeacherFormInput = Omit<Teacher, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
export type StaffFormInput = Omit<Staff, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
export type GuardianFormInput = Omit<Guardian, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>

/**
 * Partial update type for PATCH operations
 */
export type PersonUpdate = Partial<Omit<Person, 'id' | 'type' | 'createdAt'>>

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

export function getPersonFullName(person: BasePerson): string {
  if (person.middleName) {
    return `${person.firstName} ${person.middleName} ${person.lastName}`
  }
  return `${person.firstName} ${person.lastName}`
}

export function getPersonInitials(person: BasePerson): string {
  return `${person.firstName.charAt(0)}${person.lastName.charAt(0)}`.toUpperCase()
}

export function getPersonTypeLabel(type: PersonType): string {
  const labels: Record<PersonType, string> = {
    student: 'Student',
    teacher: 'Teacher',
    staff: 'Staff',
    guardian: 'Guardian',
    admin: 'Administrator',
  }
  return labels[type]
}

export function getPersonStatusLabel(status: PersonStatus): string {
  const labels: Record<PersonStatus, string> = {
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
    on_leave: 'On Leave',
    graduated: 'Graduated',
    suspended: 'Suspended',
    terminated: 'Terminated',
  }
  return labels[status]
}

