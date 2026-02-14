/**
 * Academics Service
 *
 * Service for student management with CRUD operations.
 * Uses types from @aibrains/shared-types (single source of truth).
 */

import axios from 'axios'
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api'

// ============================================================================
// TYPES - Import from @aibrains/shared-types
// ============================================================================

// Re-export types for convenience
export type {
  StudentResponseDto,
  StudentListResponseDto,
  StudentProfileResponseDto,
  StudentFilterDto,
  CreateStudentDto,
  UpdateStudentDto,
  StudentStatus,
  CreateEnrollmentDto,
  EnrollmentResponseDto,
  EnrollmentSummaryDto,
  WithdrawStudentDto,
  TransferStudentDto,
  EnrollmentStatus,
  EnrollmentType,
  CourseResponseDto,
  CourseListResponseDto,
  CourseFilterDto,
  CreateCourseDto,
  UpdateCourseDto,
  CourseSubjectArea,
  CourseType,
  CreditType,
  CourseDuration,
  SectionResponseDto,
  SectionListResponseDto,
  SectionFilterDto,
  CreateSectionDto,
  UpdateSectionDto,
  SectionRosterResponseDto,
  StudentSectionResponseDto,
  EnrollStudentInSectionDto,
  CourseOfferingResponseDto,
  CourseOfferingListResponseDto,
  CourseOfferingFilterDto,
  CreateCourseOfferingDto,
  UpdateCourseOfferingDto,
  ClassPeriodResponseDto,
  ClassPeriodListResponseDto,
  LocationResponseDto,
  LocationListResponseDto,
} from '@aibrains/shared-types'

// Import for internal use
import type {
  StudentResponseDto,
  StudentListResponseDto,
  StudentProfileResponseDto,
  StudentFilterDto,
  CreateStudentDto,
  UpdateStudentDto,
  CreateEnrollmentDto,
  EnrollmentResponseDto,
  CourseResponseDto,
  CourseListResponseDto,
  CourseFilterDto,
  CreateCourseDto,
  UpdateCourseDto,
  SectionResponseDto,
  SectionListResponseDto,
  SectionFilterDto,
  CreateSectionDto,
  UpdateSectionDto,
  SectionRosterResponseDto,
  CourseOfferingResponseDto,
  CourseOfferingListResponseDto,
  CourseOfferingFilterDto,
  CreateCourseOfferingDto,
  UpdateCourseOfferingDto,
  ClassPeriodListResponseDto,
  LocationListResponseDto,
} from '@aibrains/shared-types'

// ============================================================================
// API ERROR HANDLING
// ============================================================================

/**
 * Parsed API error with actionable information
 */
export interface ParsedApiError {
  message: string
  fieldErrors?: Record<string, string>
  isRetryable: boolean
  statusCode?: number
}

/**
 * Backend error response shape (Sprint Alaska ErrorResponseDto)
 *
 * errors[] → path is an array (e.g., ["guardians", 0, "phone"])
 * details.validationErrors[] → path is a dot-joined string (e.g., "guardians.0.phone")
 * errorCode → machine-readable: BAD_REQUEST, NOT_FOUND, CONFLICT, VALIDATION_ERROR, INTERNAL_SERVER_ERROR
 */
interface ApiErrorResponse {
  statusCode: number
  message: string | string[]
  error?: string
  errorCode?: string
  field?: string
  timestamp?: string
  requestId?: string
  path?: string
  errors?: Array<{ path: (string | number)[]; message: string; code?: string }>
  details?: {
    validationErrors?: Array<{ path: string; message: string; code?: string }>
  }
}

/**
 * Build a human-friendly label from a validation error path
 * e.g., ["contactInfo", "address", "zipCode"] -> "Contact Info > Address > Zip Code"
 */
function formatFieldPath(path: (string | number)[]): string {
  return path
    .filter((p) => typeof p === 'string')
    .map((p) =>
      String(p)
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (s) => s.toUpperCase())
        .trim()
    )
    .join(' > ')
}

/**
 * Parse API errors into a standardized format
 * Handles all HTTP status codes with appropriate messages
 * Supports Sprint Alaska ErrorResponseDto with errors[] and details.validationErrors[]
 */
