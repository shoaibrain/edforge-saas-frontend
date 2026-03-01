/**
 * usePayments — TanStack Query hooks for payment operations
 *
 * Query key factory pattern for predictable cache invalidation.
 * Mutations invalidate related queries on success.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  InvoiceFilterDto,
  GenerateInvoiceDto,
  InitiatePaymentRequest,
} from '@edforge/types'
import {
  getInvoices,
  getInvoice,
  generateInvoice,
  getStudentAccounts,
  getStudentLedger,
} from '../services/invoices.service'
import {
  initiatePayment,
  verifyPayment,
  getInvoicePayments,
  getPaymentReceipt,
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

  // Student accounts
  studentAccounts: (schoolId: string) =>
    [...paymentKeys.all, 'accounts', schoolId] as const,
  studentAccount: (schoolId: string, studentId: string) =>
    [...paymentKeys.studentAccounts(schoolId), studentId] as const,
  ledger: (schoolId: string, accountId: string) =>
    [...paymentKeys.all, 'ledger', schoolId, accountId] as const,
}

// ============================================================================
// INVOICE QUERIES
// ============================================================================

export function useInvoices(schoolId: string, filters?: InvoiceFilterDto) {
  return useQuery({
    queryKey: paymentKeys.invoiceList(schoolId, filters),
    queryFn: () => getInvoices(schoolId, filters),
    enabled: !!schoolId,
    staleTime: 30 * 1000, // 30s — invoices change frequently
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

/**
 * Verify payment on callback page.
 * Only enabled when sessionId is provided (after gateway redirect).
 * callbackParams forwards raw gateway query params (e.g. eSewa's data, Khalti's pidx).
 */
export function useVerifyPayment(
  sessionId: string | null,
  callbackParams?: Record<string, string>
) {
  return useQuery({
    queryKey: paymentKeys.verify(sessionId ?? ''),
    queryFn: () => verifyPayment(sessionId!, callbackParams),
    enabled: !!sessionId,
    retry: 2, // Retry verification on transient failures
    staleTime: Infinity, // Verification result is immutable — no refetch needed
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
    staleTime: Infinity, // Receipts are immutable
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
    staleTime: 60 * 1000, // 1 min
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
