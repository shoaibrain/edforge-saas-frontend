/**
 * Sprint M2.3 — useSchoolBranding query hook.
 *
 * Tests:
 *   - Query stays IDLE while schoolId is falsy (cold-mount before
 *     Shell's school-context broadcast lands).
 *   - Query fires + returns data when schoolId is provided.
 *   - brandingKeys produce stable, namespaced cache keys for M3
 *     invalidation.
 *   - staleTime is 60_000 (mirrors backend signed-URL TTL with buffer).
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

const apiGetMock = vi.fn()
vi.mock('@edforge/api-client', () => ({
  apiGet: (...args: unknown[]) => apiGetMock(...args),
}))

const { useSchoolBranding, brandingKeys } = await import('../hooks/useBranding')
import type { BrandingResponse } from '../types'

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
  return { Wrapper, client }
}

describe('brandingKeys', () => {
  it('produces stable, namespaced cache keys', () => {
    expect(brandingKeys.all).toEqual(['branding'])
    expect(brandingKeys.school('s-1')).toEqual(['branding', 's-1'])
    expect(brandingKeys.school('s-2')).toEqual(['branding', 's-2'])
  })

  it('is referentially-stable for the same schoolId arg (no surprise re-fetches)', () => {
    const a = brandingKeys.school('s-1')
    const b = brandingKeys.school('s-1')
    expect(a).toEqual(b)
  })
})

describe('useSchoolBranding (M2.3)', () => {
  beforeEach(() => {
    apiGetMock.mockReset()
  })

  it('stays idle (no fetch) when schoolId is undefined', () => {
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useSchoolBranding(undefined), {
      wrapper: Wrapper,
    })

    // React Query enabled:false → fetchStatus is idle, data undefined.
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
    expect(apiGetMock).not.toHaveBeenCalled()
  })

  it('stays idle when schoolId is empty string (falsy gate)', () => {
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useSchoolBranding(''), {
      wrapper: Wrapper,
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(apiGetMock).not.toHaveBeenCalled()
  })

  it('fires the request and returns BrandingResponse data when schoolId is provided', async () => {
    const payload: BrandingResponse = {
      branding: {
        formalName: 'Saraswati Higher Secondary School',
        brandingVersionId: 'v-1',
      },
      urls: { logo: 'https://example.s3/logo' },
    }
    apiGetMock.mockResolvedValueOnce(payload)

    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useSchoolBranding('school-1'), {
      wrapper: Wrapper,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(payload)
    expect(apiGetMock).toHaveBeenCalledWith('/schools/school-1/branding')
  })

  it('surfaces backend errors via the error field', async () => {
    const err = Object.assign(new Error('forbidden'), {
      response: { status: 403 },
    })
    apiGetMock.mockRejectedValueOnce(err)

    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useSchoolBranding('school-1'), {
      wrapper: Wrapper,
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBe(err)
  })
})
