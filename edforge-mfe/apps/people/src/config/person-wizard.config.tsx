/**
 * Person Wizard Configurations
 * 
 * Domain-specific wizard step configurations for different person types.
 * Each configuration defines the steps, validation, and flow for creating
 * students, teachers, staff, and guardians.
 */

import {
  User,
  Mail,
  Briefcase,
  GraduationCap,
  Heart,
  BookOpen,
  Building,
  Shield,
  Check,
  Users,
} from 'lucide-react'
import type { WizardStep } from '@edforge/wizard'
import { 
  PersonalInfoStep, 
  ContactAddressStep,
  GuardianLinkingStep,
} from '@/components/steps'

// ============================================================================
// PLACEHOLDER STEP COMPONENTS
// These will be replaced with real implementations
// ============================================================================

// GuardianLinkingStep is now imported from @/components/steps

// Academic Info Step - For student academic placement
function AcademicInfoStep({ data, updateData }: { data: Record<string, unknown>; updateData: (data: Record<string, unknown>) => void }) {
  return (
    <div className="p-6 bg-[rgb(var(--surface-tertiary))] rounded-xl border border-[rgb(var(--border-primary))]">
      <div className="flex items-center gap-3 mb-4">
        <GraduationCap className="w-5 h-5 text-golden-500" />
        <h3 className="font-semibold text-[rgb(var(--text-primary))]">Academic Placement</h3>
      </div>
      <p className="text-sm text-[rgb(var(--text-tertiary))]">
        Select the grade level, section, and enrollment date for this student.
      </p>
      {/* Placeholder for grade level, section selection */}
    </div>
  )
}

// Employment Info Step - For staff employment details
function EmploymentInfoStep({ data, updateData }: { data: Record<string, unknown>; updateData: (data: Record<string, unknown>) => void }) {
  return (
    <div className="p-6 bg-[rgb(var(--surface-tertiary))] rounded-xl border border-[rgb(var(--border-primary))]">
      <div className="flex items-center gap-3 mb-4">
        <Briefcase className="w-5 h-5 text-aqua-500" />
        <h3 className="font-semibold text-[rgb(var(--text-primary))]">Employment Information</h3>
      </div>
      <p className="text-sm text-[rgb(var(--text-tertiary))]">
        Enter department, position, start date, and other employment details.
      </p>
      {/* Placeholder for employment fields */}
    </div>
  )
}

// Credentials Step - For teacher qualifications
function CredentialsStep({ data, updateData }: { data: Record<string, unknown>; updateData: (data: Record<string, unknown>) => void }) {
  return (
    <div className="p-6 bg-[rgb(var(--surface-tertiary))] rounded-xl border border-[rgb(var(--border-primary))]">
      <div className="flex items-center gap-3 mb-4">
        <BookOpen className="w-5 h-5 text-teal-500" />
        <h3 className="font-semibold text-[rgb(var(--text-primary))]">Credentials & Qualifications</h3>
      </div>
      <p className="text-sm text-[rgb(var(--text-tertiary))]">
        Add certifications, subjects, and years of experience for this teacher.
      </p>
      {/* Placeholder for credentials fields */}
    </div>
  )
}

// Class Assignment Step - For assigning teachers to classes
function ClassAssignmentStep({ data, updateData }: { data: Record<string, unknown>; updateData: (data: Record<string, unknown>) => void }) {
  return (
    <div className="p-6 bg-[rgb(var(--surface-tertiary))] rounded-xl border border-[rgb(var(--border-primary))]">
      <div className="flex items-center gap-3 mb-4">
        <Users className="w-5 h-5 text-indigo-500" />
        <h3 className="font-semibold text-[rgb(var(--text-primary))]">Class Assignments</h3>
      </div>
      <p className="text-sm text-[rgb(var(--text-tertiary))]">
        Select the classes this teacher will be assigned to.
      </p>
      {/* Placeholder for class multi-select */}
    </div>
  )
}

