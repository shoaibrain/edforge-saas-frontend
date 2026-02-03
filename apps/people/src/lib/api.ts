/**
 * API Client for People MFE
 * 
 * Axios-based HTTP client with automatic Cognito JWT token injection.
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { getIdToken } from '@edforge/auth'

// ============================================================================
// API CLIENT SETUP
// ============================================================================

// In development, use /api proxy path (same origin, no CORS)
// In production, use direct backend URL (CORS handled by backend)
const API_BASE_URL = import.meta.env.DEV
    ? '/api'  // Proxied through rsbuild dev server
    : (import.meta.env.VITE_API_URL || '')  // Direct backend URL

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
            console.warn('[API] Authentication error - redirecting to login')

            // Clear local session storage if needed, but primarily redirect
            // Shell will handle the actual cleanup on re-init
            window.location.href = '/login'

            setTimeout(() => {
                isRedirecting = false
            }, 2000)
        }

        return Promise.reject(error)
    }
)

// ============================================================================
// TYPED API HELPERS
// ============================================================================

function unwrapResponse<T>(response: any): T {
    if (response && typeof response === 'object' && 'data' in response) {
        return response.data as T
    }
    return response as T
}

export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response = await api.get<T>(url, { params })
    return unwrapResponse<T>(response.data)
}

export async function apiPost<T, B = unknown>(url: string, body?: B): Promise<T> {
    const response = await api.post<T>(url, body)
    return unwrapResponse<T>(response.data)
}

export async function apiPut<T, B = unknown>(url: string, body?: B): Promise<T> {
    const response = await api.put<T>(url, body)
    return unwrapResponse<T>(response.data)
}

export async function apiPatch<T, B = unknown>(url: string, body?: B): Promise<T> {
    const response = await api.patch<T>(url, body)
    return unwrapResponse<T>(response.data)
}

export async function apiDelete<T>(url: string): Promise<T> {
    const response = await api.delete<T>(url)
    return unwrapResponse<T>(response.data)
}
