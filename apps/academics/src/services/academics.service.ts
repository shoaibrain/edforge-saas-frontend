/**
 * Academics Service
 *
 * Service for student management with CRUD operations.
 * Uses types from @aibrains/shared-types (single source of truth).
 */

import axios from 'axios'
import { api, apiGet, apiPost, apiPatch, apiDelete } from '../lib/api'

// ============================================================================
// DEBUG INSTRUMENTATION
// ============================================================================

const DEBUG = typeof localStorage !== 'undefined' && localStorage.getItem('edforge-debug') === 'true';

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
  ClassworkItemResponseDto,
  ClassworkTopicResponseDto,
  SectionClassworkResponseDto,
  CreateClassworkItemDto,
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
  ClassworkItemResponseDto,
  ClassworkTopicResponseDto,
  SectionClassworkResponseDto,
  CreateClassworkItemDto,
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
// DASHBOARD OVERVIEW (Unified endpoint)
// ============================================================================

export interface DashboardEnrollmentSummary {
  totalEnrolled: number
  byGradeLevel: Record<string, number>
  byStatus: Record<string, number>
  recentEnrollments: number
  recentWithdrawals: number
}

export interface DashboardAttendanceSummary {
  date: string
  totalStudents: number
  totalRecorded: number
  present: number
  absent: number
  late: number
  excused: number
  halfDay: number
  remote: number
  attendanceRate: number
}

export interface DashboardOverviewResponse {
  schoolId: string
  academicYearId: string
  date: string
  enrollment: DashboardEnrollmentSummary
  activeSectionsCount: number
  attendance: DashboardAttendanceSummary | null
  _cached: boolean
}

/**
 * Get unified dashboard overview (enrollment + sections + attendance)
 * GET /academics/dashboard/overview
 */
