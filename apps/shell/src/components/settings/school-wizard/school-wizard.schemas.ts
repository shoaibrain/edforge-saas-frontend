/**
 * School Wizard Step Schemas
 *
 * Per-step Zod validation schemas for the school creation wizard.
 * Each step validates only its own fields on "Continue".
 */

import { z } from 'zod'
import { ORDERED_GRADES, validateSchoolTypeGradeRange, getCountryConfig } from './school-wizard.utils'

/**
 * Sprint C Gap 3 — PABSON archetype requires emisSchoolCode at create.
 * Backend enforces the rule with a structured 400 on POST /schools, but we
 * also validate it client-side so the wizard blocks "Continue" on Step 1
 * instead of letting the user fill four more steps before the server
 * rejects the payload. Built as a factory because the archetype is not
 * known at module-load time; SchoolWizard.tsx resolves it from shell
 * context and memoizes the schema on archetype changes.
 */
export function makeBasicInfoSchema(archetype: string | null) {
  const emisSchoolCodeField =
    archetype === 'PABSON'
      ? z
          .string({ required_error: 'IEMIS School Code is required for PABSON tenants' })
          .min(1, 'IEMIS School Code is required for PABSON tenants')
          .max(32, 'IEMIS School Code must be 32 characters or fewer')
      : z.string().max(32, 'IEMIS School Code must be 32 characters or fewer').optional()

  return z
    .object({
      name: z.string().min(2, 'School name must be at least 2 characters').max(100),
      schoolCode: z.string().min(2, 'School code must be 2–10 characters').max(10),
      emisSchoolCode: emisSchoolCodeField,
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
}

/**
 * Back-compat export — non-PABSON-aware baseline schema.
 * Callers that don't have access to archetype (e.g. module-scoped tests)
 * can use this; production callers should use `makeBasicInfoSchema(archetype)`
 * from SchoolWizard.tsx.
 */
export const basicInfoSchema = makeBasicInfoSchema(null)

// Step 2: Location & Contact — validate format only if provided, enforce address completeness
export const locationContactSchema = z.object({
  email: z.union([z.string().email('Invalid email format'), z.literal('')]).optional(),
  website: z.union([z.string().url('Invalid URL format'), z.literal('')]).optional(),
  principalEmail: z.union([z.string().email('Invalid email format'), z.literal('')]).optional(),
}).passthrough().refine(
  (data) => {
    const country = (data['address.country'] as string) || 'USA'
    const config = getCountryConfig(country)
    const requiredKeys = config.addressFields
      .filter(f => f.required && f.key !== 'country')
      .map(f => f.key)
    const anyFilled = requiredKeys.some(k => !!(data as Record<string, unknown>)[`address.${k}`])
    if (!anyFilled) return true
    return requiredKeys.every(k => !!(data as Record<string, unknown>)[`address.${k}`])
  },
  (data) => {
    const country = (data['address.country'] as string) || 'USA'
    const config = getCountryConfig(country)
    const labels = config.addressFields
      .filter(f => f.required && f.key !== 'country')
      .map(f => f.label)
    return {
      message: `Please complete all required address fields (${labels.join(', ')})`,
      path: ['address.street1'],
    }
  },
)

// Step 4: Ed-Fi Compliance — optional but validate structure if provided
export const edfiComplianceSchema = z.object({
  schoolCategories: z.array(z.string()).optional(),
  schoolTypeDescriptor: z.string().optional(),
  charterStatusDescriptor: z.string().optional(),
  administrativeFundingControlDescriptor: z.string().optional(),
  gradeLevels: z.array(z.string()).optional(),
}).passthrough()
