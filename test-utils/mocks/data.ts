/**
 * Mock Data for Payment Endpoints
 *
 * Realistic Nepal-school data for MSW handlers.
 * All monetary values in NPR, dates in ISO format.
 */

import type {
  FeeStructure,
  StudentAccount,
  Invoice,
  InvoiceLineItem,
  Payment,
  Receipt,
  PaymentGatewayPublicConfig,
  PaymentGatewayConfig,
  StudentLedgerEntry,
} from '@edforge/types'

// ============================================================================
// IDS
// ============================================================================

export const SCHOOL_ID = 'school-001'
export const STUDENT_ID = 'student-001'
export const STUDENT_ACCOUNT_ID = 'sa-001'

// ============================================================================
// FEE STRUCTURES
// ============================================================================

export const feeStructures: FeeStructure[] = [
  {
    id: 'fs-001',
    schoolId: SCHOOL_ID,
    name: 'Monthly Tuition',
    description: 'Monthly tuition fee for all grade levels',
    academicYear: '2082',
    feeType: 'tuition',
    amount: 5000,
    currency: 'NPR',
    taxRate: 0,
    taxType: 'none',
    frequency: 'monthly',
    gradeLevels: [],
    isActive: true,
    effectiveFrom: '2025-04-14',
    createdAt: '2025-03-01T00:00:00Z',
    updatedAt: '2025-03-01T00:00:00Z',
  },
  {
    id: 'fs-002',
    schoolId: SCHOOL_ID,
    name: 'Annual Exam Fee',
    description: 'Fee for annual examinations',
    academicYear: '2082',
    feeType: 'exam',
    amount: 2500,
    currency: 'NPR',
    taxRate: 0,
    taxType: 'none',
    frequency: 'annual',
    gradeLevels: [],
    isActive: true,
    effectiveFrom: '2025-04-14',
    createdAt: '2025-03-01T00:00:00Z',
    updatedAt: '2025-03-01T00:00:00Z',
  },
  {
    id: 'fs-003',
    schoolId: SCHOOL_ID,
    name: 'Computer Lab Fee',
    description: 'Computer lab usage fee',
    academicYear: '2082',
    feeType: 'lab',
    amount: 1500,
    currency: 'NPR',
    taxRate: 13,
    taxType: 'VAT',
    frequency: 'annual',
    gradeLevels: ['6', '7', '8', '9', '10'],
    isActive: true,
    effectiveFrom: '2025-04-14',
    createdAt: '2025-03-01T00:00:00Z',
    updatedAt: '2025-03-01T00:00:00Z',
  },
  {
    id: 'fs-004',
    schoolId: SCHOOL_ID,
    name: 'Transport Fee',
    description: 'School bus service',
    academicYear: '2082',
    feeType: 'transport',
    amount: 3000,
    currency: 'NPR',
    taxRate: 0,
    taxType: 'none',
    frequency: 'monthly',
    gradeLevels: [],
    isActive: true,
    effectiveFrom: '2025-04-14',
    createdAt: '2025-03-01T00:00:00Z',
    updatedAt: '2025-03-01T00:00:00Z',
  },
]

// ============================================================================
// STUDENT ACCOUNTS
// ============================================================================

export const studentAccounts: StudentAccount[] = [
  {
    id: STUDENT_ACCOUNT_ID,
    studentId: STUDENT_ID,
    schoolId: SCHOOL_ID,
    studentName: 'Aarav Sharma',
    balance: 12500,
    totalPaid: 45000,
    lastPaymentDate: '2025-12-15T10:30:00Z',
    createdAt: '2025-04-14T00:00:00Z',
    updatedAt: '2025-12-15T10:30:00Z',
  },
  {
    id: 'sa-002',
    studentId: 'student-002',
    schoolId: SCHOOL_ID,
    studentName: 'Priya Thapa',
    balance: 5000,
    totalPaid: 60000,
    lastPaymentDate: '2026-01-10T14:00:00Z',
    createdAt: '2025-04-14T00:00:00Z',
    updatedAt: '2026-01-10T14:00:00Z',
  },
]

// ============================================================================
// INVOICES
// ============================================================================

const tuitionLineItem: InvoiceLineItem = {
  id: 'li-001',
  feeStructureId: 'fs-001',
  description: 'Monthly Tuition — Magh 2082',
  amount: 5000,
  quantity: 1,
  discount: 0,
  taxRate: 0,
  taxAmount: 0,
  total: 5000,
}

