/**
 * Sprint M2.2 — getBranding service.
 *
 * Verifies the thin axios-via-apiGet wrapper:
 *   1. Hits the right URL (schoolId path-encoded).
 *   2. Propagates the response shape as-is (passthrough).
 *   3. Propagates errors as-is (AxiosError shape — consumers branch).
 */

import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const apiGetMock = vi.fn()
const apiPatchMock = vi.fn()
const apiPostMock = vi.fn()
vi.mock('@edforge/api-client', () => ({
  apiGet: (...args: unknown[]) => apiGetMock(...args),
  apiPatch: (...args: unknown[]) => apiPatchMock(...args),
  apiPost: (...args: unknown[]) => apiPostMock(...args),
}))

const {
  getBranding,
  updateBranding,
  presignBrandingUpload,
  uploadAssetToS3,
} = await import('../services/branding.service')
import type {
  BrandingResponse,
  PresignedUploadResponse,
  UpdateBrandingRequest,
} from '../types'

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

describe('presignBrandingUpload (M3.2)', () => {
  beforeEach(() => {
    apiPostMock.mockReset()
  })

  it('POSTs to /schools/:id/branding/assets/upload-url with the asset metadata', async () => {
    const expectedResponse: PresignedUploadResponse = {
      uploadUrl: 'https://example.s3/signed?signature=abc',
      key: 'tenants/t/schools/s/logo.png',
      expiresInSeconds: 600,
    }
    apiPostMock.mockResolvedValueOnce(expectedResponse)
    const result = await presignBrandingUpload('school-1', {
      assetType: 'logo',
      contentType: 'image/png',
      contentLength: 12345,
    })
    expect(apiPostMock).toHaveBeenCalledWith(
      '/schools/school-1/branding/assets/upload-url',
      { assetType: 'logo', contentType: 'image/png', contentLength: 12345 },
    )
    expect(result).toEqual(expectedResponse)
  })

  it('URL-encodes the schoolId path segment', async () => {
    apiPostMock.mockResolvedValueOnce({ uploadUrl: 'x', key: 'k', expiresInSeconds: 1 })
    await presignBrandingUpload('a/b c', {
      assetType: 'signature',
      contentType: 'image/jpeg',
      contentLength: 1,
    })
    expect(apiPostMock).toHaveBeenCalledWith(
      '/schools/a%2Fb%20c/branding/assets/upload-url',
      expect.objectContaining({ assetType: 'signature' }),
    )
  })

  it('propagates server 400 (MIME/size violation) errors unchanged', async () => {
    const err = Object.assign(new Error('Bad Request'), {
      response: { status: 400, data: { message: 'unsupported MIME' } },
    })
    apiPostMock.mockRejectedValueOnce(err)
    await expect(
      presignBrandingUpload('s', {
        assetType: 'logo',
        contentType: 'application/x-evil',
        contentLength: 100,
      }),
    ).rejects.toBe(err)
  })
})

describe('uploadAssetToS3 (M3.2)', () => {
  const fetchSpy = vi.fn()
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    fetchSpy.mockReset()
    ;(globalThis as { fetch: typeof fetch }).fetch = fetchSpy
  })

  afterAll(() => {
    ;(globalThis as { fetch: typeof fetch }).fetch = originalFetch
  })

  it('PUTs the file bytes to the signed URL with Content-Type from the file', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 200 }))
    const file = new File(['logo bytes'], 'logo.png', { type: 'image/png' })

    await uploadAssetToS3('https://example.s3/signed', file)

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://example.s3/signed')
    expect(init.method).toBe('PUT')
    expect(init.body).toBe(file)
    const headers = init.headers as Record<string, string>
    expect(headers['Content-Type']).toBe('image/png')
  })

  it('does NOT attach Authorization or any other auth headers (raw fetch)', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 200 }))
    const file = new File(['x'], 'x.png', { type: 'image/png' })
    await uploadAssetToS3('https://example.s3/signed', file)
    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit
    const headers = init.headers as Record<string, string>
    // The signed URL has its own auth embedded; sending the Cognito
    // bearer token would (a) leak it to the asset CDN and (b) cause
    // S3 to reject the request.
    expect(headers).not.toHaveProperty('Authorization')
    expect(headers).not.toHaveProperty('authorization')
  })

  it('throws when S3 returns a non-2xx status', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 403, statusText: 'Forbidden' }))
    const file = new File(['x'], 'x.png', { type: 'image/png' })
    await expect(uploadAssetToS3('https://example.s3/signed', file)).rejects.toThrow(
      /status 403/,
    )
  })

  it('throws when fetch itself rejects (network error)', async () => {
    fetchSpy.mockRejectedValueOnce(new TypeError('Network down'))
    const file = new File(['x'], 'x.png', { type: 'image/png' })
    await expect(uploadAssetToS3('https://example.s3/signed', file)).rejects.toThrow(
      /Network down/,
    )
  })
})