export function parseApiError(error: unknown): ParsedApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const data = error.response?.data as ApiErrorResponse | undefined

    // Extract message (could be string or array)
    const getMessage = (msg: string | string[] | undefined): string => {
      if (Array.isArray(msg)) return msg[0] || 'Validation error'
      return msg || 'An error occurred'
    }

    // 400 - Bad Request / Validation error
    if (status === 400) {
      const fieldErrors: Record<string, string> = {}

      // Parse errors[] array (path is an array of segments)
      if (data?.errors && Array.isArray(data.errors)) {
        for (const err of data.errors) {
          const key = Array.isArray(err.path) ? err.path.join('.') : String(err.path)
          fieldErrors[key] = err.message
        }
      }
      // Fallback: parse details.validationErrors[] (path is a dot-joined string)
      else if (data?.details?.validationErrors && Array.isArray(data.details.validationErrors)) {
        for (const err of data.details.validationErrors) {
          fieldErrors[err.path] = err.message
        }
      }
      // Legacy: single field error
      else if (data?.field) {
        fieldErrors[data.field] = getMessage(data.message)
      }

      // Build user-friendly summary
      const errorCount = Object.keys(fieldErrors).length
      let message: string
      if (errorCount > 0) {
        const summaryParts = Object.entries(fieldErrors)
          .slice(0, 3)
          .map(([key, msg]) => {
            const pathParts = key.split('.')
            const label = formatFieldPath(pathParts.map((p) => (isNaN(Number(p)) ? p : Number(p))))
            return `${label}: ${msg}`
          })
        message = summaryParts.join('; ')
        if (errorCount > 3) message += ` (+${errorCount - 3} more)`
      } else {
        message = getMessage(data?.message)
      }

      return {
        message,
        fieldErrors: errorCount > 0 ? fieldErrors : undefined,
        isRetryable: false,
        statusCode: 400,
      }
    }

    // 403 - Forbidden (ABAC permission denied or API Gateway auth issue)
    if (status === 403) {
      return {
        message: 'You do not have permission to perform this action. This feature may not be available yet.',
        isRetryable: false,
        statusCode: 403,
      }
    }

    // 404 - Not Found (stale data or referenced entity missing)
    if (status === 404) {
      return {
        message: data?.message
          ? getMessage(data.message)
          : 'The requested record was not found. It may have been removed.',
        isRetryable: false,
        statusCode: 404,
      }
    }

    // 409 - Conflict (duplicate enrollment, student already enrolled)
    if (status === 409) {
      return {
        message: data?.message
          ? getMessage(data.message)
          : 'A record with this identifier already exists.',
        isRetryable: false,
        statusCode: 409,
      }
    }

    // 429 - Too Many Requests (rate limit)
    if (status === 429) {
      return {
        message: 'Too many requests. Please wait a moment and try again.',
        isRetryable: true,
        statusCode: 429,
      }
    }

    // 5xx - Server errors
    if (status && status >= 500) {
      return {
        message: 'Something went wrong on our end. Please try again.',
        isRetryable: true,
        statusCode: status,
      }
    }

    // Network timeout
    if (error.code === 'ECONNABORTED') {
      return {
        message: 'Request timed out. Please check your connection.',
        isRetryable: true,
      }
    }

    // No response (network error)
    if (!error.response) {
      return {
        message: 'Unable to connect. Please check your internet connection.',
        isRetryable: true,
      }
    }

    // Generic axios error
    return {
      message: getMessage(data?.message) || error.message || 'An error occurred',
      isRetryable: false,
      statusCode: status,
    }
  }

  // Non-axios error
  if (error instanceof Error) {
    return {
      message: error.message,
      isRetryable: false,
    }
  }

  return {
    message: 'An unexpected error occurred',
    isRetryable: false,
  }
}

// ============================================================================
// PAGINATION QUERY TYPE
// ============================================================================

export interface PaginationQuery {
  limit?: number
  cursor?: string
}

// ============================================================================
// STUDENT CRUD OPERATIONS
// ============================================================================

/**
 * List students with optional filters and pagination
 * GET /academics/students
 */
export async function getStudents(
  params: StudentFilterDto & PaginationQuery
): Promise<StudentListResponseDto> {
  // Build query params, filtering out undefined values
  const queryParams: Record<string, unknown> = {}

  if (params.schoolId) queryParams.schoolId = params.schoolId
  if (params.gradeLevel) queryParams.gradeLevel = params.gradeLevel
  if (params.status) queryParams.status = params.status
  if (params.searchTerm) queryParams.search = params.searchTerm
  if (params.hasIEP !== undefined) queryParams.hasIEP = params.hasIEP
  if (params.has504Plan !== undefined) queryParams.has504Plan = params.has504Plan
  if (params.limit) queryParams.limit = params.limit
  if (params.cursor) queryParams.cursor = params.cursor

  return apiGet<StudentListResponseDto>('/academics/students', queryParams)
}

/**
 * Get student by ID
 * GET /academics/students/:id
 */
export async function getStudent(studentId: string): Promise<StudentResponseDto> {
  return apiGet<StudentResponseDto>(`/academics/students/${studentId}`)
}

