/**
 * PaymentReceipt
 *
 * Displays a payment receipt with BS+AD dual date, NPR amounts,
 * PAN/VAT tax breakdown, and print-friendly layout.
 */

import { useCallback, useRef } from 'react'
import type { Receipt } from '@edforge/types'
import { useCurrency } from '@edforge/types/use-currency'
import { useTranslation } from '@edforge/i18n'
import { DateDisplay } from '@edforge/ui'
import { useDownloadReceiptPdf } from '@edforge/finance-services'
import { CheckCircle2, Printer, ArrowLeft, Download, Loader2 } from 'lucide-react'
import { useSettings, useActiveSchool } from '../../lib/shell-context'

interface PaymentReceiptProps {
  receipt: Receipt
  onBack?: () => void
}

export function PaymentReceipt({ receipt, onBack }: PaymentReceiptProps) {
  const { t } = useTranslation('payments')
  const settings = useSettings()
  const { format } = useCurrency(settings)
  const fmt = (amount: number) => format(amount)
  // receiptRef is retained on the receipt card below; it's no longer used
  // for PDF capture (we render server-side now) but keeping the ref hook
  // would let a future "print-this-section" feature target the same node
  // without re-wiring. Removed in V1.5 if still unused.
  const receiptRef = useRef<HTMLDivElement>(null)
  const { activeSchoolId } = useActiveSchool()
  const downloadReceipt = useDownloadReceiptPdf()
  const downloading = downloadReceipt.isPending

  /**
   * Download the receipt as a server-rendered PDF (Sprint C.1.6 frontend).
   *
   * Replaces the prior jspdf+html2canvas client-side raster screenshot.
   * The server response embeds Devanagari fonts + uses BS+AD dual-date
   * formatting + tenant-customized branding — none of which the raster
   * approach could produce. Print button below stays through C.5 as a
   * fallback for users on browsers that block large blob downloads.
   *
   * Bails out (without erroring) when `activeSchoolId` is not yet
   * resolved — the shell context may not have loaded yet on cold-mount;
   * the user can click again once it has.
   */
  const handleDownloadPdf = useCallback(() => {
    if (!activeSchoolId || downloading) return
    downloadReceipt.mutate({
      paymentId: receipt.paymentId,
      schoolId: activeSchoolId,
      receiptNumber: receipt.receiptNumber,
    })
  }, [activeSchoolId, downloading, downloadReceipt, receipt.paymentId, receipt.receiptNumber])

  return (
    <div className="max-w-lg mx-auto">
      {/* Action bar (hidden in print) */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('actions.back')}
          </button>
        )}
        <div className="flex gap-2 ml-auto">
          <button
            type="button"
            onClick={handleDownloadPdf}
            // Disable when actively downloading OR when the shell context
            // hasn't resolved an active school yet (rare cold-mount path
            // — without this guard, clicks would silently no-op in the
            // handler because the API call needs `?schoolId=<sid>`).
            disabled={downloading || !activeSchoolId}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              border border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))]
              hover:bg-[rgb(var(--bg-tertiary))] transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {downloading ? t('receipt.generating') : t('receipt.download')}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              border border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))]
              hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            {t('receipt.print')}
          </button>
        </div>
      </div>

      {/* Receipt card */}
      <div ref={receiptRef} className="p-6 rounded-2xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-primary))] print:border-2 print:border-black">
        {/* Success header */}
        <div className="text-center mb-6 pb-6 border-b border-[rgb(var(--border-primary))] border-dashed">
          <div className="inline-flex p-3 rounded-full bg-emerald-100 dark:bg-emerald-500/10 mb-3 print:hidden">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold text-[rgb(var(--text-primary))]">
            {t('receipt.title')}
          </h2>
          <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
            {t('receipt.receiptNumber')}{receipt.receiptNumber}
          </p>
        </div>

        {/* School info */}
        <div className="text-center mb-6">
          <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
            {receipt.schoolName}
          </p>
          {receipt.schoolAddress && (
            <p className="text-xs text-[rgb(var(--text-tertiary))]">{receipt.schoolAddress}</p>
          )}
          {receipt.taxBreakdown.panNumber && (
            <p className="text-xs text-[rgb(var(--text-tertiary))]">
              {t('receipt.panNumber')}: {receipt.taxBreakdown.panNumber}
            </p>
          )}
        </div>

        {/* Receipt fields */}
        <div className="space-y-2 text-sm mb-6">
          <ReceiptField label={t('receipt.studentName')} value={receipt.studentName} />
          <ReceiptField
            label={t('receipt.paymentDate')}
            value={<DateDisplay date={receipt.paidDate} format="long" showDual />}
          />
          <ReceiptField label={t('receipt.paymentMethod')} value={receipt.gatewayDisplayName} />
          <ReceiptField label={t('receipt.transactionId')} value={receipt.transactionId} mono />
          <ReceiptField label={t('receipt.paidBy')} value={receipt.paidBy} />
        </div>

        {/* Line items */}
        <div className="border-t border-b border-[rgb(var(--border-primary))] py-4 mb-4 space-y-2">
          {receipt.lineItems.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-[rgb(var(--text-secondary))]">{item.description}</span>
              <span className="text-[rgb(var(--text-primary))] font-medium">
                {fmt(item.total)}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-[rgb(var(--text-tertiary))]">{t('summary.subtotal')}</span>
            <span className="text-[rgb(var(--text-primary))]">{fmt(receipt.subtotal)}</span>
          </div>
          {receipt.discountTotal > 0 && (
            <div className="flex justify-between">
              <span className="text-[rgb(var(--text-tertiary))]">{t('summary.discountTotal')}</span>
              <span className="text-emerald-600">-{fmt(receipt.discountTotal)}</span>
            </div>
          )}
          {receipt.taxTotal > 0 && (
            <div className="flex justify-between">
              <span className="text-[rgb(var(--text-tertiary))]">{t('summary.taxTotal')}</span>
              <span className="text-[rgb(var(--text-primary))]">{fmt(receipt.taxTotal)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-[rgb(var(--border-primary))]">
            <span className="font-semibold text-[rgb(var(--text-primary))]">
              {t('summary.grandTotal')}
            </span>
            <span className="font-bold text-lg text-[rgb(var(--text-primary))]">
              {fmt(receipt.grandTotal)}
            </span>
          </div>
        </div>

        {/* Thank you */}
        <div className="text-center mt-6 pt-6 border-t border-[rgb(var(--border-primary))] border-dashed">
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            {t('receipt.thankYou')}
          </p>
        </div>
      </div>
    </div>
  )
}

function ReceiptField({
  label,
  value,
  mono,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-[rgb(var(--text-tertiary))] shrink-0">{label}</span>
      <span
        className={`text-[rgb(var(--text-primary))] text-right ${mono ? 'font-mono text-xs' : ''}`}
      >
        {value}
      </span>
    </div>
  )
}