// Department Assignment Step - For organizational structure
function DepartmentAssignmentStep({ data, updateData }: { data: Record<string, unknown>; updateData: (data: Record<string, unknown>) => void }) {
  return (
    <div className="p-6 bg-[rgb(var(--surface-tertiary))] rounded-xl border border-[rgb(var(--border-primary))]">
      <div className="flex items-center gap-3 mb-4">
        <Building className="w-5 h-5 text-amber-500" />
        <h3 className="font-semibold text-[rgb(var(--text-primary))]">Department Assignment</h3>
      </div>
      <p className="text-sm text-[rgb(var(--text-tertiary))]">
        Assign this person to a department in the organization structure.
      </p>
      {/* Placeholder for department tree selector */}
    </div>
  )
}

// Role Permissions Step - For ABAC role assignment
function RolePermissionsStep({ data, updateData }: { data: Record<string, unknown>; updateData: (data: Record<string, unknown>) => void }) {
  return (
    <div className="p-6 bg-[rgb(var(--surface-tertiary))] rounded-xl border border-[rgb(var(--border-primary))]">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="w-5 h-5 text-purple-500" />
        <h3 className="font-semibold text-[rgb(var(--text-primary))]">Roles & Permissions</h3>
      </div>
      <p className="text-sm text-[rgb(var(--text-tertiary))]">
        Configure the role and specific permissions for this person.
      </p>
      {/* Placeholder for role selector and permissions */}
    </div>
  )
}

// Student Linking Step - For guardians to link to students
function StudentLinkingStep({ data, updateData }: { data: Record<string, unknown>; updateData: (data: Record<string, unknown>) => void }) {
  return (
    <div className="p-6 bg-[rgb(var(--surface-tertiary))] rounded-xl border border-[rgb(var(--border-primary))]">
      <div className="flex items-center gap-3 mb-4">
        <GraduationCap className="w-5 h-5 text-golden-500" />
        <h3 className="font-semibold text-[rgb(var(--text-primary))]">Link to Students</h3>
      </div>
      <p className="text-sm text-[rgb(var(--text-tertiary))]">
        Search for existing students to link to this guardian.
      </p>
      {/* Placeholder for student search/select component */}
    </div>
  )
}

