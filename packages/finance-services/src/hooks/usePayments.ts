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
  downloadInvoicePdf,
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
  exportPaymentsCsv,
  downloadReceiptPdf,
} from '../services/payments.service'
import { searchStudents } from '../services/students.service'
import { usePdfErrorToast } from './usePdfErrorToast'

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
  dashboard: (schoolId: string, filters?: Record<string, unknown>) =>
    [...paymentKeys.all, 'dashboard', schoolId, filters] as const,
}

// ============================================================================
// INVOICE QUERIES
// ============================================================================

export function useInvoices(schoolId: string, filters?: InvoiceFilterDto) {
  // If a studentId filter is provided but falsy (e.g. undefined during parent portal
  // first render before activeChild resolves), disable the query to prevent fetching
  // without the required student scope.
  const studentIdGate = 'studentId' in (filters ?? {})
    ? !!filters?.studentId
    : true
  return useQuery({
    queryKey: paymentKeys.invoiceList(schoolId, filters),
    queryFn: () => getInvoices(schoolId, filters),
    enabled: !!schoolId && studentIdGate,
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

export function useDashboardSummary(
  schoolId: string,
  filters?: { from?: string; to?: string; academicYear?: string },
) {
  return useQuery({
    queryKey: paymentKeys.dashboard(schoolId, filters),
    queryFn: () => getDashboardSummary(schoolId, filters),
    enabled: !!schoolId,
    staleTime: 60 * 1000,
  })
}

// ============================================================================
// STUDENT SEARCH
// ============================================================================

export const studentKeys = {
  all: ['students'] as const,
  search: (schoolId: string, search: string) =>
    [...studentKeys.all, 'search', schoolId, search] as const,
  enrolled: (schoolId: string) =>
    [...studentKeys.all, 'enrolled', schoolId] as const,
}

export function useSearchStudents(schoolId: string, search: string) {
  return useQuery({
    queryKey: studentKeys.search(schoolId, search),
    queryFn: () => searchStudents(schoolId, search),
    enabled: !!schoolId && search.length >= 2,
    staleTime: 60 * 1000,
  })
}

/**
 * Fetch all enrolled (active) students for the school.
 * Used by Bulk Generate to show the complete student list.
 * Fetches up to 500 students — covers typical Nepal school sizes.
 */
export function useEnrolledStudents(schoolId: string) {
  return useQuery({
    queryKey: studentKeys.enrolled(schoolId),
    queryFn: () => searchStudents(schoolId, undefined, 500),
    enabled: !!schoolId,
    staleTime: 2 * 60 * 1000,
  })
}

// ============================================================================
// EXPORT INVOICES CSV
// ============================================================================

export function useExportInvoicesCsv() {
  return useMutation({
    mutationFn: (schoolId: string) => exportInvoicesCsv(schoolId),
    onSuccess: (blob, schoolId) => {
      const dateStr = new Date().toISOString().slice(0, 10)
      const filename = `invoices-${schoolId}-${dateStr}.csv`
      const csvBlob = new Blob([blob], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(csvBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      // Clean up after a short delay to ensure download starts
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
    },
    onError: (error) => {
      throw error instanceof Error
        ? error
        : new Error('Failed to export invoices CSV')
    },
  })
}

// ============================================================================
// EXPORT PAYMENTS CSV
// ============================================================================

export function useExportPaymentsCsv() {
  return useMutation({
    mutationFn: (schoolId: string) => exportPaymentsCsv(schoolId),
    onSuccess: (blob, schoolId) => {
      const dateStr = new Date().toISOString().slice(0, 10)
      const filename = `payments-${schoolId}-${dateStr}.csv`
      const csvBlob = new Blob([blob], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(csvBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
    },
    onError: (error) => {
      throw error instanceof Error
        ? error
        : new Error('Failed to export payments CSV')
    },
  })
}

// ============================================================================
// DOWNLOAD RECEIPT PDF (Sprint C.1.6 frontend — retires jspdf+html2canvas)
// ============================================================================

/**
 * Download a payment receipt as a server-rendered PDF.
 *
 * Replaces the prior `jspdf+html2canvas` client-side raster approach in
 * `PaymentReceipt.tsx`. The new server-rendered PDF (via
 * `@aibrains/pdf-renderer` on the finance microservice — Sprint C.1.6
 * backend PR #202) has selectable text + embedded Devanagari fonts +
 * proper BS+AD dual-date rendering + tenant-customized branding,
 * none of which the raster approach could produce.
 *
 * Mirrors `useExportInvoicesCsv` blob-anchor pattern: mutationFn fetches
 * the Blob, onSuccess creates a temporary `<a download>` and clicks it,
 * cleanup after 100ms. Print button on the receipt stays as a fallback
 * through C.5.
 *
 * @example
 *   const downloadReceipt = useDownloadReceiptPdf()
 *   downloadReceipt.mutate({ paymentId: '...', schoolId: '...',
 *                            receiptNumber: 'RCT-2026-001' })
 */
export function useDownloadReceiptPdf() {
  // M1.11 — surface a canonical localized toast on failure so the
  // PaymentReceipt download button stops silently no-op'ing on 4xx/5xx.
  // The hook still re-throws so callers can attach their own onError
  // handling if they want; the toast is purely additive.
  const showPdfError = usePdfErrorToast()
  return useMutation({
    mutationFn: (vars: { paymentId: string; schoolId: string; receiptNumber?: string }) =>
      downloadReceiptPdf(vars.paymentId, vars.schoolId),
    onSuccess: (blob, vars) => {
      const filename = `${vars.receiptNumber ?? `receipt-${vars.paymentId.slice(0, 8)}`}.pdf`
      // Wrap explicitly with the application/pdf MIME so Safari + Edge
      // honor the .pdf extension on save. The server already sends
      // Content-Type: application/pdf but the Blob constructor here
      // controls the client-side download MIME independent of network.
      const pdfBlob = new Blob([blob], { type: 'application/pdf' })
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      // Same cleanup window as the CSV export hooks above.
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
    },
    onError: (error) => {
      showPdfError(error, 'receipt')
      throw error instanceof Error
        ? error
        : new Error('Failed to download receipt PDF')
    },
  })
}

// ============================================================================
// DOWNLOAD INVOICE PDF (Sprint M1.4 — frontend half of C.1.5)
// ============================================================================

/**
 * Download an issued invoice as a server-rendered PDF.
 *
 * Symmetric to `useDownloadReceiptPdf`. Server endpoint is C.1.5
 * (live in prod 2026-05-26). The PDF has selectable text + embedded
 * Devanagari fonts + BS+AD dual-date rendering + tenant-customized
 * branding — none of which the legacy `window.print()` fallback
 * (still mounted as Print button) produces.
 *
 * Filename defaults to the invoice number when supplied
 * (`INV-2026-001.pdf`), falling back to the first 8 chars of the
 * invoiceId so two PDFs from the same browser session don't collide
 * in the user's downloads folder.
 *
 * @example
 *   const downloadInvoice = useDownloadInvoicePdf()
 *   downloadInvoice.mutate({ schoolId: '...', invoiceId: '...',
 *                            invoiceNumber: 'INV-2026-001' })
 */
export function useDownloadInvoicePdf() {
  // M1.11 — same canonical toast as the receipt hook above.
  const showPdfError = usePdfErrorToast()
  return useMutation({
    mutationFn: (vars: { schoolId: string; invoiceId: string; invoiceNumber?: string }) =>
      downloadInvoicePdf(vars.schoolId, vars.invoiceId),
    onSuccess: (blob, vars) => {
      const filename = `${vars.invoiceNumber ?? `invoice-${vars.invoiceId.slice(0, 8)}`}.pdf`
      // Wrap with explicit application/pdf MIME so Safari + Edge honor
      // the .pdf extension on save — same reasoning as the receipt
      // hook above.
      const pdfBlob = new Blob([blob], { type: 'application/pdf' })
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      // Mirror the receipt hook's cleanup window. Revoking immediately
      // races Safari's download-initiation; 100ms is the documented
      // safe window across browsers.
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
    },
    onError: (error) => {
      showPdfError(error, 'invoice')
      throw error instanceof Error
        ? error
        : new Error('Failed to download invoice PDF')
    },
  })
}