/**
 * Get student profile (extended with enrollment history, attendance, etc.)
 * 
 * Note: Currently uses the same endpoint as getStudent since the backend
 * doesn't have a dedicated /profile endpoint. The StudentProfileResponseDto
 * extends StudentResponseDto, so this works - additional fields like
 * enrollmentHistory, attendanceSummary will be undefined until the backend
 * implements them.
 * 
 * GET /academics/students/:id
 */
export async function getStudentProfile(studentId: string): Promise<StudentProfileResponseDto> {
  // Use the base student endpoint - profile data will be added when backend supports it
  return apiGet<StudentProfileResponseDto>(`/academics/students/${studentId}`)
}

/**
 * Update student
 * PATCH /academics/students/:id
 */
export async function updateStudent(
  studentId: string,
  data: UpdateStudentDto
): Promise<StudentResponseDto> {
  return apiPatch<StudentResponseDto>(`/academics/students/${studentId}`, data)
}

/**
 * Create a new student
 * POST /academics/students
 */
export async function createStudent(
  data: CreateStudentDto
): Promise<StudentResponseDto> {
  return apiPost<StudentResponseDto>('/academics/students', data)
}

/**
 * Delete student
 * DELETE /academics/students/:id
 */
export async function deleteStudent(studentId: string): Promise<void> {
  return apiDelete(`/academics/students/${studentId}`)
}

// ============================================================================
// STUDENT DE-DUPLICATION (Sprint 4)
// ============================================================================

export interface DuplicateMatch {
  studentId: string
  firstName: string
  lastName: string
  dateOfBirth: string
  currentGradeLevel?: string
  status?: string
  confidence: 'high' | 'medium' | 'low'
  matchReasons: string[]
}

export interface DuplicateCheckResult {
  hasDuplicates: boolean
  matches: DuplicateMatch[]
}

export interface DuplicateCheckParams {
  firstName: string
  lastName: string
  dateOfBirth: string
  schoolId: string
}

/**
 * Check for potential duplicate students (detailed, POST)
 * POST /academics/students/check-duplicate
 */
export async function checkDuplicateStudents(
  data: DuplicateCheckParams
): Promise<DuplicateCheckResult> {
  return apiPost<DuplicateCheckResult>('/academics/students/check-duplicate', data)
}

// ============================================================================
// CSV STUDENT IMPORT (Sprint 4)
// ============================================================================

export interface CsvImportResult {
  imported: number
  skipped: number
  errors: Array<{ row: number; field: string; message: string }>
  duplicates: Array<{ row: number; matches: DuplicateMatch[] }>
}

/**
 * Bulk import students from CSV data
 * POST /academics/students/import
 */
export async function importStudentsCsv(
  data: { students: Record<string, unknown>[]; schoolId: string }
): Promise<CsvImportResult> {
  return apiPost<CsvImportResult>('/academics/students/import', data)
}

// ============================================================================
// ENROLLMENT OPERATIONS
// ============================================================================

/**
 * Create a new enrollment
 * POST /academics/enrollments
 */
export async function createEnrollment(
  data: CreateEnrollmentDto
): Promise<EnrollmentResponseDto> {
  return apiPost<EnrollmentResponseDto>('/academics/enrollments', data)
}

// ============================================================================
// COURSE CRUD OPERATIONS
// ============================================================================

/**
 * List courses with optional filters and pagination
 * GET /academics/courses
 */
export async function getCourses(
  params: CourseFilterDto & PaginationQuery
): Promise<CourseListResponseDto> {
  const queryParams: Record<string, unknown> = {}

  if (params.schoolId) queryParams.schoolId = params.schoolId
  if (params.subjectArea) queryParams.subjectArea = params.subjectArea
  if (params.courseType) queryParams.courseType = params.courseType
  if (params.creditType) queryParams.creditType = params.creditType
  if (params.gradeLevel) queryParams.gradeLevel = params.gradeLevel
  if (params.departmentId) queryParams.departmentId = params.departmentId
  if (params.academicYearId) queryParams.academicYearId = params.academicYearId
  if (params.isActive !== undefined) queryParams.isActive = params.isActive
  if (params.searchTerm) queryParams.search = params.searchTerm
  if (params.limit) queryParams.limit = params.limit
  if (params.cursor) queryParams.cursor = params.cursor

  return apiGet<CourseListResponseDto>('/academics/courses', queryParams)
}

/**
 * Get course by ID
 * GET /academics/courses/:id?schoolId=
 */
export async function getCourse(
  courseId: string,
  schoolId: string
): Promise<CourseResponseDto> {
  return apiGet<CourseResponseDto>(`/academics/courses/${courseId}`, { schoolId })
}

/**
 * Create a new course
 * POST /academics/courses
 */
export async function createCourse(
  data: CreateCourseDto
): Promise<CourseResponseDto> {
  return apiPost<CourseResponseDto>('/academics/courses', data)
}

