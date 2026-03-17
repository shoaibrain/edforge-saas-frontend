/**
 * School Wizard Utilities
 *
 * Auto-generation helpers, DTO transformation, and re-exports for the school creation wizard.
 * Grade-level constants and school-type mappings are imported from @aibrains/shared-types.
 */

import type { CreateSchoolDto } from '@aibrains/shared-types'
import {
  getDefaultsForCountry,
  getTimezoneOptionsForCountry,
} from '@aibrains/shared-types'

// Re-export canonical constants from shared-types for use by wizard steps
export {
  ORDERED_GRADES,
  GRADE_LEVEL_OPTIONS,
  GRADE_LEVEL_OPTIONS as GRADE_OPTIONS,
  GRADE_RANGE_TO_DESCRIPTOR,
  SCHOOL_TYPE_OPTIONS,
  SCHOOL_TYPE_LABELS,
  TYPE_TO_SUGGESTED_CATEGORY,
  TYPE_TO_SUGGESTED_DESCRIPTOR,
  SCHOOL_TYPE_GRADE_DEFAULTS,
  getDefaultGradeRange,
  getGradeLevelLabel,
  getGradeIndex,
  isValidGradeRange,
  computeGradeLevels,
  getSuggestedCategory,
  getSuggestedDescriptor,
  validateSchoolTypeGradeRange,
  // Country configuration — from shared-types registry
  COUNTRY_OPTIONS,
  COUNTRY_REGISTRY,
  getCountryConfig,
  getTimezoneOptionsForCountry,
  getLocaleOptionsForCountry,
  getDefaultsForCountry,
  STATE_TIMEZONE_MAP,
} from '@aibrains/shared-types'

// Backward-compatible aliases
export const US_TIMEZONE_OPTIONS = getTimezoneOptionsForCountry('USA')

// ============================================================================
// AUTO-GENERATION HELPERS
// ============================================================================

const SKIP_WORDS = new Set(['the', 'of', 'and', 'for', 'in', 'at', 'a', 'an'])

export function generateSchoolCode(name: string): string {
  if (!name || !name.trim()) return 'XX'

  // Split on spaces and hyphens, filter out articles/prepositions
  const words = name
    .replace(/-/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0)

  const significantWords = words.filter((w) => !SKIP_WORDS.has(w.toLowerCase()))
  const sourceWords = significantWords.length > 0 ? significantWords : words

  let code: string
  if (sourceWords.length === 1) {
    // Single word: take first 4 chars
    code = sourceWords[0].slice(0, 4).toUpperCase()
  } else {
    // Multiple words: take first char of each
    code = sourceWords
      .map((w) => w.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 5)
  }

  // Ensure minimum 2 characters
  if (code.length < 2) {
    code = (name.replace(/[^a-zA-Z0-9]/g, '') + 'XX').slice(0, 2).toUpperCase()
  }

  return code
}

// ============================================================================
// DTO TRANSFORMATION
// ============================================================================

/** Filter out array entries with empty required fields */
function filterIdCodes(codes: any[] | undefined): any[] | undefined {
  if (!codes?.length) return undefined
  const filtered = codes.filter((c) => c?.identificationCode?.trim())
  return filtered.length > 0 ? filtered : undefined
}

function filterPhones(phones: any[] | undefined): any[] | undefined {
  if (!phones?.length) return undefined
  const filtered = phones.filter((p) => p?.telephoneNumber?.trim())
  return filtered.length > 0 ? filtered : undefined
}

function filterRatings(ratings: any[] | undefined): any[] | undefined {
  if (!ratings?.length) return undefined
  const filtered = ratings.filter((r) => r?.title?.trim() && r?.rating?.trim())
  return filtered.length > 0 ? filtered : undefined
}

/** Transform flat wizard data into the nested CreateSchoolDto structure */
export function transformWizardDataToDto(
  data: Record<string, unknown>,
): CreateSchoolDto {
  const hasAddress = data['address.street1']
  const country = (data['address.country'] as string) || 'USA'
  const defaults = getDefaultsForCountry(country)

  // Build address based on country
  let address: CreateSchoolDto['address'] | undefined
  if (hasAddress) {
    const baseAddress: any = {
      street1: data['address.street1'] as string,
      street2: (data['address.street2'] as string) || undefined,
      country,
    }

    if (country === 'NPL') {
      // Nepal: ward, municipality, district, province
      baseAddress.wardNumber = (data['address.wardNumber'] as string) || undefined
      baseAddress.municipality = (data['address.municipality'] as string) || undefined
      baseAddress.district = (data['address.district'] as string) || undefined
      baseAddress.province = (data['address.province'] as string) || undefined
      baseAddress.city = (data['address.city'] as string) || undefined
    } else if (country === 'USA') {
      // US: city, state (2-char), zipCode
      baseAddress.city = data['address.city'] as string
      baseAddress.state = data['address.state'] as string
      baseAddress.zipCode = data['address.zipCode'] as string
    } else {
      // Generic: city, state/region, zipCode
      baseAddress.city = (data['address.city'] as string) || undefined
      baseAddress.state = (data['address.state'] as string) || undefined
      baseAddress.zipCode = (data['address.zipCode'] as string) || undefined
      baseAddress.region = (data['address.region'] as string) || undefined
    }

    address = baseAddress
  }

  return {
    name: data.name as string,
    schoolCode: data.schoolCode as string,
    shortName: (data.shortName as string) || undefined,
    schoolType: data.schoolType as any,
    gradeRange: {
      start: data['gradeRange.start'] as string,
      end: data['gradeRange.end'] as string,
    },
    phone: (data.phone as string) || undefined,
    email: (data.email as string) || undefined,
    website: (data.website as string) || undefined,
    address,
    timezone: (data.timezone as string) || defaults.timezone,
    locale: (data.locale as string) || defaults.locale,
    academicCalendarType: (data.academicCalendarType as any) || defaults.calendarSystem === 'bikram_sambat' ? 'annual' : 'semester',
    calendarSystem: (data.calendarSystem as any) || defaults.calendarSystem,
    localEducationAgencyId:
      (data.localEducationAgencyId as string) || undefined,
    schoolCategories: (data.schoolCategories as string[])?.length
      ? (data.schoolCategories as any)
      : undefined,
    schoolTypeDescriptor: ((data.schoolTypeDescriptor as string) || undefined) as any,
    gradeLevels: (data.gradeLevels as string[])?.length
      ? (data.gradeLevels as any)
      : undefined,
    charterStatusDescriptor:
      ((data.charterStatusDescriptor as string) || undefined) as any,
    administrativeFundingControlDescriptor:
      ((data.administrativeFundingControlDescriptor as string) || undefined) as any,
    titleIPartASchoolDesignationDescriptor:
      (data.titleIPartASchoolDesignationDescriptor as string) || undefined,
    identificationCodes: filterIdCodes(data.identificationCodes as any[]),
    institutionTelephones: filterPhones(data.institutionTelephones as any[]),
    accountabilityRatings: filterRatings(data.accountabilityRatings as any[]),
  }
}
