/**
 * People Service
 * 
 * Service for fetching user data.
 */

import { apiGet, apiPost } from '../lib/api'
import type { GlobalRole } from '@edforge/types'
import type { AssignRoleDto } from '@edforge/shared-types'

export interface SchoolAssignment {
    schoolId: string
    schoolName: string
    role: string
}

// ============================================================================
// TYPES
// ============================================================================

export interface UserAddress {
    street: string
    street2?: string
    city: string
    state: string
    postalCode: string
    country: string
}

export interface UserResponseDto {
    userId: string
    email: string
    firstName: string
    lastName: string
    middleName?: string
    displayName?: string
    phone?: string
    avatarUrl?: string
    address?: UserAddress
    globalRole: GlobalRole
    status: 'pending' | 'active' | 'inactive' | 'suspended'
    createdAt: string
    updatedAt: string
}

export interface UserListResponseDto {
    items: UserResponseDto[]
    lastEvaluatedKey?: string
    hasMore: boolean
}

// ============================================================================
// SECURITY TYPES
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

// ============================================================================
// API METHODS
// ============================================================================

/**
 * Get user by ID
 * GET /users/:id
 */
export async function getUser(userId: string): Promise<UserResponseDto> {
    return apiGet<UserResponseDto>(`/users/${userId}`)
}

/**
 * List users
 * GET /users
 */
export async function listUsers(
    limit: number = 20,
    cursor?: string
): Promise<UserListResponseDto> {
    const params: Record<string, any> = { limit }
    if (cursor) params.cursor = cursor

    return apiGet<UserListResponseDto>('/users', params)
}

/**
 * Response type for user assignments endpoint
 */
interface UserAssignmentsResponse {
    userId: string
    assignments: SchoolAssignment[]
}

/**
 * Get user's school assignments
 * GET /users/:id/assignments
 * Note: API returns { userId, assignments } - we extract just the assignments array
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
// SECURITY API METHODS
// ============================================================================

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

export const peopleService = {
    getUser,
    listUsers,
    getUserAssignments,
    assignRole,
    getUserSecurity,
    getUserSessions,
}