const examLineItem: InvoiceLineItem = {
  id: 'li-002',
  feeStructureId: 'fs-002',
  description: 'Annual Exam Fee',
  amount: 2500,
  quantity: 1,
  discount: 0,
  taxRate: 0,
  taxAmount: 0,
  total: 2500,
}

const labLineItem: InvoiceLineItem = {
  id: 'li-003',
  feeStructureId: 'fs-003',
  description: 'Computer Lab Fee',
  amount: 1500,
  quantity: 1,
  discount: 0,
  taxRate: 13,
  taxAmount: 195,
  total: 1695,
}

export const invoices: Invoice[] = [
  {
    id: 'inv-001',
    invoiceNumber: 'INV-2082-0001',
    studentAccountId: STUDENT_ACCOUNT_ID,
    studentId: STUDENT_ID,
    studentName: 'Aarav Sharma',
    schoolId: SCHOOL_ID,
    schoolName: 'Sunrise Academy',
    academicYear: '2082',
    billingPeriod: 'Magh 2082',
    lineItems: [tuitionLineItem, labLineItem],
    subtotal: 6500,
    taxTotal: 195,
    discountTotal: 0,
    grandTotal: 6695,
    amountPaid: 0,
    amountDue: 6695,
    currency: 'NPR',
    dueDate: '2026-02-15',
    issuedDate: '2026-01-15',
    status: 'issued',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'inv-002',
    invoiceNumber: 'INV-2082-0002',
    studentAccountId: STUDENT_ACCOUNT_ID,
    studentId: STUDENT_ID,
    studentName: 'Aarav Sharma',
    schoolId: SCHOOL_ID,
    schoolName: 'Sunrise Academy',
    academicYear: '2082',
    billingPeriod: 'Poush 2082',
    lineItems: [{ ...tuitionLineItem, id: 'li-004', description: 'Monthly Tuition — Poush 2082' }],
    subtotal: 5000,
    taxTotal: 0,
    discountTotal: 0,
    grandTotal: 5000,
    amountPaid: 5000,
    amountDue: 0,
    currency: 'NPR',
    dueDate: '2026-01-15',
    issuedDate: '2025-12-15',
    status: 'paid',
    createdAt: '2025-12-15T00:00:00Z',
    updatedAt: '2025-12-20T10:30:00Z',
  },
  {
    id: 'inv-003',
    invoiceNumber: 'INV-2082-0003',
    studentAccountId: STUDENT_ACCOUNT_ID,
    studentId: STUDENT_ID,
    studentName: 'Aarav Sharma',
    schoolId: SCHOOL_ID,
    schoolName: 'Sunrise Academy',
    academicYear: '2082',
    lineItems: [examLineItem],
    subtotal: 2500,
    taxTotal: 0,
    discountTotal: 0,
    grandTotal: 2500,
    amountPaid: 0,
    amountDue: 2500,
    currency: 'NPR',
    dueDate: '2026-01-01',
    issuedDate: '2025-12-01',
    status: 'overdue',
    createdAt: '2025-12-01T00:00:00Z',
    updatedAt: '2025-12-01T00:00:00Z',
  },
]

// ============================================================================
// PAYMENTS
// ============================================================================

export const payments: Payment[] = [
  {
    id: 'pay-001',
    invoiceId: 'inv-002',
    studentAccountId: STUDENT_ACCOUNT_ID,
    schoolId: SCHOOL_ID,
    amount: 5000,
    currency: 'NPR',
    gateway: 'esewa',
    gatewayTransactionId: 'ESW-20251220-001',
    gatewaySessionId: 'session-001',
    status: 'completed',
    paidAt: '2025-12-20T10:30:00Z',
    paidBy: 'parent-001',
    receiptNumber: 'REC-2082-0001',
    metadata: { esewaRefId: 'ESW-20251220-001' },
    refunds: [],
    createdAt: '2025-12-20T10:25:00Z',
    updatedAt: '2025-12-20T10:30:00Z',
  },
]

// ============================================================================
// RECEIPT
// ============================================================================

