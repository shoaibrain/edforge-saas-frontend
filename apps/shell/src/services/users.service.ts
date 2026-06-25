/**
 * Users Service
 * 
 * API client for user management operations.
 * Communicates with the Users API backend.
 */

import { apiGet, apiPatch, apiPost, apiDelete } from '../lib/api'
import type { GlobalRole } from '@edforge/types'

// ============================================================================
// ADDRESS TYPES
// ============================================================================

export interface UserAddress {
  street: string
  street2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

// ============================================================================
// USER TYPES - Matching Backend DTOs
// ============================================================================

/**
 * User response from the API
 */
export interface UserResponseDto {
  userId: string
  email: string
  firstName: string
  lastName: string
  middleName?: string
  displayName?: string
  phone?: string
  phoneCountryCode?: string
  avatarUrl?: string
  address?: UserAddress
  globalRole: GlobalRole
  status: 'pending' | 'active' | 'inactive' | 'suspended'
  lastLoginAt?: string
  mfaEnabled?: boolean
  mfaMethod?: 'totp' | 'sms' | null
  createdAt: string
  updatedAt: string
}

/**
 * Update user request DTO
 * Note: phone should include country code (e.g., "+1 555-123-4567")
 */
export interface UpdateUserDto {
  firstName?: string
  lastName?: string
  displayName?: string
  phone?: string
  avatarUrl?: string
  address?: Partial<UserAddress>
  status?: 'active' | 'inactive' | 'suspended'
}

/**
 * Assign role request DTO
 */
export interface AssignRoleDto {
  schoolId: string
  role: string
  departmentId?: string
  expiresAt?: string
  permissionOverrides?: any[]
}

/**
 * Create user request DTO
 */
export interface CreateUserDto {
  email: string
  firstName: string
  lastName: string
  middleName?: string
  phone?: string
  globalRole?: GlobalRole
}

/**
 * User list response DTO
 */
export interface UserListResponseDto {
  items: UserResponseDto[]
  lastEvaluatedKey?: string
  hasMore: boolean
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

/**
 * Notification channel settings
 */
export interface NotificationChannelSettings {
  email: {
    enabled: boolean
    digest: 'immediate' | 'daily' | 'weekly' | 'never'
  }
  push: {
    enabled: boolean
  }
  sms: {
    enabled: boolean
    phone?: string
  }
}

/**
 * Notification category settings
 */
export interface NotificationCategorySettings {
  announcements: boolean
  attendance: boolean
  grades: boolean
  messages: boolean
  calendar: boolean
  billing: boolean
  security: boolean
}

/**
 * Full notification settings
 */
export interface NotificationSettings {
  channels: NotificationChannelSettings
  categories: NotificationCategorySettings
}

// ============================================================================
// PREFERENCES TYPES
// ============================================================================

/**
 * Raw preferences response from backend (may have flat notification structure)
 */
interface RawUserPreferencesResponse {
  tenantId: string
  userId: string
  theme?: 'light' | 'dark' | 'system'
  language?: string
  timezone?: string
  dateFormat?: string
  timeFormat?: '12h' | '24h'
  weekStartsOn?: 'sunday' | 'monday'
  notifications?: NotificationSettings | {
    // Flat structure from backend
    email?: boolean
    push?: boolean
    sms?: boolean
    digest?: 'immediate' | 'daily' | 'weekly' | 'never'
  }
  defaultSchoolId?: string
  createdAt: string
  updatedAt: string
  version?: number
  // Backend-specific fields to ignore
  entityType?: string
  entityKey?: string
  createdBy?: string
  updatedBy?: string
}

/**
 * User preferences from the API (normalized)
 */
export interface UserPreferences {
  tenantId: string
  userId: string
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  dateFormat: string
  timeFormat: '12h' | '24h'
  weekStartsOn: 'sunday' | 'monday'
  notifications: NotificationSettings
  defaultSchoolId?: string
  createdAt: string
  updatedAt: string
  version: number
}

/**
 * Normalize backend preferences response to frontend expected structure.
 * Handles flat vs nested notification settings and adds defaults for missing fields.
 */
function normalizePreferences(raw: RawUserPreferencesResponse): UserPreferences {
  // Check if notifications is in flat format (backend) vs nested format (frontend)
  const rawNotifications = raw.notifications as any

  let notifications: NotificationSettings

  if (rawNotifications?.channels) {
    // Already in nested format — use actual data, fill in missing categories with defaults
    notifications = {
      channels: rawNotifications.channels,
      categories: {
        announcements: rawNotifications.categories?.announcements ?? true,
        attendance: rawNotifications.categories?.attendance ?? true,
        grades: rawNotifications.categories?.grades ?? true,
        messages: rawNotifications.categories?.messages ?? true,
        calendar: rawNotifications.categories?.calendar ?? true,
        billing: rawNotifications.categories?.billing ?? true,
        security: true, // Always enabled
      },
    }
  } else {
    // Convert flat format to nested format, using actual category data if present
    const emailEnabled = rawNotifications?.email ?? true
    notifications = {
      channels: {
        email: {
          enabled: emailEnabled,
          digest: rawNotifications?.digest ?? 'immediate'
        },
        push: {
          enabled: rawNotifications?.push ?? true
        },
        sms: {
          enabled: rawNotifications?.sms ?? false,
          phone: undefined
        }
      },
      categories: {
        announcements: rawNotifications?.categories?.announcements ?? true,
        attendance: rawNotifications?.categories?.attendance ?? true,
        grades: rawNotifications?.categories?.grades ?? true,
        messages: rawNotifications?.categories?.messages ?? true,
        calendar: rawNotifications?.categories?.calendar ?? true,
        billing: rawNotifications?.categories?.billing ?? true,
        security: true, // Always enabled
      }
    }
  }

  return {
    tenantId: raw.tenantId,
    userId: raw.userId,
    theme: raw.theme ?? 'system',
    language: raw.language ?? 'en-US',
    timezone: raw.timezone ?? 'America/New_York',
    dateFormat: raw.dateFormat ?? 'MM/DD/YYYY',
    timeFormat: raw.timeFormat ?? '12h',
    weekStartsOn: raw.weekStartsOn ?? 'sunday',
    notifications,
    defaultSchoolId: raw.defaultSchoolId,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    version: raw.version ?? 1
  }
}

/**
 * Update preferences request DTO
 */
export interface UpdatePreferencesDto {
  theme?: 'light' | 'dark' | 'system'
  language?: string
  timezone?: string
  dateFormat?: string
  timeFormat?: '12h' | '24h'
  weekStartsOn?: 'sunday' | 'monday'
  notifications?: Partial<NotificationSettings>
  defaultSchoolId?: string
}

/**
 * Prepare notifications for backend.
 * Backend now accepts both flat and nested formats (via z.union).
 * We send nested format directly to preserve categories.
 */
function preparePreferencesForBackend(data: UpdatePreferencesDto): any {
  if (!data.notifications) return data

  const notif = data.notifications as Partial<NotificationSettings>

  // Send nested format directly — backend normalizes on its side
  return {
    ...data,
    notifications: {
      channels: notif.channels,
      categories: notif.categories,
    },
  }
}

// ============================================================================
// AVATAR TYPES
// ============================================================================

/**
 * Presigned URL response for avatar upload
 */
export interface AvatarUploadUrlResponse {
  uploadUrl: string
  avatarUrl: string
  expiresAt: string
}

// ============================================================================
// SECURITY TYPES
// ============================================================================

/**
 * Password change request
 */
export interface ChangePasswordDto {
  currentPassword: string
  newPassword: string
}

/**
 * MFA setup initiation response
 */
export interface MfaSetupResponse {
  secretKey: string
  qrCodeUrl: string
  backupCodes: string[]
}

/**
 * MFA verification request
 */
export interface VerifyMfaDto {
  code: string
}

/**
 * Active session info
 */
export interface UserSession {
  sessionId: string
  deviceName: string
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown'
  browser: string
  os: string
  ipAddress: string
  location?: string
  lastActivityAt: string
  createdAt: string
  isCurrent: boolean
}

/**
 * Login history entry
 */
export interface LoginHistoryEntry {
  id: string
  timestamp: string
  ipAddress: string
  location?: string
  deviceInfo: string
  status: 'success' | 'failed' | 'blocked'
  failureReason?: string
}

/**
 * Security overview
 */
export interface SecurityOverview {
  mfaEnabled: boolean
  mfaMethod?: 'totp' | 'sms' | null
  passwordLastChanged?: string
  lastLoginAt?: string
  activeSessions: number
  recentLoginAttempts: number
  securityScore: number
  recommendations: string[]
}

// ============================================================================
// USER API METHODS
// ============================================================================

/**
 * Get user by ID
 * GET /users/:id
 */
export async function getUser(userId: string): Promise<UserResponseDto> {
  return apiGet<UserResponseDto>(`/users/${userId}`)
}

/**
 * List/search users with optional filters
 * GET /users
 */
export interface ListUsersParams {
  limit?: number
  cursor?: string
  search?: string
  status?: string
  globalRole?: string
  schoolId?: string
  role?: string
}

export async function listUsers(
  params: ListUsersParams = {}
): Promise<UserListResponseDto> {
  const query: Record<string, any> = { limit: params.limit ?? 50 }
  if (params.cursor) query.cursor = params.cursor
  if (params.search) query.search = params.search
  if (params.status) query.status = params.status
  if (params.globalRole) query.globalRole = params.globalRole
  if (params.schoolId) query.schoolId = params.schoolId
  if (params.role) query.role = params.role

  return apiGet<UserListResponseDto>('/users', query)
}

/**
 * Create user
 * POST /users
 */
export async function createUser(data: CreateUserDto): Promise<UserResponseDto> {
  return apiPost<UserResponseDto, CreateUserDto>('/users', data)
}

/**
 * Assign role to user
 * POST /users/:id/roles
 */
export async function assignRole(userId: string, data: AssignRoleDto): Promise<void> {
  return apiPost(`/users/${userId}/roles`, data)
}

/**
 * Update user profile
 * PATCH /users/:id
 */
export async function updateUser(
  userId: string,
  data: UpdateUserDto
): Promise<UserResponseDto> {
  return apiPatch<UserResponseDto, UpdateUserDto>(`/users/${userId}`, data)
}

/**
 * Change user's global role
 * PATCH /users/:id/global-role
 */
export async function changeGlobalRole(
  userId: string,
  newRole: GlobalRole
): Promise<{ userId: string; previousRole: string; newRole: string; sessionsRevoked: number }> {
  // Backend schema is { globalRole } (changeGlobalRoleSchema); sending { newRole }
  // silently fails validation (400). Field name must match.
  return apiPatch(`/users/${userId}/global-role`, { globalRole: newRole })
}

/**
 * Delete user (soft delete)
 * DELETE /users/:id
 */
export async function deleteUser(userId: string): Promise<void> {
  return apiDelete(`/users/${userId}`)
}

/**
 * Get user preferences
 * GET /users/:id/preferences
 * Note: Response is normalized to handle backend flat structure
 */
export async function getPreferences(userId: string): Promise<UserPreferences> {
  const raw = await apiGet<RawUserPreferencesResponse>(`/users/${userId}/preferences`)
  return normalizePreferences(raw)
}

/**
 * Update user preferences
 * PATCH /users/:id/preferences
 * Note: Request is flattened to match backend format, response is normalized
 */
export async function updatePreferences(
  userId: string,
  data: UpdatePreferencesDto
): Promise<UserPreferences> {
  // Prepare notifications for backend (sends nested format with categories)
  const preparedData = preparePreferencesForBackend(data)

  const raw = await apiPatch<RawUserPreferencesResponse, typeof preparedData>(
    `/users/${userId}/preferences`,
    preparedData
  )
  return normalizePreferences(raw)
}

// ============================================================================
// AVATAR API METHODS
// ============================================================================

/**
 * Get presigned URL for avatar upload
 * POST /users/:id/avatar/upload-url
 */
export async function getAvatarUploadUrl(
  userId: string,
  contentType: string = 'image/jpeg'
): Promise<AvatarUploadUrlResponse> {
  return apiPost<AvatarUploadUrlResponse>(`/users/${userId}/avatar/upload-url`, {
    contentType,
  })
}

/**
 * Upload avatar to presigned URL and update user profile
 * This is a client-side helper that:
 * 1. Gets a presigned URL
 * 2. Uploads the file directly to S3
 * 3. Updates the user profile with the new avatar URL
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<UserResponseDto> {
  // Get presigned URL
  const { uploadUrl, avatarUrl } = await getAvatarUploadUrl(userId, file.type)

  // Upload to S3
  await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  })

  // Update user profile with new avatar URL
  return updateUser(userId, { avatarUrl })
}

/**
 * Remove user avatar
 * DELETE /users/:id/avatar
 */
export async function removeAvatar(userId: string): Promise<UserResponseDto> {
  await apiDelete(`/users/${userId}/avatar`)
  return getUser(userId)
}

// ============================================================================
// SECURITY API METHODS
// ============================================================================

/**
 * Get security overview
 * GET /users/:id/security
 */
export async function getSecurityOverview(userId: string): Promise<SecurityOverview> {
  return apiGet<SecurityOverview>(`/users/${userId}/security`)
}

/**
 * Change user password
 * POST /users/:id/security/change-password
 *
 * Uses skipAuthRedirect because the backend may return 401 for "wrong
 * current password" — that is a validation error, not a session expiry.
 */
export async function changePassword(
  userId: string,
  data: ChangePasswordDto
): Promise<{ success: boolean; message: string }> {
  return apiPost(`/users/${userId}/security/change-password`, data, {
    meta: { skipAuthRedirect: true },
  })
}

/**
 * Initiate MFA setup
 * POST /users/:id/security/mfa/setup
 */
export async function initiateMfaSetup(userId: string): Promise<MfaSetupResponse> {
  return apiPost<MfaSetupResponse>(`/users/${userId}/security/mfa/setup`, {})
}

/**
 * Verify and enable MFA
 * POST /users/:id/security/mfa/verify
 */
export async function verifyAndEnableMfa(
  userId: string,
  data: VerifyMfaDto
): Promise<{ success: boolean; backupCodes?: string[] }> {
  return apiPost(`/users/${userId}/security/mfa/verify`, data)
}

/**
 * Disable MFA
 * DELETE /users/:id/security/mfa
 */
export async function disableMfa(
  userId: string,
  password: string
): Promise<{ success: boolean }> {
  return apiPost(`/users/${userId}/security/mfa/disable`, { password })
}

/**
 * Get active sessions
 * GET /users/:id/security/sessions
 */
export async function getActiveSessions(userId: string): Promise<UserSession[]> {
  return apiGet<UserSession[]>(`/users/${userId}/security/sessions`)
}

/**
 * Revoke a specific session
 * DELETE /users/:id/security/sessions/:sessionId
 */
export async function revokeSession(
  userId: string,
  sessionId: string
): Promise<{ success: boolean }> {
  return apiDelete(`/users/${userId}/security/sessions/${sessionId}`)
}

/**
 * Revoke all sessions except current
 * POST /users/:id/security/sessions/revoke-all
 */
export async function revokeAllSessions(
  userId: string
): Promise<{ success: boolean; revokedCount: number }> {
  return apiPost(`/users/${userId}/security/sessions/revoke-all`, {})
}

/**
 * Get login history
 * GET /users/:id/security/login-history
 */
export async function getLoginHistory(
  userId: string,
  limit: number = 10
): Promise<LoginHistoryEntry[]> {
  return apiGet<LoginHistoryEntry[]>(
    `/users/${userId}/security/login-history?limit=${limit}`
  )
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const usersService = {
  // User profile
  getUser,
  listUsers,
  createUser,
  assignRole,
  updateUser,
  changeGlobalRole,
  deleteUser,

  // Preferences
  getPreferences,
  updatePreferences,

  // Avatar
  getAvatarUploadUrl,
  uploadAvatar,
  removeAvatar,

  // Security
  getSecurityOverview,
  changePassword,
  initiateMfaSetup,
  verifyAndEnableMfa,
  disableMfa,
  getActiveSessions,
  revokeSession,
  revokeAllSessions,
  getLoginHistory,
}
