/**
 * Ed-Fi Descriptor Constants
 *
 * Human-readable descriptor values aligned with Ed-Fi v5 StudentSchoolAssociation.
 * Values are stored as plain strings in enrollment records.
 * Ed-Fi URI form (e.g., uri://ed-fi.org/EntryTypeDescriptor#Next year school)
 * is computed only in the Ed-Fi sync/mapper layer.
 */

// ============================================================================
// ENTRY TYPE DESCRIPTOR
// ============================================================================

export const ENTRY_TYPE_OPTIONS = [
  { value: 'Next year school', label: 'Next Year School' },
  { value: 'Transfer from a public school in the same local education agency', label: 'Transfer (Same District)' },
  { value: 'Transfer from a public school in a different local education agency in the same state', label: 'Transfer (Different District)' },
  { value: 'Transfer from a private, non-religiously-affiliated school in the same state', label: 'Transfer (Private School)' },
  { value: 'Re-entry from the same school with no interruption of schooling', label: 'Re-entry (Same School)' },
  { value: 'Original entry into a United States school', label: 'Original Entry' },
  { value: 'Transfer from a school outside of the country', label: 'Transfer (International)' },
]

// ============================================================================
// RESIDENCY STATUS DESCRIPTOR
// ============================================================================

export const RESIDENCY_STATUS_OPTIONS = [
  { value: 'Resident of administrative unit and target school area', label: 'Resident — Admin Unit & School Area' },
  { value: 'Resident of administrative unit but not of target school area', label: 'Resident — Admin Unit Only' },
  { value: 'Resident of this state but not of this administrative unit or school area', label: 'Resident — State Only' },
  { value: 'Not a resident of this state', label: 'Not a Resident' },
]

// ============================================================================
// EXIT / WITHDRAW TYPE DESCRIPTOR
// ============================================================================

export const EXIT_WITHDRAW_TYPE_OPTIONS = [
  { value: 'Transferred to a public school in the same local education agency', label: 'Transferred (Same District)' },
  { value: 'Transferred to a public school in a different local education agency in the same state', label: 'Transferred (Different District)' },
  { value: 'Transferred to a private, non-religiously-affiliated school in the same state', label: 'Transferred (Private School)' },
  { value: 'Transferred to a school outside of the country', label: 'Transferred (International)' },
  { value: 'Graduated with regular, advanced, International Baccalaureate, or other type of diploma', label: 'Graduated' },
  { value: 'Died or is permanently incapacitated', label: 'Deceased / Incapacitated' },
  { value: 'Withdrawn due to illness', label: 'Illness' },
  { value: 'Expelled or involuntarily withdrawn', label: 'Expelled' },
  { value: 'Reached maximum age for services', label: 'Aged Out' },
  { value: 'Moved out of state', label: 'Moved Out of State' },
  { value: 'Other', label: 'Other' },
]

// ============================================================================
// ENROLLMENT TYPE DESCRIPTOR (Ed-Fi enrollmentTypeDescriptor)
// ============================================================================

export const ENROLLMENT_TYPE_DESCRIPTOR_MAP: Record<string, string> = {
  new: 'Current',
  transfer: 'Current',
  returning: 'Current',
  re_enrollment: 'Current',
}

// ============================================================================
// GRADE LEVEL DESCRIPTOR MAPPING
// internal grade value -> Ed-Fi human-readable descriptor
// ============================================================================

export const GRADE_LEVEL_DESCRIPTORS: Record<string, string> = {
  PK: 'Pre-Kindergarten',
  K: 'Kindergarten',
  '1': 'First grade',
  '2': 'Second grade',
  '3': 'Third grade',
  '4': 'Fourth grade',
  '5': 'Fifth grade',
  '6': 'Sixth grade',
  '7': 'Seventh grade',
  '8': 'Eighth grade',
  '9': 'Ninth grade',
  '10': 'Tenth grade',
  '11': 'Eleventh grade',
  '12': 'Twelfth grade',
}