/**
 * Update course
 * PATCH /academics/courses/:id?schoolId=
 */
export async function updateCourse(
  courseId: string,
  schoolId: string,
  data: UpdateCourseDto
): Promise<CourseResponseDto> {
  return apiPatch<CourseResponseDto>(`/academics/courses/${courseId}?schoolId=${schoolId}`, data)
}

/**
 * Delete (deactivate) course
 * DELETE /academics/courses/:id?schoolId=
 */
export async function deleteCourse(
  courseId: string,
  schoolId: string
): Promise<void> {
  return apiDelete(`/academics/courses/${courseId}?schoolId=${schoolId}`)
}

// ============================================================================
// SECTION CRUD OPERATIONS
// ============================================================================

/**
 * List sections with optional filters and pagination
 * GET /academics/sections
 */
export async function getSections(
  params: SectionFilterDto & PaginationQuery
): Promise<SectionListResponseDto> {
  const queryParams: Record<string, unknown> = {}

  if (params.schoolId) queryParams.schoolId = params.schoolId
  if (params.courseId) queryParams.courseId = params.courseId
  if (params.academicYearId) queryParams.academicYearId = params.academicYearId
  if (params.termId) queryParams.termId = params.termId
  if (params.teacherId) queryParams.teacherId = params.teacherId
  if (params.isActive !== undefined) queryParams.isActive = params.isActive
  if (params.searchTerm) queryParams.search = params.searchTerm
  if (params.limit) queryParams.limit = params.limit
  if (params.cursor) queryParams.cursor = params.cursor

  return apiGet<SectionListResponseDto>('/academics/sections', queryParams)
}

/**
 * Get section by ID
 * GET /academics/sections/:id?schoolId=
 */
export async function getSection(
  sectionId: string,
  schoolId: string
): Promise<SectionResponseDto> {
  return apiGet<SectionResponseDto>(`/academics/sections/${sectionId}`, { schoolId })
}

/**
 * Create a new section
 * POST /academics/sections
 */
export async function createSection(
  data: CreateSectionDto
): Promise<SectionResponseDto> {
  return apiPost<SectionResponseDto>('/academics/sections', data)
}

/**
 * Update section
 * PATCH /academics/sections/:id?schoolId=
 */
export async function updateSection(
  sectionId: string,
  schoolId: string,
  data: UpdateSectionDto
): Promise<SectionResponseDto> {
  return apiPatch<SectionResponseDto>(
    `/academics/sections/${sectionId}?schoolId=${schoolId}`,
    data
  )
}

/**
 * Delete (deactivate) section
 * DELETE /academics/sections/:id?schoolId=
 */
export async function deleteSection(
  sectionId: string,
  schoolId: string
): Promise<void> {
  return apiDelete(`/academics/sections/${sectionId}?schoolId=${schoolId}`)
}

// ============================================================================
// SECTION ROSTER OPERATIONS
// ============================================================================

/**
 * Get section roster (enrolled students)
 * GET /academics/sections/:id/students?schoolId=
 */
export async function getSectionRoster(
  sectionId: string,
  schoolId: string
): Promise<SectionRosterResponseDto> {
  return apiGet<SectionRosterResponseDto>(
    `/academics/sections/${sectionId}/students`,
    { schoolId }
  )
}

/**
 * Enroll a student in a section
 * POST /academics/sections/:id/students?schoolId=
 */
export async function enrollStudentInSection(
  sectionId: string,
  schoolId: string,
  studentId: string
): Promise<void> {
  return apiPost(`/academics/sections/${sectionId}/students?schoolId=${schoolId}`, {
    studentId,
  })
}

/**
 * Remove a student from a section
 * DELETE /academics/sections/:id/students/:studentId?schoolId=
 */
export async function removeStudentFromSection(
  sectionId: string,
  schoolId: string,
  studentId: string
): Promise<void> {
  return apiDelete(
    `/academics/sections/${sectionId}/students/${studentId}?schoolId=${schoolId}`
  )
}

// ============================================================================
// ATTENDANCE OPERATIONS
// ============================================================================

/**
 * Attendance types used by the service layer.
 * These match the backend API contract from FRONTEND_API_STATUS_RESPONSE.md.
 */
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'half_day' | 'early_departure' | 'remote'

export interface CreateAttendanceParams {
  studentId: string
  schoolId: string
  date: string
  status: AttendanceStatus
  notes?: string
  sectionId?: string
  academicYearId?: string
}

export interface BulkAttendanceRecord {
  studentId: string
  status: AttendanceStatus
  notes?: string
}

export interface BulkAttendanceParams {
  date: string
  schoolId: string
  sectionId?: string
  records: BulkAttendanceRecord[]
}

