/**
 * LEA Wizard Step Schemas
 *
 * Per-step Zod validation schemas for the LEA creation wizard.
 * Each schema validates only the fields relevant to that step.
 */

import { z } from 'zod'

// Step 1: Organization Type
export const orgTypeStepSchema = z
  .object({
    leaCategoryDescriptor: z.string().min(1, 'Please select an organization type'),
  })
  .passthrough()

// Step 2: Details
export const detailsStepSchema = z
  .object({
    localEducationAgencyId: z
      .number({ required_error: 'Ed-Fi ID is required', invalid_type_error: 'Must be a number' })
      .int('Must be a whole number')
      .positive('Must be a positive number'),
    nameOfInstitution: z.string().min(1, 'Organization name is required').max(200),
    shortNameOfInstitution: z.string().max(100).optional(),
    webSite: z.preprocess(
      (val) => (val === '' ? undefined : val),
      z.string().url('Must be a valid URL').optional(),
    ),
    operationalStatusDescriptor: z.string().min(1),
  })
  .passthrough()

// Step 3: Connections (all optional)
export const connectionsStepSchema = z.object({}).passthrough()
