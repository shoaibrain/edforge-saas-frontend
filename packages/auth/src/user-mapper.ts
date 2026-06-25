/**
 * User Mapper
 * 
 * Maps Cognito JWT claims to the application's UserIdentity interface.
 * This bridges the gap between AWS Cognito's attribute structure and
 * the ABAC system's expected user format.
 */

import type { UserIdentity, GlobalRole, SchoolRole } from '@edforge/types'
import type { CognitoIdTokenPayload, SchoolAssignment } from './types'

/**
 * Maps Cognito custom:userRole to GlobalRole type
 */
function mapGlobalRole(cognitoRole: string): GlobalRole {
  if (cognitoRole === 'TenantAdmin') {
    return 'TenantAdmin'
  }
  return 'TenantUser'
}

/**
 * Maps school assignments array to the assignments record format
 * expected by the ABAC system
 */
function mapSchoolAssignments(
  assignments: SchoolAssignment[]
): Record<string, SchoolRole> {
  return assignments.reduce((acc, { schoolId, role }) => {
    acc[schoolId] = role
    return acc
  }, {} as Record<string, SchoolRole>)
}

/**
 * Maps Cognito ID token payload to UserIdentity
 * 
 * @param payload - Decoded Cognito ID token payload
 * @param schoolAssignments - School assignments fetched from the backend API
 * @returns UserIdentity object compatible with ABAC system
 * 
 * @example
 * ```typescript
 * const session = await fetchAuthSession()
 * const payload = session.tokens?.idToken?.payload as CognitoIdTokenPayload
 * const assignments = await tenantService.getUserAssignments(payload.sub)
 * const user = mapCognitoToUserIdentity(payload, assignments)
 * ```
 */
export function mapCognitoToUserIdentity(
  payload: CognitoIdTokenPayload,
  schoolAssignments: SchoolAssignment[]
): UserIdentity {
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name ?? payload.email.split('@')[0],
    displayName: payload.given_name || payload.nickname || payload.preferred_username || undefined,
    globalRole: mapGlobalRole(payload['custom:userRole']),
    tenantId: payload['custom:tenantId'],
    assignments: mapSchoolAssignments(schoolAssignments),
    avatarUrl: payload.picture,
  }
}

/**
 * Creates a minimal UserIdentity from just JWT claims
 * Used when school assignments haven't been fetched yet
 *
 * @param payload - Decoded Cognito ID token payload
 * @returns Partial UserIdentity with empty assignments
 */
export function mapCognitoToPartialUserIdentity(
  payload: CognitoIdTokenPayload
): UserIdentity {
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name ?? payload.email.split('@')[0],
    displayName: payload.given_name || payload.nickname || payload.preferred_username || undefined,
    globalRole: mapGlobalRole(payload['custom:userRole']),
    tenantId: payload['custom:tenantId'],
    assignments: {}, // Will be populated after API call
    avatarUrl: payload.picture,
  }
}

/**
 * Extracts tenant information from Cognito payload
 */
export function extractTenantInfo(payload: CognitoIdTokenPayload): {
  tenantId: string
  tenantName: string
  tenantTier: string
} {
  return {
    tenantId: payload['custom:tenantId'],
    tenantName: payload['custom:tenantName'],
    tenantTier: payload['custom:tenantTier'],
  }
}

/**
 * Checks if the token payload indicates a TenantAdmin user
 */
export function isTenantAdmin(payload: CognitoIdTokenPayload): boolean {
  return payload['custom:userRole'] === 'TenantAdmin'
}

