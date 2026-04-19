/**
 * API Client for Analytics MFE
 *
 * Mirrors the per-MFE pattern used by academics/finance/people: each MFE
 * carries its own axios instance + Cognito JWT injection rather than
 * sharing one via the @edforge/api-client workspace package. This avoids
 * Module-Federation singleton hazards with axios + Amplify.
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { toast } from 'sonner'
import { getIdToken } from '@edforge/auth'

const API_BASE_URL = '/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    config.headers.set('X-Correlation-Id', crypto.randomUUID())

    try {
      const token = await getIdToken()
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`)
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          const tenantId = payload['custom:tenantId'] as string
          if (tenantId) config.headers.set('X-Tenant-Id', tenantId)
        } catch (parseError) {
          console.warn('[Analytics API] Could not parse tenant from token:', parseError)
        }
      }
    } catch (error) {
      console.warn('[Analytics API] Failed to get auth token:', error)
    }

    return config
  },
  (error) => Promise.reject(error),
)

let isRedirecting = false

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status

    if (status === 401 && !isRedirecting) {
      if (window.location.pathname === '/login') return Promise.reject(error)
      isRedirecting = true
      window.location.href = '/login'
      setTimeout(() => { isRedirecting = false }, 2000)
    }

    if (status === 403 && !isRedirecting) {
      const errorData = error.response?.data as Record<string, unknown> | undefined
      const message = (errorData?.message as string) || "You don't have permission to view this data"
      const method = error.config?.method?.toUpperCase()
      const meta = (error.config as { meta?: { gracefulDegradation?: boolean } } | undefined)?.meta
      if (!meta?.gracefulDegradation && method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        toast.error('Access Denied', { description: message })
      }
    }

    return Promise.reject(error)
  },
)

function unwrapResponse<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data
  }
  return response as T
}

export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const response = await api.get<T>(url, { params })
  return unwrapResponse<T>(response.data)
}
