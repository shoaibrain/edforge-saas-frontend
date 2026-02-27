/**
 * API Client
 *
 * Axios-based HTTP client with automatic Cognito JWT token injection.
 * Handles authentication errors and token refresh.
 */

import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { toast } from 'sonner'
import { getIdToken } from '@edforge/auth'

// ============================================================================
// REQUEST META — per-request behavior overrides
// ============================================================================

export interface ApiRequestMeta {
  /** Skip the global 401 → logout redirect for this request.
   *  Use for endpoints where 401 means "wrong input" (e.g. change-password). */
  skipAuthRedirect?: boolean
  /** Skip the global 403 toast for this request. */
  gracefulDegradation?: boolean
}

// ============================================================================
// API CLIENT SETUP
// ============================================================================

// Always use /api prefix — proxied in both environments:
// - Dev: rsbuild dev server proxy (rsbuild.config.ts)
// - Prod: Vercel rewrite rule (vercel.json)
const API_BASE_URL = '/api'

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
    // Generate correlation ID for distributed tracing
    const correlationId = crypto.randomUUID()
    config.headers.set('X-Correlation-Id', correlationId)

    try {
      // Get the ID token from Cognito session (uses shared singleton Amplify instance)
      const token = await getIdToken()

      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`)

        // Extract tenant ID from the JWT token payload for multi-tenant context
        // The token payload contains custom:tenantId from Cognito
        try {
          const payloadBase64 = token.split('.')[1]
          const payload = JSON.parse(atob(payloadBase64))
          const tenantId = payload['custom:tenantId'] as string
          if (tenantId) {
            config.headers.set('X-Tenant-Id', tenantId)
          }
        } catch (parseError) {
          console.warn('[API] Could not parse tenant from token:', parseError)
        }
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

    // Read per-request meta for behavior overrides
    const meta = (error.config as AxiosRequestConfig & { meta?: ApiRequestMeta })?.meta

    // Handle authentication errors
    if (status === 401 && !isRedirecting) {
      // If this request opted out of the global auth redirect (e.g. change-password
      // where 401 means "wrong current password"), just reject normally.
      if (meta?.skipAuthRedirect) {
        return Promise.reject(error)
      }

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

      // Clear persisted auth cookie (store uses cookie, not localStorage)
      if (typeof document !== 'undefined') {
        document.cookie = 'edforge-auth=; path=/; max-age=0'
      }

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
      const errorData = error.response?.data as Record<string, unknown> | undefined
      const message = (errorData?.message as string) || 'You don\'t have permission to perform this action'
      const method = error.config?.method?.toUpperCase()

      // Only toast on write operations (user explicitly took an action)
      // For reads (GET), let the error bubble to the component for graceful degradation
      if (!meta?.gracefulDegradation && method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        toast.error('Access Denied', { description: message })
      }
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
 * Helper to unwrap API response
 * Checks if the response has a 'data' property and returns it, otherwise returns the whole response.
 */
function unwrapResponse<T>(response: any): T {
  if (response && typeof response === 'object' && 'data' in response) {
    // Check if it's really a wrapper (e.g. has data and maybe message/meta)
    // or if the actual data just happens to have a 'data' property.
    // In this specific case, based on the error "availableSchools.find is not a function",
    // we know we are getting an object when we expect an array.
    // So if 'data' is an array and we expect an array, it's likely a wrapper.
    return response.data as T
  }
  return response as T
}

/** Optional extra config forwarded to Axios (e.g. meta overrides). */
type ExtraConfig = AxiosRequestConfig & { meta?: ApiRequestMeta }

/**
 * GET request with typed response
 */
export async function apiGet<T>(url: string, params?: Record<string, unknown>, config?: ExtraConfig): Promise<T> {
  const response = await api.get<T>(url, { ...config, params })
  return unwrapResponse<T>(response.data)
}

/**
 * POST request with typed body and response
 */
export async function apiPost<T, B = unknown>(url: string, body?: B, config?: ExtraConfig): Promise<T> {
  const response = await api.post<T>(url, body, config)
  return unwrapResponse<T>(response.data)
}

/**
 * PUT request with typed body and response
 */
export async function apiPut<T, B = unknown>(url: string, body?: B, config?: ExtraConfig): Promise<T> {
  const response = await api.put<T>(url, body, config)
  return unwrapResponse<T>(response.data)
}

/**
 * PATCH request with typed body and response
 */
export async function apiPatch<T, B = unknown>(url: string, body?: B, config?: ExtraConfig): Promise<T> {
  const response = await api.patch<T>(url, body, config)
  return unwrapResponse<T>(response.data)
}

/**
 * DELETE request with typed response
 */
export async function apiDelete<T>(url: string, config?: ExtraConfig): Promise<T> {
  const response = await api.delete<T>(url, config)
  return unwrapResponse<T>(response.data)
}

