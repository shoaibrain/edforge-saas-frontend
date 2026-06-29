/**
 * @edforge/api-client
 *
 * Shared API client with Cognito JWT injection, tenant header extraction,
 * and typed HTTP helpers. Used by shell and all MFE apps via Module Federation
 * singleton to ensure a single configured axios instance.
 *
 * Shell registers response interceptors (401 redirect, 403 toast) on top.
 */

import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import { getIdToken } from '@edforge/auth'

// ============================================================================
// TYPES
// ============================================================================

export interface ApiRequestMeta {
  /** Skip the global 401 → logout redirect for this request. */
  skipAuthRedirect?: boolean
  /** Skip the global 403 toast for this request. */
  gracefulDegradation?: boolean
}

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
 * Extract a human-readable error message from an Axios error response.
 * Falls back to the generic Axios message if the response body has no message.
 */
export function extractApiErrorMessage(error: unknown): string {
  const axiosErr = error as AxiosError<{ message?: string; errors?: Array<{ message?: string }> }>
  const data = axiosErr?.response?.data
  if (data?.message) return data.message
  if (data?.errors?.length) {
    return data.errors.map(e => e.message).filter(Boolean).join('; ')
  }
  if (axiosErr?.message) return axiosErr.message
  return 'An unexpected error occurred'
}

/** Optional extra config forwarded to Axios (e.g. meta overrides). */
export type ExtraConfig = AxiosRequestConfig & { meta?: ApiRequestMeta }

// ============================================================================
// API CLIENT SETUP
// ============================================================================

const API_BASE_URL = '/api'

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ============================================================================
// REQUEST INTERCEPTOR — JWT + tenant + correlation ID
// ============================================================================

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const correlationId = crypto.randomUUID()
    config.headers.set('X-Correlation-Id', correlationId)

    try {
      const token = await getIdToken()

      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`)

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
      console.warn('[API] Failed to get auth token:', error)
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// ============================================================================
// RESPONSE UNWRAPPER
// ============================================================================

function unwrapResponse<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as Record<string, unknown>).data as T
  }
  return response as T
}

// ============================================================================
// TYPED API HELPERS
// ============================================================================

export async function apiGet<T>(
  url: string,
  params?: Record<string, unknown>,
  config?: ExtraConfig,
): Promise<T> {
  const response = await api.get<T>(url, { ...config, params })
  return unwrapResponse<T>(response.data)
}

export async function apiPost<T, B = unknown>(
  url: string,
  body?: B,
  config?: ExtraConfig,
): Promise<T> {
  const response = await api.post<T>(url, body, config)
  return unwrapResponse<T>(response.data)
}

/**
 * POST helper that preserves the HTTP status code alongside the unwrapped
 * body. Use when the caller needs to discriminate 2xx variants — e.g.,
 * `finance/invoices/bulk-generate` returns 200 + { generated, skipped }
 * for sync and 202 + { jobId } for async, and the JSON shape doesn't
 * include the status.
 *
 * Kept as a separate function (not a config flag on `apiPost`) so the
 * common case stays simple and the unwrap behavior is shared verbatim.
 */
export async function apiPostWithStatus<T, B = unknown>(
  url: string,
  body?: B,
  config?: ExtraConfig,
): Promise<{ status: number; data: T }> {
  const response = await api.post<T>(url, body, config)
  return { status: response.status, data: unwrapResponse<T>(response.data) }
}

export async function apiPut<T, B = unknown>(
  url: string,
  body?: B,
  config?: ExtraConfig,
): Promise<T> {
  const response = await api.put<T>(url, body, config)
  return unwrapResponse<T>(response.data)
}

export async function apiPatch<T, B = unknown>(
  url: string,
  body?: B,
  config?: ExtraConfig,
): Promise<T> {
  const response = await api.patch<T>(url, body, config)
  return unwrapResponse<T>(response.data)
}

export async function apiDelete<T>(
  url: string,
  config?: ExtraConfig,
): Promise<T> {
  const response = await api.delete<T>(url, config)
  return unwrapResponse<T>(response.data)
}

// Re-export axios types consumers may need
export type { AxiosError, AxiosInstance, AxiosRequestConfig }
