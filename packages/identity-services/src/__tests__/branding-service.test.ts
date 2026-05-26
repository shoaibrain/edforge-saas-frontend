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
const apiPatchMock = vi.fn()
vi.mock('@edforge/api-client', () => ({
  apiGet: (...args: unknown[]) => apiGetMock(...args),
  apiPatch: (...args: unknown[]) => apiPatchMock(...args),
}))

const { getBranding, updateBranding } = await import('../services/branding.service')
import type { BrandingResponse, UpdateBrandingRequest } from '../types'

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

describe('updateBranding (M3.1)', () => {
  beforeEach(() => {
    apiPatchMock.mockReset()
  })

  it('calls PATCH /schools/:schoolId/branding with the partial body', async () => {
    const body: UpdateBrandingRequest = { formalName: 'Saraswati Higher Secondary School' }
    apiPatchMock.mockResolvedValueOnce({ branding: null })
    await updateBranding('school-1', body)
    expect(apiPatchMock).toHaveBeenCalledTimes(1)
    expect(apiPatchMock).toHaveBeenCalledWith('/schools/school-1/branding', body)
  })

  it('URL-encodes the schoolId path segment', async () => {
    apiPatchMock.mockResolvedValueOnce({ branding: null })
    await updateBranding('a/b c', {})
    expect(apiPatchMock).toHaveBeenCalledWith('/schools/a%2Fb%20c/branding', {})
  })

  it('returns the post-update BrandingResponse verbatim', async () => {
    const response: BrandingResponse = {
      branding: {
        formalName: 'New Name',
        colorPalette: { primary: '#005A5B', accent: '#FFC000' },
        brandingVersionId: 'v-after-patch',
      },
      urls: { logo: 'https://example.s3/signed/logo' },
    }
    apiPatchMock.mockResolvedValueOnce(response)
    const result = await updateBranding('s', { formalName: 'New Name' })
    expect(result).toEqual(response)
  })

  it('propagates 400 Zod validation errors unchanged', async () => {
    const err = Object.assign(new Error('Request failed with status code 400'), {
      response: { status: 400, data: { message: 'Validation failed' } },
    })
    apiPatchMock.mockRejectedValueOnce(err)
    await expect(updateBranding('s', { panNumber: '!!!' })).rejects.toBe(err)
  })

  it('propagates 403 permission errors unchanged', async () => {
    const err = Object.assign(new Error('Forbidden'), {
      response: { status: 403 },
    })
    apiPatchMock.mockRejectedValueOnce(err)
    await expect(updateBranding('s', {})).rejects.toBe(err)
  })
})
