/**
 * People Service
 * 
 * Service for user/staff management with CRUD operations.
 * Uses types from @aibrains/shared-types (single source of truth).
 */

import axios from 'axios'
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api'
import type { AssignRoleDto } from '@aibrains/shared-types'

// ============================================================================
// TYPES - Import from @aibrains/shared-types
// ============================================================================

// Re-export types for convenience
export type {
  UserResponseDto,
  UserListResponseDto,
  CreateUserDto,
  UpdateUserDto,
  UserAddressDto,
  SchoolAssignmentDto,
} from '@aibrains/shared-types'

// Import for internal use
import type {
  UserResponseDto,
  UserListResponseDto,
  CreateUserDto,
  UpdateUserDto,
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
        message: 'This record no longer exists. Please refresh the page.',
        isRetryable: false,
        statusCode: 404,
      }
    }

    // 409 - Conflict (duplicate)
    if (status === 409) {
      return {
        message: data?.message ? getMessage(data.message) : 'A user with this email already exists',
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
// USER CRUD OPERATIONS
// ============================================================================

/**
 * Get user by ID
 * GET /users/:id
 */
export async function getUser(userId: string): Promise<UserResponseDto> {
  return apiGet<UserResponseDto>(`/users/${userId}`)
}

/**
 * List users with optional search and pagination
 * GET /users
 */
export async function listUsers(
  limit: number = 20,
  cursor?: string,
  search?: string
): Promise<UserListResponseDto> {
  const params: Record<string, unknown> = { limit }
  if (cursor) params.cursor = cursor
  if (search) params.search = search

  return apiGet<UserListResponseDto>('/users', params)
}

/**
 * Create a new user
 * POST /users
 */
export async function createUser(data: CreateUserDto): Promise<UserResponseDto> {
  return apiPost<UserResponseDto>('/users', data)
}

/**
 * Update an existing user
 * PATCH /users/:id
 */
export async function updateUser(
  userId: string,
  data: UpdateUserDto
): Promise<UserResponseDto> {
  return apiPatch<UserResponseDto>(`/users/${userId}`, data)
}

/**
 * Delete a user
 * DELETE /users/:id
 */
export async function deleteUser(userId: string): Promise<void> {
  return apiDelete(`/users/${userId}`)
}

// ============================================================================
// USER ASSIGNMENTS
// ============================================================================

/**
 * School assignment type
 */
export interface SchoolAssignment {
  schoolId: string
  schoolName: string
  role: string
}

interface UserAssignmentsResponse {
  userId: string
  assignments: SchoolAssignment[]
}

/**
 * Get user's school assignments
 * GET /users/:id/assignments
 */
export async function getUserAssignments(userId: string): Promise<SchoolAssignment[]> {
  const response = await apiGet<UserAssignmentsResponse>(`/users/${userId}/assignments`)
  return response.assignments
}

/**
 * Assign role to user
 * POST /users/:id/roles
 */
export async function assignRole(userId: string, data: AssignRoleDto): Promise<void> {
  return apiPost(`/users/${userId}/roles`, data)
}

// ============================================================================
// SECURITY
// ============================================================================

export interface SecurityOverview {
  userId: string
  email: string
  mfaEnabled: boolean
  mfaMethod: 'totp' | 'sms' | null
  lastLoginAt: string | null
  lastLoginIp: string | null
  lastLoginDevice: string | null
  passwordLastChangedAt: string | null
  accountLocked: boolean
  failedLoginAttempts: number
  activeSessions: number
  securityScore: number
  recommendations: string[]
}

export interface UserSession {
  sessionId: string
  createdAt: string
  lastActivityAt: string
  expiresAt: string
  ipAddress: string
  userAgent: string
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown'
  browser: string
  os: string
  location: string | null
  isCurrent: boolean
}

export interface SessionsResponse {
  sessions: UserSession[]
  total: number
  currentSessionId: string
}

/**
 * Get user security overview
 * GET /users/:id/security
 */
export async function getUserSecurity(userId: string): Promise<SecurityOverview> {
  return apiGet<SecurityOverview>(`/users/${userId}/security`)
}

/**
 * Get user's active sessions
 * GET /users/:id/security/sessions
 */
export async function getUserSessions(userId: string): Promise<SessionsResponse> {
  return apiGet<SessionsResponse>(`/users/${userId}/security/sessions`)
}

/**
 * Admin: terminate all of a user's sessions (Sprint 4 / S4.2).
 * POST /sessions/user/:userId/revoke-all — the sessions-module admin surface,
 * which (unlike the security surface) also kills the target's Cognito refresh
 * tokens. TenantAdmin-only on the backend.
 */
export async function revokeUserSessions(
  userId: string
): Promise<{ revokedCount: number }> {
  return apiPost<{ revokedCount: number }>(`/sessions/user/${userId}/revoke-all`, {})
}

// ============================================================================
// EXPORTED SERVICE OBJECT
// ============================================================================

export const peopleService = {
  // User CRUD
  getUser,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  // Assignments
  getUserAssignments,
  assignRole,
  // Security
  getUserSecurity,
  getUserSessions,
  revokeUserSessions,
}
