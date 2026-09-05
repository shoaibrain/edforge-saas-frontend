import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Route-shape guard for the payments service.
 *
 * Every assertion below pins a frontend service call to the EXACT path
 * registered on the backend (payments.controller.ts) and in the API
 * Gateway spec (server/lib/tenant-api-prod.json). It exists because PR #93
 * silently rewrote three of these to invented `/finance/schools/:schoolId/...`
 * REST paths that don't exist on the backend — producing 403 SigV4 at
 * runtime (API GW falls through to IAM auth when no route matches).
 *
 * If you change a URL here, change the backend route + API GW spec in the
 * same PR (the three-way route handoff), or this test should fail.
 */

vi.mock('@edforge/api-client', () => ({
  api: { get: vi.fn(() => Promise.resolve({ data: new Blob(['%PDF']) })) },
  apiGet: vi.fn(() => Promise.resolve({})),
  apiPost: vi.fn(() => Promise.resolve({})),
}))

import { api, apiGet, apiPost } from '@edforge/api-client'
import {
  initiatePayment,
  getInvoicePayments,
  getSchoolPayments,
  getPaymentReceipt,
  recordManualPayment,
  voidPayment,
  createRefund,
  downloadReceiptPdf,
} from '../services/payments.service'

const mockApi = vi.mocked(api)
const mockApiGet = vi.mocked(apiGet)
const mockApiPost = vi.mocked(apiPost)

const SCHOOL = 'sch-1'
const PAYMENT = 'pay-1'
const INVOICE = 'inv-1'

describe('payments.service route shapes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getPaymentReceipt → schoolId is a QUERY param, not a path segment', async () => {
    await getPaymentReceipt(PAYMENT, SCHOOL)
    expect(mockApiGet).toHaveBeenCalledWith(
      `/finance/payments/${PAYMENT}/receipt`,
      { schoolId: SCHOOL },
    )
  })

  it('recordManualPayment → POST .../payments/manual (not /record)', async () => {
    await recordManualPayment(SCHOOL, {} as never)
    expect(mockApiPost).toHaveBeenCalledWith(
      `/finance/schools/${SCHOOL}/payments/manual`,
      {},
    )
  })

  it('downloadReceiptPdf → GET .../receipt/pdf with schoolId query param', async () => {
    await downloadReceiptPdf(PAYMENT, SCHOOL)
    expect(mockApi.get).toHaveBeenCalledWith(
      `/finance/payments/${PAYMENT}/receipt/pdf`,
      { params: { schoolId: SCHOOL }, responseType: 'blob', headers: { Accept: 'application/pdf' } },
    )
  })

  it('initiatePayment → POST .../payments/initiate', async () => {
    await initiatePayment(SCHOOL, {} as never)
    expect(mockApiPost).toHaveBeenCalledWith(
      `/finance/schools/${SCHOOL}/payments/initiate`,
      {},
    )
  })

  it('getInvoicePayments → GET .../invoices/:invoiceId/payments', async () => {
    await getInvoicePayments(SCHOOL, INVOICE)
    expect(mockApiGet).toHaveBeenCalledWith(
      `/finance/schools/${SCHOOL}/invoices/${INVOICE}/payments`,
    )
  })

  it('getSchoolPayments → GET .../payments', async () => {
    await getSchoolPayments(SCHOOL)
    expect(mockApiGet).toHaveBeenCalledWith(
      `/finance/schools/${SCHOOL}/payments`,
      undefined,
    )
  })

  it('voidPayment → POST .../payments/:paymentId/void', async () => {
    await voidPayment(SCHOOL, PAYMENT, {} as never)
    expect(mockApiPost).toHaveBeenCalledWith(
      `/finance/schools/${SCHOOL}/payments/${PAYMENT}/void`,
      {},
    )
  })

  it('createRefund → POST .../payments/:paymentId/refund', async () => {
    await createRefund(SCHOOL, PAYMENT, {} as never)
    expect(mockApiPost).toHaveBeenCalledWith(
      `/finance/schools/${SCHOOL}/payments/${PAYMENT}/refund`,
      {},
    )
  })
})
