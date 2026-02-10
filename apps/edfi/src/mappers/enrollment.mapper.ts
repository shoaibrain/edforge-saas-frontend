/**
 * Ed-Fi Enrollment Mapper
 *
 * Maps EdForge enrollment records to/from Ed-Fi StudentSchoolAssociation resources.
 * Handles URI descriptor prefixing and field transformations.
 *
 * Ed-Fi v5 StudentSchoolAssociation reference:
 * https://docs.ed-fi.org/partners/certification/available-certifications/sis-v5/test-scenarios/student-school-association-scenarios/
 *
 * Sprint Alaska task AK-4.6
 */

// ============================================================================
// ED-FI DESCRIPTOR URI NAMESPACES
// ============================================================================

const DESCRIPTOR_NAMESPACES = {
  gradeLevelDescriptor: 'uri://ed-fi.org/GradeLevelDescriptor',
  entryTypeDescriptor: 'uri://ed-fi.org/EntryTypeDescriptor',
  enrollmentTypeDescriptor: 'uri://ed-fi.org/EnrollmentTypeDescriptor',
  exitWithdrawTypeDescriptor: 'uri://ed-fi.org/ExitWithdrawTypeDescriptor',
  residencyStatusDescriptor: 'uri://ed-fi.org/ResidencyStatusDescriptor',
} as const

// ============================================================================
// TYPES
// ============================================================================

/**
 * Ed-Fi StudentSchoolAssociation resource shape
 * (simplified — covers the most common fields)
 */
export interface StudentSchoolAssociationResource {
  id?: string
  schoolReference: {
    schoolId: number | string
  }
  studentReference: {
    studentUniqueId: string
  }
  entryDate: string
  entryGradeLevelDescriptor: string
  entryTypeDescriptor?: string
  enrollmentTypeDescriptor?: string
  exitWithdrawDate?: string
  exitWithdrawTypeDescriptor?: string
  residencyStatusDescriptor?: string
  primarySchool?: boolean
  fullTimeEquivalency?: number
  repeatGradeIndicator?: boolean
  calendarReference?: {
    calendarCode: string
    schoolId: number | string
    schoolYear: number
  }
}

/**
 * EdForge enrollment record shape (matches EnrollmentResponseDto)
 */
interface EdForgeEnrollment {
  enrollmentId: string
  studentId: string
  schoolId: string
  academicYearId: string
  gradeLevel: string
  enrollmentDate: string
  enrollmentType: string
  status: string
  withdrawalDate?: string
  // Ed-Fi fields
  entryGradeLevelDescriptor?: string
  entryTypeDescriptor?: string
  enrollmentTypeDescriptor?: string
  residencyStatusDescriptor?: string
  exitWithdrawTypeDescriptor?: string
  primarySchool?: boolean
  fullTimeEquivalency?: number
  repeatGradeIndicator?: boolean
  calendarCode?: string
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Convert a human-readable descriptor value to an Ed-Fi URI
 * e.g., ("First grade", "gradeLevelDescriptor") -> "uri://ed-fi.org/GradeLevelDescriptor#First grade"
 */
function toDescriptorUri(
  value: string | undefined,
  namespace: keyof typeof DESCRIPTOR_NAMESPACES
): string | undefined {
  if (!value) return undefined
  // If already a URI, return as-is
  if (value.startsWith('uri://')) return value
  return `${DESCRIPTOR_NAMESPACES[namespace]}#${value}`
}

/**
 * Extract the human-readable value from an Ed-Fi descriptor URI
 * e.g., "uri://ed-fi.org/GradeLevelDescriptor#First grade" -> "First grade"
 */
function fromDescriptorUri(uri: string | undefined): string | undefined {
  if (!uri) return undefined
  const hashIndex = uri.lastIndexOf('#')
  return hashIndex >= 0 ? uri.substring(hashIndex + 1) : uri
}

// ============================================================================
// MAPPERS
// ============================================================================

/**
 * Map an EdForge enrollment to an Ed-Fi StudentSchoolAssociation resource.
 *
 * Handles:
 * - Field name transformation (enrollmentDate -> entryDate, etc.)
 * - Descriptor URI prefixing
 * - Calendar reference construction
 */
export function toStudentSchoolAssociation(
  enrollment: EdForgeEnrollment,
  schoolYear?: number
): StudentSchoolAssociationResource {
  const resource: StudentSchoolAssociationResource = {
    schoolReference: {
      schoolId: enrollment.schoolId,
    },
    studentReference: {
      studentUniqueId: enrollment.studentId,
    },
    entryDate: enrollment.enrollmentDate,
    entryGradeLevelDescriptor: toDescriptorUri(
      enrollment.entryGradeLevelDescriptor || enrollment.gradeLevel,
      'gradeLevelDescriptor'
    ) || `${DESCRIPTOR_NAMESPACES.gradeLevelDescriptor}#${enrollment.gradeLevel}`,
    entryTypeDescriptor: toDescriptorUri(
      enrollment.entryTypeDescriptor,
      'entryTypeDescriptor'
    ),
    enrollmentTypeDescriptor: toDescriptorUri(
      enrollment.enrollmentTypeDescriptor,
      'enrollmentTypeDescriptor'
    ),
    residencyStatusDescriptor: toDescriptorUri(
      enrollment.residencyStatusDescriptor,
      'residencyStatusDescriptor'
    ),
    primarySchool: enrollment.primarySchool,
    fullTimeEquivalency: enrollment.fullTimeEquivalency,
    repeatGradeIndicator: enrollment.repeatGradeIndicator,
  }

  // Withdrawal fields
  if (enrollment.withdrawalDate) {
    resource.exitWithdrawDate = enrollment.withdrawalDate
    resource.exitWithdrawTypeDescriptor = toDescriptorUri(
      enrollment.exitWithdrawTypeDescriptor,
      'exitWithdrawTypeDescriptor'
    )
  }

  // Calendar reference
  if (enrollment.calendarCode && schoolYear) {
    resource.calendarReference = {
      calendarCode: enrollment.calendarCode,
      schoolId: enrollment.schoolId,
      schoolYear,
    }
  }

  return resource
}

/**
 * Map an Ed-Fi StudentSchoolAssociation resource back to EdForge enrollment fields.
 * Used for import/sync operations.
 */
export function fromStudentSchoolAssociation(
  resource: StudentSchoolAssociationResource
): Partial<EdForgeEnrollment> {
  return {
    studentId: resource.studentReference.studentUniqueId,
    schoolId: String(resource.schoolReference.schoolId),
    enrollmentDate: resource.entryDate,
    entryGradeLevelDescriptor: fromDescriptorUri(resource.entryGradeLevelDescriptor),
    entryTypeDescriptor: fromDescriptorUri(resource.entryTypeDescriptor),
    enrollmentTypeDescriptor: fromDescriptorUri(resource.enrollmentTypeDescriptor),
    residencyStatusDescriptor: fromDescriptorUri(resource.residencyStatusDescriptor),
    exitWithdrawTypeDescriptor: fromDescriptorUri(resource.exitWithdrawTypeDescriptor),
    primarySchool: resource.primarySchool,
    fullTimeEquivalency: resource.fullTimeEquivalency,
    repeatGradeIndicator: resource.repeatGradeIndicator,
    withdrawalDate: resource.exitWithdrawDate,
    calendarCode: resource.calendarReference?.calendarCode,
  }
}