export interface AttendanceRecord {
  studentId: string
  studentName?: string
  studentNumber?: string
  date: string
  status: AttendanceStatus
  notes?: string
  sectionId?: string
  createdAt?: string
  updatedAt?: string
}

export interface BulkAttendanceResponse {
  recorded: number
  errors: Array<{ studentId: string; error: string }>
}

export interface DailyAttendanceSummary {
  date: string
  schoolId: string
  totalStudents: number
  present: number
  absent: number
  late: number
  excused: number
  halfDay: number
  attendanceRate: number
  byGradeLevel?: Record<string, {
    total: number
    present: number
    absent: number
    rate: number
  }>
}

export interface StudentAttendanceSummary {
  studentId: string
  studentName: string
  totalDays: number
  present: number
  absent: number
  late: number
  excused: number
  halfDay: number
  attendanceRate: number
  dateRange: { start: string; end: string }
}

/**
 * Record a single attendance entry
 * POST /academics/attendance
 */
export async function recordAttendance(
  data: CreateAttendanceParams
): Promise<AttendanceRecord> {
  return apiPost<AttendanceRecord>('/academics/attendance', data)
}

/**
 * Record bulk attendance for a classroom
 * POST /academics/attendance/bulk
 */
export async function recordBulkAttendance(
  data: BulkAttendanceParams
): Promise<BulkAttendanceResponse> {
  return apiPost<BulkAttendanceResponse>('/academics/attendance/bulk', data)
}

/**
 * Get daily attendance summary for a school
 * GET /academics/attendance/summary?schoolId=&date=
 */
export async function getAttendanceSummary(
  schoolId: string,
  date: string
): Promise<DailyAttendanceSummary> {
  return apiGet<DailyAttendanceSummary>('/academics/attendance/summary', {
    schoolId,
    date,
  })
}

/**
 * Get student attendance history
 * GET /academics/attendance/student/:id?startDate=&endDate=
 */
export async function getStudentAttendance(
  studentId: string,
  params?: { startDate?: string; endDate?: string }
): Promise<AttendanceRecord[]> {
  const queryParams: Record<string, unknown> = {}
  if (params?.startDate) queryParams.startDate = params.startDate
  if (params?.endDate) queryParams.endDate = params.endDate
  return apiGet<AttendanceRecord[]>(`/academics/attendance/student/${studentId}`, queryParams)
}

/**
 * Get student attendance summary (rate + counts)
 * GET /academics/attendance/student/:id/summary
 */
export async function getStudentAttendanceSummary(
  studentId: string
): Promise<StudentAttendanceSummary> {
  return apiGet<StudentAttendanceSummary>(`/academics/attendance/student/${studentId}/summary`)
}

/**
 * Update/correct an attendance record
 * PATCH /academics/attendance/:date/:studentId
 */
export async function updateAttendance(
  date: string,
  studentId: string,
  data: { status: AttendanceStatus; notes?: string }
): Promise<AttendanceRecord> {
  return apiPatch<AttendanceRecord>(`/academics/attendance/${date}/${studentId}`, data)
}

// ============================================================================
// ENROLLMENT MANAGEMENT OPERATIONS
// ============================================================================

export interface EnrollmentFilterParams {
  gradeLevel?: string
  status?: string
  limit?: number
  cursor?: string
}

export interface EnrollmentListResponse {
  items: EnrollmentResponseDto[]
  hasMore: boolean
  lastEvaluatedKey?: string
  total?: number
}

export interface EnrollmentSummaryResponse {
  totalEnrolled: number
  byGradeLevel: Record<string, number>
  byStatus: Record<string, number>
}

/**
 * Withdrawal params aligned with shared-types WithdrawStudentDto
 */
export interface WithdrawStudentParams {
  withdrawalDate: string
  reason: string
  notes?: string
  lastDayAttended?: string
  exitCode?: string
  exitWithdrawTypeDescriptor?: string
}

/**
 * Transfer params aligned with shared-types TransferStudentDto
 */
export interface TransferStudentParams {
  newSchoolId: string
  effectiveDate: string
  transferReason?: string
  notes?: string
  newGradeLevel?: string
  sendRecords?: boolean
}

/**
 * List enrollments for a school year
 * GET /academics/schools/:schoolId/years/:yearId/enrollments
 */
export async function getEnrollments(
  schoolId: string,
  yearId: string,
  params?: EnrollmentFilterParams
): Promise<EnrollmentListResponse> {
  const queryParams: Record<string, unknown> = {}
  if (params?.gradeLevel) queryParams.gradeLevel = params.gradeLevel
  if (params?.status) queryParams.status = params.status
  if (params?.limit) queryParams.limit = params.limit
  if (params?.cursor) queryParams.cursor = params.cursor
  return apiGet<EnrollmentListResponse>(
    `/academics/schools/${schoolId}/years/${yearId}/enrollments`,
    queryParams
  )
}

