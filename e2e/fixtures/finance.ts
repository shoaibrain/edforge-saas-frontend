/**
 * Finance MFE mock layer — deterministic `page.route` mocks for the
 * family-billing surfaces (agreements, agreement-aware invoicing, family
 * payments, provenance, dashboard coverage). Layer ON TOP of the shell mocks
 * (mockShellApi) — routes registered later win, so these override the shell
 * catch-all. Follows the e2e/fixtures/attendance.ts capture pattern.
 *
 * Response envelopes are the BACKEND GROUND TRUTH the FE was bitten by:
 *   - lists are wrapped `{ items, hasMore, lastEvaluatedKey? }`
 *   - GET .../agreements/:id/versions is WRAPPED `{ items: [...] }` (the
 *     "t is not iterable" regression) — this fixture never serves a bare array
 *   - detail/mutation responses are bare entities
 *   - 409 bodies are the wire envelope the backend GlobalExceptionFilter
 *     emits — `{ statusCode, errorCode: 'CONFLICT', code, message, ...payload,
 *     timestamp, requestId, path }` — with the domain `code` discriminators
 *     (CONFLICTING_OPEN_INVOICES, AGREEMENT_OVERLAP, AGREEMENT_ACTIVE)
 *   - 400 validation bodies follow the nestjs-zod shape
 *     `{ statusCode, errorCode, message, errors[], details.validationErrors[] }`
 *
 * Reuses the E2E tenant/school constants from role-data.mjs.
 */

import type { Page, Route } from '@playwright/test'
import { E2E_TENANT } from './role-data.mjs'

export const SCHOOL_ID = E2E_TENANT.schoolId
const AY_NAME = E2E_TENANT.academicYearName
const AY_ID = E2E_TENANT.academicYearId

const NOW = '2026-06-01T00:00:00.000Z'

function json(body: unknown, status = 200) {
  return { status, contentType: 'application/json', body: JSON.stringify(body) }
}

/**
 * A 409 exactly as the backend puts it on the wire: the filter envelope plus
 * the domain `code` and payload the service threw. Never serve a bare
 * `{ code, message }` — the FE must be proven against the real shape.
 */
function conflict409(code: string, message: string, payload: Dict = {}) {
  return json(
    {
      statusCode: 409,
      errorCode: 'CONFLICT',
      code,
      message,
      ...payload,
      timestamp: NOW,
      requestId: 'e2e-request',
      path: '/api/finance',
    },
    409,
  )
}

type Dict = Record<string, unknown>

// ---------------------------------------------------------------------------
// Deterministic seed data
// ---------------------------------------------------------------------------

/** Students the finance flows search/pick (academics search shape). */
export const FINANCE_STUDENTS = [
  { studentId: 'stu-aarav', firstName: 'Aarav', lastName: 'Sharma', fullName: 'Aarav Sharma', studentNumber: '001', currentGradeLevel: '9', status: 'active' },
  { studentId: 'stu-bhavna', firstName: 'Bhavna', lastName: 'Poudel', fullName: 'Bhavna Poudel', studentNumber: '002', currentGradeLevel: '9', status: 'active' },
  { studentId: 'stu-chandra', firstName: 'Chandra', lastName: 'Thapa', fullName: 'Chandra Thapa', studentNumber: '003', currentGradeLevel: '10', status: 'active' },
]

// ---------------------------------------------------------------------------
// Factories — each returns a full backend-shaped entity; overrides win.
// ---------------------------------------------------------------------------

