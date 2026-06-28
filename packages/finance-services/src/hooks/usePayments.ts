/**
 * usePayments — TanStack Query hooks for finance operations
 *
 * Query key factory pattern for predictable cache invalidation.
 * Mutations invalidate related queries on success.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useInvoicesInfinite } from './useInvoicesInfinite'
import { useSchoolPaymentsInfinite } from './useSchoolPaymentsInfinite'
import { useStudentAccountsInfinite } from './useStudentAccountsInfinite'
import { useStudentLedgerInfinite } from './useStudentLedgerInfinite'
import type {
  InvoiceFilterDto,
  GenerateInvoiceDto,
  InitiatePaymentRequest,
  RecordManualPaymentDto,
  VoidPaymentDto,
  CreateRefundDto,
} from '@edforge/types'
import {
  getInvoice,
  generateInvoice,
  issueInvoice,
  cancelInvoice,
  bulkGenerateInvoices,
  bulkIssueInvoices,
  downloadInvoicePdf,
  getBulkPreview,
} from '../services/invoices.service'
import type {
  BulkGenerateInvoiceDto,
  BulkIssueInvoicesDto,
  BulkPreviewParams,
} from '../services/invoices.service'
import {
  initiatePayment,
  verifyPayment,
  getInvoicePayments,
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
import {
  trackPdfDownloadStarted,
  trackPdfDownloadSucceeded,
  trackPdfDownloadFailed,
} from '../utils/telemetry'

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

/** Cursor-aware invoice list — wraps useInvoicesInfinite for shell + finance MFEs. */
export function useInvoices(schoolId: string, filters?: InvoiceFilterDto) {
  const paginated = useInvoicesInfinite(schoolId, filters)
  return {
    data:
      paginated.isLoading && paginated.items.length === 0
        ? undefined
        : { items: paginated.items, hasMore: paginated.hasMore },
    isLoading: paginated.isLoading,
    isFetching: paginated.isFetchingNextPage,
    error: paginated.error,
    refetch: paginated.refetch,
    hasMore: paginated.hasMore,
    loadMore: paginated.loadMore,
    isFetchingNextPage: paginated.isFetchingNextPage,
    totalLoaded: paginated.totalLoaded,
  }
}

export { useInvoicesInfinite } from './useInvoicesInfinite'

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

/**
 * Fetch the JSON receipt for a completed payment.
 *
 * `schoolId` is REQUIRED by the backend (see getPaymentReceipt in
 * payments.service.ts for the DDB-key-construction reason). The hook
 * stays gated until BOTH paymentId AND schoolId are resolved, so a
 * cold-mount where activeSchoolId hasn't loaded yet won't fire a
 * request that's destined to 404.
 *
 * The queryKey includes schoolId so React Query naturally invalidates
 * if the active school switches mid-session.
 */
export function usePaymentReceipt(
  paymentId: string | null,
  schoolId: string | null,
) {
  return useQuery({
    queryKey: [...paymentKeys.receipt(paymentId ?? ''), schoolId ?? ''],
    queryFn: () => getPaymentReceipt(paymentId!, schoolId!),
    enabled: !!paymentId && !!schoolId,
    staleTime: Infinity,
  })
}

// ============================================================================
// STUDENT ACCOUNTS
// ============================================================================

export function useStudentAccounts(
  schoolId: string,
  filters?: { searchTerm?: string; hasOutstandingBalance?: boolean },
) {
  const paginated = useStudentAccountsInfinite(schoolId, filters)
  return {
    data: paginated.items,
    isLoading: paginated.isLoading,
    error: paginated.error,
    refetch: paginated.refetch,
    hasMore: paginated.hasMore,
    loadMore: paginated.loadMore,
    isFetchingNextPage: paginated.isFetchingNextPage,
    totalLoaded: paginated.totalLoaded,
  }
}

export { useStudentAccountsInfinite } from './useStudentAccountsInfinite'

export function useStudentLedger(schoolId: string, accountId: string) {
  const paginated = useStudentLedgerInfinite(schoolId, accountId)
  return {
    data: paginated.items,
    isLoading: paginated.isLoading,
    isError: !!paginated.error,
    error: paginated.error,
    refetch: paginated.refetch,
    hasMore: paginated.hasMore,
    loadMore: paginated.loadMore,
    isFetchingNextPage: paginated.isFetchingNextPage,
    totalLoaded: paginated.totalLoaded,
  }
}

