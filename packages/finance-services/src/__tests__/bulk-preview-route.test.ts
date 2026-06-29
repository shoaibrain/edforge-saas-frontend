import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Route-shape guard for Sprint C.6 + Phase 1 bulk-preview.
 *
 * Pins the exact URL and query-param encoding the bulk-preview hook
 * sends. CSV-not-array encoding matters: the BE's controller parses
 * `studentIds` via `csv.split(',')`, so a frontend sending
 * `?studentIds=a&studentIds=b` (repeated key) would arrive as the
 * string `'b'` and silently mis-resolve. Pin it here.
 *
 * Also pins the Phase 1 customLineItems + skipZeroTotal forward on the
 * bulk-generate POST body.
 */

vi.mock('@edforge/api-client', () => ({
  apiGet: vi.fn(() => Promise.resolve({})),
  apiPost: vi.fn(() => Promise.resolve({ generated: 0, skipped: 0, errors: [] })),
  // Sprint E.5 — bulkGenerateInvoices switched to apiPostWithStatus to
  // discriminate 200 (sync) vs 202 (async). The Phase-1 body-shape assertions
  // below still target the POST body and URL — both arguments are forwarded
  // verbatim to this helper, so the assertions still hold.
  apiPostWithStatus: vi.fn(() =>
    Promise.resolve({ status: 200, data: { generated: 0, skipped: 0, errors: [] } }),
  ),
}))

import { apiGet, apiPostWithStatus } from '@edforge/api-client'
import {
  getBulkPreview,
  bulkGenerateInvoices,
} from '../services/invoices.service'

const mockApiGet = vi.mocked(apiGet)
const mockApiPost = vi.mocked(apiPostWithStatus)

const SCHOOL = 'sch-1'

describe('bulk-preview route shape (Sprint C.6 + Phase 1 counters)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('hits exactly /finance/schools/{schoolId}/invoices/bulk-preview', async () => {
    await getBulkPreview(SCHOOL, { selectionMode: 'students', studentIds: ['a'] })
    expect(mockApiGet).toHaveBeenCalledWith(
      `/finance/schools/${SCHOOL}/invoices/bulk-preview`,
      expect.any(Object),
    )
  })

  it('encodes studentIds[] as a CSV string (NOT a repeated-key array)', async () => {
    await getBulkPreview(SCHOOL, {
      selectionMode: 'students',
      studentIds: ['s1', 's2', 's3'],
    })
    const [, params] = mockApiGet.mock.calls[0]
    expect((params as Record<string, string>).studentIds).toBe('s1,s2,s3')
    expect(Array.isArray((params as Record<string, unknown>).studentIds)).toBe(false)
  })

  it('encodes gradeLevels[] as CSV; encodes feeStructureIds[] as CSV', async () => {
    await getBulkPreview(SCHOOL, {
      selectionMode: 'grades',
      gradeLevels: ['4', '5'],
      feeStructureIds: ['fs1', 'fs2'],
      billingPeriod: '2026-04',
    })
    const [, params] = mockApiGet.mock.calls[0]
    expect(params).toMatchObject({
      selectionMode: 'grades',
      gradeLevels: '4,5',
      feeStructureIds: 'fs1,fs2',
      billingPeriod: '2026-04',
    })
  })

  it('omits empty / undefined params (no &gradeLevels=&studentIds= noise)', async () => {
    await getBulkPreview(SCHOOL, {
      selectionMode: 'students',
      studentIds: ['only'],
      gradeLevels: [], // empty
      // feeStructureIds + billingPeriod absent
    })
    const [, params] = mockApiGet.mock.calls[0]
    expect(params).not.toHaveProperty('gradeLevels')
    expect(params).not.toHaveProperty('feeStructureIds')
    expect(params).not.toHaveProperty('billingPeriod')
  })
})

describe('bulkGenerateInvoices — Phase 1 customLineItems + skipZeroTotal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('forwards customLineItems verbatim in the POST body', async () => {
    await bulkGenerateInvoices(SCHOOL, {
      selectionMode: 'students',
      studentIds: ['s1', 's2'],
      academicYear: '2026',
      feeStructureIds: ['fs1'],
      dueDate: '2026-08-15',
      customLineItems: [
        { name: 'Annual picnic', amount: 500 },
        { name: 'Stationery', amount: 100 },
      ],
    })
    const [, body] = mockApiPost.mock.calls[0]
    expect(body).toMatchObject({
      customLineItems: [
        { name: 'Annual picnic', amount: 500 },
        { name: 'Stationery', amount: 100 },
      ],
    })
  })

  it('forwards skipZeroTotal flag in the POST body', async () => {
    await bulkGenerateInvoices(SCHOOL, {
      selectionMode: 'students',
      studentIds: ['s1'],
      academicYear: '2026',
      feeStructureIds: ['fs1'],
      dueDate: '2026-08-15',
      skipZeroTotal: true,
    })
    const [, body] = mockApiPost.mock.calls[0]
    expect((body as Record<string, unknown>).skipZeroTotal).toBe(true)
  })

  it('omits Phase 1 optionals when caller does not supply them (no nulls leak)', async () => {
    await bulkGenerateInvoices(SCHOOL, {
      selectionMode: 'students',
      studentIds: ['s1'],
      academicYear: '2026',
      feeStructureIds: ['fs1'],
      dueDate: '2026-08-15',
    })
    const [, body] = mockApiPost.mock.calls[0]
    expect(body).not.toHaveProperty('customLineItems')
    expect(body).not.toHaveProperty('skipZeroTotal')
  })
})
