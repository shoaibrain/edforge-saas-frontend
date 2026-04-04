/**
 * Course Form Schema
 *
 * Frontend validation schemas for course creation/editing.
 * Derived from CreateCourseDto with user-friendly error messages.
 */

import { z } from 'zod'

// ============================================================================
// OPTION CONSTANTS
// ============================================================================

export const SUBJECT_AREA_OPTIONS = [
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'english_language_arts', label: 'English Language Arts' },
  { value: 'science', label: 'Science' },
  { value: 'social_studies', label: 'Social Studies' },
  { value: 'world_languages', label: 'World Languages' },
  { value: 'arts', label: 'Arts' },
  { value: 'physical_education', label: 'Physical Education' },
  { value: 'technology', label: 'Technology' },
  { value: 'business', label: 'Business' },
  { value: 'vocational', label: 'Vocational' },
  { value: 'other', label: 'Other' },
] as const

export const COURSE_TYPE_OPTIONS = [
  { value: 'required', label: 'Required' },
  { value: 'elective', label: 'Elective' },
  { value: 'enrichment', label: 'Enrichment' },
  { value: 'remedial', label: 'Remedial' },
  { value: 'honors', label: 'Honors' },
  { value: 'ap', label: 'AP' },
  { value: 'ib', label: 'IB' },
  { value: 'dual_enrollment', label: 'Dual Enrollment' },
  { value: 'vocational', label: 'Vocational' },
] as const

export const CREDIT_TYPE_OPTIONS = [
  { value: 'academic', label: 'Academic' },
  { value: 'elective', label: 'Elective' },
  { value: 'honors', label: 'Honors' },
  { value: 'ap', label: 'AP' },
  { value: 'ib', label: 'IB' },
  { value: 'dual_enrollment', label: 'Dual Enrollment' },
] as const

export const DURATION_OPTIONS = [
  { value: 'semester', label: 'Semester' },
  { value: 'year', label: 'Full Year' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'trimester', label: 'Trimester' },
] as const

// Re-exported from shared-types (canonical source of truth)
export { GRADE_LEVEL_OPTIONS } from '@aibrains/shared-types'

export const MATERIAL_TYPE_OPTIONS = [
  { value: 'textbook', label: 'Textbook' },
  { value: 'workbook', label: 'Workbook' },
  { value: 'digital', label: 'Digital Resource' },
  { value: 'other', label: 'Other' },
] as const

// ============================================================================
// SUBJECT AREA COLOR MAP
// ============================================================================

export const SUBJECT_AREA_COLORS: Record<string, { bg: string; text: string }> = {
  mathematics: { bg: 'bg-blue-50', text: 'text-blue-700' },
  english_language_arts: { bg: 'bg-purple-50', text: 'text-purple-700' },
  science: { bg: 'bg-green-50', text: 'text-green-700' },
  social_studies: { bg: 'bg-amber-50', text: 'text-amber-700' },
  world_languages: { bg: 'bg-rose-50', text: 'text-rose-700' },
  arts: { bg: 'bg-pink-50', text: 'text-pink-700' },
  physical_education: { bg: 'bg-orange-50', text: 'text-orange-700' },
  technology: { bg: 'bg-cyan-50', text: 'text-cyan-700' },
  business: { bg: 'bg-slate-50', text: 'text-slate-700' },
  vocational: { bg: 'bg-teal-50', text: 'text-teal-700' },
  other: { bg: 'bg-gray-50', text: 'text-gray-700' },
}

export const COURSE_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  required: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
  elective: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  enrichment: { bg: 'bg-violet-50', text: 'text-violet-700' },
  remedial: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
  honors: { bg: 'bg-sky-50', text: 'text-sky-700' },
  ap: { bg: 'bg-blue-50', text: 'text-blue-700' },
  ib: { bg: 'bg-cyan-50', text: 'text-cyan-700' },
  dual_enrollment: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700' },
  vocational: { bg: 'bg-teal-50', text: 'text-teal-700' },
}

// ============================================================================
// FORM SCHEMA
// ============================================================================

export const courseFormSchema = z.object({
  // Identity
  courseCode: z
    .string({ required_error: 'Course code is required' })
    .min(2, 'Course code must be at least 2 characters')
    .max(20, 'Course code must not exceed 20 characters')
    .regex(
      /^[A-Z0-9_-]+$/i,
      'Only letters, numbers, hyphens, and underscores allowed'
    ),
  courseName: z
    .string({ required_error: 'Course name is required' })
    .min(2, 'Course name must be at least 2 characters')
    .max(200, 'Course name must not exceed 200 characters'),

  // Classification
  subjectArea: z.enum(
    [
      'mathematics',
      'english_language_arts',
      'science',
      'social_studies',
      'world_languages',
      'arts',
      'physical_education',
      'technology',
      'business',
      'vocational',
      'other',
    ],
    { required_error: 'Subject area is required' }
  ),
  courseType: z.enum(
    ['required', 'elective', 'enrichment', 'remedial', 'honors', 'ap', 'ib', 'dual_enrollment', 'vocational'],
    { required_error: 'Course type is required' }
  ),
  creditType: z
    .enum(['academic', 'elective', 'honors', 'ap', 'ib', 'dual_enrollment'])
    .optional(),
  credits: z.coerce
    .number({ required_error: 'Credits are required' })
    .min(0, 'Credits must be at least 0')
    .max(12, 'Credits cannot exceed 12'),
  typicalDuration: z.enum(['semester', 'year', 'quarter', 'trimester'], {
    required_error: 'Duration is required',
  }),

  // Grade Levels
  gradeLevels: z
    .array(z.string())
    .min(1, 'At least one grade level is required')
    .max(15),

  // Description
  description: z.string().max(2000, 'Description must not exceed 2000 characters').optional().or(z.literal('')),
  objectives: z.array(z.string().max(500)).max(20).optional(),

  // Prerequisites (text input for MVP)
  prerequisites: z.array(z.string()).max(10).optional(),

  // Scheduling
  periodsPerWeek: z
    .union([z.literal(''), z.coerce.number().int().min(1, 'Must be at least 1').max(20, 'Cannot exceed 20')])
    .optional()
    .transform((val) => (val === '' || val === undefined ? undefined : val)),
})

export type CourseFormData = z.infer<typeof courseFormSchema>

// ============================================================================
// DEFAULTS
// ============================================================================

export const defaultCourseFormData: Partial<CourseFormData> = {
  courseCode: '',
  courseName: '',
  subjectArea: undefined,
  courseType: undefined,
  creditType: undefined,
  credits: 1,
  typicalDuration: undefined,
  gradeLevels: [],
  description: '',
  objectives: [],
  prerequisites: [],
  periodsPerWeek: undefined,
}

// ============================================================================
// LABEL HELPERS
// ============================================================================

export function getSubjectAreaLabel(value: string): string {
  const option = SUBJECT_AREA_OPTIONS.find((o) => o.value === value)
  return option?.label ?? value
}

export function getCourseTypeLabel(value: string): string {
  const option = COURSE_TYPE_OPTIONS.find((o) => o.value === value)
  return option?.label ?? value
}

export function getCreditTypeLabel(value: string): string {
  const option = CREDIT_TYPE_OPTIONS.find((o) => o.value === value)
  return option?.label ?? value
}

export function getDurationLabel(value: string): string {
  const option = DURATION_OPTIONS.find((o) => o.value === value)
  return option?.label ?? value
}

// Re-exported from shared-types (canonical source of truth)
export { getGradeLevelLabel } from '@aibrains/shared-types'
