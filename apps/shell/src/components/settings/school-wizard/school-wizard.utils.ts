/**
 * School Wizard Utilities
 *
 * Auto-generation helpers, DTO transformation, and re-exports for the school creation wizard.
 * Grade-level constants and school-type mappings are imported from @aibrains/shared-types.
 */

import type { CreateSchoolDto } from '@aibrains/shared-types'

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
} from '@aibrains/shared-types'

export const COUNTRY_OPTIONS = [
  { value: 'USA', label: 'United States' },
  { value: 'CAN', label: 'Canada' },
  { value: 'GBR', label: 'United Kingdom' },
  { value: 'AUS', label: 'Australia' },
  { value: 'OTHER', label: 'Other' },
]

// ============================================================================
// TIMEZONE CONSTANTS
// ============================================================================

export const US_TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'America/Anchorage', label: 'Alaska (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HT)' },
]

/** Map US state abbreviations to their primary timezone */
export const STATE_TIMEZONE_MAP: Record<string, string> = {
  CT: 'America/New_York', DE: 'America/New_York', FL: 'America/New_York',
  GA: 'America/New_York', ME: 'America/New_York', MD: 'America/New_York',
  MA: 'America/New_York', NH: 'America/New_York', NJ: 'America/New_York',
  NY: 'America/New_York', NC: 'America/New_York', OH: 'America/New_York',
  PA: 'America/New_York', RI: 'America/New_York', SC: 'America/New_York',
  VT: 'America/New_York', VA: 'America/New_York', WV: 'America/New_York',
  DC: 'America/New_York',
  AL: 'America/Chicago', AR: 'America/Chicago', IL: 'America/Chicago',
  IA: 'America/Chicago', KS: 'America/Chicago', KY: 'America/Chicago',
  LA: 'America/Chicago', MN: 'America/Chicago', MS: 'America/Chicago',
  MO: 'America/Chicago', NE: 'America/Chicago', ND: 'America/Chicago',
  OK: 'America/Chicago', SD: 'America/Chicago', TN: 'America/Chicago',
  TX: 'America/Chicago', WI: 'America/Chicago', IN: 'America/New_York',
  MI: 'America/New_York',
  AZ: 'America/Denver', CO: 'America/Denver', ID: 'America/Denver',
  MT: 'America/Denver', NM: 'America/Denver', UT: 'America/Denver',
  WY: 'America/Denver',
  CA: 'America/Los_Angeles', NV: 'America/Los_Angeles',
  OR: 'America/Los_Angeles', WA: 'America/Los_Angeles',
  AK: 'America/Anchorage',
  HI: 'Pacific/Honolulu',
}

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
    address: hasAddress
      ? {
          street1: data['address.street1'] as string,
          street2: (data['address.street2'] as string) || undefined,
          city: data['address.city'] as string,
          state: data['address.state'] as string,
          zipCode: data['address.zipCode'] as string,
          country: (data['address.country'] as string) || 'USA',
        }
      : undefined,
    principalName: (data.principalName as string) || undefined,
    principalEmail: (data.principalEmail as string) || undefined,
    timezone: (data.timezone as string) || 'America/Chicago',
    locale: 'en-US',
    academicCalendarType: (data.academicCalendarType as any) || 'semester',
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
