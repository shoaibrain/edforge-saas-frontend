/**
 * Academics Service
 *
 * Service for student management with CRUD operations.
 * Uses types from @edforge/shared-types (single source of truth).
 */

import axios from 'axios'
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api'

// ============================================================================
// TYPES - Import from @edforge/shared-types
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
  CourseResponseDto,
  CourseListResponseDto,
  CourseFilterDto,
  CreateCourseDto,
  UpdateCourseDto,
  CourseSubjectArea,
  CourseType,
  CreditType,
  CourseDuration,
} from '@edforge/shared-types'

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
} from '@edforge/shared-types'

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
 * Backend error response shape
 */
interface ApiErrorResponse {
  statusCode: number
  message: string | string[]
  error?: string
  errorCode?: string
  field?: string
  timestamp?: string
}

/**
 * Parse API errors into a standardized format
 * Handles all HTTP status codes with appropriate messages
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
      const message = getMessage(data?.message)
      if (data?.field) {
        return {
          message,
          fieldErrors: { [data.field]: message },
          isRetryable: false,
          statusCode: 400,
        }
      }
      return {
        message,
        isRetryable: false,
        statusCode: 400,
      }
    }

    // 403 - Forbidden (ABAC permission denied)
    if (status === 403) {
      return {
        message: 'You do not have permission to perform this action',
        isRetryable: false,
        statusCode: 403,
      }
    }

    // 404 - Not Found (stale data)
    if (status === 404) {
      return {
        message: 'This student record no longer exists. Please refresh the page.',
        isRetryable: false,
        statusCode: 404,
      }
    }

    // 409 - Conflict (duplicate)
    if (status === 409) {
      return {
        message: data?.message
          ? getMessage(data.message)
          : 'A student with this identifier already exists',
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
  // Course CRUD
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
}
