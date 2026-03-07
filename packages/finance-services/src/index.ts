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
  invoicesService,
} from './services/invoices.service'
export type {
  FinancePaginatedResponse,
  BulkGenerateInvoiceResponse,
  BulkGenerateInvoiceDto,
  BulkIssueInvoicesDto,
  BulkIssueInvoicesResponse,
} from './services/invoices.service'

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
  useCreateFeeStructure,
  useUpdateFeeStructure,
  useDeleteFeeStructure,
} from './hooks/useFeeStructures'

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
  useExportPaymentsCsv,
  studentKeys,
  useSearchStudents,
} from './hooks/usePayments'

export {
  gatewayKeys,
  useEnabledGateways,
  useGatewayConfigs,
  useSaveGatewayConfig,
} from './hooks/usePaymentGateways'
