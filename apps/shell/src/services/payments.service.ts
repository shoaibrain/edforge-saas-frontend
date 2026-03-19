/**
 * Payments Service — Re-exports from @edforge/finance-services
 *
 * Shell-local proxy. All implementation lives in the shared package.
 * Existing imports from shell pages/components continue to work unchanged.
 */

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
  paymentsService,
} from '@edforge/finance-services'
