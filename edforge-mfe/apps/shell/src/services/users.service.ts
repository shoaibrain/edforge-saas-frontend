/**
 * Users Service
 * 
 * API client for user management operations.
 * Communicates with the Users API backend.
 */

import { apiGet, apiPatch } from '../lib/api'
import type { GlobalRole } from '@edforge/types'

// ============================================================================
// TYPES - Matching Backend DTOs
// ============================================================================

/**
 * User response from the API
 */
export interface UserResponseDto {
  userId: string
  email: string
  firstName: string
  lastName: string
  displayName?: string
  phone?: string
  avatarUrl?: string
  globalRole: GlobalRole
  status: 'pending' | 'active' | 'inactive' | 'suspended'
  lastLoginAt?: string
  mfaEnabled?: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Update user request DTO
 */
export interface UpdateUserDto {
  firstName?: string
  lastName?: string
  displayName?: string
  phone?: string
  avatarUrl?: string
  status?: 'active' | 'inactive' | 'suspended'
}

/**
 * Notification preferences
 */
export interface NotificationSettings {
  email: {
    enabled: boolean
    digest: 'immediate' | 'daily' | 'weekly' | 'never'
  }
  push: {
    enabled: boolean
  }
  sms: {
    enabled: boolean
  }
  categories: {
    announcements: boolean
    attendance: boolean
    grades: boolean
    messages: boolean
    calendar: boolean
    billing: boolean
  }
}

/**
 * User preferences from the API
 */
export interface UserPreferences {
  tenantId: string
  userId: string
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  dateFormat: string
  notifications: NotificationSettings
  defaultSchoolId?: string
  createdAt: string
  updatedAt: string
  version: number
}

/**
 * Update preferences request DTO
 */
export interface UpdatePreferencesDto {
  theme?: 'light' | 'dark' | 'system'
  language?: string
  timezone?: string
  dateFormat?: string
  notifications?: Partial<NotificationSettings>
  defaultSchoolId?: string
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
 * Get user preferences
 * GET /users/:id/preferences
 */
export async function getPreferences(userId: string): Promise<UserPreferences> {
  return apiGet<UserPreferences>(`/users/${userId}/preferences`)
}

/**
 * Update user preferences
 * PATCH /users/:id/preferences
 */
export async function updatePreferences(
  userId: string,
  data: UpdatePreferencesDto
): Promise<UserPreferences> {
  return apiPatch<UserPreferences, UpdatePreferencesDto>(
    `/users/${userId}/preferences`,
    data
  )
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const usersService = {
  getUser,
  updateUser,
  getPreferences,
  updatePreferences,
}

