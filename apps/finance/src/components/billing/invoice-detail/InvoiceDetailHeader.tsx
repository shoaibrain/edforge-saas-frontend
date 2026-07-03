/**
 * Invoice-detail header: mono invoice number + status chip, student meta
 * row, and STATE-AWARE actions —
 *   draft:                     [Issue PRIMARY] [Download] ⋯(Cancel draft)
 *   issued/partial/overdue:    [Send reminder] [Download] [Record payment PRIMARY] ⋯(Cancel invoice)
 *   paid/cancelled/written_off:[Download PRIMARY]
 *
 * The Download button's JSX contract (mutate args, aria-label, pending
 * spinner swap) is pinned by invoice-detail-download-button.test.tsx —
 * keep it byte-compatible.
 */

import { Check, Download, Loader2, Send, Wallet, XCircle } from 'lucide-react'
import { Avatar, Button } from '@edforge/ui'
import { UuidBadge } from '@edforge/archetype'
import { useTranslation } from '@edforge/i18n'
import type { Invoice } from '@edforge/types'
import { useDownloadInvoicePdf } from '@edforge/finance-services'
import { FinanceStatusChip, ActionsMenu, type ActionsMenuItem } from '../../shared'
import { isPayable } from './invoice-detail-utils'

export interface InvoiceDetailHeaderProps {
  invoice: Invoice
  schoolId: string
  onIssue: () => void
  issuePending: boolean
  onCancel: () => void
  onRecordPayment: () => void
  onSendReminder: () => void
}

export function InvoiceDetailHeader({
  invoice,
  schoolId,
  onIssue,
  issuePending,
  onCancel,
  onRecordPayment,
  onSendReminder,
}: InvoiceDetailHeaderProps) {
  const { t } = useTranslation('payments')
  const downloadInvoice = useDownloadInvoicePdf()
  const payable = isPayable(invoice.status)
  const settled = invoice.status === 'paid' || invoice.status === 'cancelled' || invoice.status === 'written_off'

  const menuItems: ActionsMenuItem[] = []
  if (invoice.status === 'draft') {
    menuItems.push({
      label: t('invoiceDetail.actions.cancelDraft'),
      icon: <XCircle className="h-4 w-4" />,
      danger: true,
      onClick: onCancel,
    })
  } else if (payable) {
    menuItems.push({
      label: t('invoices.cancelInvoice'),
      icon: <XCircle className="h-4 w-4" />,
      danger: true,
      onClick: onCancel,
    })
  }

  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="min-w-64 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-semibold tracking-tight text-[rgb(var(--text-primary))]">
            {invoice.invoiceNumber || (
              <>
                {t('invoiceDetail.invoice')} <UuidBadge value={invoice.id} />
              </>
            )}
          </h1>
          <FinanceStatusChip status={invoice.status} />
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-[rgb(var(--text-secondary))]">
          {invoice.studentName && (
            <span className="inline-flex items-center gap-1.5">
              <Avatar name={invoice.studentName} size="xs" />
              {invoice.studentName}
            </span>
          )}
          {invoice.billingPeriod && (
            <>
              <span className="h-0.5 w-0.5 rounded-full bg-[rgb(var(--text-disabled))]" aria-hidden="true" />
              <span>{invoice.billingPeriod}</span>
            </>
          )}
          <span className="h-0.5 w-0.5 rounded-full bg-[rgb(var(--text-disabled))]" aria-hidden="true" />
          <span>{invoice.academicYear}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 print:hidden">
        {payable && (
          <Button variant="outline" onClick={onSendReminder}>
            <Send className="mr-1.5 h-4 w-4" />
            {t('invoiceDetail.actions.sendReminder')}
          </Button>
        )}
        {/*
          M1.5 — Download PDF button. The M1.4 hook owns telemetry + the
          localized error toast; invoiceNumber keeps the filename aligned
          with the on-screen number. Contract pinned by
          invoice-detail-download-button.test.tsx.
        */}
        <Button
          variant={settled ? 'primary' : 'outline'}
          onClick={() =>
            schoolId &&
            downloadInvoice.mutate({
              schoolId,
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
            })
          }
          disabled={downloadInvoice.isPending || !schoolId}
          aria-label={t('actions.downloadPdf')}
        >
          {downloadInvoice.isPending ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-1.5 h-4 w-4" />
          )}
          {t('actions.downloadPdf')}
        </Button>
        {invoice.status === 'draft' && (
          <Button onClick={onIssue} disabled={issuePending}>
            {issuePending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-1.5 h-4 w-4" />
            )}
            {t('invoiceDetail.actions.issueInvoice')}
          </Button>
        )}
        {payable && (
          <Button onClick={onRecordPayment}>
            <Wallet className="mr-1.5 h-4 w-4" />
            {t('recordPayment.title')}
          </Button>
        )}
        <ActionsMenu items={menuItems} label={t('invoiceDetail.actions.moreActions')} />
      </div>
    </div>
  )
}
