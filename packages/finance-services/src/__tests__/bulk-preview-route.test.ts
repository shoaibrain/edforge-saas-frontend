import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Route-shape guard for Sprint C.6 — the bulk-preview endpoint must
 * be reached at the exact path the backend controller registers
 * (`GET /finance/schools/:schoolId/invoices/bulk-preview`) AND the
 * query-param shape must match what the controller's `.split(',')`
 * parsing expects (CSV strings, not repeated array params).
 */

vi.mock('@edforge/api-client', () => ({
  apiGet: vi.fn(() => Promise.resolve({
    studentCount: 0,
    eligibleCount: 0,
    duplicateCount: 0,
    estimatedDurationSec: 0,
  })),
  apiPost: vi.fn(),
}))

import { apiGet } from '@edforge/api-client'
import { getBulkPreview } from '../services/invoices.service'

const mockApiGet = vi.mocked(apiGet)

const SCHOOL = 'sch-1'

describe('getBulkPreview route shape (Sprint C.6)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('hits the canonical bulk-preview path', async () => {
    await getBulkPreview(SCHOOL, {
      selectionMode: 'grades',
      gradeLevels: ['4', '5'],
      feeStructureIds: ['fs-1', 'fs-2'],
      billingPeriod: '2026-04',
    })
    expect(mockApiGet).toHaveBeenCalledTimes(1)
    expect(mockApiGet.mock.calls[0][0]).toBe(
      `/finance/schools/${SCHOOL}/invoices/bulk-preview`,
    )
  })

  it('encodes lists as CSV strings (NOT repeated array params)', async () => {
    await getBulkPreview(SCHOOL, {
      selectionMode: 'grades',
      gradeLevels: ['4', '5'],
      feeStructureIds: ['fs-1', 'fs-2'],
      billingPeriod: '2026-04',
    })
    const params = mockApiGet.mock.calls[0][1] as Record<string, string>
    expect(params).toEqual({
      selectionMode: 'grades',
      gradeLevels: '4,5',
      feeStructureIds: 'fs-1,fs-2',
      billingPeriod: '2026-04',
    })
  })

  it('encodes studentIds CSV under selectionMode=students', async () => {
    await getBulkPreview(SCHOOL, {
      selectionMode: 'students',
      studentIds: ['stu-1', 'stu-2', 'stu-3'],
      feeStructureIds: ['fs-1'],
    })
    const params = mockApiGet.mock.calls[0][1] as Record<string, string>
    expect(params.studentIds).toBe('stu-1,stu-2,stu-3')
    expect(params.selectionMode).toBe('students')
    expect(params).not.toHaveProperty('gradeLevels')
  })

  it('omits empty arrays + undefined values entirely', async () => {
    await getBulkPreview(SCHOOL, {
      selectionMode: 'grades',
      gradeLevels: ['4'],
    })
    const params = mockApiGet.mock.calls[0][1] as Record<string, string>
    expect(params).toEqual({
      selectionMode: 'grades',
      gradeLevels: '4',
    })
  })

  it('returns the canonical response shape', async () => {
    mockApiGet.mockResolvedValueOnce({
      studentCount: 100,
      eligibleCount: 85,
      duplicateCount: 15,
      estimatedDurationSec: 26,
    })
    const result = await getBulkPreview(SCHOOL, {
      selectionMode: 'grades',
      gradeLevels: ['ALL'],
      feeStructureIds: ['fs-1'],
    })
    expect(result).toEqual({
      studentCount: 100,
      eligibleCount: 85,
      duplicateCount: 15,
      estimatedDurationSec: 26,
    })
  })
})