/**
 * Get enrollment summary for a school year
 * GET /academics/schools/:schoolId/years/:yearId/enrollments/summary
 */
export async function getEnrollmentSummary(
  schoolId: string,
  yearId: string
): Promise<EnrollmentSummaryResponse> {
  return apiGet<EnrollmentSummaryResponse>(
    `/academics/schools/${schoolId}/years/${yearId}/enrollments/summary`
  )
}

/**
 * Withdraw a student from enrollment
 * POST /academics/schools/:schoolId/years/:yearId/enrollments/:studentId/withdraw
 */
export async function withdrawStudent(
  schoolId: string,
  yearId: string,
  studentId: string,
  data: WithdrawStudentParams
): Promise<void> {
  return apiPost(
    `/academics/schools/${schoolId}/years/${yearId}/enrollments/${studentId}/withdraw`,
    data
  )
}

/**
 * Transfer a student to another school
 * POST /academics/schools/:schoolId/years/:yearId/enrollments/:studentId/transfer
 */
export async function transferStudent(
  schoolId: string,
  yearId: string,
  studentId: string,
  data: TransferStudentParams
): Promise<void> {
  return apiPost(
    `/academics/schools/${schoolId}/years/${yearId}/enrollments/${studentId}/transfer`,
    data
  )
}

// ============================================================================
// GRADING POLICY OPERATIONS
// ============================================================================

export interface GradingScaleEntry {
  letter: string
  minPercentage: number
  maxPercentage: number
  gpaValue?: number
}

export interface CategoryWeight {
  categoryId: string
  name: string
  weight: number
  dropLowest?: number
}

