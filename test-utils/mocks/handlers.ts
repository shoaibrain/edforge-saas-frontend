/**
 * MSW Request Handlers — Payment Endpoints
 *
 * Mock API handlers for all payment-related endpoints.
 * Matches the URL structure used by services in apps/shell/src/services/.
 *
 * Usage:
 *   import { handlers } from './handlers'
 *   const server = setupServer(...handlers)
 *
 * Override per-test:
 *   server.use(http.get('/api/...', () => HttpResponse.json(...)))
 */

import { http, HttpResponse, delay } from 'msw'
import type {
  InitiatePaymentRequest,
  SaveGatewayConfigDto,
  GenerateInvoiceDto,
  UpdateInvoiceDto,
  CreateFeeStructureDto,
} from '@edforge/types'
import {
  feeStructures,
  studentAccounts,
  invoices,
  payments,
  receipts,
  publicGateways,
  gatewayConfigs,
  ledgerEntries,
} from './data'

// ============================================================================
// HELPERS
// ============================================================================

/** Simulate realistic network latency (50–150ms) */
const simulateLatency = () => delay(50 + Math.random() * 100)

/** Wrap data in the standard API response envelope */
function envelope<T>(data: T) {
  return { data }
}

/** Paginated response wrapper */
function paginated<T>(items: T[], page = 1, pageSize = 20) {
  const start = (page - 1) * pageSize
  const data = items.slice(start, start + pageSize)
  return {
    data,
    total: items.length,
    page,
    pageSize,
    totalPages: Math.ceil(items.length / pageSize),
  }
}

// ============================================================================
// INVOICE HANDLERS
// ============================================================================

