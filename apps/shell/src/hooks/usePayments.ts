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
  // `usePaymentReceipt` re-export removed in Sprint M1.5-FU.7 closeout —
  // shell no longer renders a receipt page (moved to Finance MFE in
  // M1.5-FU.2). Any future shell-side consumer should re-add the export.
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
