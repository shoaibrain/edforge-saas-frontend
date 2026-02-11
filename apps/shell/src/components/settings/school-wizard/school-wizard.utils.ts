/**
 * School Wizard Utilities
 *
 * Constants, auto-generation helpers, and DTO transformation for the school creation wizard.
 */

import type { CreateSchoolDto } from '@aibrains/shared-types'

// ============================================================================
// GRADE RANGE → ED-FI DESCRIPTOR MAPPING
// ============================================================================

export const GRADE_RANGE_TO_DESCRIPTOR: Record<string, string> = {
  PK: 'Prekindergarten',
  K: 'Kindergarten',
  '1': 'FirstGrade',
  '2': 'SecondGrade',
  '3': 'ThirdGrade',
  '4': 'FourthGrade',
  '5': 'FifthGrade',
  '6': 'SixthGrade',
  '7': 'SeventhGrade',
  '8': 'EighthGrade',
  '9': 'NinthGrade',
  '10': 'TenthGrade',
  '11': 'EleventhGrade',
  '12': 'TwelfthGrade',
}

export const ORDERED_GRADES = [
  'PK', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
]

export const GRADE_OPTIONS = [
  { value: 'PK', label: 'Pre-K' },
  { value: 'K', label: 'Kindergarten' },
  { value: '1', label: '1st Grade' },
  { value: '2', label: '2nd Grade' },
  { value: '3', label: '3rd Grade' },
  { value: '4', label: '4th Grade' },
  { value: '5', label: '5th Grade' },
  { value: '6', label: '6th Grade' },
  { value: '7', label: '7th Grade' },
  { value: '8', label: '8th Grade' },
  { value: '9', label: '9th Grade' },
  { value: '10', label: '10th Grade' },
  { value: '11', label: '11th Grade' },
  { value: '12', label: '12th Grade' },
]

export const SCHOOL_TYPE_OPTIONS = [
  { value: 'elementary', label: 'Elementary School' },
  { value: 'middle', label: 'Middle School' },
  { value: 'high', label: 'High School' },
  { value: 'k12', label: 'K-12 School' },
  { value: 'charter', label: 'Charter School' },
  { value: 'private', label: 'Private School' },
  { value: 'vocational', label: 'Vocational School' },
  { value: 'special_education', label: 'Special Education' },
]

export const SCHOOL_TYPE_LABELS: Record<string, string> = {
  elementary: 'Elementary',
  middle: 'Middle School',
  high: 'High School',
  k12: 'K-12',
  charter: 'Charter',
  private: 'Private',
  vocational: 'Vocational',
  special_education: 'Special Ed',
  other: 'Other',
}

/** Map internal school type to suggested Ed-Fi school category */
export const TYPE_TO_SUGGESTED_CATEGORY: Record<string, string> = {
  elementary: 'Elementary',
  middle: 'MiddleSchool',
  high: 'HighSchool',
  k12: 'AllLevels',
  charter: 'AllLevels',
  private: 'AllLevels',
  vocational: 'SecondarySchool',
  special_education: 'Ungraded',
}

/** Map internal school type to suggested Ed-Fi school type descriptor */
export const TYPE_TO_SUGGESTED_DESCRIPTOR: Record<string, string> = {
  elementary: 'Regular',
  middle: 'Regular',
  high: 'Regular',
  k12: 'Regular',
  charter: 'Regular',
  private: 'Regular',
  vocational: 'CareerAndTechnical',
  special_education: 'SpecialEducation',
}

export const COUNTRY_OPTIONS = [
  { value: 'USA', label: 'United States' },
  { value: 'CAN', label: 'Canada' },
  { value: 'GBR', label: 'United Kingdom' },
  { value: 'AUS', label: 'Australia' },
  { value: 'OTHER', label: 'Other' },
]

// ============================================================================
// AUTO-GENERATION HELPERS
// ============================================================================

export function generateSchoolCode(name: string): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 5)
}

export function computeGradeLevels(start: string, end: string): string[] {
  if (!start || !end) return []
  const startIdx = ORDERED_GRADES.indexOf(start)
  const endIdx = ORDERED_GRADES.indexOf(end)
  if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) return []
  return ORDERED_GRADES.slice(startIdx, endIdx + 1)
    .map((g) => GRADE_RANGE_TO_DESCRIPTOR[g])
    .filter(Boolean)
}

export function getSuggestedCategory(schoolType: string): string | undefined {
  return TYPE_TO_SUGGESTED_CATEGORY[schoolType]
}

export function getSuggestedDescriptor(schoolType: string): string | undefined {
  return TYPE_TO_SUGGESTED_DESCRIPTOR[schoolType]
}

// ============================================================================
// DTO TRANSFORMATION
// ============================================================================

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
    timezone: 'America/Chicago',
    locale: 'en-US',
    academicCalendarType: 'semester',
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
    identificationCodes: (data.identificationCodes as any[])?.length
      ? (data.identificationCodes as any)
      : undefined,
    institutionTelephones: (data.institutionTelephones as any[])?.length
      ? (data.institutionTelephones as any)
      : undefined,
    accountabilityRatings: (data.accountabilityRatings as any[])?.length
      ? (data.accountabilityRatings as any)
      : undefined,
  }
}
