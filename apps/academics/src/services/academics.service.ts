/**
 * Academics Service
 *
 * Service for student management with CRUD operations.
 * Uses types from @aibrains/shared-types (single source of truth).
 */

import axios from 'axios'
import { api, apiGet, apiPost, apiPatch, apiDelete } from '../lib/api'
import type {
  ExamResponseDto,
  ExamListResponseDto,
  CreateExamDto,
  UpdateExamDto,
  ExamStatus,
  ExamCourseResponseDto,
  CreateExamCourseDto,
  UpdateExamCourseDto,
  ExamScoreResponseDto,
  CreateExamScoreDto,
  UpdateExamScoreDto,
  BulkExamScoreDto,
  BulkExamScoreResponseDto,
  ResultCardResponseDto,
  ResultCardListResponseDto,
} from '@aibrains/shared-types'

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
  AttendancePolicyResponseDto,
  PresenceLockResponseDto,
  IemisAttendanceExportResponseDto,
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
 * Payload for PATCH /academics/students/:id/descriptors. All 8 fields are
 * optional; only those present in the request are updated. Backend validates
 * via `studentDescriptorPatchSchema` from `@aibrains/shared-types` (Sprint 3).
 */
export interface StudentDescriptorPatchInput {
  sexDescriptor?: string
  languageDescriptor?: string
  motherTongueDescriptor?: string
  disabilities?: Array<{ descriptor: string; notes?: string }>
  ethnicityDescriptor?: string
  isTransferred?: boolean
  belowPovertyLine?: boolean
  scholarshipCategory?: string
}

/**
 * Update student Ed-Fi descriptor fields (Sprint 3 S3.7).
 * PATCH /academics/students/:id/descriptors
 *
 * The backend emits a `student.descriptor.edited` audit event on every
 * successful call. Notes inside `disabilities[]` are stripped before the
 * audit event is emitted (privacy guard — verified in the Sprint 3 DDB
 * verifier smoke).
 */
export async function updateStudentDescriptors(
  studentId: string,
  data: StudentDescriptorPatchInput,
): Promise<StudentResponseDto> {
  return apiPatch<StudentResponseDto>(`/academics/students/${studentId}/descriptors`, data)
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
  IemisImportAsyncAck,
  IemisImportJob,
} from '../components/students/iemis/iemis-import.types'

/**
 * Dry-run preview of the IEMIS import. Synchronous. Backend short-circuits
 * before Phase 3 (no DDB writes) so this returns in well under 30s for the
 * 779-row case. Default 30s timeout is fine; we keep the explicit 60s here
 * as a safety net for slow STS warm-ups.
 */
export async function previewIemisImport(
  data: Omit<IemisImportRequest, 'dryRun' | 'enrollInAcademicYearId'>,
): Promise<IemisImportResult> {
  const response = await api.post<IemisImportResult>(
    '/academics/students/import/iemis',
    { ...data, dryRun: true },
    { timeout: 60_000 },
  )
  return response.data
}

/**
 * Real (non-dryRun) import. Backend returns 202 + jobId immediately and
 * runs the work asynchronously. Caller polls `getIemisImportJob(jobId)`
 * until the job's status is `succeeded` or `failed`.
 *
 * Solves the API Gateway 29s integration timeout that previously dropped
 * the response on >500-row imports while the backend silently kept
 * committing rows.
 */
export async function startIemisImport(
  data: Omit<IemisImportRequest, 'dryRun'>,
): Promise<IemisImportAsyncAck> {
  const response = await api.post<IemisImportAsyncAck>(
    '/academics/students/import/iemis',
    { ...data, dryRun: false },
    { timeout: 30_000 },
  )
  return response.data
}

/**
 * Poll the status of an in-flight or completed IEMIS import job.
 *
 * Returns the full record. Frontend should call this every 2s while
 * `status` is `queued` or `running`, and stop on `succeeded` / `failed`.
 */
