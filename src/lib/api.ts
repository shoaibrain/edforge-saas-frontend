/**
 * Axios API Client with Multi-Tenant Interceptors
 *
 * Request interceptor: Injects X-Tenant-ID and Authorization headers
 * Response interceptor: Handles 401/403 errors globally
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { getTenantId } from './tenant'
import { useAuthStore } from '@/stores/auth.store'

// ============================================================================
// API CLIENT SETUP
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

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
  (config: InternalAxiosRequestConfig) => {
    // Inject Tenant ID
    const tenantId = getTenantId()
    if (tenantId) {
      config.headers.set('X-Tenant-ID', tenantId)
    }

    // Inject Authorization token
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`)
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
  (error: AxiosError) => {
    const status = error.response?.status

    // Handle authentication errors
    if (status === 401 && !isRedirecting) {
      isRedirecting = true

      // Clear auth state
      useAuthStore.getState().logout()

      // Redirect to login
      // Using window.location for simplicity; router redirect would require
      // passing router instance or using a different pattern
      window.location.href = '/login'

      // Reset flag after a delay
      setTimeout(() => {
        isRedirecting = false
      }, 1000)
    }

    // Handle authorization errors
    if (status === 403 && !isRedirecting) {
      isRedirecting = true

      // Redirect to forbidden page
      window.location.href = '/forbidden'

      setTimeout(() => {
        isRedirecting = false
      }, 1000)
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

/**
 * GET request with typed response
 */
export async function apiGet<T>(url: string, params?: Record<string, unknown>) {
  const response = await api.get<T>(url, { params })
  return response.data
}

/**
 * POST request with typed body and response
 */
export async function apiPost<T, B = unknown>(url: string, body?: B) {
  const response = await api.post<T>(url, body)
  return response.data
}

/**
 * PUT request with typed body and response
 */
export async function apiPut<T, B = unknown>(url: string, body?: B) {
  const response = await api.put<T>(url, body)
  return response.data
}

/**
 * PATCH request with typed body and response
 */
export async function apiPatch<T, B = unknown>(url: string, body?: B) {
  const response = await api.patch<T>(url, body)
  return response.data
}

/**
 * DELETE request with typed response
 */
export async function apiDelete<T>(url: string) {
  const response = await api.delete<T>(url)
  return response.data
}

export default api

