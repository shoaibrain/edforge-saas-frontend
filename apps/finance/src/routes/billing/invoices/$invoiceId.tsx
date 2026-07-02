/**
 * Admin Invoice Detail Page
 *
 * Route: /finance/invoices/:invoiceId (finance router basepath `/finance`).
 * Redesigned per the Finance detail-page prototypes: state-aware header
 * actions, joined summary band, line items + totals stack, payment history,
 * sidebar (details / student / activity timeline), and the Record Payment
 * drawer.
 */

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Skeleton } from '@edforge/ui'
import { UuidBadge } from '@edforge/archetype'
import { ArrowLeft, AlertTriangle, FileText } from 'lucide-react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useTranslation } from '@edforge/i18n'
import type { Payment } from '@edforge/types'
import { useAppStore } from '../../../stores/app.store'
import {
  useInvoice,
  useIssueInvoice,
  useCancelInvoice,
  useInvoicePayments,
} from '@edforge/finance-services'
import { useCurrency } from '@edforge/types/use-currency'
import { useFinanceSettings } from '../../../layouts/FinanceLayout'
import { BulkSendInvoiceReminderDrawer } from '../../../components/billing/BulkSendInvoiceReminderDrawer'
import {
  CancelInvoiceDialog,
  InvoiceDetailAside,
  InvoiceDetailHeader,
  InvoiceLineItemsCard,
  InvoicePaymentsCard,
  InvoiceStateBanner,
  InvoiceSummaryBand,
  RecordPaymentDrawer,
} from '../../../components/billing/invoice-detail'