const invoiceHandlers = [
  // GET /schools/:schoolId/invoices
  http.get('/api/finance/schools/:schoolId/invoices', async ({ request, params }) => {
    await simulateLatency()
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const studentId = url.searchParams.get('studentId')
    const page = Number(url.searchParams.get('page')) || 1
    const pageSize = Number(url.searchParams.get('pageSize')) || 20

    let filtered = invoices.filter((inv) => inv.schoolId === params.schoolId)
    if (status) {
      const statuses = status.split(',')
      filtered = filtered.filter((inv) => statuses.includes(inv.status))
    }
    if (studentId) {
      filtered = filtered.filter((inv) => inv.studentId === studentId)
    }

    return HttpResponse.json(envelope(paginated(filtered, page, pageSize)))
  }),

  // GET /schools/:schoolId/invoices/:invoiceId
  http.get('/api/finance/schools/:schoolId/invoices/:invoiceId', async ({ params }) => {
    await simulateLatency()
    const invoice = invoices.find(
      (inv) => inv.id === params.invoiceId && inv.schoolId === params.schoolId
    )
    if (!invoice) {
      return HttpResponse.json({ message: 'Invoice not found' }, { status: 404 })
    }
    return HttpResponse.json(envelope(invoice))
  }),

  // POST /schools/:schoolId/invoices (generate)
  http.post('/api/finance/schools/:schoolId/invoices', async ({ request, params }) => {
    await simulateLatency()
    const body = (await request.json()) as GenerateInvoiceDto
    const newInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${body.academicYear}-${String(invoices.length + 1).padStart(4, '0')}`,
      studentAccountId: body.studentAccountId,
      studentId: 'student-001',
      studentName: 'Aarav Sharma',
      schoolId: params.schoolId as string,
      schoolName: 'Sunrise Academy',
      academicYear: body.academicYear,
      billingPeriod: body.billingPeriod,
      lineItems: [],
      subtotal: 0,
      taxTotal: 0,
      discountTotal: 0,
      grandTotal: 0,
      amountPaid: 0,
      amountDue: 0,
      currency: 'NPR' as const,
      dueDate: body.dueDate,
      issuedDate: new Date().toISOString().split('T')[0],
      status: 'draft' as const,
      notes: body.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    return HttpResponse.json(envelope(newInvoice), { status: 201 })
  }),

  // PATCH /schools/:schoolId/invoices/:invoiceId
  http.patch('/api/finance/schools/:schoolId/invoices/:invoiceId', async ({ request, params }) => {
    await simulateLatency()
    const body = (await request.json()) as UpdateInvoiceDto
    const invoice = invoices.find(
      (inv) => inv.id === params.invoiceId && inv.schoolId === params.schoolId
    )
    if (!invoice) {
      return HttpResponse.json({ message: 'Invoice not found' }, { status: 404 })
    }
    const updated = { ...invoice, ...body, updatedAt: new Date().toISOString() }
    return HttpResponse.json(envelope(updated))
  }),
]

// ============================================================================
// PAYMENT HANDLERS
// ============================================================================

const paymentHandlers = [
  // POST /schools/:schoolId/payments/initiate
  http.post('/api/finance/schools/:schoolId/payments/initiate', async ({ request }) => {
    await simulateLatency()
    const body = (await request.json()) as InitiatePaymentRequest
    const sessionId = `session-${Date.now()}`

    // Validate invoice exists
    const invoice = invoices.find((inv) => inv.id === body.invoiceId)
    if (!invoice) {
      return HttpResponse.json(
        { message: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Simulate gateway redirect URL
    const gatewayUrls: Record<string, string> = {
      esewa: `https://rc-epay.esewa.com.np/api/epay/main/v2/form?amt=${body.amount}&pid=${sessionId}`,
      khalti: `https://test-pay.khalti.com/?pidx=${sessionId}`,
      fonepay: `https://dev-clientapi.fonepay.com/api/merchantRequest?prn=${sessionId}`,
      connectips: `https://uat.connectips.com/payment?token=${sessionId}`,
      stripe: `https://checkout.stripe.com/c/pay/${sessionId}`,
    }

    const isFormPost = body.gateway === 'esewa'

    return HttpResponse.json(
      envelope({
        paymentSessionId: sessionId,
        redirectUrl: gatewayUrls[body.gateway] || body.returnUrl,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        method: isFormPost ? 'form_post' : 'redirect',
        ...(isFormPost && {
          formData: {
            amount: String(body.amount),
            tax_amount: '0',
            total_amount: String(body.amount),
            transaction_uuid: sessionId,
            product_code: 'EPAYTEST',
            product_service_charge: '0',
            product_delivery_charge: '0',
            success_url: body.returnUrl,
            failure_url: body.cancelUrl,
            signed_field_names: 'total_amount,transaction_uuid,product_code',
            signature: 'mock-signature-for-testing',
          },
        }),
      }),
      { status: 201 }
    )
  }),

  // GET /payments/verify/:sessionId
  http.get('/api/finance/payments/verify/:sessionId', async () => {
    await simulateLatency()
    const payment = payments[0]
    return HttpResponse.json(
      envelope({
        payment: { ...payment, status: 'completed' },
        invoice: {
          id: 'inv-002',
          invoiceNumber: 'INV-2082-0002',
          status: 'paid',
          amountDue: 0,
          grandTotal: 5000,
        },
        receipt: receipts[0],
        status: 'completed',
      })
    )
  }),

  // GET /schools/:schoolId/invoices/:invoiceId/payments
  http.get('/api/finance/schools/:schoolId/invoices/:invoiceId/payments', async ({ params }) => {
    await simulateLatency()
    const invoicePayments = payments.filter((p) => p.invoiceId === params.invoiceId)
    return HttpResponse.json(envelope(invoicePayments))
  }),

  // GET /schools/:schoolId/payments
  http.get('/api/finance/schools/:schoolId/payments', async ({ params }) => {
    await simulateLatency()
    const schoolPayments = payments.filter((p) => p.schoolId === params.schoolId)
    return HttpResponse.json(envelope(schoolPayments))
  }),

  // GET /payments/:paymentId/receipt
  http.get('/api/finance/payments/:paymentId/receipt', async ({ params }) => {
    await simulateLatency()
    const receipt = receipts.find((r) => r.paymentId === params.paymentId)
    if (!receipt) {
      return HttpResponse.json({ message: 'Receipt not found' }, { status: 404 })
    }
    return HttpResponse.json(envelope(receipt))
  }),
]

// ============================================================================
// STUDENT ACCOUNT HANDLERS
// ============================================================================

const studentAccountHandlers = [
  // GET /schools/:schoolId/student-accounts
  http.get('/api/finance/schools/:schoolId/student-accounts', async ({ request, params }) => {
    await simulateLatency()
    const url = new URL(request.url)
    const studentId = url.searchParams.get('studentId')

    let filtered = studentAccounts.filter((sa) => sa.schoolId === params.schoolId)
    if (studentId) {
      filtered = filtered.filter((sa) => sa.studentId === studentId)
    }
    return HttpResponse.json(envelope(filtered))
  }),

  // GET /schools/:schoolId/student-accounts/:accountId/ledger
  http.get('/api/finance/schools/:schoolId/student-accounts/:accountId/ledger', async ({ params }) => {
    await simulateLatency()
    const entries = ledgerEntries.filter((e) => e.studentAccountId === params.accountId)
    return HttpResponse.json(envelope(entries))
  }),
]

// ============================================================================
// FEE STRUCTURE HANDLERS
// ============================================================================

