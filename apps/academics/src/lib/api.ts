/**
 * API Client for Academics MFE
 *
 * Axios-based HTTP client with automatic Cognito JWT token injection.
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { toast } from 'sonner'
import { getIdToken } from '@edforge/auth'

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
        try {
          const payloadBase64 = token.split('.')[1]
          const payload = JSON.parse(atob(payloadBase64))
          const tenantId = payload['custom:tenantId'] as string
          if (tenantId) {
            config.headers.set('X-Tenant-Id', tenantId)
          }
        } catch (parseError) {
          console.warn('[Academics API] Could not parse tenant from token:', parseError)
        }
      }
    } catch (error) {
      console.warn('[Academics API] Failed to get auth token:', error)
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

let isRedirecting = false

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status

    // Handle authentication errors
    if (status === 401 && !isRedirecting) {
      if (window.location.pathname === '/login') {
        return Promise.reject(error)
      }

      isRedirecting = true
      console.warn('[Academics API] Authentication error - redirecting to login')

      // Shell will handle the actual cleanup on re-init
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

      // Only toast on write operations (user explicitly took an action)
      // For reads (GET), let the error bubble to the component for graceful degradation
      const meta = (error.config as any)?.meta as { gracefulDegradation?: boolean } | undefined
      if (!meta?.gracefulDegradation && method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        toast.error('Access Denied', { description: message })
      }
    }

    return Promise.reject(error)
  }
)

// ============================================================================
// DEBUG INSTRUMENTATION
// ============================================================================

const DEBUG = typeof localStorage !== 'undefined' && localStorage.getItem('edforge-debug') === 'true';

/** Fields that must never have their values logged */
const PII_FIELDS = new Set(['dateOfBirth', 'dob', 'ssn', 'socialSecurityNumber', 'medicalInfo', 'medicalNotes', 'healthInfo']);

/** Return an object with PII field values replaced by '[redacted]' */
function safeBodyKeys(body: unknown): Record<string, string> | null {
  if (!body || typeof body !== 'object') return null
  const result: Record<string, string> = {}
  for (const key of Object.keys(body as Record<string, unknown>)) {
    result[key] = PII_FIELDS.has(key) ? '[redacted]' : typeof (body as Record<string, unknown>)[key]
  }
  return result
}

// ============================================================================
// TYPED API HELPERS
// ============================================================================

function unwrapResponse<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data
  }
  return response as T
}

export async function apiGet<T>(
  url: string,
  params?: Record<string, unknown>,
  options?: { signal?: AbortSignal },
): Promise<T> {
  const start = performance.now()
  try {
    const response = await api.get<T>(url, { params, signal: options?.signal })
    if (DEBUG) {
      console.debug('[Academics API] GET', url, {
        params: params ? Object.keys(params) : [],
        status: response.status,
        latency: `${Math.round(performance.now() - start)}ms`,
      })
    }
    return unwrapResponse<T>(response.data)
  } catch (error: any) {
    const status = error?.response?.status
    const message = error?.response?.data?.message || error?.message || 'Unknown error'
    console.error('[Academics API] GET FAILED', url, { status, message })
    throw error
  }
}

export async function apiPost<T, B = unknown>(url: string, body?: B): Promise<T> {
  const start = performance.now()
  try {
    const response = await api.post<T>(url, body)
    if (DEBUG) {
      console.debug('[Academics API] POST', url, {
        bodyKeys: safeBodyKeys(body),
        status: response.status,
        latency: `${Math.round(performance.now() - start)}ms`,
      })
    }
    return unwrapResponse<T>(response.data)
  } catch (error: any) {
    const status = error?.response?.status
    const message = error?.response?.data?.message || error?.message || 'Unknown error'
    console.error('[Academics API] POST FAILED', url, { status, message })
    throw error
  }
}

export async function apiPut<T, B = unknown>(url: string, body?: B): Promise<T> {
  const start = performance.now()
  try {
    const response = await api.put<T>(url, body)
    if (DEBUG) {
      console.debug('[Academics API] PUT', url, {
        bodyKeys: safeBodyKeys(body),
        status: response.status,
        latency: `${Math.round(performance.now() - start)}ms`,
      })
    }
    return unwrapResponse<T>(response.data)
  } catch (error: any) {
    const status = error?.response?.status
    const message = error?.response?.data?.message || error?.message || 'Unknown error'
    console.error('[Academics API] PUT FAILED', url, { status, message })
    throw error
  }
}

export async function apiPatch<T, B = unknown>(url: string, body?: B): Promise<T> {
  const start = performance.now()
  try {
    const response = await api.patch<T>(url, body)
    if (DEBUG) {
      console.debug('[Academics API] PATCH', url, {
        bodyKeys: safeBodyKeys(body),
        status: response.status,
        latency: `${Math.round(performance.now() - start)}ms`,
      })
    }
    return unwrapResponse<T>(response.data)
  } catch (error: any) {
    const status = error?.response?.status
    const message = error?.response?.data?.message || error?.message || 'Unknown error'
    console.error('[Academics API] PATCH FAILED', url, { status, message })
    throw error
  }
}

export async function apiDelete<T>(url: string): Promise<T> {
  const start = performance.now()
  try {
    const response = await api.delete<T>(url)
    if (DEBUG) {
      console.debug('[Academics API] DELETE', url, {
        status: response.status,
        latency: `${Math.round(performance.now() - start)}ms`,
      })
    }
    return unwrapResponse<T>(response.data)
  } catch (error: any) {
    const status = error?.response?.status
    const message = error?.response?.data?.message || error?.message || 'Unknown error'
    console.error('[Academics API] DELETE FAILED', url, { status, message })
    throw error
  }
}
