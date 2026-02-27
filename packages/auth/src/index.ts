/**
 * @edforge/auth
 * 
 * AWS Cognito authentication library for the EdForge EMIS platform.
 * Provides Amplify configuration, auth service, and user mapping utilities.
 */

// Configuration
export { configureAmplify, getAuthConfig, isAmplifyConfigured } from './config'

// Auth service operations
export {
  login,
  logout,
  getSession,
  getIdToken,
  getAccessToken,
  getIdTokenPayload,
  isAuthenticated,
  refreshSession,
  getAuthenticatedUser,
  subscribeToAuthChanges,
  handleAuthCallback,
  getForgotPasswordUrl,
} from './service'

// User mapping utilities
export {
  mapCognitoToUserIdentity,
  mapCognitoToPartialUserIdentity,
  extractTenantInfo,
  isTenantAdmin,
} from './user-mapper'

// Types
export type {
  CognitoIdTokenPayload,
  SchoolAssignment,
  UserProfile,
  AuthConfig,
  AuthState,
  AuthSession,
} from './types'

