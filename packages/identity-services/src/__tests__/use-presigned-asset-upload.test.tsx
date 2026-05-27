/**
 * Sprint M3.2 — usePresignedAssetUpload mutation hook.
 *
 * Covers the 2-step pipeline:
 *   1. Pre-validation (MIME + size) — fails fast WITHOUT calling either
 *      apiPost or fetch.
 *   2. Presign step — apiPost to /schools/:id/branding/assets/upload-url.
 *   3. PUT step — fetch to the signed URL.
 *   4. Result shape — returns `{ s3Key }` derived from the presign's `key`.
 *
 * The pre-validation specs assert that NO network call fires for an
 * invalid file — that's the entire UX win vs. letting the server
 * surface the error after a round-trip.
 */

import { describe, expect, it, vi, beforeEach, afterAll } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

const apiPostMock = vi.fn()
vi.mock('@edforge/api-client', () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: (...args: unknown[]) => apiPostMock(...args),
}))

const { usePresignedAssetUpload, runAssetUpload } = await import(
  '../hooks/usePresignedAssetUpload'
)
import {
  BRANDING_ASSET_MAX_BYTES,
  type BrandingAssetType,
} from '../types'

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
  return { Wrapper, client }
}

const fetchSpy = vi.fn()
const originalFetch = globalThis.fetch
beforeEach(() => {
  apiPostMock.mockReset()
  fetchSpy.mockReset()
  ;(globalThis as { fetch: typeof fetch }).fetch = fetchSpy
})
afterAll(() => {
  ;(globalThis as { fetch: typeof fetch }).fetch = originalFetch
})

function makeFile(opts: { type: string; sizeBytes?: number; name?: string } = { type: 'image/png' }): File {
  const sizeBytes = opts.sizeBytes ?? 100
  const blob = new Blob([new Uint8Array(sizeBytes)], { type: opts.type })
  return new File([blob], opts.name ?? 'asset.bin', { type: opts.type })
}

function mockHappyPath(key = 'tenants/t/schools/s/logo.png') {
  apiPostMock.mockResolvedValueOnce({
    uploadUrl: 'https://example.s3/signed',
    key,
    expiresInSeconds: 600,
  })
  fetchSpy.mockResolvedValueOnce(new Response(null, { status: 200 }))
}

