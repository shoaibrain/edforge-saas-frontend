import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Route-shape guard for the family-billing additions to invoices.service:
 * provenance read + generate-invoice agreement-override body. Pins the exact
 * URLs + bodies so a refactor can't silently invent a wrong path (the
 * PR#93-class 403-SigV4 failure).
 */

vi.mock('@edforge/api-client', () => ({
  api: { get: vi.fn(() => Promise.resolve({ data: {} })) },
  apiGet: vi.fn(() => Promise.resolve({})),
  apiPost: vi.fn(() => Promise.resolve({})),
  apiPatch: vi.fn(() => Promise.resolve({})),
  apiPostWithStatus: vi.fn(() => Promise.resolve({ status: 200, data: {} })),
}))

import { apiGet, apiPost } from '@edforge/api-client'
import {
  getInvoiceProvenance,
  generateInvoice,
} from '../services/invoices.service'

const mockApiGet = vi.mocked(apiGet)
const mockApiPost = vi.mocked(apiPost)

const SCHOOL = 'sch-1'
const INVOICE = 'inv-1'

const GENERATE_BODY = {
  studentId: 'stu-1',
  academicYear: '2083',
  feeStructureIds: ['fee-1'],
  dueDate: '2026-05-01',
}

describe('invoices.service family-billing route shapes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getInvoiceProvenance → GET .../invoices/:invoiceId/provenance', async () => {
    await getInvoiceProvenance(SCHOOL, INVOICE)
    expect(mockApiGet).toHaveBeenCalledWith(
      `/finance/schools/${SCHOOL}/invoices/${INVOICE}/provenance`,
    )
  })

  it('generateInvoice (no opts) → POST .../invoices with the plain body', async () => {
    await generateInvoice(SCHOOL, GENERATE_BODY)
    expect(mockApiPost).toHaveBeenCalledWith(
      `/finance/schools/${SCHOOL}/invoices`,
      GENERATE_BODY,
    )
  })

  it('generateInvoice (overrideAgreement) → POST .../invoices with overrideAgreement:true on the SAME route', async () => {
    await generateInvoice(SCHOOL, GENERATE_BODY, { overrideAgreement: true })
    expect(mockApiPost).toHaveBeenCalledWith(
      `/finance/schools/${SCHOOL}/invoices`,
      { ...GENERATE_BODY, overrideAgreement: true },
    )
  })

  it('generateInvoice (overrideAgreement:false) → does NOT add the flag', async () => {
    await generateInvoice(SCHOOL, GENERATE_BODY, { overrideAgreement: false })
    expect(mockApiPost).toHaveBeenCalledWith(
      `/finance/schools/${SCHOOL}/invoices`,
      GENERATE_BODY,
    )
  })
})
