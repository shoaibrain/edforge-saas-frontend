/**
 * Auth Types
 * 
 * Type definitions for AWS Cognito authentication integration.
 */

import type { GlobalRole, SchoolRole } from '@edforge/types'

/**
 * Cognito ID Token payload structure
 * Maps to the custom attributes configured in the User Pool
 */
export interface CognitoIdTokenPayload {
  /** User's unique identifier (UUID) */
  sub: string
  /** User's email address */
  email: string
  /** Email verification status */
  email_verified?: boolean
  /** User's display name */
  name?: string
  /** User's phone number */
  phone_number?: string
  /** Phone verification status */
  phone_number_verified?: boolean
  /** User's profile picture URL */
  picture?: string
  /** User's preferred username */
  preferred_username?: string
  /** User's nickname */
  nickname?: string
  /** User's given (first) name */
  given_name?: string
  /** User's family (last) name */
  family_name?: string

  // Custom Cognito attributes (prefixed with custom:)
  /** Tenant ID the user belongs to */
  'custom:tenantId': string
  /** Tenant name for display */
  'custom:tenantName': string
  /** Tenant subscription tier (BASIC, PROFESSIONAL, ENTERPRISE) */
  'custom:tenantTier': string
  /** Global role: TenantAdmin or TenantUser */
  'custom:userRole': string
  
  // Standard JWT claims
  /** Token issuer */
  iss: string
  /** Audience (client ID) */
  aud: string
  /** Token issued at timestamp */
  iat: number
  /** Token expiration timestamp */
  exp: number
  /** Authentication time */
  auth_time: number
}

/**
 * School assignment from the backend API
 */
export interface SchoolAssignment {
  schoolId: string
  schoolName: string
  role: SchoolRole
}

/**
 * User profile returned from /users/me endpoint
 */
export interface UserProfile {
  id: string
  email: string
  name?: string
  tenantId: string
  tenantName: string
  globalRole: GlobalRole
  assignments: SchoolAssignment[]
  createdAt: string
  updatedAt: string
}

/**
 * Auth configuration for Amplify
 */
export interface AuthConfig {
  userPoolId: string
  userPoolClientId: string
  domain: string
  region: string
  redirectSignIn: string
  redirectSignOut: string
  scopes: string[]
}

/**
 * Auth state for tracking authentication status
 */
export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

/**
 * Auth session containing tokens
 */
export interface AuthSession {
  idToken: string
  accessToken: string
  refreshToken?: string
  expiresAt: number
}

