/**
 * Route-shape guard for Sprint E.5 — bulk-generate async-vs-sync branch.
 *
 * The BE returns either:
 *   - 200 + { generated, skipped, errors, resolvedStudentCount }  (sync)
 *   - 202 + { jobId }                                             (async)
 *
 * The shapes are disjoint, so the service uses HTTP status (not body
 * inspection) to discriminate. Pin both branches here so a future
 * api-client refactor that drops the status code (and falls back to
 * body-only) fails the test instead of silently regressing the async
 * path to "looks like sync, generated=undefined."
 *
 * Also pins that `?async=true` is forwarded as an axios `params` config
 * when the caller opts into the async path explicitly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@edforge/api-client', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiPostWithStatus: vi.fn(),
}))

import { apiPostWithStatus } from '@edforge/api-client'
import { bulkGenerateInvoices } from '../services/invoices.service'

const mockApiPostWithStatus = vi.mocked(apiPostWithStatus)

const SCHOOL = 'sch-1'

const baseDto = {
  selectionMode: 'students' as const,
  studentIds: ['s1'],
  academicYear: '2026',
  feeStructureIds: ['fs1'],
  dueDate: '2026-08-15',
}

describe('bulkGenerateInvoices — Sprint E.5 sync/async discrimination', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('parses 200 as { mode: "sync", generated, skipped, ... }', async () => {
    mockApiPostWithStatus.mockResolvedValue({
      status: 200,
      data: {
        generated: 3,
        skipped: 1,
        errors: [],
        resolvedStudentCount: 4,
      },
    })

    const result = await bulkGenerateInvoices(SCHOOL, baseDto)

    expect(result).toEqual({
      mode: 'sync',
      generated: 3,
      skipped: 1,
      errors: [],
      resolvedStudentCount: 4,
    })
  })

  it('parses 202 as { mode: "async", jobId }', async () => {
    mockApiPostWithStatus.mockResolvedValue({
      status: 202,
      data: { jobId: 'job-abc-123' },
    })

    const result = await bulkGenerateInvoices(SCHOOL, baseDto)

    expect(result).toEqual({ mode: 'async', jobId: 'job-abc-123' })
  })

  it('hits exactly /finance/schools/{schoolId}/invoices/bulk-generate', async () => {
    mockApiPostWithStatus.mockResolvedValue({
      status: 200,
      data: { generated: 0, skipped: 0, errors: [] },
    })
    await bulkGenerateInvoices(SCHOOL, baseDto)
    const [url, body, config] = mockApiPostWithStatus.mock.calls[0]
    expect(url).toBe(`/finance/schools/${SCHOOL}/invoices/bulk-generate`)
    expect(body).toEqual(baseDto)
    // The route is @Idempotent() server-side and 400s without this header (#347).
    expect(config?.headers?.['Idempotency-Key']).toEqual(expect.any(String))
  })

  it('forwards ?async=true via axios params when options.async is set', async () => {
    mockApiPostWithStatus.mockResolvedValue({
      status: 202,
      data: { jobId: 'job-forced-async' },
    })
    await bulkGenerateInvoices(SCHOOL, baseDto, { async: true })
    const [url, body, config] = mockApiPostWithStatus.mock.calls[0]
    expect(url).toBe(`/finance/schools/${SCHOOL}/invoices/bulk-generate`)
    expect(body).toEqual(baseDto)
    expect(config?.params).toEqual({ async: true })
    expect(config?.headers?.['Idempotency-Key']).toEqual(expect.any(String))
  })

  it('omits the params config when options.async is omitted (no &async= noise)', async () => {
    mockApiPostWithStatus.mockResolvedValue({
      status: 200,
      data: { generated: 0, skipped: 0, errors: [] },
    })
    await bulkGenerateInvoices(SCHOOL, baseDto)
    const [, , config] = mockApiPostWithStatus.mock.calls[0]
    // The config now always carries the required Idempotency-Key header, but
    // still no `params` unless async was asked for.
    expect(config?.params).toBeUndefined()
  })
})