export const receipts: Receipt[] = [
  {
    receiptNumber: 'REC-2082-0001',
    paymentId: 'pay-001',
    invoiceNumber: 'INV-2082-0002',
    transactionId: 'ESW-20251220-001',
    studentName: 'Aarav Sharma',
    studentId: STUDENT_ID,
    schoolName: 'Sunrise Academy',
    schoolAddress: 'Dillibazar, Kathmandu',
    schoolPhone: '+977-01-4445566',
    paidDate: '2025-12-20',
    amount: 5000,
    currency: 'NPR',
    gateway: 'esewa',
    gatewayDisplayName: 'eSewa',
    lineItems: [
      {
        description: 'Monthly Tuition — Poush 2082',
        amount: 5000,
        taxAmount: 0,
        total: 5000,
      },
    ],
    subtotal: 5000,
    taxTotal: 0,
    discountTotal: 0,
    grandTotal: 5000,
    taxBreakdown: {
      panNumber: '123456789',
      taxableAmount: 0,
      taxAmount: 0,
    },
    paidBy: 'Ram Sharma',
  },
]

// ============================================================================
// PAYMENT GATEWAYS
// ============================================================================

export const publicGateways: PaymentGatewayPublicConfig[] = [
  {
    id: 'gw-001',
    schoolId: SCHOOL_ID,
    gateway: 'esewa',
    isEnabled: true,
    isTestMode: true,
    displayName: 'eSewa',
    displayOrder: 1,
  },
  {
    id: 'gw-002',
    schoolId: SCHOOL_ID,
    gateway: 'khalti',
    isEnabled: true,
    isTestMode: true,
    displayName: 'Khalti',
    displayOrder: 2,
  },
  {
    id: 'gw-003',
    schoolId: SCHOOL_ID,
    gateway: 'fonepay',
    isEnabled: false,
    isTestMode: true,
    displayName: 'Fonepay',
    displayOrder: 3,
  },
]

export const gatewayConfigs: PaymentGatewayConfig[] = [
  {
    id: 'gw-001',
    schoolId: SCHOOL_ID,
    gateway: 'esewa',
    isEnabled: true,
    isTestMode: true,
    displayName: 'eSewa',
    displayOrder: 1,
    credentials: { merchantCode: 'EPAYTEST', secretKey: '****' },
  },
  {
    id: 'gw-002',
    schoolId: SCHOOL_ID,
    gateway: 'khalti',
    isEnabled: true,
    isTestMode: true,
    displayName: 'Khalti',
    displayOrder: 2,
    credentials: { publicKey: 'test_public_key_xxxx', secretKey: '****' },
  },
  {
    id: 'gw-003',
    schoolId: SCHOOL_ID,
    gateway: 'fonepay',
    isEnabled: false,
    isTestMode: true,
    displayName: 'Fonepay',
    displayOrder: 3,
    credentials: {},
  },
]

// ============================================================================
// STUDENT LEDGER
// ============================================================================

export const ledgerEntries: StudentLedgerEntry[] = [
  {
    id: 'ledger-001',
    studentAccountId: STUDENT_ACCOUNT_ID,
    entryType: 'invoice',
    referenceId: 'inv-002',
    description: 'Invoice INV-2082-0002 — Monthly Tuition Poush',
    debit: 5000,
    credit: 0,
    balance: 5000,
    date: '2025-12-15',
    createdAt: '2025-12-15T00:00:00Z',
  },
  {
    id: 'ledger-002',
    studentAccountId: STUDENT_ACCOUNT_ID,
    entryType: 'payment',
    referenceId: 'pay-001',
    description: 'Payment via eSewa — REC-2082-0001',
    debit: 0,
    credit: 5000,
    balance: 0,
    date: '2025-12-20',
    createdAt: '2025-12-20T10:30:00Z',
  },
  {
    id: 'ledger-003',
    studentAccountId: STUDENT_ACCOUNT_ID,
    entryType: 'invoice',
    referenceId: 'inv-001',
    description: 'Invoice INV-2082-0001 — Magh Tuition + Lab',
    debit: 6695,
    credit: 0,
    balance: 6695,
    date: '2026-01-15',
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'ledger-004',
    studentAccountId: STUDENT_ACCOUNT_ID,
    entryType: 'invoice',
    referenceId: 'inv-003',
    description: 'Invoice INV-2082-0003 — Exam Fee',
    debit: 2500,
    credit: 0,
    balance: 9195,
    date: '2025-12-01',
    createdAt: '2025-12-01T00:00:00Z',
  },
]
