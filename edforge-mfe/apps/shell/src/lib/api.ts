/**
 * API Client
 * 
 * Axios-based HTTP client with automatic Cognito JWT token injection.
 * Handles authentication errors and token refresh.
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { getIdToken } from '@edforge/auth'

// ============================================================================
// API CLIENT SETUP
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ============================================================================
// REQUEST INTERCEPTOR
// ============================================================================

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Get the ID token from Cognito session
      const token = await getIdToken()
      
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`)
        console.log('[API] Token injected:', {
          url: config.url,
          tokenLength: token.length,
          tokenPreview: token.substring(0, 50) + '...',
        })
      } else {
        console.warn('[API] No token available for request:', config.url)
      }
    } catch (error) {
      // Not authenticated - let request proceed without token
      // Backend will return 401 if auth is required
      console.warn('[API] Failed to get auth token:', error)
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// ============================================================================
// RESPONSE INTERCEPTOR
// ============================================================================

// Flag to track if we're already handling a redirect (prevent loops)
let isRedirecting = false

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status

    // Handle authentication errors
    if (status === 401 && !isRedirecting) {
      // Import auth store and signOut dynamically to avoid circular dependency
      const { useAuthStore } = await import('../stores/auth.store')
      const { signOut } = await import('aws-amplify/auth')

      // Set a persistent flag to prevent initializeAuth from re-authenticating
      // This flag is only cleared when user explicitly clicks login button
      sessionStorage.setItem('edforge-session-invalidated', 'true')
      
      // Clear auth state synchronously
      useAuthStore.setState({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        tenantName: null,
        tenantTier: null,
        error: 'Session expired. Please log in again.',
      })
      
      // Clear persisted auth data
      localStorage.removeItem('edforge-auth')
      
      // Sign out from Cognito (local only - no global redirect)
      // This clears Amplify's local session so user can login again
      try {
        await signOut()
      } catch (signOutError) {
        console.warn('[API] Failed to sign out from Cognito:', signOutError)
      }

      // Skip redirect if already on login page
      if (window.location.pathname === '/login') {
        return Promise.reject(error)
      }

      isRedirecting = true
      console.warn('[API] Authentication error - redirecting to login')
      
      // Redirect to login immediately (no async operations)
      window.location.href = '/login'

      // Reset flag after a delay
      setTimeout(() => {
        isRedirecting = false
      }, 2000)
    }

    // Handle authorization errors
    if (status === 403 && !isRedirecting) {
      console.warn('[API] Authorization error - access denied')
      // Could redirect to a "forbidden" page if needed
    }

    return Promise.reject(error)
  }
)

// ============================================================================
// TYPED API HELPERS
// ============================================================================

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiError {
  message: string
  code?: string
  details?: Record<string, string[]>
}

/**
 * GET request with typed response
 */
export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const response = await api.get<T>(url, { params })
  return response.data
}

/**
 * POST request with typed body and response
 */
export async function apiPost<T, B = unknown>(url: string, body?: B): Promise<T> {
  const response = await api.post<T>(url, body)
  return response.data
}

/**
 * PUT request with typed body and response
 */
export async function apiPut<T, B = unknown>(url: string, body?: B): Promise<T> {
  const response = await api.put<T>(url, body)
  return response.data
}

/**
 * PATCH request with typed body and response
 */
export async function apiPatch<T, B = unknown>(url: string, body?: B): Promise<T> {
  const response = await api.patch<T>(url, body)
  return response.data
}

/**
 * DELETE request with typed response
 */
export async function apiDelete<T>(url: string): Promise<T> {
  const response = await api.delete<T>(url)
  return response.data
}

