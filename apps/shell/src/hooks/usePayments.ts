/**
 * usePayments — Re-exports from @edforge/finance-services
 *
 * Shell-local proxy. All implementation lives in the shared package.
 * Existing imports from shell pages/components continue to work unchanged.
 */

export {
  paymentKeys,
  useInvoices,
  useInvoice,
  useGenerateInvoice,
  useIssueInvoice,
  useCancelInvoice,
  useInvoicePayments,
  useInitiatePayment,
  useVerifyPayment,
  usePaymentReceipt,
  useStudentAccounts,
  useStudentLedger,
  useSchoolPayments,
  useRecordManualPayment,
  useVoidPayment,
  useCreateRefund,
  useBulkGenerateInvoices,
  useBulkIssueInvoices,
  useDashboardSummary,
  useExportInvoicesCsv,
} from '@edforge/finance-services'

// Re-export types that consumers may import with `type`
export type {
  BulkGenerateInvoiceDto,
  BulkIssueInvoicesDto,
} from '@edforge/finance-services'
