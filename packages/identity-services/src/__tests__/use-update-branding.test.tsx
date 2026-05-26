/**
 * Sprint M3.1 — useUpdateBranding mutation hook.
 *
 * Verifies the mutation:
 *   1. Calls the underlying PATCH service with the right args.
 *   2. On success, eager-writes the response into the
 *      `brandingKeys.school(schoolId)` cache slot AND invalidates the
 *      same key (so any other subscriber re-fetches).
 *   3. Propagates errors without swallowing them — consumers wire
 *      toasts at the call site.
 *   4. Is safe to call with undefined schoolId (won't crash; mutation
 *      simply won't fire usefully).
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

const apiPatchMock = vi.fn()
vi.mock('@edforge/api-client', () => ({
  apiGet: vi.fn(),
  apiPatch: (...args: unknown[]) => apiPatchMock(...args),
}))

const { useUpdateBranding, brandingKeys } = await import('../hooks/useBranding')
import type { BrandingResponse } from '../types'

function makeFixture() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
  const setQueryDataSpy = vi.spyOn(client, 'setQueryData')
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
  return { Wrapper, client, invalidateSpy, setQueryDataSpy }
}

const RESPONSE: BrandingResponse = {
  branding: {
    formalName: 'New School Name',
    colorPalette: { primary: '#1F4E79', accent: '#FFC000' },
    brandingVersionId: 'v-new',
  },
  urls: { logo: 'https://example.s3/signed/logo-new' },
}

describe('useUpdateBranding (M3.1)', () => {
  beforeEach(() => {
    apiPatchMock.mockReset()
  })

  it('calls PATCH with (schoolId, body) and resolves with the response data', async () => {
    apiPatchMock.mockResolvedValueOnce(RESPONSE)
    const { Wrapper } = makeFixture()
    const { result } = renderHook(() => useUpdateBranding('school-1'), { wrapper: Wrapper })

    result.current.mutate({ formalName: 'New School Name' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiPatchMock).toHaveBeenCalledWith(
      '/schools/school-1/branding',
      { formalName: 'New School Name' },
    )
    expect(result.current.data).toEqual(RESPONSE)
  })

  it('eager-writes the server response into the cache slot on success', async () => {
    apiPatchMock.mockResolvedValueOnce(RESPONSE)
    const { Wrapper, client, setQueryDataSpy } = makeFixture()
    const { result } = renderHook(() => useUpdateBranding('school-1'), { wrapper: Wrapper })

    result.current.mutate({ formalName: 'New School Name' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(setQueryDataSpy).toHaveBeenCalledWith(
      brandingKeys.school('school-1'),
      RESPONSE,
    )
    // Cache reflects the new branding immediately.
    expect(client.getQueryData(brandingKeys.school('school-1'))).toEqual(RESPONSE)
  })

  it('invalidates the school branding query so subscribers re-fetch', async () => {
    apiPatchMock.mockResolvedValueOnce(RESPONSE)
    const { Wrapper, invalidateSpy } = makeFixture()
    const { result } = renderHook(() => useUpdateBranding('school-1'), { wrapper: Wrapper })

    result.current.mutate({})
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: brandingKeys.school('school-1'),
    })
  })

  it('propagates errors to the mutation error field without swallowing', async () => {
    const err = Object.assign(new Error('Bad Request'), {
      response: { status: 400, data: { message: 'Validation failed' } },
    })
    apiPatchMock.mockRejectedValueOnce(err)
    const { Wrapper } = makeFixture()
    const { result } = renderHook(() => useUpdateBranding('school-1'), { wrapper: Wrapper })

    result.current.mutate({ panNumber: '!!!' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBe(err)
  })

  it('does NOT crash if schoolId is undefined (no-op invalidation)', async () => {
    apiPatchMock.mockResolvedValueOnce(RESPONSE)
    const { Wrapper, invalidateSpy } = makeFixture()
    const { result } = renderHook(() => useUpdateBranding(undefined), { wrapper: Wrapper })

    result.current.mutate({ formalName: 'X' })
    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true))

    // Either it errored (apiPatch called with undefined path part — produces "/schools/undefined/branding")
    // OR it succeeded. Either way, invalidate must NOT be called (the success guard checks !schoolId).
    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