export default function InvoiceDetailPage() {
  const navigate = useNavigate()
  const { invoiceId } = useParams({ strict: false }) as { invoiceId: string }
  const schoolId = useAppStore((s) => s.activeSchoolId)
  const settings = useFinanceSettings()
  const { format } = useCurrency(settings)
  const { t } = useTranslation('payments')

  const {
    data: invoice,
    isLoading,
    isPending,
    error,
    refetch,
  } = useInvoice(schoolId ?? '', invoiceId)
  const { data: payments } = useInvoicePayments(schoolId ?? '', invoiceId)
  const issueMutation = useIssueInvoice(schoolId ?? '')
  const cancelMutation = useCancelInvoice(schoolId ?? '')

  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false)
  const [reminderOpen, setReminderOpen] = useState(false)

  const handleIssue = async () => {
    try {
      await issueMutation.mutateAsync(invoiceId)
      toast.success(t('invoices.issueSuccess'))
    } catch {
      toast.error(t('invoices.issueFailed'))
    }
  }

  const handleConfirmCancel = async (reason: string) => {
    try {
      await cancelMutation.mutateAsync({ invoiceId, reason })
      toast.success(t('invoices.cancelSuccess'))
      setShowCancelDialog(false)
    } catch {
      toast.error(t('invoices.cancelFailed'))
    }
  }

  if (isLoading || isPending) {
    return <InvoiceDetailSkeleton />
  }

  if (error || !invoice) {
    // Status-differentiated error (same house pattern as the receipt page):
    // 403 — caller lacks billing:view on this school; 404 — invoice id
    // unknown on this school; else — generic failure. Retry refetches in
    // place; the UuidBadge gives operators a support-ready entity id.
    const status = (error as { response?: { status?: number } } | undefined)?.response?.status
    const messageKey =
      status === 403
        ? 'invoiceDetail.error.forbidden'
        : status === 404
          ? 'invoiceDetail.error.notFound'
          : 'error.failedToLoad'
    return (
      <div className="py-16 text-center">
        <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-[rgb(var(--state-danger-fg))]" />
        <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{t(messageKey)}</p>
        <p className="mt-2 text-xs text-[rgb(var(--text-tertiary))]">
          <UuidBadge value={invoiceId} />
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => navigate({ to: '/invoices' })}
            className="rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] px-4 py-2 text-sm font-medium text-[rgb(var(--text-primary))] transition-colors hover:bg-[rgb(var(--background-tertiary))]"
          >
            {t('invoiceDetail.backToInvoices')}
          </button>
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-lg bg-[rgb(var(--action-primary-bg))] px-4 py-2 text-sm font-medium text-[rgb(var(--action-primary-fg))] transition-colors hover:bg-[rgb(var(--action-primary-bg-hover))]"
          >
            {t('actions.retry')}
          </button>
        </div>
      </div>
    )
  }

  const paymentsList: Payment[] = Array.isArray(payments)
    ? payments
    : ((payments as { items?: Payment[] } | undefined)?.items ?? [])

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-6">
      {/* Back nav */}
      <button
        onClick={() => navigate({ to: '/invoices' })}
        className="flex items-center gap-1.5 text-sm text-[rgb(var(--text-secondary))] transition-colors hover:text-[rgb(var(--text-primary))] print:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('invoiceDetail.backToInvoices')}
      </button>

      <InvoiceStateBanner invoice={invoice} settings={settings} />

      <InvoiceDetailHeader
        invoice={invoice}
        schoolId={schoolId ?? ''}
        onIssue={handleIssue}
        issuePending={issueMutation.isPending}
        onCancel={() => setShowCancelDialog(true)}
        onRecordPayment={() => setRecordPaymentOpen(true)}
        onSendReminder={() => setReminderOpen(true)}
      />

      <InvoiceSummaryBand
        invoice={invoice}
        payments={paymentsList}
        settings={settings}
        format={format}
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-4">
          <InvoiceLineItemsCard invoice={invoice} format={format} />
          <InvoicePaymentsCard
            invoice={invoice}
            payments={paymentsList}
            onRecordPayment={() => setRecordPaymentOpen(true)}
            settings={settings}
            format={format}
          />
          {invoice.notes && (
            <section className="flex items-start gap-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] px-4 py-3 text-sm leading-relaxed text-[rgb(var(--text-secondary))]">
              <FileText className="mt-0.5 h-4 w-4 flex-none text-[rgb(var(--text-tertiary))]" />
              <span>{invoice.notes}</span>
            </section>
          )}
        </div>
        <InvoiceDetailAside
          invoice={invoice}
          payments={paymentsList}
          settings={settings}
          format={format}
        />
      </div>

      {/* Cancel Invoice Dialog */}
      <AnimatePresence>
        {showCancelDialog && (
          <CancelInvoiceDialog
            // eslint-disable-next-line edforge/no-id-slice-in-jsx -- dialog prop needs a plain string label; rare no-number fallback, not a rendered UUID
            invoiceNumber={invoice.invoiceNumber || `Invoice ${invoice.id.slice(0, 8)}`}
            isPending={cancelMutation.isPending}
            onConfirm={handleConfirmCancel}
            onClose={() => setShowCancelDialog(false)}
          />
        )}
      </AnimatePresence>

      {/* Record Payment drawer */}
      {schoolId && (
        <RecordPaymentDrawer
          open={recordPaymentOpen}
          onClose={() => setRecordPaymentOpen(false)}
          invoice={invoice}
          schoolId={schoolId}
        />
      )}

      {/* Single-invoice reminder rides the bulk-reminder drawer with one id */}
      {schoolId && (
        <BulkSendInvoiceReminderDrawer
          open={reminderOpen}
          invoices={reminderOpen ? [invoice] : []}
          schoolId={schoolId}
          onClose={() => setReminderOpen(false)}
          onComplete={() => setReminderOpen(false)}
        />
      )}

      {/* Print-friendly styles */}
      <style>{`
        @media print {
          nav, header, aside,
          [data-sidebar], [data-topbar], [data-shell-header] {
            display: none !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
            font-size: 12pt;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          * {
            box-shadow: none !important;
          }
          main, [data-content], .p-6 {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          table {
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #d1d5db !important;
            padding: 6px 10px !important;
          }
          h1, h2, h3, p, span, td, th {
            color: black !important;
          }
          .rounded-full {
            border: 1px solid #9ca3af !important;
          }
          @page {
            margin: 1.5cm;
          }
        }
      `}</style>
    </div>
  )
}

function InvoiceDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-4 p-6" aria-busy="true">
      <Skeleton className="h-4 w-28" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-72" />
      </div>
      <Skeleton className="h-28 w-full" />
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      </div>
    </div>
  )
}
