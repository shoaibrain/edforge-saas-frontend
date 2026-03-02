/**
 * usePayments — TanStack Query hooks for finance operations
 *
 * Query key factory pattern for predictable cache invalidation.
 * Mutations invalidate related queries on success.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  InvoiceFilterDto,
  GenerateInvoiceDto,
  InitiatePaymentRequest,
  RecordManualPaymentDto,
  VoidPaymentDto,
  CreateRefundDto,
} from '@edforge/types'
import {
  getInvoices,
  getInvoice,
  generateInvoice,
  issueInvoice,
  cancelInvoice,
  getStudentAccounts,
  getStudentLedger,
  bulkGenerateInvoices,
  bulkIssueInvoices,
} from '../services/invoices.service'
import type {
  BulkGenerateInvoiceDto,
  BulkIssueInvoicesDto,
} from '../services/invoices.service'
import {
  initiatePayment,
  verifyPayment,
  getInvoicePayments,
  getSchoolPayments,
  getPaymentReceipt,
  recordManualPayment,
  voidPayment,
  createRefund,
  getDashboardSummary,
  exportInvoicesCsv,
} from '../services/payments.service'

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

export const paymentKeys = {
  all: ['payments'] as const,

  // Invoices
  invoices: (schoolId: string) => [...paymentKeys.all, 'invoices', schoolId] as const,
  invoiceList: (schoolId: string, filters?: InvoiceFilterDto) =>
    [...paymentKeys.invoices(schoolId), 'list', filters] as const,
  invoice: (schoolId: string, invoiceId: string) =>
    [...paymentKeys.invoices(schoolId), invoiceId] as const,

  // Payments (per invoice)
  invoicePayments: (schoolId: string, invoiceId: string) =>
    [...paymentKeys.all, 'history', schoolId, invoiceId] as const,

  // Verification
  verify: (sessionId: string) => [...paymentKeys.all, 'verify', sessionId] as const,

  // Receipt
  receipt: (paymentId: string) => [...paymentKeys.all, 'receipt', paymentId] as const,

  // School-wide payments
  schoolPayments: (schoolId: string, filters?: Record<string, unknown>) =>
    [...paymentKeys.all, 'school', schoolId, filters] as const,

  // Student accounts
  studentAccounts: (schoolId: string) =>
    [...paymentKeys.all, 'accounts', schoolId] as const,
  studentAccount: (schoolId: string, studentId: string) =>
    [...paymentKeys.studentAccounts(schoolId), studentId] as const,
  ledger: (schoolId: string, accountId: string) =>
    [...paymentKeys.all, 'ledger', schoolId, accountId] as const,

  // Dashboard
  dashboard: (schoolId: string) =>
    [...paymentKeys.all, 'dashboard', schoolId] as const,
}

// ============================================================================
// INVOICE QUERIES
// ============================================================================

export function useInvoices(schoolId: string, filters?: InvoiceFilterDto) {
  return useQuery({
    queryKey: paymentKeys.invoiceList(schoolId, filters),
    queryFn: () => getInvoices(schoolId, filters),
    enabled: !!schoolId,
    staleTime: 30 * 1000,
  })
}

export function useInvoice(schoolId: string, invoiceId: string) {
  return useQuery({
    queryKey: paymentKeys.invoice(schoolId, invoiceId),
    queryFn: () => getInvoice(schoolId, invoiceId),
    enabled: !!schoolId && !!invoiceId,
    staleTime: 30 * 1000,
  })
}

// ============================================================================
// INVOICE MUTATIONS
// ============================================================================

export function useGenerateInvoice(schoolId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: GenerateInvoiceDto) => generateInvoice(schoolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.invoices(schoolId) })
      queryClient.invalidateQueries({ queryKey: paymentKeys.studentAccounts(schoolId) })
    },
  })
}

export function useIssueInvoice(schoolId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invoiceId: string) => issueInvoice(schoolId, invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.invoices(schoolId) })
      queryClient.invalidateQueries({ queryKey: paymentKeys.studentAccounts(schoolId) })
    },
  })
}

export function useCancelInvoice(schoolId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ invoiceId, reason }: { invoiceId: string; reason?: string }) =>
      cancelInvoice(schoolId, invoiceId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.invoices(schoolId) })
      queryClient.invalidateQueries({ queryKey: paymentKeys.studentAccounts(schoolId) })
    },
  })
}

// ============================================================================
// PAYMENT QUERIES
// ============================================================================

export function useInvoicePayments(schoolId: string, invoiceId: string) {
  return useQuery({
    queryKey: paymentKeys.invoicePayments(schoolId, invoiceId),
    queryFn: () => getInvoicePayments(schoolId, invoiceId),
    enabled: !!schoolId && !!invoiceId,
    staleTime: 30 * 1000,
  })
}

// ============================================================================
// PAYMENT INITIATION
// ============================================================================

export function useInitiatePayment(schoolId: string) {
  return useMutation({
    mutationFn: (request: InitiatePaymentRequest) =>
      initiatePayment(schoolId, request),
  })
}

// ============================================================================
// PAYMENT VERIFICATION
// ============================================================================

export function useVerifyPayment(
  sessionId: string | null,
  callbackParams?: Record<string, string>
) {
  return useQuery({
    queryKey: paymentKeys.verify(sessionId ?? ''),
    queryFn: () => verifyPayment(sessionId!, callbackParams),
    enabled: !!sessionId,
    retry: 2,
    staleTime: Infinity,
  })
}

// ============================================================================
// RECEIPT
// ============================================================================

export function usePaymentReceipt(paymentId: string | null) {
  return useQuery({
    queryKey: paymentKeys.receipt(paymentId ?? ''),
    queryFn: () => getPaymentReceipt(paymentId!),
    enabled: !!paymentId,
    staleTime: Infinity,
  })
}

// ============================================================================
// STUDENT ACCOUNTS
// ============================================================================

export function useStudentAccounts(schoolId: string, studentId?: string) {
  return useQuery({
    queryKey: studentId
      ? paymentKeys.studentAccount(schoolId, studentId)
      : paymentKeys.studentAccounts(schoolId),
    queryFn: () => getStudentAccounts(schoolId, studentId ? { studentId } : undefined),
    enabled: !!schoolId,
    staleTime: 60 * 1000,
  })
}

export function useStudentLedger(schoolId: string, accountId: string) {
  return useQuery({
    queryKey: paymentKeys.ledger(schoolId, accountId),
    queryFn: () => getStudentLedger(schoolId, accountId),
    enabled: !!schoolId && !!accountId,
    staleTime: 30 * 1000,
  })
}

// ============================================================================
// SCHOOL-WIDE PAYMENTS
// ============================================================================

export function useSchoolPayments(
  schoolId: string,
  params?: { status?: string; gateway?: string; limit?: number }
) {
  return useQuery({
    queryKey: paymentKeys.schoolPayments(schoolId, params),
    queryFn: () => getSchoolPayments(schoolId, params),
    enabled: !!schoolId,
    staleTime: 30 * 1000,
  })
}

// ============================================================================
// RECORD MANUAL PAYMENT
// ============================================================================

export function useRecordManualPayment(schoolId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RecordManualPaymentDto) =>
      recordManualPayment(schoolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
      queryClient.invalidateQueries({ queryKey: paymentKeys.invoices(schoolId) })
      queryClient.invalidateQueries({ queryKey: paymentKeys.studentAccounts(schoolId) })
    },
  })
}

// ============================================================================
// VOID PAYMENT
// ============================================================================

export function useVoidPayment(schoolId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ paymentId, data }: { paymentId: string; data: VoidPaymentDto }) =>
      voidPayment(schoolId, paymentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
      queryClient.invalidateQueries({ queryKey: paymentKeys.invoices(schoolId) })
      queryClient.invalidateQueries({ queryKey: paymentKeys.studentAccounts(schoolId) })
    },
  })
}

// ============================================================================
// REFUND
// ============================================================================

export function useCreateRefund(schoolId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ paymentId, data }: { paymentId: string; data: CreateRefundDto }) =>
      createRefund(schoolId, paymentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
      queryClient.invalidateQueries({ queryKey: paymentKeys.invoices(schoolId) })
      queryClient.invalidateQueries({ queryKey: paymentKeys.studentAccounts(schoolId) })
    },
  })
}

// ============================================================================
// BULK GENERATE INVOICES
// ============================================================================

export function useBulkGenerateInvoices(schoolId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BulkGenerateInvoiceDto) =>
      bulkGenerateInvoices(schoolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.invoices(schoolId) })
      queryClient.invalidateQueries({ queryKey: paymentKeys.studentAccounts(schoolId) })
    },
  })
}

// ============================================================================
// BULK ISSUE INVOICES
// ============================================================================

export function useBulkIssueInvoices(schoolId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BulkIssueInvoicesDto) =>
      bulkIssueInvoices(schoolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.invoices(schoolId) })
      queryClient.invalidateQueries({ queryKey: paymentKeys.studentAccounts(schoolId) })
    },
  })
}

// ============================================================================
// DASHBOARD SUMMARY
// ============================================================================

export function useDashboardSummary(schoolId: string) {
  return useQuery({
    queryKey: paymentKeys.dashboard(schoolId),
    queryFn: () => getDashboardSummary(schoolId),
    enabled: !!schoolId,
    staleTime: 60 * 1000,
  })
}

// ============================================================================
// EXPORT INVOICES CSV
// ============================================================================

export function useExportInvoicesCsv() {
  return useMutation({
    mutationFn: (schoolId: string) => exportInvoicesCsv(schoolId),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoices-export-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
  })
}