export { useStudentLedgerInfinite } from './useStudentLedgerInfinite'

// ============================================================================
// SCHOOL-WIDE PAYMENTS
// ============================================================================

export function useSchoolPayments(
  schoolId: string,
  // Sprint B.2 — gradeLevel filter routes the backend through GSI14;
  // sparse on unresolved-snapshot rows.
  params?: { status?: string; gateway?: string; gradeLevel?: string },
) {
  const paginated = useSchoolPaymentsInfinite(schoolId, params)
  return {
    data: paginated.items,
    isLoading: paginated.isLoading,
    error: paginated.error,
    refetch: paginated.refetch,
    hasMore: paginated.hasMore,
    loadMore: paginated.loadMore,
    isFetchingNextPage: paginated.isFetchingNextPage,
    totalLoaded: paginated.totalLoaded,
  }
}

export { useSchoolPaymentsInfinite } from './useSchoolPaymentsInfinite'

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
// BULK PREVIEW — Sprint C.6
// ============================================================================

/**
 * Read-only counts for the bulk-generate wizard's confirm step. Pass
 * `enabled: false` to gate fetches until the operator has actually
 * filled in enough of the form to make a preview meaningful (e.g. has
 * picked at least one fee structure + one student/grade selection).
 */
export function useBulkPreview(
  schoolId: string,
  params: BulkPreviewParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [
      ...paymentKeys.invoices(schoolId),
      'bulk-preview',
      params.selectionMode,
      params.studentIds?.length ?? 0,
      params.gradeLevels?.join(',') ?? '',
      params.feeStructureIds?.join(',') ?? '',
      params.billingPeriod ?? '',
    ],
    queryFn: () => getBulkPreview(schoolId, params),
    enabled: !!schoolId && (options?.enabled ?? true),
    staleTime: 30 * 1000, // 30s — operator likely tweaks form fields rapidly
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
    mutationFn: (vars: { paymentId: string; schoolId: string; receiptNumber?: string }) => {
      // M1.10 telemetry — emit `started` at mutation kickoff so the
      // pipeline sees the click even if the network call hangs.
      trackPdfDownloadStarted({ docType: 'receipt', schoolId: vars.schoolId })
      return downloadReceiptPdf(vars.paymentId, vars.schoolId)
    },
    onSuccess: (blob, vars) => {
      trackPdfDownloadSucceeded({
        docType: 'receipt',
        schoolId: vars.schoolId,
        byteSize: blob.size,
      })
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
    onError: (error, vars) => {
      trackPdfDownloadFailed({ docType: 'receipt', schoolId: vars.schoolId, error })
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
    mutationFn: (vars: { schoolId: string; invoiceId: string; invoiceNumber?: string }) => {
      // M1.10 telemetry — see receipt hook above for rationale.
      trackPdfDownloadStarted({ docType: 'invoice', schoolId: vars.schoolId })
      return downloadInvoicePdf(vars.schoolId, vars.invoiceId)
    },
    onSuccess: (blob, vars) => {
      trackPdfDownloadSucceeded({
        docType: 'invoice',
        schoolId: vars.schoolId,
        byteSize: blob.size,
      })
      // Use `.trim() ||` (NOT `??`) so empty/whitespace invoiceNumber
      // strings — which sometimes leak from optional form fields —
      // fall back to the id-derived name instead of producing ".pdf".
      // Optional-chain on invoiceId is defense against a `as any` cast
      // bypassing the TS-required prop; `unknown` is a stable last
      // resort so we never crash building the download filename.
      const trimmedNumber = vars.invoiceNumber?.trim()
      const idSlice = vars.invoiceId?.slice(0, 8) ?? 'unknown'
      const filename = `${trimmedNumber || `invoice-${idSlice}`}.pdf`
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
        if (typeof document !== 'undefined' && document.body.contains(a)) {
          document.body.removeChild(a)
        }
        URL.revokeObjectURL(url)
      }, 100)
    },
    onError: (error, vars) => {
      trackPdfDownloadFailed({ docType: 'invoice', schoolId: vars.schoolId, error })
      showPdfError(error, 'invoice')
      throw error instanceof Error
        ? error
        : new Error('Failed to download invoice PDF')
    },
  })
}
