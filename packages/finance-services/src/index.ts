/**
 * @edforge/finance-services
 *
 * Shared finance service layer: invoice/payment API services + React Query hooks.
 * Used by shell and finance MFE via Module Federation singleton.
 */

// Services
export {
  getInvoices,
  getInvoice,
  generateInvoice,
  updateInvoice,
  issueInvoice,
  cancelInvoice,
  getStudentAccounts,
  getStudentLedger,
  bulkGenerateInvoices,
  bulkIssueInvoices,
  downloadInvoicePdf,
  getBulkPreview,
  invoicesService,
} from './services/invoices.service'
export type {
  InvoiceListParams,
  BulkGenerateInvoiceResponse,
  BulkGenerateInvoiceDto,
  BulkIssueInvoicesDto,
  BulkIssueInvoicesResponse,
  BulkPreviewParams,
  BulkPreviewResponse,
} from './services/invoices.service'
export type {
  FinancePaginatedResponse,
  FinanceListQueryParams,
  StudentAccountListParams,
} from './types/pagination'
export type { SchoolPaymentListParams } from './services/payments.service'

export {
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
  paymentsService,
} from './services/payments.service'

export {
  getFeeStructures,
  getFeeStructure,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  feeStructuresService,
} from './services/fee-structures.service'

export {
  searchStudents,
} from './services/students.service'
export type { StudentSearchResult } from './services/students.service'

// Pilot Onboarding Hardening PD.3.1 — opening-balance write
export { setOpeningBalance } from './services/student-accounts.service'

// Pilot Onboarding Hardening PD.3.2 — opening-balance mutation hook
export { useSetOpeningBalance } from './hooks/useSetOpeningBalance'

export {
  getAcademicYears,
  getCurrentAcademicYear,
} from './services/academic-years.service'
export type { AcademicYearOption } from './services/academic-years.service'

export {
  getEnabledGateways,
  getGatewayConfigs,
  saveGatewayConfig,
  paymentGatewaysService,
} from './services/payment-gateways.service'

// Hooks
export {
  feeStructureKeys,
  useFeeStructures,
  useFeeStructuresInfinite,
  useCreateFeeStructure,
  useUpdateFeeStructure,
  useDeleteFeeStructure,
} from './hooks/useFeeStructures'

export {
  paymentKeys,
  useInvoices,
  useInvoicesInfinite,
  useInvoice,
  useGenerateInvoice,
  useIssueInvoice,
  useCancelInvoice,
  useInvoicePayments,
  useInitiatePayment,
  useVerifyPayment,
  usePaymentReceipt,
  useStudentAccounts,
  useStudentAccountsInfinite,
  useStudentLedger,
  useStudentLedgerInfinite,
  useSchoolPayments,
  useSchoolPaymentsInfinite,
  useRecordManualPayment,
  useVoidPayment,
  useCreateRefund,
  useBulkGenerateInvoices,
  useBulkPreview,
  useBulkIssueInvoices,
  useDashboardSummary,
  useExportInvoicesCsv,
  useExportPaymentsCsv,
  useDownloadReceiptPdf,
  useDownloadInvoicePdf,
  studentKeys,
  useSearchStudents,
  useEnrolledStudents,
} from './hooks/usePayments'

export {
  gatewayKeys,
  useEnabledGateways,
  useGatewayConfigs,
  useSaveGatewayConfig,
} from './hooks/usePaymentGateways'

export {
  academicYearKeys,
  useAcademicYears,
  useCurrentAcademicYear,
} from './hooks/useAcademicYears'

// M1.1 cross-MFE navigation helpers (viewDocument + receiptHref)
// retired in M1.5-FU.6 — the receipt page moved into Finance MFE so
// the cross-MFE shim has no consumers. Re-export removed; the
// helpers' source file is deleted.

// PDF error-toast helper (M1.11)
export { usePdfErrorToast, type PdfDocType } from './hooks/usePdfErrorToast'

// D1–D4 async-bulk-job framework (PR #339 backend)
export {
  bulkSendReceipts,
  bulkSendInvoiceReminders,
  bulkSendStatements,
  bulkAdjustBalances,
  getAsyncBulkJob,
} from './services/async-bulk-jobs.service'
export type { AsyncJobDomain } from './services/async-bulk-jobs.service'
export type {
  AsyncBulkJobAck,
  AsyncBulkJobFailure,
  AsyncBulkJobResult,
  AsyncBulkJobStatus,
  BulkAdjustBalanceDto,
  BulkSendReceiptDto,
  BulkSendReminderDto,
  BulkSendStatementDto,
} from './types/async-jobs'
export {
  useAsyncBulkJob,
  useBulkAdjustBalances,
  useBulkSendInvoiceReminders,
  useBulkSendReceipts,
  useBulkSendStatements,
} from './hooks/useAsyncBulkJob'

// Pagination foundation (Sprint 0)
export { useFinancePaginatedQuery } from './hooks/useFinancePaginatedQuery'
export type {
  UseFinancePaginatedQueryOptions,
  UseFinancePaginatedQueryResult,
} from './hooks/useFinancePaginatedQuery'
export { normalizeFinanceListResponse } from './utils/normalize-finance-list-response'
export { flattenFinancePages } from './utils/flatten-finance-pages'
export { buildServerPaginationProps } from './utils/build-server-pagination-props'
export type { FinanceServerPaginationConfig } from './utils/build-server-pagination-props'
