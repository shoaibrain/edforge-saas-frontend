/**
 * School Wizard Step Schemas
 *
 * Per-step Zod validation schemas for the school creation wizard.
 * Each step validates only its own fields on "Continue".
 */

import { z } from 'zod'
import { ORDERED_GRADES } from './school-wizard.utils'

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
      const startIdx = ORDERED_GRADES.indexOf(data['gradeRange.start'])
      const endIdx = ORDERED_GRADES.indexOf(data['gradeRange.end'])
      return startIdx <= endIdx
    },
    { message: 'Start grade must be before or equal to end grade', path: ['gradeRange.end'] },
  )

// Step 2: Location & Contact — validate format only if provided
export const locationContactSchema = z.object({
  email: z.union([z.string().email('Invalid email format'), z.literal('')]).optional(),
  website: z.union([z.string().url('Invalid URL format'), z.literal('')]).optional(),
  principalEmail: z.union([z.string().email('Invalid email format'), z.literal('')]).optional(),
}).passthrough()
