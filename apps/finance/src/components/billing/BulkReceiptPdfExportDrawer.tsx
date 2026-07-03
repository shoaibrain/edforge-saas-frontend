/**
 * BulkReceiptPdfExportDrawer — Sprint G.4, redesigned per the Bulk PDF
 * Export prototype (Sprint H.4 adds the merged-PDF format picker).
 *
 * Thin wrapper over BulkExportDrawerBase: maps selected payments into the
 * normalized export-row shape and binds the receipt-side kickoff
 * mutation (POST .../payments/bulk-pdf-export). The payments-list caller
 * already filters the selection action to completed payments; anything
 * else that slips through is surfaced in the preflight skip note and
 * skipped server-side by the G.2 worker (status === 'completed' is the
 * source of truth — non-completed come back as counters.skipped, not
 * failed).
 */

import { useMemo } from 'react'
import type { Payment } from '@edforge/types'
import { useBulkReceiptPdfExport, type FinanceJobRow } from '@edforge/finance-services'
import { BulkExportDrawerBase } from './bulk-export/BulkExportDrawerBase'
import type { ExportRowSummary } from './bulk-export/export-manifest'

export interface BulkReceiptPdfExportDrawerProps {
  open: boolean
  onClose: () => void
  payments: Payment[]
  schoolId: string
  /** Called after the drawer's onClose fires; used to clear parent row selection. */
  onComplete?: () => void
}

export function BulkReceiptPdfExportDrawer({
  open,
  onClose,
  payments,
  schoolId,
  onComplete,
}: BulkReceiptPdfExportDrawerProps) {
  const startExport = useBulkReceiptPdfExport(schoolId)

  const rows = useMemo<ExportRowSummary[]>(
    () =>
      payments.map((payment) => ({
        id: payment.id,
        // Filename stem; receipts without a number fall back to a short id.
        number: payment.receiptNumber || payment.id.slice(0, 8),
        studentName: payment.studentName,
        status: payment.status,
        amount: payment.amount,
      })),
    [payments]
  )

  return (
    <BulkExportDrawerBase
      open={open}
      onClose={onClose}
      onComplete={onComplete}
      rows={rows}
      docType="receipt"
      i18nRoot="asyncJobs.receiptPdfExport"
      kickoff={(ids, format) => startExport.mutateAsync({ paymentIds: ids, format })}
      kickoffPending={startExport.isPending}
      resetKickoff={() => startExport.reset()}
      invalidateKey={['payments']}
    />
  )
}

export type { FinanceJobRow }
