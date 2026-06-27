/**
 * Tests for useUpdateSchoolAttendancePolicy (Story 4).
 *
 * Verifies the write reuses the identity school-config PATCH and that a
 * successful mutation invalidates:
 *   - ['attendance']               (reaches the academics MFE — live reflection)
 *   - ['schoolConfiguration', id]  (the Configuration tab read)
 *   - ['school', id]               (the school header read)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/services/tenant.service', () => ({
  tenantService: {
    updateSchoolConfiguration: vi.fn(),
  },
}))

import { tenantService } from '@/services/tenant.service'
import { useUpdateSchoolAttendancePolicy } from '../useAttendancePolicy'

const SCHOOL_ID = 'school-abc'

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { wrapper, invalidateSpy }
}

describe('useUpdateSchoolAttendancePolicy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(tenantService.updateSchoolConfiguration as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValue({ schoolId: SCHOOL_ID })
  })

  it('PATCHes school configuration with { attendancePolicy } and invalidates the right keys', async () => {
    const { wrapper, invalidateSpy } = makeWrapper()
    const { result } = renderHook(() => useUpdateSchoolAttendancePolicy(SCHOOL_ID), { wrapper })

    result.current.mutate('per_section_granular')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(tenantService.updateSchoolConfiguration).toHaveBeenCalledTimes(1)
    expect(tenantService.updateSchoolConfiguration).toHaveBeenCalledWith(SCHOOL_ID, {
      attendancePolicy: 'per_section_granular',
    })

    const invalidatedKeys = invalidateSpy.mock.calls.map(c => (c[0] as any)?.queryKey)
    expect(invalidatedKeys).toContainEqual(['attendance'])
    expect(invalidatedKeys).toContainEqual(['schoolConfiguration', SCHOOL_ID])
    expect(invalidatedKeys).toContainEqual(['school', SCHOOL_ID])
  })
})