/** A family-billing Agreement (bare entity, as detail/mutation responses). */
export function agreement(overrides: Dict = {}): Dict {
  return {
    id: 'agr-1',
    schoolId: SCHOOL_ID,
    title: 'Sharma Family Agreement 2082',
    payer: { name: 'Ram Sharma', phone: '9841000001', email: 'ram@example.com' },
    studentIds: ['stu-aarav', 'stu-bhavna'],
    agreementType: 'fixed_total',
    terms: {
      agreementType: 'fixed_total',
      totalAmount: 60000,
      allocation: [
        { studentId: 'stu-aarav', amount: 40000 },
        { studentId: 'stu-bhavna', amount: 20000 },
      ],
    },
    coveredFeeTypes: ['tuition', 'exam'],
    billingFrequency: 'monthly',
    currency: 'NPR',
    effectiveFrom: '2025-04-14',
    effectiveTo: '2026-04-13',
    status: 'draft',
    version: 1,
    statusHistory: [],
    createdBy: 'e2e-accountant',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

/** An Invoice (bare entity). feeOverrideMode 'catalog' | 'agreement'. */
export function invoice(overrides: Dict = {}): Dict {
  return {
    id: 'inv-1',
    invoiceNumber: 'INV-2082-0001',
    studentAccountId: 'acct-aarav',
    studentId: 'stu-aarav',
    studentName: 'Aarav Sharma',
    schoolId: SCHOOL_ID,
    schoolName: E2E_TENANT.schoolName,
    academicYear: AY_NAME,
    billingPeriod: '2082 Baisakh',
    lineItems: [
      {
        id: 'line-1',
        feeStructureId: 'fee-tuition',
        description: 'Tuition Fee',
        amount: 5000,
        quantity: 1,
        discount: 0,
        taxRate: 0,
        taxAmount: 0,
        total: 5000,
      },
    ],
    subtotal: 5000,
    taxTotal: 0,
    discountTotal: 0,
    grandTotal: 5000,
    amountPaid: 0,
    amountDue: 5000,
    currency: 'NPR',
    dueDate: '2026-08-01',
    issuedDate: '2026-06-01',
    status: 'issued',
    statusHistory: [],
    feeOverrideMode: 'catalog',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

/** A Payment (bare entity, as POST /payments/manual responds). */
export function payment(overrides: Dict = {}): Dict {
  return {
    id: 'pay-1',
    invoiceId: 'inv-1',
    studentAccountId: 'acct-aarav',
    schoolId: SCHOOL_ID,
    amount: 5000,
    currency: 'NPR',
    gateway: 'cash',
    status: 'completed',
    paidAt: NOW,
    paidBy: 'e2e-accountant',
    receiptNumber: 'RCT-2082-0001',
    metadata: {},
    refunds: [],
    studentName: 'Aarav Sharma',
    invoiceNumber: 'INV-2082-0001',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

/** Bare InvoiceProvenance for GET .../invoices/:id/provenance. */
export function provenance(overrides: Dict = {}): Dict {
  return {
    invoiceId: 'inv-1',
    invoiceNumber: 'INV-2082-0001',
    feeOverrideMode: 'agreement',
    agreementId: 'agr-1',
    agreementVersion: 1,
    lines: [
      {
        lineId: 'line-1',
        description: 'Tuition (agreement pricing)',
        source: 'agreement',
        agreementId: 'agr-1',
        agreementVersion: 1,
        agreementTitle: 'Sharma Family Agreement 2082',
        suppressedFeeStructures: [
          { id: 'fee-tuition', name: 'Tuition Fee', feeType: 'tuition' },
        ],
      },
      {
        lineId: 'line-2',
        description: 'Transport Fee',
        source: 'fee_structure',
        feeStructureId: 'fee-transport',
        feeStructureName: 'Transport Fee',
        discount: { amount: 200, ruleName: 'Sibling discount' },
      },
      {
        lineId: 'line-3',
        description: 'Late admission surcharge',
        source: 'custom',
      },
    ],
    ...overrides,
  }
}

/** GET /finance/schools/:sid/families/:fid/open-invoices response. */
export function familyOpenInvoices(overrides: Dict = {}): Dict {
  return {
    students: [
      { studentId: 'stu-aarav', studentName: 'Aarav Sharma' },
      { studentId: 'stu-bhavna', studentName: 'Bhavna Poudel' },
    ],
    openInvoices: [
      { invoiceId: 'inv-fam-1', invoiceNumber: 'INV-2082-0101', studentId: 'stu-aarav', studentName: 'Aarav Sharma', amountDue: 4000, dueDate: '2026-08-01' },
      { invoiceId: 'inv-fam-2', invoiceNumber: 'INV-2082-0102', studentId: 'stu-bhavna', studentName: 'Bhavna Poudel', amountDue: 2500, dueDate: '2026-08-01' },
    ],
    totalDue: 6500,
    suggestedAllocation: [
      { invoiceId: 'inv-fam-1', amount: 4000 },
      { invoiceId: 'inv-fam-2', amount: 2500 },
    ],
    ...overrides,
  }
}

/** GET /academics/students/:studentId/family response (family | null + siblings). */
export function studentFamily(overrides: Dict = {}): Dict {
  return {
    family: {
      id: 'fam-sharma-1',
      schoolId: SCHOOL_ID,
      name: 'Sharma Family',
      primaryContact: { name: 'Ram Sharma', phone: '9841000001' },
      createdBy: 'e2e-accountant',
      createdAt: NOW,
      updatedAt: NOW,
    },
    siblings: [
      { studentId: 'stu-bhavna', studentName: 'Bhavna Poudel', gradeLevel: '9', status: 'active' },
    ],
    ...overrides,
  }
}

/** GET /finance/schools/:sid/dashboard/summary — incl. agreementCoverage. */
export function dashboardSummary(overrides: Dict = {}): Dict {
  return {
    totalInvoiced: 500000,
    totalCollected: 320000,
    outstanding: 180000,
    overdue: 45000,
    collectionRate: 64,
    invoicesByStatus: { draft: 2, issued: 5, paid: 4, overdue: 1 },
    paymentsByGateway: { cash: 6, bank_transfer: 2 },
    byFeeType: [
      { feeType: 'tuition', invoiceCount: 8, totalAmount: 400000, collectedAmount: 260000 },
    ],
    agingReport: [
      { label: '0-30', minDays: 0, maxDays: 30, count: 3, amount: 90000 },
      { label: '31-60', minDays: 31, maxDays: 60, count: 1, amount: 45000 },
    ],
    monthlyCollections: [
      { month: '2026-05', collected: 160000, invoiced: 250000, paymentCount: 4 },
    ],
    byGradeLevel: [
      { gradeLevel: '9', invoiceCount: 6, totalInvoiced: 300000, totalCollected: 200000, outstanding: 100000 },
    ],
    recentPayments: [],
    recentInvoices: [],
    agreementCoverage: {
      studentsCovered: 12,
      activeAgreements: 3,
      invoicedViaAgreement: { count: 5, amount: 250000 },
    },
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Options + capture
// ---------------------------------------------------------------------------

export interface ValidationErrorEntry {
  path: Array<string | number>
  message: string
  code: string
}

export interface FinanceMockOptions {
  /** Agreements list (also serves detail by id). */
  agreements?: Dict[]
  /** Explicit detail override (else looked up from `agreements` by URL id). */
  agreementDetail?: Dict
  /** Version chain — ALWAYS served wrapped as `{ items }` (regression fence). */
  agreementVersions?: Dict[]
  /**
   * Activation behavior:
   *   'ok'       → 200 activated agreement
   *   'conflict' → 409 CONFLICTING_OPEN_INVOICES until the retry body carries
   *                acknowledgeOpenInvoices:true (then 200)
   *   'overlap'  → 409 AGREEMENT_OVERLAP, terminal
   */
  activateResponse?: 'ok' | 'conflict' | 'overlap'
  activateConflicts?: Array<{ invoiceId: string; invoiceNumber: string; grandTotal: number; matchedFeeTypes: string[] }>
  /** POST /agreements: 'ok' → 201 bare agreement; 'validation_error' → nestjs-zod 400. */
  createAgreementResponse?: 'ok' | 'validation_error'
  validationErrors?: ValidationErrorEntry[]
  invoices?: Dict[]
  invoiceDetail?: Dict
  /**
   * Single-generate behavior:
   *   'ok'                          → 201 bare invoice
   *   'agreement_active'            → 409 AGREEMENT_ACTIVE with existingInvoiceId
   *   'agreement_active_no_existing'→ 409 AGREEMENT_ACTIVE WITHOUT existingInvoiceId
   * Both 409 modes succeed (201) when the retry body carries overrideAgreement:true.
   */
  generateResponse?: 'ok' | 'agreement_active' | 'agreement_active_no_existing'
  provenanceBody?: Dict
  dashboard?: Dict
  studentFamilyBody?: Dict
  familyOpenInvoicesBody?: Dict
  feeStructures?: Dict[]
  students?: Dict[]
  manualPaymentResult?: Dict
}

export interface FinanceCapture {
  /** Every non-GET the finance/academics mock layer fulfilled, in order. */
  writes: Array<{ method: string; url: string; body: Dict | undefined }>
  /** Finance-scoped calls only the finance catch-all handled — coverage gaps. */
  unmocked: string[]
}

const DEFAULT_VALIDATION_ERRORS: ValidationErrorEntry[] = [
  {
    path: ['coveredFeeTypes', 0],
    message: 'Covered fee type must be one of tuition, admission, exam, transport, library, lab, hostel, uniform, miscellaneous, custom',
    code: 'invalid_enum_value',
  },
  {
    path: ['billingFrequency'],
    message: 'Billing frequency must be one of one_time, monthly, quarterly, annual',
    code: 'invalid_enum_value',
  },
]

const DEFAULT_CONFLICTS = [
  { invoiceId: 'inv-c1', invoiceNumber: 'INV-2082-0007', grandTotal: 12000, matchedFeeTypes: ['tuition'] },
  { invoiceId: 'inv-c2', invoiceNumber: 'INV-2082-0011', grandTotal: 3500, matchedFeeTypes: ['exam'] },
]

// ---------------------------------------------------------------------------
// mockFinanceApi
// ---------------------------------------------------------------------------

/**
 * Install the finance + supporting academics mocks. Call AFTER the shell
 * fixture has run (it has, when specs import from e2e/fixtures/test.ts and
 * call this in a beforeEach) so these take precedence over the shell
 * catch-all. Returns the capture for write-payload assertions.
 */
export async function mockFinanceApi(page: Page, opts: FinanceMockOptions = {}): Promise<FinanceCapture> {
  const captured: FinanceCapture = { writes: [], unmocked: [] }

  const agreements = opts.agreements ?? [
    agreement({ id: 'agr-1', status: 'active', statusHistory: [{ from: 'draft', to: 'active', changedAt: NOW, changedBy: 'e2e-accountant' }] }),
    agreement({
      id: 'agr-2',
      title: 'Thapa Brothers 2082',
      payer: { name: 'Hari Thapa' },
      studentIds: ['stu-chandra'],
      agreementType: 'per_student',
      terms: {
        agreementType: 'per_student',
        lines: [
          { studentId: 'stu-chandra', feeType: 'tuition', amount: 15000 },
          { studentId: 'stu-chandra', feeType: 'transport', amount: 4000 },
        ],
      },
      coveredFeeTypes: ['tuition', 'transport'],
      status: 'draft',
    }),
  ]
  const invoices = opts.invoices ?? [
    invoice({ id: 'inv-1', invoiceNumber: 'INV-2082-0001', feeOverrideMode: 'agreement', agreementId: 'agr-1', agreementVersion: 1 }),
    invoice({ id: 'inv-2', invoiceNumber: 'INV-2082-0002', studentId: 'stu-bhavna', studentName: 'Bhavna Poudel', status: 'draft', feeOverrideMode: 'catalog' }),
  ]
  const feeStructures = opts.feeStructures ?? [
    { id: 'fee-tuition', schoolId: SCHOOL_ID, name: 'Tuition Fee', feeType: 'tuition', amount: 5000, taxRate: 0, frequency: 'monthly', academicYear: AY_NAME, isActive: true },
    { id: 'fee-exam', schoolId: SCHOOL_ID, name: 'Exam Fee', feeType: 'exam', amount: 1500, taxRate: 0, frequency: 'one_time', academicYear: AY_NAME, isActive: true },
  ]
  const students = opts.students ?? FINANCE_STUDENTS

  const record = (route: Route) => {
    const req = route.request()
    if (req.method() !== 'GET') {
      captured.writes.push({ method: req.method(), url: req.url(), body: req.postDataJSON?.() as Dict | undefined })
    }
  }

  // Finance-scoped catch-all — registered FIRST so every later (more
  // specific) route wins. Anything landing here is a mock-layer gap.
  await page.route('**/api/finance/**', async (route) => {
    const req = route.request()
    record(route)
    captured.unmocked.push(`${req.method()} ${new URL(req.url()).pathname}`)
    await route.fulfill(json({}))
  })

  // ── Workspace settings fallback (FinanceLayout 500ms fallback fetch) ──────
  await page.route('**/api/tenants/my/settings**', (route) =>
    route.fulfill(
      json({
        regional: {
          defaultCurrency: 'NPR',
          defaultTimezone: 'Asia/Kathmandu',
          defaultCalendarSystem: 'gregorian',
          defaultNumberFormat: 'south_asian',
          defaultLocale: 'en-US',
          defaultWeekStartsOn: 'sunday',
        },
      }),
    ),
  )

  // ── Identity: school entity (grade filter options) + academic years ───────
  await page.route(`**/api/schools/${SCHOOL_ID}`, (route) =>
    route.fulfill(
      json({
        schoolId: SCHOOL_ID,
        name: E2E_TENANT.schoolName,
        enabledGradeLevels: ['9', '10'],
      }),
    ),
  )
  await page.route('**/api/schools/*/academic-years**', (route) => {
    const path = new URL(route.request().url()).pathname
    const year = {
      yearId: AY_ID,
      schoolId: SCHOOL_ID,
      name: AY_NAME,
      status: 'active',
      isCurrent: true,
      startDate: '2025-04-14',
      endDate: '2026-04-13',
    }
    if (path.endsWith('/current')) return route.fulfill(json(year))
    return route.fulfill(json({ items: [year], hasMore: false }))
  })

  // ── Academics: student search + student→family resolution ─────────────────
  // Single dispatch route: /academics/students?search=… vs /academics/students/:id/family
  await page.route('**/api/academics/students**', (route) => {
    const url = new URL(route.request().url())
    if (/\/students\/[^/]+\/family$/.test(url.pathname)) {
      // Backend 400s without ?schoolId= — mirror that so a missing param is
      // a loud failure in specs, not a silently-working mock.
      if (!url.searchParams.get('schoolId')) {
        return route.fulfill(
          json({ statusCode: 400, errorCode: 'BAD_REQUEST', message: 'Missing required parameter: schoolId' }, 400),
        )
      }
      return route.fulfill(json(opts.studentFamilyBody ?? studentFamily()))
    }
    const search = (url.searchParams.get('search') ?? '').toLowerCase()
    const matched = search
      ? students.filter((s) => String(s.fullName).toLowerCase().includes(search))
      : students
    return route.fulfill(json({ items: matched, hasMore: false }))
  })

  // ── Finance: fee structures (wrapped list) ─────────────────────────────────
  await page.route('**/api/finance/schools/*/fee-structures**', (route) =>
    route.fulfill(json({ items: feeStructures, hasMore: false })),
  )

  // ── Finance: dashboard summary ─────────────────────────────────────────────
  await page.route('**/api/finance/schools/*/dashboard/summary**', (route) =>
    route.fulfill(json(opts.dashboard ?? dashboardSummary())),
  )

  // ── Finance: family open invoices ──────────────────────────────────────────
  await page.route('**/api/finance/schools/*/families/*/open-invoices**', (route) =>
    route.fulfill(json(opts.familyOpenInvoicesBody ?? familyOpenInvoices())),
  )

  // ── Finance: payments (manual record + list) ───────────────────────────────
  await page.route('**/api/finance/schools/*/payments**', (route) => {
    const req = route.request()
    const path = new URL(req.url()).pathname
    record(route)
    if (path.endsWith('/payments/manual') && req.method() === 'POST') {
      const body = (req.postDataJSON?.() ?? {}) as Dict
      const result =
        opts.manualPaymentResult ??
        payment({
          id: 'pay-new',
          receiptNumber: 'RCT-2082-0042',
          amount: body.amount,
          gateway: body.gateway,
          // Family payments have no single invoiceId
          ...(body.invoiceId ? { invoiceId: body.invoiceId } : { invoiceId: undefined }),
        })
      return route.fulfill(json(result, 201))
    }
    return route.fulfill(json({ items: [], hasMore: false }))
  })

  // ── Finance: agreements family (list / detail / versions / activate / cancel / create)
  await page.route('**/api/finance/schools/*/agreements**', (route) => {
    const req = route.request()
    const url = new URL(req.url())
    const path = url.pathname
    record(route)

    const sub = path.match(/\/agreements\/([^/]+)(?:\/(versions|activate|cancel))?$/)

    // POST /agreements — create draft
    if (!sub && req.method() === 'POST') {
      if (opts.createAgreementResponse === 'validation_error') {
        const errors = opts.validationErrors ?? DEFAULT_VALIDATION_ERRORS
        return route.fulfill(
          json(
            {
              statusCode: 400,
              errorCode: 'BAD_REQUEST',
              message: 'Validation failed',
              errors,
              details: {
                validationErrors: errors.map((e) => ({ ...e, path: e.path.map(String).join('.') })),
              },
            },
            400,
          ),
        )
      }
      const body = (req.postDataJSON?.() ?? {}) as Dict
      return route.fulfill(
        json(agreement({ ...body, id: 'agr-new', status: 'draft', version: 1, statusHistory: [] }), 201),
      )
    }

    // GET /agreements — wrapped list, filtered by ?status=
    if (!sub) {
      const status = url.searchParams.get('status')
      const items = status ? agreements.filter((a) => a.status === status) : agreements
      return route.fulfill(json({ items, hasMore: false }))
    }

    const [, id, action] = sub
    const found = opts.agreementDetail ?? agreements.find((a) => a.id === id) ?? agreements[0]

    if (action === 'versions') {
      // ALWAYS wrapped — the FE once spread this and crashed ("t is not iterable").
      const versions = opts.agreementVersions ?? [found]
      return route.fulfill(json({ items: versions }))
    }

    if (action === 'activate') {
      const body = (req.postDataJSON?.() ?? {}) as Dict
      const mode = opts.activateResponse ?? 'ok'
      if (mode === 'overlap') {
        return route.fulfill(
          conflict409('AGREEMENT_OVERLAP', 'Another active agreement already covers overlapping students or fee types.', {
            studentIds: ['stu-1'],
            conflictingAgreementId: 'agr-9',
          }),
        )
      }
      if (mode === 'conflict' && body.acknowledgeOpenInvoices !== true) {
        return route.fulfill(
          conflict409('CONFLICTING_OPEN_INVOICES', 'Open invoices conflict with this activation.', {
            conflicts: opts.activateConflicts ?? DEFAULT_CONFLICTS,
          }),
        )
      }
      return route.fulfill(
        json({ ...found, status: 'active', statusHistory: [{ from: 'draft', to: 'active', changedAt: NOW, changedBy: 'e2e-accountant' }] }),
      )
    }

    if (action === 'cancel') {
      return route.fulfill(json({ ...found, status: 'cancelled' }))
    }

    // GET /agreements/:id — bare detail
    return route.fulfill(json(found))
  })

  // ── Finance: invoices family (list / generate / detail / provenance / payments)
  await page.route('**/api/finance/schools/*/invoices**', (route) => {
    const req = route.request()
    const url = new URL(req.url())
    const path = url.pathname
    record(route)

    const sub = path.match(/\/invoices\/([^/]+)(?:\/(provenance|payments|issue|pdf))?$/)

    // POST /invoices — single generate (FB-3.10 AGREEMENT_ACTIVE guard)
    if (!sub && req.method() === 'POST') {
      const body = (req.postDataJSON?.() ?? {}) as Dict
      const mode = opts.generateResponse ?? 'ok'
      if (mode !== 'ok' && body.overrideAgreement !== true) {
        return route.fulfill(
          conflict409('AGREEMENT_ACTIVE', 'An active agreement covers this student for the requested fee types.', {
            agreementId: 'agr-1',
            coveredFeeTypes: ['tuition', 'exam'],
            ...(mode === 'agreement_active' ? { existingInvoiceId: 'inv-1' } : {}),
          }),
        )
      }
      return route.fulfill(json(invoice({ id: 'inv-new', invoiceNumber: 'INV-2082-0099', status: 'draft', feeOverrideMode: 'catalog' }), 201))
    }

    // GET /invoices — wrapped list, filtered by ?status= / ?billingSource=
    if (!sub) {
      const status = url.searchParams.get('status')
      const billingSource = url.searchParams.get('billingSource')
      let items = invoices
      if (status) items = items.filter((i) => i.status === status)
      if (billingSource === 'agreement') items = items.filter((i) => i.feeOverrideMode === 'agreement')
      if (billingSource === 'standard') items = items.filter((i) => i.feeOverrideMode !== 'agreement')
      return route.fulfill(json({ items, hasMore: false }))
    }

    const [, id, action] = sub

    if (action === 'provenance') {
      return route.fulfill(json(opts.provenanceBody ?? provenance({ invoiceId: id })))
    }
    if (action === 'payments') {
      return route.fulfill(json([]))
    }
    if (action === 'issue') {
      const found = invoices.find((i) => i.id === id) ?? invoices[0]
      return route.fulfill(json({ ...found, status: 'issued' }))
    }
    if (action === 'pdf') {
      return route.fulfill(json({}))
    }

    // PATCH /invoices/:id (cancel/update) or GET detail
    const found = opts.invoiceDetail ?? invoices.find((i) => i.id === id) ?? invoices[0]
    if (req.method() === 'PATCH') {
      const body = (req.postDataJSON?.() ?? {}) as Dict
      return route.fulfill(json({ ...found, ...body }))
    }
    return route.fulfill(json(found))
  })

  return captured
}