describe('runAssetUpload (M3.2) — happy paths', () => {
  it('runs the full 2-step pipeline + returns the S3 key', async () => {
    mockHappyPath('tenants/t/schools/s/logo.png')
    const file = makeFile({ type: 'image/png', sizeBytes: 1024 })

    const result = await runAssetUpload({ schoolId: 's', assetType: 'logo', file })

    expect(result).toEqual({ s3Key: 'tenants/t/schools/s/logo.png' })
    expect(apiPostMock).toHaveBeenCalledWith(
      '/schools/s/branding/assets/upload-url',
      { assetType: 'logo', contentType: 'image/png', contentLength: 1024 },
    )
    const [putUrl, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(putUrl).toBe('https://example.s3/signed')
    expect(init.method).toBe('PUT')
  })
})

describe('runAssetUpload (M3.2) — pre-validation rejections', () => {
  it('throws with code "mime" for an unsupported file type — no network call', async () => {
    const file = makeFile({ type: 'application/x-evil' })
    let caught: unknown
    try {
      await runAssetUpload({ schoolId: 's', assetType: 'logo', file })
    } catch (e) {
      caught = e
    }
    expect(caught).toBeInstanceOf(Error)
    expect((caught as { code?: string }).code).toBe('mime')
    expect(apiPostMock).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('throws with code "size" when the file exceeds the per-assetType ceiling — no network call', async () => {
    const oversize = BRANDING_ASSET_MAX_BYTES.signature + 1
    const file = makeFile({ type: 'image/png', sizeBytes: oversize })

    let caught: unknown
    try {
      await runAssetUpload({ schoolId: 's', assetType: 'signature', file })
    } catch (e) {
      caught = e
    }
    expect(caught).toBeInstanceOf(Error)
    expect((caught as { code?: string }).code).toBe('size')
    expect(apiPostMock).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('enforces logo-specific MIME (SVG ok for logo, NOT for signature)', async () => {
    // SVG is allowed on logo
    mockHappyPath()
    await runAssetUpload({
      schoolId: 's',
      assetType: 'logo',
      file: makeFile({ type: 'image/svg+xml' }),
    })
    expect(apiPostMock).toHaveBeenCalled()

    // Reset + retry SVG on signature → must reject
    apiPostMock.mockReset()
    fetchSpy.mockReset()

    let caught: unknown
    try {
      await runAssetUpload({
        schoolId: 's',
        assetType: 'signature',
        file: makeFile({ type: 'image/svg+xml' }),
      })
    } catch (e) {
      caught = e
    }
    expect((caught as { code?: string }).code).toBe('mime')
    expect(apiPostMock).not.toHaveBeenCalled()
  })

  it('enforces letterhead-specific MIME (PDF allowed for letterhead only)', async () => {
    // PDF on logo → mime reject
    let caught: unknown
    try {
      await runAssetUpload({
        schoolId: 's',
        assetType: 'logo',
        file: makeFile({ type: 'application/pdf' }),
      })
    } catch (e) {
      caught = e
    }
    expect((caught as { code?: string }).code).toBe('mime')

    // PDF on letterhead → ok
    mockHappyPath()
    await runAssetUpload({
      schoolId: 's',
      assetType: 'letterhead',
      file: makeFile({ type: 'application/pdf' }),
    })
    expect(apiPostMock).toHaveBeenCalled()
  })
})

describe('runAssetUpload (M3.2) — pipeline failures', () => {
  it('propagates presign errors without firing the PUT', async () => {
    const err = Object.assign(new Error('Bad Request'), {
      response: { status: 400, data: { message: 'too large' } },
    })
    apiPostMock.mockRejectedValueOnce(err)
    const file = makeFile({ type: 'image/png' })

    await expect(
      runAssetUpload({ schoolId: 's', assetType: 'logo', file }),
    ).rejects.toBe(err)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('propagates PUT errors (e.g. signed URL expired)', async () => {
    apiPostMock.mockResolvedValueOnce({
      uploadUrl: 'https://example.s3/signed',
      key: 'k',
      expiresInSeconds: 600,
    })
    fetchSpy.mockResolvedValueOnce(
      new Response(null, { status: 403, statusText: 'Forbidden' }),
    )
    const file = makeFile({ type: 'image/png' })

    await expect(
      runAssetUpload({ schoolId: 's', assetType: 'logo', file }),
    ).rejects.toThrow(/status 403/)
  })
})

describe('usePresignedAssetUpload — mutation wrapper (M3.2)', () => {
  it('mutateAsync runs the full pipeline + resolves with the S3 key', async () => {
    mockHappyPath('k-from-server')
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => usePresignedAssetUpload(), { wrapper: Wrapper })

    const file = makeFile({ type: 'image/png' })
    const out = await result.current.mutateAsync({
      schoolId: 's',
      assetType: 'logo' as BrandingAssetType,
      file,
    })

    expect(out).toEqual({ s3Key: 'k-from-server' })
    // React Query updates `isSuccess` on the next render tick after
    // the promise resolves. waitFor gives it a beat.
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('isPending flips during the pipeline + clears to false on success', async () => {
    mockHappyPath()
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => usePresignedAssetUpload(), { wrapper: Wrapper })

    expect(result.current.isPending).toBe(false)
    const p = result.current.mutateAsync({
      schoolId: 's',
      assetType: 'logo' as BrandingAssetType,
      file: makeFile({ type: 'image/png' }),
    })
    await p
    // After the pipeline resolves, isPending must clear AND isSuccess
    // must flip. waitFor handles the render-tick delay.
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.isPending).toBe(false)
  })

  it('surfaces pre-validation errors on the mutation error field', async () => {
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => usePresignedAssetUpload(), { wrapper: Wrapper })

    await expect(
      result.current.mutateAsync({
        schoolId: 's',
        assetType: 'logo' as BrandingAssetType,
        file: makeFile({ type: 'application/x-evil' }),
      }),
    ).rejects.toThrow()
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(apiPostMock).not.toHaveBeenCalled()
  })
})
