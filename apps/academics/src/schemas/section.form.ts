/**
 * Section Form Schema
 *
 * Frontend-specific Zod schema for section create/edit forms.
 * Uses z.coerce.number() for HTML number inputs.
 */

import { z } from 'zod'

// ============================================================================
// FORM SCHEMA
// ============================================================================

export const sectionFormSchema = z.object({
  // Section Identity
  courseId: z.string().min(1, 'Please select a course'),
  sectionNumber: z
    .string()
    .min(1, 'Section number is required')
    .max(20, 'Section number must not exceed 20 characters'),
  sectionName: z.string().max(100).optional(),

  // Teacher Assignment
  primaryTeacherId: z.string().min(1, 'Please assign a primary teacher'),
  coTeacherIds: z.array(z.string()).max(5).optional(),

  // Logistics
  maxEnrollment: z.coerce
    .number({ invalid_type_error: 'Enter a valid number' })
    .int('Must be a whole number')
    .min(1, 'At least 1 student')
    .max(500, 'Cannot exceed 500'),

  // Academic Session
  academicYearId: z.string().min(1, 'Please select an academic year'),
  termId: z.string().optional(),

  // Master Schedule references (Sprint 3)
  courseOfferingId: z.string().optional(),
  classPeriodId: z.string().optional(),
  locationId: z.string().optional(),
})

export type SectionFormData = z.infer<typeof sectionFormSchema>

// ============================================================================
// DEFAULTS
// ============================================================================

export const defaultSectionFormData: Partial<SectionFormData> = {
  courseId: '',
  sectionNumber: '',
  sectionName: '',
  primaryTeacherId: '',
  coTeacherIds: [],
  maxEnrollment: 30,
  academicYearId: '',
  termId: '',
  courseOfferingId: '',
  classPeriodId: '',
  locationId: '',
}

// ============================================================================
// CAPACITY HELPERS
// ============================================================================

/**
 * Get capacity color class based on enrollment ratio
 */
export function getCapacityColor(current: number, max: number): string {
  if (max === 0) return 'bg-[rgb(var(--border-primary))]'
  const ratio = current / max
  if (ratio >= 0.9) return 'bg-[rgb(var(--state-danger-bg)/0.18)]0'
  if (ratio >= 0.75) return 'bg-amber-500'
  return 'bg-[rgb(var(--state-success-bg)/0.18)]0'
}

/**
 * Get capacity text color
 */
export function getCapacityTextColor(current: number, max: number): string {
  if (max === 0) return 'text-[rgb(var(--text-tertiary))]'
  const ratio = current / max
  if (ratio >= 0.9) return 'text-[rgb(var(--state-danger-fg))]'
  if (ratio >= 0.75) return 'text-amber-600'
  return 'text-[rgb(var(--state-success-fg))]'
}

/**
 * Get capacity label (e.g., "28 / 30")
 */
export function getCapacityLabel(current: number, max: number): string {
  return `${current} / ${max}`
}

/**
 * Get capacity percentage
 */
export function getCapacityPercent(current: number, max: number): number {
  if (max === 0) return 0
  return Math.min(100, Math.round((current / max) * 100))
}
