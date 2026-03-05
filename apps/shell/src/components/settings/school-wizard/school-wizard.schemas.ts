/**
 * School Wizard Step Schemas
 *
 * Per-step Zod validation schemas for the school creation wizard.
 * Each step validates only its own fields on "Continue".
 */

import { z } from 'zod'
import { ORDERED_GRADES, validateSchoolTypeGradeRange } from './school-wizard.utils'

// Step 1: Basic Information — all required fields
export const basicInfoSchema = z
  .object({
    name: z.string().min(2, 'School name must be at least 2 characters').max(100),
    schoolCode: z.string().min(2, 'School code must be 2–10 characters').max(10),
    schoolType: z.enum(
      ['elementary', 'middle', 'high', 'k12', 'charter', 'private', 'vocational', 'special_education'],
      { errorMap: () => ({ message: 'Select a school type' }) },
    ),
    'gradeRange.start': z.string().min(1, 'Select a starting grade'),
    'gradeRange.end': z.string().min(1, 'Select an ending grade'),
  })
  .refine(
    (data) => {
      const startIdx = (ORDERED_GRADES as readonly string[]).indexOf(data['gradeRange.start'])
      const endIdx = (ORDERED_GRADES as readonly string[]).indexOf(data['gradeRange.end'])
      return startIdx <= endIdx
    },
    { message: 'Start grade must be before or equal to end grade', path: ['gradeRange.end'] },
  )
  .refine(
    (data) => {
      const error = validateSchoolTypeGradeRange(
        data.schoolType,
        { start: data['gradeRange.start'], end: data['gradeRange.end'] },
      )
      return error === null
    },
    (data) => ({
      message: validateSchoolTypeGradeRange(
        data.schoolType,
        { start: data['gradeRange.start'], end: data['gradeRange.end'] },
      ) || 'Invalid grade range for this school type',
      path: ['gradeRange.end'],
    }),
  )

// Step 2: Location & Contact — validate format only if provided, enforce address completeness
export const locationContactSchema = z.object({
  email: z.union([z.string().email('Invalid email format'), z.literal('')]).optional(),
  website: z.union([z.string().url('Invalid URL format'), z.literal('')]).optional(),
  principalEmail: z.union([z.string().email('Invalid email format'), z.literal('')]).optional(),
  'address.street1': z.string().optional(),
  'address.city': z.string().optional(),
  'address.state': z.string().optional(),
  'address.zipCode': z.string().optional(),
}).passthrough().refine(
  (data) => {
    const street = data['address.street1'] as string
    const city = data['address.city'] as string
    const state = data['address.state'] as string
    const zip = data['address.zipCode'] as string
    // If any address field is filled, require the core set
    const anyFilled = !!(street || city || state || zip)
    if (!anyFilled) return true
    return !!(street && city && state && zip)
  },
  { message: 'Please complete all required address fields (street, city, state, zip)', path: ['address.street1'] },
)

// Step 4: Ed-Fi Compliance — optional but validate structure if provided
export const edfiComplianceSchema = z.object({
  schoolCategories: z.array(z.string()).optional(),
  schoolTypeDescriptor: z.string().optional(),
  charterStatusDescriptor: z.string().optional(),
  administrativeFundingControlDescriptor: z.string().optional(),
  gradeLevels: z.array(z.string()).optional(),
}).passthrough()
