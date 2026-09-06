import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Issue #347 — every `@Idempotent()` route on the finance service REQUIRES an
 * `Idempotency-Key` header and rejects the request 400 without it. Bulk invoice
 * generation shipped without one, so it failed 100% of the time in production:
 *
 *   POST /finance/schools/<id>/invoices/bulk-generate → 400
 *   "This endpoint requires an 'Idempotency-Key' header (UUID v4 recommended)."
 *
 * These guards pin the header on every route that carries the decorator.
 */
vi.mock('@edforge/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
  apiGet: vi.fn(() => Promise.resolve({})),
  apiPost: vi.fn(() => Promise.resolve({})),
  apiPut: vi.fn(() => Promise.resolve({})),
  apiPatch: vi.fn(() => Promise.resolve({})),
  apiPostWithStatus: vi.fn(() => Promise.resolve({ status: 200, data: {} })),
}))

import { apiPostWithStatus } from '@edforge/api-client'
import { bulkGenerateInvoices } from '../services/invoices.service'

const post = vi.mocked(apiPostWithStatus)

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const dto = {
  academicYear: '2083-academic-year',
  feeStructureIds: ['fee-1'],
  dueDate: '2026-11-15',
} as any

describe('bulk-generate sends the required Idempotency-Key', () => {
  beforeEach(() => post.mockClear())

  it('sends a UUID header on every call', async () => {
    await bulkGenerateInvoices('school-1', dto)

    const [url, , config] = post.mock.calls[0]
    expect(url).toBe('/finance/schools/school-1/invoices/bulk-generate')
    expect(config?.headers?.['Idempotency-Key']).toMatch(UUID_V4)
  })

  it('uses the caller-supplied key so a retried submission is deduplicated', async () => {
    const key = '11111111-2222-4333-8444-555555555555'
    await bulkGenerateInvoices('school-1', dto, { idempotencyKey: key })
    await bulkGenerateInvoices('school-1', dto, { idempotencyKey: key })

    expect(post.mock.calls[0][2]?.headers?.['Idempotency-Key']).toBe(key)
    expect(post.mock.calls[1][2]?.headers?.['Idempotency-Key']).toBe(key)
  })

  it('mints a distinct key per submission when none is supplied', async () => {
    await bulkGenerateInvoices('school-1', dto)
    await bulkGenerateInvoices('school-1', dto)

    const first = post.mock.calls[0][2]?.headers?.['Idempotency-Key']
    const second = post.mock.calls[1][2]?.headers?.['Idempotency-Key']
    expect(first).not.toBe(second)
  })

  it('keeps the async query param alongside the header', async () => {
    await bulkGenerateInvoices('school-1', dto, { async: true })

    const config = post.mock.calls[0][2]
    expect(config?.params).toEqual({ async: true })
    expect(config?.headers?.['Idempotency-Key']).toMatch(UUID_V4)
  })
})