export async function getIemisImportJob(jobId: string): Promise<IemisImportJob> {
  return apiGet<IemisImportJob>(`/academics/students/import/iemis/jobs/${jobId}`)
}

/**
 * @deprecated Use `previewIemisImport` (dryRun) or `startIemisImport` (commit)
 * directly. Kept temporarily to avoid breaking callers during the C4 rollout.
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
 * Fetch every course matching `params` by walking the cursor across all pages.
 * Used by the catalog CSV export so the file reflects the full filtered set,
 * not just the loaded page. Iteration is capped defensively.
 */
export async function getAllCourses(
  params: CourseFilterDto
): Promise<CourseResponseDto[]> {
  const all: CourseResponseDto[] = []
  let cursor: string | undefined
  for (let i = 0; i < 50; i++) {
    const page = await getCourses({ ...params, limit: 100, cursor })
    all.push(...page.items)
    cursor = page.hasMore ? page.lastEvaluatedKey : undefined
    if (!cursor) break
  }
  return all
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
  // Sprint 1.5 — carry the attendance reason on the bulk path (shared-types
  // 0.70.0 added these to bulkSectionAttendanceRecordSchema). Previously dropped
  // before the request, so the UI-selected reason never reached the server.
  excuseType?: string
  excuseReason?: string
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

/**
 * Resolve the effective attendance policy (mode + counting policy) for a school.
 * Mode is the realigned enum (daily_presence | per_section_granular); legacy
 * daily/period/both values are coerced server-side. Source is school override →
 * archetype → platform.
 * GET /academics/attendance/policy?schoolId=
 */
export async function getAttendancePolicy(
  schoolId: string,
): Promise<AttendancePolicyResponseDto> {
  return apiGet<AttendancePolicyResponseDto>('/academics/attendance/policy', { schoolId })
}

/**
 * Cross-section presence locks for a school + date: each student's day-presence is
 * "locked" by the first section that marked them, so subsequent sections show the
 * lock under daily_presence. Read-only / policy-agnostic.
 * GET /academics/attendance/presence-locks?schoolId=&date=
 */
export async function getPresenceLocks(
  schoolId: string,
  date: string,
): Promise<PresenceLockResponseDto> {
  return apiGet<PresenceLockResponseDto>('/academics/attendance/presence-locks', { schoolId, date })
}

/**
 * IEMiS monthly attendance export (Layer 4). POST because it recomputes + persists
 * the monthly aggregate, then returns IEMiS Flash II rows. academicYearId enriches
 * each row with the student's school-local grade.
 * POST /academics/attendance/iemis-export?schoolId=&yearMonth=YYYY-MM&academicYearId=
 */
export async function exportIemisAttendance(
  schoolId: string,
  yearMonth: string,
  academicYearId: string,
): Promise<IemisAttendanceExportResponseDto> {
  const qs = new URLSearchParams({ schoolId, yearMonth, academicYearId }).toString()
  return apiPost<IemisAttendanceExportResponseDto>(`/academics/attendance/iemis-export?${qs}`)
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

export interface StudentAttendanceTrend {
  rate: number
  series: number[]
  trend: 'improving' | 'declining' | 'stable'
  totalDays: number
  absentDays: number
}

/**
 * Batch per-student attendance trend for the roster sparkline (Sprint 2).
 * GET /academics/attendance/student-trends?schoolId=&studentIds=<csv>&startDate=&endDate=
 * Returns a studentId → trend map (only students with records in the window).
 */
export async function getAttendanceStudentTrends(
  schoolId: string,
  studentIds: string[],
  startDate: string,
  endDate: string,
  signal?: AbortSignal,
): Promise<Record<string, StudentAttendanceTrend>> {
  if (studentIds.length === 0) return {}
  if (DEBUG) console.debug('[Academics Service] getAttendanceStudentTrends', { count: studentIds.length })
  const res = await apiGet<{ trends: Record<string, StudentAttendanceTrend> }>(
    '/academics/attendance/student-trends',
    { schoolId, studentIds: studentIds.join(','), startDate, endDate },
    { signal },
  )
  return res?.trends ?? {}
}

// ============================================================================
// ATTENDANCE OVERVIEW (Task 1.13)
// ============================================================================

/**
 * Get attendance overview (aggregate dashboard endpoint)
 * GET /academics/attendance/overview?schoolId=&academicYearId=&date=
 */
export async function getAttendanceOverview(
  params: { schoolId: string; academicYearId: string; date: string },
  signal?: AbortSignal,
): Promise<AttendanceOverviewResponse> {
  // Signal lets react-query abort a superseded fetch — rapid date navigation
  // would otherwise stack heavy aggregate requests on the server.
  return apiGet<AttendanceOverviewResponse>('/academics/attendance/overview', params, { signal })
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
// EXAMS (school + term scoped)
// ============================================================================

export interface ExamListParams {
  schoolId: string
  academicYearId?: string
  termId?: string
  examType?: string
  status?: ExamStatus
  isActive?: boolean
  limit?: number
  cursor?: string
}

/**
 * List exams. GET /academics/exams?schoolId=…
 */
export async function getExams(params: ExamListParams): Promise<ExamListResponseDto> {
  const queryParams: Record<string, unknown> = { schoolId: params.schoolId }
  if (params.academicYearId) queryParams.academicYearId = params.academicYearId
  if (params.termId) queryParams.termId = params.termId
  if (params.examType) queryParams.examType = params.examType
  if (params.status) queryParams.status = params.status
  if (params.isActive !== undefined) queryParams.isActive = params.isActive
  if (params.limit) queryParams.limit = params.limit
  if (params.cursor) queryParams.cursor = params.cursor
  return apiGet<ExamListResponseDto>('/academics/exams', queryParams)
}

/**
 * Read the tenant archetype's allowed exam types.
 * GET /academics/exams/exam-pattern
 */
export async function getExamPattern(): Promise<{ archetype: string | null; examPattern: string[] }> {
  return apiGet<{ archetype: string | null; examPattern: string[] }>('/academics/exams/exam-pattern')
}

/**
 * Create an exam. POST /academics/exams
 */
export async function createExam(data: CreateExamDto): Promise<ExamResponseDto> {
  return apiPost<ExamResponseDto>('/academics/exams', data)
}

/**
 * Get a single exam. GET /academics/exams/{examId}?schoolId=…
 */
export async function getExam(examId: string, schoolId: string): Promise<ExamResponseDto> {
  return apiGet<ExamResponseDto>(`/academics/exams/${examId}`, { schoolId })
}

/**
 * Update an exam's editable fields (examName / examType / dates / description).
 * PATCH /academics/exams/{examId}?schoolId=…
 *
 * Immutable: schoolId, academicYearId, termId. `examType` is server-guarded to
 * exam.status === 'draft'. Status transitions go through `transitionExamStatus`.
 */
export async function updateExam(
  examId: string,
  schoolId: string,
  data: UpdateExamDto,
): Promise<ExamResponseDto> {
  return apiPatch<ExamResponseDto>(
    `/academics/exams/${examId}?schoolId=${encodeURIComponent(schoolId)}`,
    data,
  )
}

/**
 * Transition an exam's status through the lifecycle state machine.
 * PATCH /academics/exams/{examId}/status?schoolId=…
 *
 * `in_progress → closed` is what fires the result-batch Lambda (cards generate);
 * an illegal jump returns 409 EXAM_STATE_INVALID_TRANSITION.
 */
export async function transitionExamStatus(
  examId: string,
  schoolId: string,
  targetStatus: ExamStatus,
  notes?: string,
): Promise<ExamResponseDto> {
  return apiPatch<ExamResponseDto>(
    `/academics/exams/${examId}/status?schoolId=${encodeURIComponent(schoolId)}`,
    notes ? { targetStatus, notes } : { targetStatus },
  )
}

// ============================================================================
// EXAM COURSES (subjects on an exam — Ed-Fi AssessmentSection)
// schoolId is derived server-side from the exam (no query param); only the
// POST body carries schoolId. Mutations 409 EXAM_LOCKED once status leaves
// {draft, scheduled}.
// ============================================================================

export interface ExamCourseListResult {
  items: ExamCourseResponseDto[]
  hasMore?: boolean
  lastEvaluatedKey?: string
}

/**
 * List the subjects (courses) attached to an exam.
 * GET /academics/exams/{examId}/courses
 */
export async function getExamCourses(examId: string): Promise<ExamCourseListResult> {
  return apiGet<ExamCourseListResult>(`/academics/exams/${examId}/courses`)
}

/**
 * Add a subject (course) to an exam. POST /academics/exams/{examId}/courses
 */
export async function createExamCourse(
  examId: string,
  data: CreateExamCourseDto,
): Promise<ExamCourseResponseDto> {
  return apiPost<ExamCourseResponseDto>(`/academics/exams/${examId}/courses`, data)
}

/**
 * Update an exam-course's marks/credit. PATCH …/courses/{examCourseId}
 */
export async function updateExamCourse(
  examId: string,
  examCourseId: string,
  data: UpdateExamCourseDto,
): Promise<ExamCourseResponseDto> {
  return apiPatch<ExamCourseResponseDto>(`/academics/exams/${examId}/courses/${examCourseId}`, data)
}

/**
 * Remove a subject from an exam. DELETE …/courses/{examCourseId}
 */
export async function deleteExamCourse(examId: string, examCourseId: string): Promise<void> {
  return apiDelete(`/academics/exams/${examId}/courses/${examCourseId}`)
}

// ============================================================================
// EXAM SCORES (Ed-Fi StudentAssessmentScoreResult — score entry)
// Backend guards writes to exam.status ∈ {scheduled, in_progress}: 409
// EXAM_NOT_SCHEDULED (draft) / EXAM_LOCKED (closed/published). Bulk POST is
// chunked at 100 server-side; max 250 per request.
// ============================================================================

export interface ExamScoreListResult {
  items: ExamScoreResponseDto[]
  hasMore?: boolean
  lastEvaluatedKey?: string
}

export interface ExamScoresFilter {
  schoolId: string
  examCourseId?: string
  enrollmentId?: string
}

/**
 * List scores for an exam. GET /academics/exams/{examId}/scores?schoolId=…
 */
export async function getExamScores(
  examId: string,
  filter: ExamScoresFilter,
): Promise<ExamScoreListResult> {
  const params: Record<string, unknown> = { schoolId: filter.schoolId }
  if (filter.examCourseId) params.examCourseId = filter.examCourseId
  if (filter.enrollmentId) params.enrollmentId = filter.enrollmentId
  return apiGet<ExamScoreListResult>(`/academics/exams/${examId}/scores`, params)
}

/**
 * Record a single score. POST /academics/exams/{examId}/scores
 */
export async function createExamScore(
  examId: string,
  data: CreateExamScoreDto,
): Promise<ExamScoreResponseDto> {
  return apiPost<ExamScoreResponseDto>(`/academics/exams/${examId}/scores`, data)
}

/**
 * Bulk-write scores for an exam (≤250 per request; server chunks at 100).
 * POST /academics/exams/{examId}/scores/bulk?schoolId=…
 *
 * Idempotent on (correlationId, (examCourseId, enrollmentId) tuples).
 */
export async function createBulkExamScores(
  examId: string,
  schoolId: string,
  data: BulkExamScoreDto,
): Promise<BulkExamScoreResponseDto> {
  return apiPost<BulkExamScoreResponseDto>(
    `/academics/exams/${examId}/scores/bulk?schoolId=${encodeURIComponent(schoolId)}`,
    data,
  )
}

/**
 * Update a single score (while status === 'entered').
 * PATCH /academics/exams/{examId}/scores/{scoreId}
 */
export async function updateExamScore(
  examId: string,
  scoreId: string,
  data: UpdateExamScoreDto,
): Promise<ExamScoreResponseDto> {
  return apiPatch<ExamScoreResponseDto>(`/academics/exams/${examId}/scores/${scoreId}`, data)
}

// ============================================================================
// RESULT CARDS (Ed-Fi ReportCard — generated when an exam closes)
// ============================================================================

export interface ResultCardListParams {
  examId?: string
  schoolId?: string
  enrollmentId?: string
  studentId?: string
  termId?: string
  status?: 'draft' | 'published'
  limit?: number
  cursor?: string
}

/**
 * List result cards. GET /academics/result-cards (scoped by examId here).
 */
export async function getResultCards(params: ResultCardListParams): Promise<ResultCardListResponseDto> {
  const queryParams: Record<string, unknown> = {}
  if (params.examId) queryParams.examId = params.examId
  if (params.schoolId) queryParams.schoolId = params.schoolId
  if (params.enrollmentId) queryParams.enrollmentId = params.enrollmentId
  if (params.studentId) queryParams.studentId = params.studentId
  if (params.termId) queryParams.termId = params.termId
  if (params.status) queryParams.status = params.status
  if (params.limit) queryParams.limit = params.limit
  if (params.cursor) queryParams.cursor = params.cursor
  return apiGet<ResultCardListResponseDto>('/academics/result-cards', queryParams)
}

/**
 * Update operator conduct. PATCH /academics/result-cards/{cardId}/conduct?enrollmentId=
 * `enrollmentId` is required (Invariant 3 — the entity is keyed by it).
 */
export async function updateResultCardConduct(
  cardId: string,
  enrollmentId: string,
  conduct: string,
): Promise<ResultCardResponseDto> {
  return apiPatch<ResultCardResponseDto>(
    `/academics/result-cards/${cardId}/conduct?enrollmentId=${encodeURIComponent(enrollmentId)}`,
    { conduct },
  )
}

/**
 * Update class-teacher remark. PATCH /academics/result-cards/{cardId}/remark?enrollmentId=
 */
export async function updateResultCardRemark(
  cardId: string,
  enrollmentId: string,
  classTeacherRemark: string,
): Promise<ResultCardResponseDto> {
  return apiPatch<ResultCardResponseDto>(
    `/academics/result-cards/${cardId}/remark?enrollmentId=${encodeURIComponent(enrollmentId)}`,
    { classTeacherRemark },
  )
}

/**
 * Publish a result card (terminal). PATCH /academics/result-cards/{cardId}/publish?enrollmentId=
 * A second publish returns 409 RESULT_ALREADY_PUBLISHED.
 */
export async function publishResultCard(
  cardId: string,
  enrollmentId: string,
  notes?: string,
): Promise<ResultCardResponseDto> {
  return apiPatch<ResultCardResponseDto>(
    `/academics/result-cards/${cardId}/publish?enrollmentId=${encodeURIComponent(enrollmentId)}`,
    notes ? { notes } : {},
  )
}

// ============================================================================
// FAMILY (family-billing — sibling grouping under a primary contact)
// ============================================================================

import type {
  StudentFamily,
  FamilyResponse,
  FamilyMembersResponse,
  CreateFamilyDto,
  UpdateFamilyDto,
  AddFamilyMemberDto,
} from '@edforge/types'

export interface FamilyListParams {
  namePrefix?: string
  limit?: number
  cursor?: string
}

export interface FamilyListResponse {
  items: FamilyResponse[]
  hasMore: boolean
  lastEvaluatedKey?: string
}

/**
 * Get the family (and siblings) a student belongs to.
 *
 * `schoolId` is REQUIRED by the backend (families.controller.ts throws
 * BadRequestException('Missing required parameter: schoolId') without it).
 * GET /academics/students/:studentId/family?schoolId=
 */
export async function getStudentFamily(
  studentId: string,
  schoolId: string,
): Promise<StudentFamily> {
  return apiGet<StudentFamily>(`/academics/students/${studentId}/family`, {
    schoolId,
  })
}

/**
 * List families for a school, optionally filtered by name prefix.
 * GET /academics/schools/:schoolId/families
 */
export async function listFamilies(
  schoolId: string,
  params?: FamilyListParams,
): Promise<FamilyListResponse> {
  const queryParams: Record<string, unknown> = {}
  if (params?.namePrefix) queryParams.namePrefix = params.namePrefix
  if (params?.limit) queryParams.limit = params.limit
  if (params?.cursor) queryParams.cursor = params.cursor
  return apiGet<FamilyListResponse>(
    `/academics/schools/${schoolId}/families`,
    queryParams,
  )
}

/**
 * Get the members (students) of a family.
 * GET /academics/schools/:schoolId/families/:familyId/members
 */
export async function getFamilyMembers(
  schoolId: string,
  familyId: string,
): Promise<FamilyMembersResponse> {
  return apiGet<FamilyMembersResponse>(
    `/academics/schools/${schoolId}/families/${familyId}/members`,
  )
}

/**
 * Create a family.
 * POST /academics/schools/:schoolId/families
 */
export async function createFamily(
  schoolId: string,
  data: CreateFamilyDto,
): Promise<FamilyResponse> {
  return apiPost<FamilyResponse>(
    `/academics/schools/${schoolId}/families`,
    data,
  )
}

/**
 * Update a family. PATCH /academics/schools/:schoolId/families/:familyId
 */
export async function updateFamily(
  schoolId: string,
  familyId: string,
  data: UpdateFamilyDto,
): Promise<FamilyResponse> {
  return apiPatch<FamilyResponse>(
    `/academics/schools/${schoolId}/families/${familyId}`,
    data,
  )
}

/**
 * Soft-delete (deactivate) a family.
 * DELETE /academics/schools/:schoolId/families/:familyId
 */
export async function deactivateFamily(
  schoolId: string,
  familyId: string,
): Promise<void> {
  return apiDelete(`/academics/schools/${schoolId}/families/${familyId}`)
}

/**
 * Add a student to a family.
 * POST /academics/schools/:schoolId/families/:familyId/members
 */
export async function addFamilyMember(
  schoolId: string,
  familyId: string,
  data: AddFamilyMemberDto,
): Promise<void> {
  return apiPost(
    `/academics/schools/${schoolId}/families/${familyId}/members`,
    data,
  )
}

/**
 * Remove a student from a family.
 * DELETE /academics/schools/:schoolId/families/:familyId/members/:studentId
 */
export async function removeFamilyMember(
  schoolId: string,
  familyId: string,
  studentId: string,
): Promise<void> {
  return apiDelete(
    `/academics/schools/${schoolId}/families/${familyId}/members/${studentId}`,
  )
}

// ============================================================================
// EXPORTED SERVICE OBJECT
// ============================================================================

export const academicsService = {
  getExams,
  getExam,
  getExamPattern,
  createExam,
  updateExam,
  transitionExamStatus,
  getExamCourses,
  createExamCourse,
  updateExamCourse,
  deleteExamCourse,
  getExamScores,
  createExamScore,
  createBulkExamScores,
  updateExamScore,
  getResultCards,
  updateResultCardConduct,
  updateResultCardRemark,
  publishResultCard,
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
  // Family (family-billing)
  getStudentFamily,
  listFamilies,
  getFamilyMembers,
  createFamily,
  updateFamily,
  deactivateFamily,
  addFamilyMember,
  removeFamilyMember,
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