// Review Step - Common for all person types
function ReviewStep({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-4">
      <div className="bg-teal-500/10 dark:bg-cyan-500/10 rounded-xl p-4 border border-teal-500/20 dark:border-cyan-500/20">
        <p className="text-sm text-teal-700 dark:text-cyan-300">
          Please review the information below before submitting.
        </p>
      </div>
      <div className="p-6 bg-[rgb(var(--surface-secondary))] rounded-xl border border-[rgb(var(--border-primary))]">
        <pre className="text-xs text-[rgb(var(--text-tertiary))] overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  )
}

// ============================================================================
// STUDENT WIZARD STEPS
// ============================================================================

export const STUDENT_WIZARD_STEPS: WizardStep[] = [
  {
    id: 'personal',
    title: 'Personal Information',
    description: 'Basic details about the student',
    icon: User,
    component: PersonalInfoStep,
  },
  {
    id: 'contact',
    title: 'Contact & Address',
    description: 'How to reach this student',
    icon: Mail,
    component: ContactAddressStep,
  },
  {
    id: 'guardian',
    title: 'Guardian/Parent',
    description: 'Link to a parent or guardian',
    icon: Heart,
    component: GuardianLinkingStep,
  },
  {
    id: 'academic',
    title: 'Academic Placement',
    description: 'Grade level and enrollment',
    icon: GraduationCap,
    component: AcademicInfoStep as any,
  },
  {
    id: 'review',
    title: 'Review & Confirm',
    description: 'Verify all information',
    icon: Check,
    component: ReviewStep as any,
  },
]

// ============================================================================
// TEACHER WIZARD STEPS
// ============================================================================

export const TEACHER_WIZARD_STEPS: WizardStep[] = [
  {
    id: 'personal',
    title: 'Personal Information',
    description: 'Basic details about the teacher',
    icon: User,
    component: PersonalInfoStep,
  },
  {
    id: 'contact',
    title: 'Contact & Address',
    description: 'How to reach this teacher',
    icon: Mail,
    component: ContactAddressStep,
  },
  {
    id: 'employment',
    title: 'Employment Details',
    description: 'Position and department',
    icon: Briefcase,
    component: EmploymentInfoStep as any,
  },
  {
    id: 'credentials',
    title: 'Credentials',
    description: 'Qualifications and certifications',
    icon: BookOpen,
    component: CredentialsStep as any,
  },
  {
    id: 'classes',
    title: 'Class Assignment',
    description: 'Assign to classes',
    icon: Users,
    component: ClassAssignmentStep as any,
  },
  {
    id: 'review',
    title: 'Review & Confirm',
    description: 'Verify all information',
    icon: Check,
    component: ReviewStep as any,
  },
]

// ============================================================================
// STAFF WIZARD STEPS
// ============================================================================

export const STAFF_WIZARD_STEPS: WizardStep[] = [
  {
    id: 'personal',
    title: 'Personal Information',
    description: 'Basic details about the staff member',
    icon: User,
    component: PersonalInfoStep,
  },
  {
    id: 'contact',
    title: 'Contact & Address',
    description: 'How to reach this person',
    icon: Mail,
    component: ContactAddressStep,
  },
  {
    id: 'employment',
    title: 'Employment Details',
    description: 'Position and department',
    icon: Briefcase,
    component: EmploymentInfoStep as any,
  },
  {
    id: 'department',
    title: 'Department',
    description: 'Organizational placement',
    icon: Building,
    component: DepartmentAssignmentStep as any,
  },
  {
    id: 'permissions',
    title: 'Roles & Permissions',
    description: 'Access control settings',
    icon: Shield,
    component: RolePermissionsStep as any,
  },
  {
    id: 'review',
    title: 'Review & Confirm',
    description: 'Verify all information',
    icon: Check,
    component: ReviewStep as any,
  },
]

// ============================================================================
// GUARDIAN WIZARD STEPS
// ============================================================================

export const GUARDIAN_WIZARD_STEPS: WizardStep[] = [
  {
    id: 'personal',
    title: 'Personal Information',
    description: 'Basic details about the guardian',
    icon: User,
    component: PersonalInfoStep,
  },
  {
    id: 'contact',
    title: 'Contact & Address',
    description: 'How to reach this guardian',
    icon: Mail,
    component: ContactAddressStep,
  },
  {
    id: 'employment',
    title: 'Employment',
    description: 'Occupation and employer (optional)',
    icon: Briefcase,
    component: EmploymentInfoStep as any,
    isOptional: true,
  },
  {
    id: 'students',
    title: 'Link Students',
    description: 'Connect to their children',
    icon: GraduationCap,
    component: StudentLinkingStep as any,
  },
  {
    id: 'review',
    title: 'Review & Confirm',
    description: 'Verify all information',
    icon: Check,
    component: ReviewStep as any,
  },
]

// ============================================================================
// GET WIZARD STEPS BY PERSON TYPE
// ============================================================================

export type PersonType = 'student' | 'teacher' | 'staff' | 'guardian'

export function getWizardStepsForPersonType(type: PersonType): WizardStep[] {
  switch (type) {
    case 'student':
      return STUDENT_WIZARD_STEPS
    case 'teacher':
      return TEACHER_WIZARD_STEPS
    case 'staff':
      return STAFF_WIZARD_STEPS
    case 'guardian':
      return GUARDIAN_WIZARD_STEPS
    default:
      return STUDENT_WIZARD_STEPS
  }
}

// ============================================================================
// PERSON TYPE LABELS
// ============================================================================

export const PERSON_TYPE_LABELS: Record<PersonType, string> = {
  student: 'Student',
  teacher: 'Teacher',
  staff: 'Staff',
  guardian: 'Guardian',
}

