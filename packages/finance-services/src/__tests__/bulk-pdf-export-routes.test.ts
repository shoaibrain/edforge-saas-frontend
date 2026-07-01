import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Sprint F.6 route-shape guard for bulk-PDF-export.
 *
 * Pins frontend service calls against the exact F.4 backend routes:
 *   POST /finance/schools/:schoolId/invoices/bulk-pdf-export
 *   GET  /finance/jobs/:jobId
 *
 * Per `feedback_pin_service_urls_with_guard_tests` memory, the
 * three-way handoff (Nest controller + API GW spec + frontend service)
 * is silently invalidated by any URL refactor; this guard catches
 * the regression at unit-test time instead of 403-SigV4 at smoke-test
 * time.
 *
 * Additionally pins:
 *   - The required `Idempotency-Key` UUID header on the POST (the
 *     CORS preflight Allow-Headers must include it — see F.4 P1
 *     review fix-up at server/lib/tenant-api-prod.json:22602).
 *   - The request body shape (invoiceIds + format).
 */

vi.mock('@edforge/api-client', () => ({
  apiGet: vi.fn(() => Promise.resolve({})),
  apiPost: vi.fn(() => Promise.resolve({ jobId: 'job-abc', message: 'ok' })),
}))

import { apiGet, apiPost } from '@edforge/api-client'
import {
  bulkInvoicePdfExport,
  getFinanceJob,
} from '../services/bulk-pdf-export.service'

const mockApiPost = vi.mocked(apiPost)
const mockApiGet = vi.mocked(apiGet)

const SCHOOL = 'sch-1'
const JOB = 'job-fresh-1'
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

describe('bulk-pdf-export.service route shapes (F.6)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ────────────────────────────────────────────────────────────────
  // POST shape — bulkInvoicePdfExport
  // ────────────────────────────────────────────────────────────────
  it('bulkInvoicePdfExport → POST /finance/schools/:schoolId/invoices/bulk-pdf-export', async () => {
    await bulkInvoicePdfExport(SCHOOL, {
      invoiceIds: ['inv-1', 'inv-2', 'inv-3'],
      format: 'zip',
    })

    expect(mockApiPost).toHaveBeenCalledTimes(1)
    const [url, body, config] = mockApiPost.mock.calls[0]

    expect(url).toBe(`/finance/schools/${SCHOOL}/invoices/bulk-pdf-export`)
    expect(body).toEqual({
      invoiceIds: ['inv-1', 'inv-2', 'inv-3'],
      format: 'zip',
    })
    expect(config?.headers).toBeDefined()
    expect((config?.headers as Record<string, string>)['Idempotency-Key']).toMatch(UUID_REGEX)
  })

  it('mints a fresh Idempotency-Key per call (NOT shared across submissions)', async () => {
    await bulkInvoicePdfExport(SCHOOL, { invoiceIds: ['inv-1'], format: 'zip' })
    await bulkInvoicePdfExport(SCHOOL, { invoiceIds: ['inv-2'], format: 'zip' })

    const key1 = (mockApiPost.mock.calls[0][2]?.headers as Record<string, string>)['Idempotency-Key']
    const key2 = (mockApiPost.mock.calls[1][2]?.headers as Record<string, string>)['Idempotency-Key']
    expect(key1).not.toBe(key2)
  })

  it('passes format=zip verbatim (NOT defaulted by the service)', async () => {
    await bulkInvoicePdfExport(SCHOOL, { invoiceIds: ['inv-1'], format: 'zip' })

    const [, body] = mockApiPost.mock.calls[0]
    expect((body as { format: string }).format).toBe('zip')
  })

  // ────────────────────────────────────────────────────────────────
  // GET shape — getFinanceJob
  //
  // CRITICAL: this URL does NOT include schoolId. The D.3 backend
  // controller resolves the school from the job row to honor the
  // 404-not-403 enumerability contract (PR #339). A common refactor
  // mistake is to "normalize" this URL to `/finance/schools/:schoolId/jobs/:jobId`
  // for consistency with the D1-D4 polling URL — DO NOT do that.
  // ────────────────────────────────────────────────────────────────
  it('getFinanceJob → GET /finance/jobs/:jobId (NOT school-scoped per 404-not-403 contract)', async () => {
    mockApiGet.mockResolvedValueOnce({ jobId: JOB, status: 'queued' })

    await getFinanceJob(JOB)

    expect(mockApiGet).toHaveBeenCalledTimes(1)
    const [url] = mockApiGet.mock.calls[0]
    expect(url).toBe(`/finance/jobs/${JOB}`)
    // Specifically NOT this — the most likely-wrong refactor target.
    expect(url).not.toMatch(/^\/finance\/schools\//)
  })
})
