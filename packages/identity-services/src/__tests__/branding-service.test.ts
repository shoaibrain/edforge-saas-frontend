/**
 * Sprint M2.2 — getBranding service.
 *
 * Verifies the thin axios-via-apiGet wrapper:
 *   1. Hits the right URL (schoolId path-encoded).
 *   2. Propagates the response shape as-is (passthrough).
 *   3. Propagates errors as-is (AxiosError shape — consumers branch).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const apiGetMock = vi.fn()
vi.mock('@edforge/api-client', () => ({
  apiGet: (...args: unknown[]) => apiGetMock(...args),
}))

const { getBranding } = await import('../services/branding.service')
import type { BrandingResponse } from '../types'

describe('getBranding (M2.2)', () => {
  beforeEach(() => {
    apiGetMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls GET /schools/:schoolId/branding with URL-encoded schoolId', async () => {
    apiGetMock.mockResolvedValueOnce({ branding: null })
    await getBranding('school-uuid-1')
    expect(apiGetMock).toHaveBeenCalledTimes(1)
    expect(apiGetMock).toHaveBeenCalledWith('/schools/school-uuid-1/branding')
  })

  it('encodes special characters in schoolId (defense in depth)', async () => {
    apiGetMock.mockResolvedValueOnce({ branding: null })
    await getBranding('a/b c')
    expect(apiGetMock).toHaveBeenCalledWith('/schools/a%2Fb%20c/branding')
  })

  it('returns the BrandingResponse payload from apiGet verbatim', async () => {
    const payload: BrandingResponse = {
      branding: {
        formalName: 'Saraswati Higher Secondary School',
        colorPalette: { primary: '#1D9E75', accent: '#378ADD' },
        brandingVersionId: 'v-1',
      },
      urls: {
        logo: 'https://example.s3.amazonaws.com/signed/logo',
      },
    }
    apiGetMock.mockResolvedValueOnce(payload)
    const result = await getBranding('s')
    expect(result).toEqual(payload)
  })

  it('returns the empty-state shape when backend reports null branding', async () => {
    apiGetMock.mockResolvedValueOnce({ branding: null })
    const result = await getBranding('s')
    expect(result).toEqual({ branding: null })
    expect(result.urls).toBeUndefined()
  })

  it('propagates AxiosError-shaped failures unchanged', async () => {
    const err = Object.assign(new Error('Request failed with status code 403'), {
      response: { status: 403, data: { message: 'Forbidden' } },
    })
    apiGetMock.mockRejectedValueOnce(err)
    await expect(getBranding('s')).rejects.toBe(err)
  })
})
