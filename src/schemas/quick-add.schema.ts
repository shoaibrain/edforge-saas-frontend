/**
 * Quick Add Person Schema
 * 
 * Validation schema for the Quick Add Person modal.
 * Captures basic information before redirecting to full wizard.
 */

import { z } from 'zod'

// ============================================================================
// PERSON TYPE ENUM
// ============================================================================

export const PersonTypeEnum = z.enum(['student', 'teacher', 'staff', 'guardian'])

export type PersonTypeValue = z.infer<typeof PersonTypeEnum>

// ============================================================================
// NAME VALIDATION HELPERS
// ============================================================================

const nameRegex = /^[a-zA-Z\u00C0-\u017F\s'-]+$/

const nameValidation = z
  .string()
  .min(2, 'Must be at least 2 characters')
  .max(50, 'Must be at most 50 characters')
  .regex(nameRegex, 'Can only contain letters, spaces, hyphens, and apostrophes')
  .transform((val) => val.trim())

// ============================================================================
// EMAIL VALIDATION
// ============================================================================

const emailValidation = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(254, 'Email is too long')
  .transform((val) => val.toLowerCase().trim())

// ============================================================================
// QUICK ADD PERSON SCHEMA
// ============================================================================

export const quickAddPersonSchema = z.object({
  /** First name - required */
  firstName: nameValidation,
  
  /** Last name - required */
  lastName: nameValidation,
  
  /** Email address - required */
  email: emailValidation,
  
  /** Person type - required */
  personType: PersonTypeEnum,
})

export type QuickAddPersonInput = z.input<typeof quickAddPersonSchema>
export type QuickAddPersonOutput = z.output<typeof quickAddPersonSchema>

// ============================================================================
// PERSON TYPE OPTIONS
// ============================================================================

export interface PersonTypeOption {
  value: PersonTypeValue
  label: string
  description: string
  icon: string // Lucide icon name
  color: {
    bg: string
    text: string
    ring: string
  }
}

export const PERSON_TYPE_OPTIONS: PersonTypeOption[] = [
  {
    value: 'student',
    label: 'Student',
    description: 'A learner enrolled in the school',
    icon: 'GraduationCap',
    color: {
      bg: 'bg-golden-400/20',
      text: 'text-golden-600 dark:text-golden-400',
      ring: 'ring-golden-500',
    },
  },
  {
    value: 'teacher',
    label: 'Teacher',
    description: 'An educator who instructs students',
    icon: 'User',
    color: {
      bg: 'bg-teal-500/20',
      text: 'text-teal-600 dark:text-cyan-400',
      ring: 'ring-teal-500',
    },
  },
  {
    value: 'staff',
    label: 'Staff',
    description: 'Administrative or support personnel',
    icon: 'Users',
    color: {
      bg: 'bg-aqua-400/20',
      text: 'text-aqua-700 dark:text-aqua-400',
      ring: 'ring-aqua-500',
    },
  },
  {
    value: 'guardian',
    label: 'Guardian',
    description: 'Parent or legal guardian of a student',
    icon: 'Heart',
    color: {
      bg: 'bg-rust-400/20',
      text: 'text-rust-600 dark:text-rust-400',
      ring: 'ring-rust-500',
    },
  },
]

export function getPersonTypeOption(value: PersonTypeValue): PersonTypeOption | undefined {
  return PERSON_TYPE_OPTIONS.find((opt) => opt.value === value)
}

