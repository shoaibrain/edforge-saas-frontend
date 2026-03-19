/**
 * Invoices Service — Re-exports from @edforge/finance-services
 *
 * Shell-local proxy. All implementation lives in the shared package.
 * Existing imports from shell pages/components continue to work unchanged.
 */

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
} from '@edforge/finance-services'

export type {
  FinancePaginatedResponse,
  BulkGenerateInvoiceResponse,
  BulkGenerateInvoiceDto,
  BulkIssueInvoicesDto,
  BulkIssueInvoicesResponse,
} from '@edforge/finance-services'
