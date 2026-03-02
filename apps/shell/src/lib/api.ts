/**
 * API Client — Shell-specific wrapper
 *
 * Re-exports the shared @edforge/api-client (axios instance + typed helpers)
 * and registers shell-specific response interceptors:
 *   - 401: Clear auth state + redirect to /login
 *   - 403: Toast notification on write operations
 */

import { toast } from 'sonner'
import {
  api,
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
} from '@edforge/api-client'
import type {
  ApiRequestMeta,
  ApiResponse,
  PaginatedResponse,
  ApiError,
  ExtraConfig,
  AxiosError,
  AxiosRequestConfig,
} from '@edforge/api-client'

// ============================================================================
// SHELL-SPECIFIC RESPONSE INTERCEPTORS
// ============================================================================

let isRedirecting = false

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status

    const meta = (error.config as AxiosRequestConfig & { meta?: ApiRequestMeta })?.meta

    // Handle authentication errors
    if (status === 401 && !isRedirecting) {
      if (meta?.skipAuthRedirect) {
        return Promise.reject(error)
      }

      // Import auth store and signOut dynamically to avoid circular dependency
      const { useAuthStore } = await import('../stores/auth.store')
      const { signOut } = await import('aws-amplify/auth')

      // Set a persistent flag to prevent initializeAuth from re-authenticating
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

      // Clear persisted auth cookie
      if (typeof document !== 'undefined') {
        document.cookie = 'edforge-auth=; path=/; max-age=0'
      }

      // Sign out from Cognito (local only)
      try {
        await signOut()
      } catch (signOutError) {
        console.warn('[API] Failed to sign out from Cognito:', signOutError)
      }

      if (window.location.pathname === '/login') {
        return Promise.reject(error)
      }

      isRedirecting = true
      console.warn('[API] Authentication error - redirecting to login')

      window.location.href = '/login'

      setTimeout(() => {
        isRedirecting = false
      }, 2000)
    }

    // Handle authorization errors
    if (status === 403 && !isRedirecting) {
      const errorData = error.response?.data as Record<string, unknown> | undefined
      const message = (errorData?.message as string) || 'You don\'t have permission to perform this action'
      const method = error.config?.method?.toUpperCase()

      if (!meta?.gracefulDegradation && method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        toast.error('Access Denied', { description: message })
      }
    }

    return Promise.reject(error)
  }
)

// ============================================================================
// RE-EXPORTS — existing shell imports continue to work unchanged
// ============================================================================

export {
  api,
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
}

export type {
  ApiRequestMeta,
  ApiResponse,
  PaginatedResponse,
  ApiError,
  ExtraConfig,
}