export interface GradingPolicyResponse {
  policyId: string
  schoolId: string
  name: string
  gradingScale: GradingScaleEntry[]
  categoryWeights: CategoryWeight[]
  roundingRule: 'standard' | 'up' | 'down'
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateGradingPolicyParams {
  schoolId: string
  name: string
  gradingScale: GradingScaleEntry[]
  categoryWeights: CategoryWeight[]
  roundingRule: 'standard' | 'up' | 'down'
  isDefault?: boolean
}

export interface UpdateGradingPolicyParams {
  name?: string
  gradingScale?: GradingScaleEntry[]
  categoryWeights?: CategoryWeight[]
  roundingRule?: 'standard' | 'up' | 'down'
  isDefault?: boolean
}

/**
 * List grading policies for a school
 * GET /academics/grading-policies?schoolId=
 */
export async function getGradingPolicies(
  schoolId: string
): Promise<GradingPolicyResponse[]> {
  const result = await apiGet<GradingPolicyResponse[] | { items: GradingPolicyResponse[] }>(
    '/academics/grading-policies',
    { schoolId }
  )
  return Array.isArray(result) ? result : result.items
}

/**
 * Get a single grading policy
 * GET /academics/grading-policies/:id?schoolId=
 */
export async function getGradingPolicy(
  policyId: string,
  schoolId: string
): Promise<GradingPolicyResponse> {
  return apiGet<GradingPolicyResponse>(`/academics/grading-policies/${policyId}`, { schoolId })
}

/**
 * Create a grading policy
 * POST /academics/grading-policies
 */
export async function createGradingPolicy(
  data: CreateGradingPolicyParams
): Promise<GradingPolicyResponse> {
  return apiPost<GradingPolicyResponse>('/academics/grading-policies', data)
}

/**
 * Update a grading policy
 * PATCH /academics/grading-policies/:id?schoolId=
 */
export async function updateGradingPolicy(
  policyId: string,
  schoolId: string,
  data: UpdateGradingPolicyParams
): Promise<GradingPolicyResponse> {
  return apiPatch<GradingPolicyResponse>(
    `/academics/grading-policies/${policyId}?schoolId=${schoolId}`,
    data
  )
}

// ============================================================================
// GRADE OPERATIONS
// ============================================================================

export interface AssignmentInfo {
  assignmentName: string
  assignmentType: string
  categoryId: string
  possiblePoints: number
}

export interface RecordGradeParams {
  studentId: string
  courseId: string
  sectionId: string
  schoolId: string
  termId: string
  academicYearId: string
  teacherId: string
  assignment: AssignmentInfo
  earnedPoints: number
}

export interface BulkGradeRecord {
  studentId: string
  earnedPoints: number
}

export interface RecordBulkGradesParams {
  courseId: string
  sectionId: string
  schoolId: string
  termId: string
  academicYearId: string
  teacherId: string
  assignment: AssignmentInfo
  grades: BulkGradeRecord[]
}

export interface GradeRecord {
  gradeId: string
  studentId: string
  studentName?: string
  courseId: string
  sectionId?: string
  termId: string
  assignments: Array<{
    assignmentName: string
    assignmentType: string
    categoryId: string
    possiblePoints: number
    earnedPoints: number
    gradedAt: string
  }>
  numericGrade: number
  letterGrade: string
  gpaPoints: number
  isFinal: boolean
  createdAt: string
  updatedAt: string
}

export interface SectionGradebookResponse {
  sectionId: string
  termId: string
  grades: GradeRecord[]
}

export interface StudentGradesResponse {
  studentId: string
  grades: GradeRecord[]
  gpa?: {
    termGpa: number
    cumulativeGpa: number
    weightedGpa: number
  }
}

/**
 * Record a single assignment grade
 * POST /academics/grades/record
 */
export async function recordGrade(
  data: RecordGradeParams
): Promise<void> {
  return apiPost('/academics/grades/record', data)
}

/**
 * Record bulk grades for a section/assignment
 * POST /academics/grades/record/bulk
 */
export async function recordBulkGrades(
  data: RecordBulkGradesParams
): Promise<{ recorded: number; errors: Array<{ studentId: string; error: string }> }> {
  return apiPost('/academics/grades/record/bulk', data)
}

/**
 * Get section gradebook (all students' grades)
 * GET /academics/grades/section/:sectionId?schoolId=&termId=
 */
export async function getSectionGrades(
  sectionId: string,
  params: { schoolId: string; termId?: string }
): Promise<SectionGradebookResponse> {
  return apiGet<SectionGradebookResponse>(`/academics/grades/section/${sectionId}`, params)
}

/**
 * Get student's grades
 * GET /academics/students/:id/grades?academicYearId=&termId=
 */
export async function getStudentGrades(
  studentId: string,
  params?: { academicYearId?: string; termId?: string }
): Promise<StudentGradesResponse> {
  return apiGet<StudentGradesResponse>(`/academics/students/${studentId}/grades`, params)
}

/**
 * Finalize a grade (lock it)
 * PATCH /academics/grades/:gradeId/finalize
 */
export async function finalizeGrade(gradeId: string): Promise<void> {
  return apiPatch(`/academics/grades/${gradeId}/finalize`, {})
}

/**
 * Bulk-finalize all grades for a section in a term
 * POST /academics/grades/finalize/bulk
 */
export interface BulkFinalizeParams {
  sectionId: string
  termId: string
  schoolId: string
}

export interface BulkFinalizeResponse {
  finalized: number
  alreadyFinalized: number
  errors: Array<{ studentId: string; courseId: string; error: string }>
}

export async function bulkFinalizeGrades(
  data: BulkFinalizeParams
): Promise<BulkFinalizeResponse> {
  return apiPost<BulkFinalizeResponse>('/academics/grades/finalize/bulk', data)
}

// ============================================================================
// COURSE OFFERING CRUD OPERATIONS (Sprint 3)
// ============================================================================

/**
 * List course offerings with optional filters
 * GET /academics/course-offerings
 */
export async function getCourseOfferings(
  params: CourseOfferingFilterDto & PaginationQuery
): Promise<CourseOfferingListResponseDto> {
  const queryParams: Record<string, unknown> = {}

  if (params.schoolId) queryParams.schoolId = params.schoolId
  if (params.courseId) queryParams.courseId = params.courseId
  if (params.academicSessionId) queryParams.academicSessionId = params.academicSessionId
  if (params.limit) queryParams.limit = params.limit
  if (params.cursor) queryParams.cursor = params.cursor

  return apiGet<CourseOfferingListResponseDto>('/academics/course-offerings', queryParams)
}

/**
 * Get course offering by ID
 * GET /academics/course-offerings/:id?schoolId=
 */
export async function getCourseOffering(
  courseOfferingId: string,
  schoolId: string
): Promise<CourseOfferingResponseDto> {
  return apiGet<CourseOfferingResponseDto>(
    `/academics/course-offerings/${courseOfferingId}`,
    { schoolId }
  )
}

/**
 * Create a new course offering
 * POST /academics/course-offerings
 */
export async function createCourseOffering(
  data: CreateCourseOfferingDto
): Promise<CourseOfferingResponseDto> {
  return apiPost<CourseOfferingResponseDto>('/academics/course-offerings', data)
}

/**
 * Update course offering
 * PATCH /academics/course-offerings/:id?schoolId=
 */
export async function updateCourseOffering(
  courseOfferingId: string,
  schoolId: string,
  data: UpdateCourseOfferingDto
): Promise<CourseOfferingResponseDto> {
  return apiPatch<CourseOfferingResponseDto>(
    `/academics/course-offerings/${courseOfferingId}?schoolId=${schoolId}`,
    data
  )
}

/**
 * Delete course offering
 * DELETE /academics/course-offerings/:id?schoolId=
 */
export async function deleteCourseOffering(
  courseOfferingId: string,
  schoolId: string
): Promise<void> {
  return apiDelete(`/academics/course-offerings/${courseOfferingId}?schoolId=${schoolId}`)
}

// ============================================================================
// CROSS-SERVICE: IDENTITY CLASS PERIODS & LOCATIONS (Sprint 3)
// ============================================================================

/**
 * List class periods for a school (Identity service via API Gateway)
 * GET /schools/:schoolId/class-periods
 */
export async function getClassPeriods(
  schoolId: string
): Promise<ClassPeriodListResponseDto> {
  return apiGet<ClassPeriodListResponseDto>(`/schools/${schoolId}/class-periods`)
}

/**
 * List locations/rooms for a school (Identity service via API Gateway)
 * GET /schools/:schoolId/locations
 */
export async function getLocations(
  schoolId: string
): Promise<LocationListResponseDto> {
  return apiGet<LocationListResponseDto>(`/schools/${schoolId}/locations`)
}

// ============================================================================
// CALENDAR DATE CHECK (Sprint 5)
// ============================================================================

export interface CalendarDateInfo {
  calendarDateId: string
  schoolId: string
  date: string
  calendarEventType: string  // 'instructional' | 'holiday' | 'teacher_workday' etc.
  description?: string
}

/**
 * Check calendar date for attendance validation
 * GET /schools/:schoolId/calendar-dates/:date
 * Returns null if the date is not found (404)
 */
export async function getCalendarDate(
  schoolId: string,
  date: string
): Promise<CalendarDateInfo | null> {
  try {
    return await apiGet<CalendarDateInfo>(
      `/schools/${schoolId}/calendar-dates/${date}`
    )
  } catch (error: any) {
    if (error.response?.status === 404) return null
    throw error
  }
}

// ============================================================================
// ATTENDANCE TREND (Sprint 5)
// ============================================================================

/**
 * Get attendance trend data (for line chart)
 * GET /academics/attendance/trend?schoolId=&startDate=&endDate=
 */
export async function getAttendanceTrend(
  schoolId: string,
  startDate: string,
  endDate: string,
): Promise<DailyAttendanceSummary[]> {
  return apiGet<DailyAttendanceSummary[]>('/academics/attendance/trend', {
    schoolId,
    startDate,
    endDate,
  })
}

// ============================================================================
// ATTENDANCE ALERTS (Sprint 5)
// ============================================================================

export interface AttendanceAlert {
  studentId: string
  studentName: string
  attendanceRate: number
  totalDays: number
  absentDays: number
}

/**
 * Get students with attendance below threshold
 * GET /academics/attendance/alerts?schoolId=&academicYearId=&threshold=&startDate=&endDate=
 */
export async function getAttendanceAlerts(
  schoolId: string,
  academicYearId: string,
  threshold: number = 90,
  startDate: string,
  endDate: string,
): Promise<AttendanceAlert[]> {
  return apiGet<AttendanceAlert[]>('/academics/attendance/alerts', {
    schoolId,
    academicYearId,
    threshold,
    startDate,
    endDate,
  })
}

// ============================================================================
// EXPORTED SERVICE OBJECT
// ============================================================================

export const academicsService = {
  // Student CRUD
  getStudents,
  getStudent,
  getStudentProfile,
  createStudent,
  updateStudent,
  deleteStudent,
  // Enrollment
  createEnrollment,
  getEnrollments,
  getEnrollmentSummary,
  withdrawStudent,
  transferStudent,
  // Course CRUD
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  // Section CRUD
  getSections,
  getSection,
  createSection,
  updateSection,
  deleteSection,
  // Section Roster
  getSectionRoster,
  enrollStudentInSection,
  removeStudentFromSection,
  // Course Offerings
  getCourseOfferings,
  getCourseOffering,
  createCourseOffering,
  updateCourseOffering,
  deleteCourseOffering,
  // De-duplication (Sprint 4)
  checkDuplicateStudents,
  // CSV Import (Sprint 4)
  importStudentsCsv,
  // Cross-service (Identity)
  getClassPeriods,
  getLocations,
  // Attendance
  recordAttendance,
  recordBulkAttendance,
  getAttendanceSummary,
  getStudentAttendance,
  getStudentAttendanceSummary,
  updateAttendance,
  // Grading Policies
  getGradingPolicies,
  getGradingPolicy,
  createGradingPolicy,
  updateGradingPolicy,
  // Grades
  recordGrade,
  recordBulkGrades,
  getSectionGrades,
  getStudentGrades,
  finalizeGrade,
  // Calendar Date (Sprint 5)
  getCalendarDate,
  // Attendance Trend & Alerts (Sprint 5)
  getAttendanceTrend,
  getAttendanceAlerts,
}
