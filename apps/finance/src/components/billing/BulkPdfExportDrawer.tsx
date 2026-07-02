/**
 * BulkPdfExportDrawer — Sprint F.5, redesigned per the Bulk PDF Export
 * prototype (Sprint H.4 adds the merged-PDF format picker).
 *
 * Thin wrapper: maps selected invoices into the normalized export-row
 * shape and binds the invoice-side kickoff mutation; all drawer states
 * (preflight manifest → running → result/failed, 409/413 handling,
 * expiry countdown, retry-failed) live in BulkExportDrawerBase.
 *
 * Props take full Invoice rows (not bare ids) so the preflight manifest
 * can aggregate statuses/students/value without refetching — same
 * pattern as the sibling BulkSendInvoiceReminderDrawer.
 */

import { useMemo } from 'react'
import type { Invoice } from '@edforge/types'
import { useBulkInvoicePdfExport, type FinanceJobRow } from '@edforge/finance-services'
import { BulkExportDrawerBase } from './bulk-export/BulkExportDrawerBase'
import type { ExportRowSummary } from './bulk-export/export-manifest'

export interface BulkPdfExportDrawerProps {
  open: boolean
  onClose: () => void
  invoices: Invoice[]
  schoolId: string
  /** Called after the drawer's onClose fires; used to clear parent row selection. */
  onComplete?: () => void
}

export function BulkPdfExportDrawer({
  open,
  onClose,
  invoices,
  schoolId,
  onComplete,
}: BulkPdfExportDrawerProps) {
  const startExport = useBulkInvoicePdfExport(schoolId)

  const rows = useMemo<ExportRowSummary[]>(
    () =>
      invoices.map((invoice) => ({
        id: invoice.id,
        // Filename stem; rare no-number rows fall back to a short id.
        number: invoice.invoiceNumber || invoice.id.slice(0, 8),
        studentName: invoice.studentName,
        status: invoice.status,
        amount: invoice.grandTotal,
        gradeLevel: (invoice as Invoice & { gradeLevel?: string }).gradeLevel,
      })),
    [invoices]
  )

  return (
    <BulkExportDrawerBase
      open={open}
      onClose={onClose}
      onComplete={onComplete}
      rows={rows}
      docType="invoice"
      i18nRoot="asyncJobs.pdfExport"
      kickoff={(ids, format) => startExport.mutateAsync({ invoiceIds: ids, format })}
      kickoffPending={startExport.isPending}
      resetKickoff={() => startExport.reset()}
      invalidateKey={['invoices']}
    />
  )
}

export type { FinanceJobRow }
