import { describe, it, expect, vi, beforeEach } from 'vitest'

// API Gateway (REST, Lambda proxy) only decodes a base64 binary response when the
// request's Accept header names a binary media type; a browser fetch sends */* and
// would receive base64 text with a PDF content type ("Failed to load PDF document",
// 2026-09-05). Every PDF download therefore states what it accepts.
vi.mock('@edforge/api-client', () => ({
  api: { get: vi.fn(() => Promise.resolve({ data: new Blob(['%PDF-1.3']) })) },
  apiGet: vi.fn(() => Promise.resolve({})),
  apiPost: vi.fn(() => Promise.resolve({})),
  apiPatch: vi.fn(() => Promise.resolve({})),
  apiPostWithStatus: vi.fn(() => Promise.resolve({})),
}))

import { api } from '@edforge/api-client'
import { downloadInvoicePdf } from '../services/invoices.service'
import { downloadReceiptPdf } from '../services/payments.service'

const get = api.get as unknown as ReturnType<typeof vi.fn>

describe('PDF downloads name their media type', () => {
  beforeEach(() => get.mockClear())

  it('invoice PDF asks for application/pdf as a blob', async () => {
    await downloadInvoicePdf('school-1', 'inv-1')
    expect(get).toHaveBeenCalledWith('/finance/schools/school-1/invoices/inv-1/pdf', {
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
    })
  })

  it('receipt PDF asks for application/pdf as a blob', async () => {
    await downloadReceiptPdf('pay-1', 'school-1')
    expect(get).toHaveBeenCalledWith('/finance/payments/pay-1/receipt/pdf', {
      params: { schoolId: 'school-1' },
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
    })
  })
})
