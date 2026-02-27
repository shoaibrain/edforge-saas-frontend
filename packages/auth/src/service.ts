/**
 * Auth Service
 * 
 * Provides authentication operations using AWS Amplify v6.
 * Handles login, logout, token management, and session state.
 */

import {
  signInWithRedirect,
  signOut,
  fetchAuthSession,
  getCurrentUser,
} from 'aws-amplify/auth'
import { Hub } from 'aws-amplify/utils'
import type { CognitoIdTokenPayload, AuthSession, AuthState } from './types'
import { getAuthConfig } from './config'

/**
 * Initiates OAuth login flow by redirecting to Cognito Hosted UI
 */
export async function login(): Promise<void> {
  await signInWithRedirect()
}

/**
 * Signs out the current user and clears the session
 * Redirects to Cognito logout endpoint
 */
export async function logout(): Promise<void> {
  await signOut({ global: true })
}

/**
 * Gets the current auth session with tokens
 * Returns null if not authenticated
 */
export async function getSession(): Promise<AuthSession | null> {
  try {
    const session = await fetchAuthSession()
    
    if (!session.tokens?.idToken || !session.tokens?.accessToken) {
      return null
    }

    const idToken = session.tokens.idToken.toString()
    const accessToken = session.tokens.accessToken.toString()
    
    // Calculate expiration from the token payload
    const payload = session.tokens.idToken.payload as unknown as CognitoIdTokenPayload
    const expiresAt = payload.exp * 1000 // Convert to milliseconds

    return {
      idToken,
      accessToken,
      expiresAt,
    }
  } catch (error) {
    console.error('Failed to get auth session:', error)
    return null
  }
}

/**
 * Gets the decoded ID token payload
 * Returns null if not authenticated
 */
export async function getIdTokenPayload(): Promise<CognitoIdTokenPayload | null> {
  try {
    const session = await fetchAuthSession()
    
    if (!session.tokens?.idToken) {
      return null
    }

    return session.tokens.idToken.payload as unknown as CognitoIdTokenPayload
  } catch (error) {
    console.error('Failed to get ID token payload:', error)
    return null
  }
}

/**
 * Gets the current ID token string for API authorization
 * Returns null if not authenticated
 */
export async function getIdToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession()
    return session.tokens?.idToken?.toString() ?? null
  } catch (error) {
    console.error('Failed to get ID token:', error)
    return null
  }
}

/**
 * Gets the current access token string
 * Returns null if not authenticated
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession()
    return session.tokens?.accessToken?.toString() ?? null
  } catch (error) {
    console.error('Failed to get access token:', error)
    return null
  }
}

/**
 * Checks if the current session is valid and not expired
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const session = await fetchAuthSession()
    return !!session.tokens?.idToken
  } catch {
    return false
  }
}

/**
 * Forces a token refresh
 * Amplify automatically refreshes tokens, but this can be used to force it
 */
export async function refreshSession(): Promise<AuthSession | null> {
  try {
    const session = await fetchAuthSession({ forceRefresh: true })
    
    if (!session.tokens?.idToken || !session.tokens?.accessToken) {
      return null
    }

    const idToken = session.tokens.idToken.toString()
    const accessToken = session.tokens.accessToken.toString()
    const payload = session.tokens.idToken.payload as unknown as CognitoIdTokenPayload
    const expiresAt = payload.exp * 1000

    return {
      idToken,
      accessToken,
      expiresAt,
    }
  } catch (error) {
    console.error('Failed to refresh session:', error)
    return null
  }
}

/**
 * Gets the currently authenticated user's basic info
 */
export async function getAuthenticatedUser(): Promise<{
  username: string
  userId: string
} | null> {
  try {
    const user = await getCurrentUser()
    return {
      username: user.username,
      userId: user.userId,
    }
  } catch {
    return null
  }
}

/**
 * Subscribe to auth state changes
 * Returns an unsubscribe function
 * 
 * @example
 * ```typescript
 * const unsubscribe = subscribeToAuthChanges((event) => {
 *   if (event === 'signedIn') {
 *     // Handle sign in
 *   } else if (event === 'signedOut') {
 *     // Handle sign out
 *   }
 * })
 * 
 * // Later: unsubscribe()
 * ```
 */
export function subscribeToAuthChanges(
  callback: (event: 'signedIn' | 'signedOut' | 'tokenRefresh' | 'tokenRefresh_failure') => void
): () => void {
  const hubListener = Hub.listen('auth', ({ payload }) => {
    switch (payload.event) {
      case 'signedIn':
        callback('signedIn')
        break
      case 'signedOut':
        callback('signedOut')
        break
      case 'tokenRefresh':
        callback('tokenRefresh')
        break
      case 'tokenRefresh_failure':
        callback('tokenRefresh_failure')
        break
    }
  })

  return hubListener
}

/**
 * Returns the Cognito Hosted UI forgot-password URL.
 * Returns null if Cognito is not configured.
 */
export function getForgotPasswordUrl(): string | null {
  const config = getAuthConfig()
  if (!config) return null
  const redirectUri = encodeURIComponent(config.redirectSignIn)
  return `https://${config.domain}/forgotPassword?client_id=${config.userPoolClientId}&redirect_uri=${redirectUri}&response_type=code&scope=${encodeURIComponent(config.scopes.join(' '))}`
}

/**
 * Handle the OAuth callback after redirect from Cognito
 * This should be called on the callback page/route
 */
export async function handleAuthCallback(): Promise<AuthState> {
  try {
    // Amplify automatically handles the callback and exchanges the code for tokens
    // We just need to check if we're now authenticated
    const authenticated = await isAuthenticated()
    
    return {
      isAuthenticated: authenticated,
      isLoading: false,
      error: null,
    }
  } catch (error) {
    return {
      isAuthenticated: false,
      isLoading: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    }
  }
}

