/**
 * Authenticated File Download Utility
 *
 * Downloads files from API endpoints that require authentication.
 * Uses fetch with the Cognito JWT token instead of window.open,
 * which would open a new tab without auth headers.
 */

import { getIdToken } from '@edforge/auth'

/**
 * Download a file from an authenticated API endpoint.
 *
 * @param url - API path without /api prefix (e.g. "/academics/schools/.../export")
 * @param filename - Desired filename for the download
 */
export async function downloadAuthenticatedFile(
  url: string,
  filename: string,
): Promise<void> {
  const token = await getIdToken()

  if (!token) {
    throw new Error('Authentication token not available. Please log in again.')
  }

  // Extract tenant ID from JWT (same pattern as api.ts interceptor)
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  }
  try {
    const payloadBase64 = token.split('.')[1]
    const payload = JSON.parse(atob(payloadBase64))
    const tenantId = payload['custom:tenantId'] as string
    if (tenantId) {
      headers['X-Tenant-Id'] = tenantId
    }
  } catch {
    // Proceed without tenant header
  }

  const response = await fetch(`/api${url}`, { headers })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Session expired. Please log in again.')
    }
    if (response.status === 403) {
      throw new Error('You do not have permission to export this data.')
    }
    throw new Error(`Export failed with status ${response.status}`)
  }

  // Use filename from Content-Disposition header if available
  const disposition = response.headers.get('Content-Disposition')
  if (disposition) {
    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
    if (match?.[1]) {
      filename = match[1].replace(/['"]/g, '')
    }
  }

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()

  document.body.removeChild(anchor)
  URL.revokeObjectURL(objectUrl)
}