const feeStructureHandlers = [
  // GET /schools/:schoolId/fee-structures
  http.get('/api/finance/schools/:schoolId/fee-structures', async ({ params }) => {
    await simulateLatency()
    const schoolFees = feeStructures.filter((fs) => fs.schoolId === params.schoolId)
    return HttpResponse.json(envelope(schoolFees))
  }),

  // GET /schools/:schoolId/fee-structures/:feeStructureId
  http.get('/api/finance/schools/:schoolId/fee-structures/:feeStructureId', async ({ params }) => {
    await simulateLatency()
    const fee = feeStructures.find(
      (fs) => fs.id === params.feeStructureId && fs.schoolId === params.schoolId
    )
    if (!fee) {
      return HttpResponse.json({ message: 'Fee structure not found' }, { status: 404 })
    }
    return HttpResponse.json(envelope(fee))
  }),

  // POST /schools/:schoolId/fee-structures
  http.post('/api/finance/schools/:schoolId/fee-structures', async ({ request, params }) => {
    await simulateLatency()
    const body = (await request.json()) as CreateFeeStructureDto
    const newFee: FeeStructure = {
      id: `fs-${Date.now()}`,
      schoolId: params.schoolId as string,
      name: body.name,
      description: body.description,
      academicYear: body.academicYear,
      feeType: body.feeType,
      amount: body.amount,
      currency: 'NPR',
      taxRate: body.taxRate ?? 0,
      taxType: body.taxType ?? 'none',
      frequency: body.frequency,
      gradeLevels: body.gradeLevels ?? [],
      isActive: true,
      effectiveFrom: body.effectiveFrom,
      effectiveTo: body.effectiveTo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    return HttpResponse.json(envelope(newFee), { status: 201 })
  }),

  // PUT /schools/:schoolId/fee-structures/:feeStructureId
  http.put('/api/finance/schools/:schoolId/fee-structures/:feeStructureId', async ({ request, params }) => {
    await simulateLatency()
    const body = (await request.json()) as Partial<FeeStructure>
    const existing = feeStructures.find(
      (fs) => fs.id === params.feeStructureId && fs.schoolId === params.schoolId
    )
    if (!existing) {
      return HttpResponse.json({ message: 'Fee structure not found' }, { status: 404 })
    }
    const updated = { ...existing, ...body, updatedAt: new Date().toISOString() }
    return HttpResponse.json(envelope(updated))
  }),

  // DELETE /schools/:schoolId/fee-structures/:feeStructureId
  http.delete('/api/finance/schools/:schoolId/fee-structures/:feeStructureId', async ({ params }) => {
    await simulateLatency()
    const exists = feeStructures.some(
      (fs) => fs.id === params.feeStructureId && fs.schoolId === params.schoolId
    )
    if (!exists) {
      return HttpResponse.json({ message: 'Fee structure not found' }, { status: 404 })
    }
    return new HttpResponse(null, { status: 204 })
  }),
]

// ============================================================================
// PAYMENT GATEWAY HANDLERS
// ============================================================================

const gatewayHandlers = [
  // GET /schools/:schoolId/payment-gateways (public — no credentials)
  http.get('/api/finance/schools/:schoolId/payment-gateways', async ({ request }) => {
    await simulateLatency()
    // Check if it's the admin endpoint
    const url = new URL(request.url)
    if (url.pathname.endsWith('/admin')) return // handled below

    const enabled = publicGateways.filter((gw) => gw.isEnabled)
    return HttpResponse.json(envelope(enabled))
  }),

  // GET /schools/:schoolId/payment-gateways/admin (admin — masked credentials)
  http.get('/api/finance/schools/:schoolId/payment-gateways/admin', async () => {
    await simulateLatency()
    return HttpResponse.json(envelope(gatewayConfigs))
  }),

  // PUT /schools/:schoolId/payment-gateways/:gateway
  http.put('/api/finance/schools/:schoolId/payment-gateways/:gateway', async ({ request, params }) => {
    await simulateLatency()
    const body = (await request.json()) as SaveGatewayConfigDto
    const existing = gatewayConfigs.find((gw) => gw.gateway === params.gateway)

    const updated = {
      id: existing?.id ?? `gw-${Date.now()}`,
      schoolId: params.schoolId as string,
      gateway: params.gateway as string,
      isEnabled: body.isEnabled,
      isTestMode: body.isTestMode,
      displayName: body.displayName ?? params.gateway,
      displayOrder: body.displayOrder ?? 99,
      // Credentials are masked in response — server stored them encrypted
      credentials: Object.fromEntries(
        Object.keys(body.credentials).map((key) => [key, '****'])
      ),
    }
    return HttpResponse.json(envelope(updated))
  }),
]

// ============================================================================
// EXPORT ALL HANDLERS
// ============================================================================

export const handlers = [
  ...invoiceHandlers,
  ...paymentHandlers,
  ...studentAccountHandlers,
  ...feeStructureHandlers,
  ...gatewayHandlers,
]
