/**
 * Common Validation Schemas
 * 
 * Reusable Zod schemas for common field types.
 */

import { z } from 'zod'

// ============================================================================
// BASIC FIELD SCHEMAS
// ============================================================================

/** Email validation schema */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')

/** Optional email schema */
export const optionalEmailSchema = z
  .string()
  .email('Please enter a valid email address')
  .optional()
  .or(z.literal(''))

/** Phone number validation schema (flexible format) */
export const phoneSchema = z
  .string()
  .regex(
    /^[\d\s\-\(\)\+]+$/,
    'Please enter a valid phone number'
  )
  .min(10, 'Phone number must be at least 10 digits')
  .optional()
  .or(z.literal(''))

/** Required phone schema */
export const requiredPhoneSchema = z
  .string()
  .regex(
    /^[\d\s\-\(\)\+]+$/,
    'Please enter a valid phone number'
  )
  .min(10, 'Phone number must be at least 10 digits')

/** Name field schema (first, last, etc.) */
export const nameSchema = z
  .string()
  .min(1, 'This field is required')
  .min(2, 'Must be at least 2 characters')
  .max(50, 'Must be less than 50 characters')
  .regex(/^[a-zA-Z\s\-']+$/, 'Only letters, spaces, hyphens, and apostrophes allowed')

/** Optional name schema */
export const optionalNameSchema = z
  .string()
  .max(50, 'Must be less than 50 characters')
  .regex(/^[a-zA-Z\s\-']*$/, 'Only letters, spaces, hyphens, and apostrophes allowed')
  .optional()
  .or(z.literal(''))

/** Date string schema (YYYY-MM-DD) */
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid date')

/** Optional date schema */
export const optionalDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid date')
  .optional()
  .or(z.literal(''))

// ============================================================================
// ADDRESS SCHEMAS
// ============================================================================

/** Address schema */
export const addressSchema = z.object({
  street: z.string().optional(),
  street2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().default('US'),
})

export type AddressInput = z.input<typeof addressSchema>
export type AddressOutput = z.output<typeof addressSchema>

/** Required address schema */
export const requiredAddressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  street2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'ZIP code is required'),
  country: z.string().min(1, 'Country is required'),
})

// ============================================================================
// CONTACT SCHEMAS
// ============================================================================

/** Emergency contact schema */
export const emergencyContactSchema = z.object({
  name: z.string().optional(),
  phone: phoneSchema,
  relationship: z.string().optional(),
})

/** Contact info schema */
export const contactInfoSchema = z.object({
  email: emailSchema,
  phone: phoneSchema,
  secondaryEmail: optionalEmailSchema,
  secondaryPhone: phoneSchema,
  preferredContact: z.enum(['email', 'phone', 'sms']).optional(),
  emergencyContact: emergencyContactSchema.optional(),
})

export type ContactInfoInput = z.input<typeof contactInfoSchema>
export type ContactInfoOutput = z.output<typeof contactInfoSchema>

// ============================================================================
// GENDER & DEMOGRAPHICS
// ============================================================================

/** Gender enum */
export const genderSchema = z.enum(['male', 'female', 'other', 'prefer_not_to_say'])

export type Gender = z.infer<typeof genderSchema>

// ============================================================================
// UTILITY SCHEMAS
// ============================================================================

/** ID schema (for foreign keys, etc.) */
export const idSchema = z.string().uuid('Invalid ID format')

/** Optional ID schema */
export const optionalIdSchema = z.string().uuid('Invalid ID format').optional()

/** URL schema */
export const urlSchema = z.string().url('Please enter a valid URL')

/** Optional URL schema */
export const optionalUrlSchema = z.string().url('Please enter a valid URL').optional().or(z.literal(''))