export async function getDashboardOverview(
  schoolId: string,
  academicYearId: string,
  date: string,
): Promise<DashboardOverviewResponse> {
  if (DEBUG) console.debug('[Academics Service] getDashboardOverview', { schoolId, academicYearId, date })
  return apiGet<DashboardOverviewResponse>('/academics/dashboard/overview', {
    schoolId, academicYearId, date,
  })
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
  if (DEBUG) console.debug('[Academics Service] getStudents', {
    schoolId: params.schoolId,
    gradeLevel: params.gradeLevel,
    hasSearch: !!params.searchTerm,
  })
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
 * GET /academics/students/:id?schoolId=
 */
export async function getStudent(studentId: string, schoolId?: string): Promise<StudentResponseDto> {
  const params: Record<string, unknown> = {}
  if (schoolId) params.schoolId = schoolId
  return apiGet<StudentResponseDto>(`/academics/students/${studentId}`, params)
}

/**
 * Get student profile (extended with enrollment history, attendance, classrooms)
 *
 * GET /academics/students/:id/profile
 */
export async function getStudentProfile(studentId: string, schoolId?: string): Promise<StudentProfileResponseDto> {
  const params: Record<string, unknown> = {}
  if (schoolId) params.schoolId = schoolId
  return apiGet<StudentProfileResponseDto>(`/academics/students/${studentId}/profile`, params)
}

/**
 * Update student
 * PATCH /academics/students/:id?schoolId=
 */
export async function updateStudent(
  studentId: string,
  data: UpdateStudentDto,
  schoolId?: string,
): Promise<StudentResponseDto> {
  const url = schoolId
    ? `/academics/students/${studentId}?schoolId=${schoolId}`
    : `/academics/students/${studentId}`
  return apiPatch<StudentResponseDto>(url, data)
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
 * DELETE /academics/students/:id?schoolId=
 */
export async function deleteStudent(studentId: string, schoolId?: string): Promise<void> {
  const url = schoolId
    ? `/academics/students/${studentId}?schoolId=${schoolId}`
    : `/academics/students/${studentId}`
  return apiDelete(url)
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
// IEMIS BULK IMPORT (PABSON — Nepal government EMIS export)
// Phase 3.1 / Saraswati pilot. Paired with backend endpoint
// `POST /academics/students/import/iemis` (students.controller.ts#importStudentsIemis)
// ============================================================================

import type {
  IemisImportRequest,
  IemisImportResult,
} from '../components/students/iemis/iemis-import.types'

/**
 * Import students from an IEMIS xlsx export. Supports a mandatory dry-run
 * phase (caller passes `dryRun: true` first, then `false` to commit).
 *
 * Uses `api.post` directly (not `apiPost`) so we can bump the timeout.
 * The default 30s is too tight: committing 779 rows against a cold DDB
 * warm-up (first invocation after low-traffic period) has been observed
 * to take 45-60s end-to-end. 120s gives comfortable headroom.
 */
export async function importStudentsIemis(
  data: IemisImportRequest,
): Promise<IemisImportResult> {
  const response = await api.post<IemisImportResult>(
    '/academics/students/import/iemis',
    data,
    { timeout: 120_000 },
  )
  return response.data
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
  if (DEBUG) console.debug('[Academics Service] createEnrollment', {
    schoolId: (data as any).schoolId,
    yearId: (data as any).academicYearId,
  })
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
  studentName?: string
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
  success: boolean
  date: string
  schoolId: string
  totalProcessed: number
  recordsCreated: number
  recordsUpdated: number
  errors: Array<{ studentId: string; error: string }>
}

export interface DailyAttendanceSummary {
  date: string
  schoolId: string
  totalStudents: number
  totalRecorded?: number
  present: number
  absent: number
  late: number
  excused: number
  halfDay: number
  remote?: number
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
  if (DEBUG) console.debug('[Academics Service] recordBulkAttendance', {
    batchSize: data.records.length,
    schoolId: data.schoolId,
    date: data.date,
  })
  return apiPost<BulkAttendanceResponse>('/academics/attendance/bulk', data)
}

/**
 * Get attendance records for a school on a specific date
 * GET /academics/attendance?schoolId=&date=
 */
export async function getAttendanceByDate(
  schoolId: string,
  date: string
): Promise<{ items: AttendanceRecord[]; hasMore: boolean }> {
  return apiGet<{ items: AttendanceRecord[]; hasMore: boolean }>('/academics/attendance', {
    schoolId,
    date,
  })
}

/**
 * Get daily attendance summary for a school
 * GET /academics/attendance/summary?schoolId=&date=
 */
export async function getAttendanceSummary(
  schoolId: string,
  date: string,
  academicYearId?: string
): Promise<DailyAttendanceSummary> {
  const params: Record<string, string> = { schoolId, date }
  if (academicYearId) params.academicYearId = academicYearId
  return apiGet<DailyAttendanceSummary>('/academics/attendance/summary', params)
}

/**
 * Get student attendance history
 * GET /academics/attendance/student/:id?schoolId=&startDate=&endDate=
 */
export async function getStudentAttendance(
  studentId: string,
  params?: { schoolId?: string; startDate?: string; endDate?: string }
): Promise<AttendanceRecord[]> {
  const queryParams: Record<string, unknown> = {}
  if (params?.schoolId) queryParams.schoolId = params.schoolId
  if (params?.startDate) queryParams.startDate = params.startDate
  if (params?.endDate) queryParams.endDate = params.endDate
  return apiGet<AttendanceRecord[]>(`/academics/attendance/student/${studentId}`, queryParams)
}

/**
 * Get student attendance summary (rate + counts)
 * GET /academics/attendance/student/:id/summary?schoolId=
 */
export async function getStudentAttendanceSummary(
  studentId: string,
  schoolId?: string,
): Promise<StudentAttendanceSummary> {
  const params: Record<string, string> = {}
  if (schoolId) params.schoolId = schoolId
  return apiGet<StudentAttendanceSummary>(`/academics/attendance/student/${studentId}/summary`, params)
}

/**
 * Update/correct an attendance record
 * PATCH /academics/attendance/:date/:studentId
 */
export async function updateAttendance(
  date: string,
  studentId: string,
  data: { status: AttendanceStatus; notes?: string },
  schoolId?: string,
): Promise<AttendanceRecord> {
  const url = schoolId
    ? `/academics/attendance/${date}/${studentId}?schoolId=${schoolId}`
    : `/academics/attendance/${date}/${studentId}`
  return apiPatch<AttendanceRecord>(url, data)
}

// ============================================================================
// SECTION ATTENDANCE (Ed-Fi: StudentSectionAttendanceEvent)
// ============================================================================

export interface CreateSectionAttendanceParams {
  studentId: string
  sectionId: string
  schoolId: string
  date: string
  status: AttendanceStatus
  academicYearId?: string
  checkInTime?: string
  notes?: string
  excuseReason?: string
}

export interface BulkSectionAttendanceRecord {
  studentId: string
  studentName?: string
  status: AttendanceStatus
  checkInTime?: string
  notes?: string
}

export interface BulkSectionAttendanceParams {
  sectionId: string
  date: string
  schoolId: string
  academicYearId?: string
  records: BulkSectionAttendanceRecord[]
}

export interface SectionAttendanceRecord {
  sectionAttendanceId: string
  studentId: string
  studentName?: string
  schoolId: string
  sectionId: string
  courseName?: string
  courseCode?: string
  date: string
  status: AttendanceStatus
  checkInTime?: string
  checkOutTime?: string
  durationMinutes?: number
  excuseType?: string
  excuseReason?: string
  notes?: string
  parentNotified: boolean
  parentNotifiedAt?: string
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
  version?: number
}

export interface BulkSectionAttendanceResponse {
  success: boolean
  date: string
  schoolId: string
  sectionId: string
  totalProcessed: number
  recordsCreated: number
  recordsUpdated: number
  errors: Array<{ studentId: string; error: string }>
}

/**
 * Record single section attendance
 * POST /academics/section-attendance
 */
export async function recordSectionAttendance(
  data: CreateSectionAttendanceParams
): Promise<SectionAttendanceRecord> {
  return apiPost<SectionAttendanceRecord>('/academics/section-attendance', data)
}

/**
 * Record bulk section attendance
 * POST /academics/section-attendance/bulk
 */
export async function recordBulkSectionAttendance(
  data: BulkSectionAttendanceParams
): Promise<BulkSectionAttendanceResponse> {
  if (DEBUG) console.debug('[Academics Service] recordBulkSectionAttendance', {
    batchSize: data.records.length,
    sectionId: data.sectionId,
    date: data.date,
  })
  return apiPost<BulkSectionAttendanceResponse>('/academics/section-attendance/bulk', data)
}

/**
 * Get section attendance by date
 * GET /academics/section-attendance?sectionId=&schoolId=&date=
 */
export async function getSectionAttendanceByDate(
  sectionId: string,
  schoolId: string,
  date: string,
): Promise<{ items: SectionAttendanceRecord[]; hasMore: boolean }> {
  return apiGet<{ items: SectionAttendanceRecord[]; hasMore: boolean }>(
    '/academics/section-attendance',
    { sectionId, schoolId, date },
  )
}

/**
 * Get student section attendance history
 * GET /academics/section-attendance/student/:studentId?sectionId=&schoolId=&startDate=&endDate=
 */
export async function getStudentSectionAttendance(
  studentId: string,
  params?: { sectionId?: string; schoolId?: string; startDate?: string; endDate?: string }
): Promise<SectionAttendanceRecord[]> {
  const queryParams: Record<string, string> = {}
  if (params?.sectionId) queryParams.sectionId = params.sectionId
  if (params?.schoolId) queryParams.schoolId = params.schoolId
  if (params?.startDate) queryParams.startDate = params.startDate
  if (params?.endDate) queryParams.endDate = params.endDate
  return apiGet<SectionAttendanceRecord[]>(
    `/academics/section-attendance/student/${studentId}`,
    queryParams,
  )
}

/**
 * Update section attendance (correction)
 * PATCH /academics/section-attendance/:date/:sectionId/:studentId?schoolId=
 */
export async function updateSectionAttendance(
  date: string,
  sectionId: string,
  studentId: string,
  data: { status?: AttendanceStatus; notes?: string; excuseReason?: string; expectedVersion?: number },
  schoolId?: string,
): Promise<SectionAttendanceRecord> {
  const url = schoolId
    ? `/academics/section-attendance/${date}/${sectionId}/${studentId}?schoolId=${schoolId}`
    : `/academics/section-attendance/${date}/${sectionId}/${studentId}`
  return apiPatch<SectionAttendanceRecord>(url, data)
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
  if (DEBUG) console.debug('[Academics Service] getEnrollments', {
    schoolId,
    yearId,
    gradeLevel: params?.gradeLevel,
    status: params?.status,
  })
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

/**
 * Mark an enrollment as no-show
 * POST /academics/schools/:schoolId/years/:yearId/students/:studentId/no-show
 */
export async function markNoShow(
  schoolId: string,
  yearId: string,
  studentId: string,
): Promise<EnrollmentResponseDto> {
  return apiPost(
    `/academics/schools/${schoolId}/years/${yearId}/students/${studentId}/no-show`,
    {}
  )
}

/**
 * Close all open enrollments for a completed academic year
 * POST /academics/schools/:schoolId/years/:yearId/enrollments/close-year
 */
export async function closeAcademicYearEnrollments(
  schoolId: string,
  yearId: string,
  lastDayOfSchool: string,
): Promise<{ closed: number; alreadyClosed: number; errors: number }> {
  return apiPost(
    `/academics/schools/${schoolId}/years/${yearId}/enrollments/close-year`,
    { lastDayOfSchool }
  )
}

/**
 * Export enrollments as CSV file download
 * GET /academics/schools/:schoolId/years/:yearId/enrollments/export
 */
export function getEnrollmentExportUrl(schoolId: string, yearId: string): string {
  return `/academics/schools/${schoolId}/years/${yearId}/enrollments/export`
}

// ============================================================================
// GRADING POLICY & GRADE TYPES (from @aibrains/shared-types)
// ============================================================================

import type {
  AssessmentCategory,
  GradingPolicyResponseDto,
  CreateGradingPolicyDto,
  UpdateGradingPolicyDto,
  GradingScaleEntryDto,
  CategoryWeightDto,
  GradeOverviewResponseDto,
  BulkFinalizeParamsDto,
  BulkFinalizeResponseDto,
} from '@aibrains/shared-types'
export type { AssessmentCategory } from '@aibrains/shared-types'

// Backward-compatible aliases for existing consumers
export type GradingScaleEntry = GradingScaleEntryDto
export type CategoryWeight = CategoryWeightDto
export type GradingPolicyResponse = GradingPolicyResponseDto
export type CreateGradingPolicyParams = CreateGradingPolicyDto
export type UpdateGradingPolicyParams = UpdateGradingPolicyDto

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
  assignmentId?: string
  assignmentName: string
  assignmentType: string
  categoryId: string
  assessmentCategory?: AssessmentCategory
  possiblePoints: number
  earnedPoints?: number
}

export interface RecordGradeParams {
  studentId: string
  studentName?: string
  courseId: string
  courseName?: string
  sectionId: string
  schoolId: string
  termId: string
  academicYearId: string
  teacherId: string
  assignment: AssignmentInfo
}

export interface BulkGradeRecord {
  studentId: string
  studentName?: string
  earnedPoints?: number
}

export interface RecordBulkGradesParams {
  courseId: string
  courseName?: string
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
  courseName?: string
  sectionId?: string
  termId: string
  assignments: Array<{
    assignmentId: string
    assignmentName: string
    assignmentType: string
    categoryId: string
    assessmentCategory?: AssessmentCategory
    possiblePoints: number
    earnedPoints?: number
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
  if (DEBUG) console.debug('[Academics Service] recordGrade', { studentId: data.studentId, sectionId: data.sectionId })
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
 *
 * Backend returns GradeResponseDto[] (plain array).
 * We normalize to SectionGradebookResponse for consistent frontend consumption.
 */
export async function getSectionGrades(
  sectionId: string,
  params: { schoolId: string; termId?: string }
): Promise<SectionGradebookResponse> {
  if (DEBUG) console.debug('[Academics Service] getSectionGrades', { sectionId, termId: params.termId })
  const response = await apiGet<GradeRecord[] | SectionGradebookResponse>(
    `/academics/grades/section/${sectionId}`,
    params
  )
  // Normalize: backend returns plain array, frontend expects { grades: [] }
  if (Array.isArray(response)) {
    return {
      sectionId,
      termId: params.termId || '',
      grades: response,
    }
  }
  return response
}

// GradeOverviewResponse and BulkFinalize types aliased from shared-types (see imports above)
export type GradeOverviewResponse = GradeOverviewResponseDto
export type BulkFinalizeParams = BulkFinalizeParamsDto
export type BulkFinalizeResponse = BulkFinalizeResponseDto

/**
 * Get grade overview for a school
 * GET /academics/grades/overview?schoolId=&academicYearId=
 */
export async function getGradeOverview(
  params: { schoolId: string; academicYearId: string }
): Promise<GradeOverviewResponse> {
  return apiGet<GradeOverviewResponse>('/academics/grades/overview', params)
}

/**
 * Get student's grades
 * GET /academics/students/:id/grades?schoolId=&academicYearId=&termId=
 */
export async function getStudentGrades(
  studentId: string,
  params?: { schoolId?: string; academicYearId?: string; termId?: string }
): Promise<StudentGradesResponse> {
  return apiGet<StudentGradesResponse>(`/academics/students/${studentId}/grades`, params)
}

/**
 * Finalize a grade (lock it)
 * PATCH /academics/grades/:gradeId/finalize?schoolId=
 */
export async function finalizeGrade(gradeId: string, schoolId?: string): Promise<void> {
  const url = schoolId
    ? `/academics/grades/${gradeId}/finalize?schoolId=${schoolId}`
    : `/academics/grades/${gradeId}/finalize`
  return apiPatch(url, {})
}

/**
 * Bulk-finalize all grades for a section in a term
 * POST /academics/grades/finalize/bulk
 */
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
  isInstructionalDay: boolean
  isHoliday: boolean
  isWeekend: boolean
  dayOfWeek: string
  calendarEvents?: Array<{
    description?: string
    isAllDay?: boolean
    eventType: string
  }>
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
  if (DEBUG) console.debug('[Academics Service] getAttendanceTrend', { schoolId, startDate, endDate })
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
  gradeLevel?: string
  attendanceRate: number
  totalDays: number
  absentDays: number
  trend: 'improving' | 'declining' | 'stable'
}

export interface AttendanceOverviewResponse {
  todaySummary: DailyAttendanceSummary & { totalRecorded: number; remote?: number }
  sectionCompletion: {
    totalSections: number
    sectionsWithAttendance: number
    sections: Array<{
      sectionId: string
      sectionNumber: string
      courseName: string
      studentCount: number
      recordedCount: number
      isComplete: boolean
    }>
  }
  trend: DailyAttendanceSummary[]
  periodAverages: {
    last7Days: number
    last30Days: number
    academicYear: number
  }
  atRiskStudents: AttendanceAlert[]
  totalAtRiskCount: number
  absenceBreakdown: {
    unexcused: number
    excused: number
    late: number
    halfDay: number
    remote: number
  }
  dayOfWeekPattern: Record<string, { avgRate: number; avgAbsent: number }>
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
  if (DEBUG) console.debug('[Academics Service] getAttendanceAlerts', { threshold, academicYearId })
  const res = await apiGet<{ alerts: AttendanceAlert[]; totalAtRiskCount: number } | AttendanceAlert[]>(
    '/academics/attendance/alerts',
    { schoolId, academicYearId, threshold, startDate, endDate },
  )
  // Backend returns { alerts, totalAtRiskCount } — unwrap to array
  return Array.isArray(res) ? res : res.alerts
}

// ============================================================================
// ATTENDANCE OVERVIEW (Task 1.13)
// ============================================================================

/**
 * Get attendance overview (aggregate dashboard endpoint)
 * GET /academics/attendance/overview?schoolId=&academicYearId=&date=
 */
export async function getAttendanceOverview(
  params: { schoolId: string; academicYearId: string; date: string }
): Promise<AttendanceOverviewResponse> {
  return apiGet<AttendanceOverviewResponse>('/academics/attendance/overview', params)
}

// ============================================================================
// PARENT PORTAL ACCESS
// ============================================================================

/**
 * Create a parent portal account via Identity service
 */
export async function createParentAccount(data: {
  email: string
  firstName: string
  lastName: string
  phone?: string
  schoolId: string
  studentId: string
  guardianId?: string
}): Promise<{ userId: string; email: string; schoolRole: string }> {
  return apiPost('/identity/users/parent-accounts', data)
}

/**
 * Create a student portal account via Identity service
 */
export async function createStudentAccount(data: {
  email: string
  firstName: string
  lastName: string
  schoolId: string
  studentId: string
}): Promise<{ userId: string; email: string; schoolRole: string }> {
  return apiPost('/identity/users/student-accounts', data)
}

/**
 * Link a guardian record to a user account (portal access)
 */
export async function linkGuardianToUser(
  studentId: string,
  data: { userId: string; guardianId?: string; guardianEmail: string },
  schoolId?: string
): Promise<{ linked: boolean }> {
  const qs = schoolId ? `?schoolId=${schoolId}` : ''
  return apiPost(`/academics/students/${studentId}/link-guardian${qs}`, data)
}

// ============================================================================
// CLASSWORK
// ============================================================================

/**
 * Get all classwork items and topics for a section
 * GET /academics/classwork?sectionId=&schoolId=
 */
export async function getClassworkItems(
  sectionId: string,
  schoolId: string
): Promise<SectionClassworkResponseDto> {
  return apiGet<SectionClassworkResponseDto>(
    `/academics/classwork?sectionId=${sectionId}&schoolId=${schoolId}`
  )
}

/**
 * Create a classwork item
 * POST /academics/classwork
 */
export async function createClassworkItem(
  data: CreateClassworkItemDto
): Promise<ClassworkItemResponseDto> {
  return apiPost<ClassworkItemResponseDto>('/academics/classwork', data)
}

/**
 * Update a classwork item
 * PATCH /academics/classwork/:itemId?schoolId=&sectionId=
 */
export async function updateClassworkItem(
  itemId: string,
  schoolId: string,
  sectionId: string,
  data: Record<string, unknown>
): Promise<ClassworkItemResponseDto> {
  return apiPatch<ClassworkItemResponseDto>(
    `/academics/classwork/${itemId}?schoolId=${schoolId}&sectionId=${sectionId}`,
    data
  )
}

/**
 * Delete a classwork item
 * DELETE /academics/classwork/:itemId?schoolId=&sectionId=
 */
export async function deleteClassworkItem(
  itemId: string,
  schoolId: string,
  sectionId: string
): Promise<void> {
  return apiDelete(
    `/academics/classwork/${itemId}?schoolId=${schoolId}&sectionId=${sectionId}`
  )
}

/**
 * Create a classwork topic
 * POST /academics/classwork/topics
 */
export async function createClassworkTopic(
  data: { sectionId: string; schoolId: string; name: string }
): Promise<ClassworkTopicResponseDto> {
  return apiPost<ClassworkTopicResponseDto>('/academics/classwork/topics', data)
}

/**
 * Update a classwork topic
 * PATCH /academics/classwork/topics/:topicId?schoolId=&sectionId=
 */
export async function updateClassworkTopic(
  topicId: string,
  schoolId: string,
  sectionId: string,
  data: { name?: string; sortOrder?: number }
): Promise<ClassworkTopicResponseDto> {
  return apiPatch<ClassworkTopicResponseDto>(
    `/academics/classwork/topics/${topicId}?schoolId=${schoolId}&sectionId=${sectionId}`,
    data
  )
}

/**
 * Delete a classwork topic
 * DELETE /academics/classwork/topics/:topicId?schoolId=&sectionId=
 */
export async function deleteClassworkTopic(
  topicId: string,
  schoolId: string,
  sectionId: string
): Promise<void> {
  return apiDelete(
    `/academics/classwork/topics/${topicId}?schoolId=${schoolId}&sectionId=${sectionId}`
  )
}

/**
 * Reorder classwork items and topics within a section
 * PATCH /academics/classwork/reorder
 */
export async function reorderClassworkItems(
  data: {
    schoolId: string
    sectionId: string
    items: Array<{ id: string; type: 'item' | 'topic'; sortOrder: number; topicId?: string | null }>
  }
): Promise<void> {
  return apiPatch('/academics/classwork/reorder', data)
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
  markNoShow,
  closeAcademicYearEnrollments,
  getEnrollmentExportUrl,
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
  getAttendanceByDate,
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
  // Portal Access
  createParentAccount,
  createStudentAccount,
  linkGuardianToUser,
  // Classwork (Sprint 3B)
  getClassworkItems,
  createClassworkItem,
  updateClassworkItem,
  deleteClassworkItem,
  createClassworkTopic,
  updateClassworkTopic,
  deleteClassworkTopic,
  reorderClassworkItems,
}
