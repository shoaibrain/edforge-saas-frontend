/**
 * PaymentReceipt (Finance MFE)
 *
 * Renders the receipt as a PAPER DOCUMENT per the approved detail-page
 * prototype: a fixed cream card (identical in light and dark themes — it
 * is an artifact, not a themed surface), centered at ~680px, with a
 * rotated PAID stamp, dashed rules, key-value rows, amount-in-words
 * (Indian numbering), and computer-generated fine print.
 *
 * **Why this lives in Finance MFE** (Sprint M1.5-FU.2/.5b): receipt is
 * finance content consumed by admin flows on the Finance Payments index;
 * keeping it here lets it use `useAppStore` + `useFinanceSettings`
 * directly. Still the only PaymentReceipt in the tree.
 *
 * Print: the browser Print button is reinstated alongside the
 * server-rendered PDF download — the paper document IS the print layout
 * now (the earlier HTML print retirement predates this design). An
 * inline @media print sheet hides app chrome; beforeprint/afterprint
 * handlers force light rendering by toggling the shell-owned `.dark`
 * class (restored to its prior state afterwards).
 *
 * The refund block + PARTIAL REFUND stamp are dormant: the live receipt
 * payload carries no refund fields yet, so they render only if the
 * backend starts including them (`ReceiptWithRefund`). Never fabricated.
 */

import { useCallback, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import type { Receipt } from '@edforge/types'
import { useCurrency } from '@edforge/types/use-currency'
import { useTranslation } from '@edforge/i18n'
import { Button, DateDisplay } from '@edforge/ui'
import { useDownloadReceiptPdf } from '@edforge/finance-services'
import { ArrowLeft, Check, Download, Loader2, Printer, Undo2 } from 'lucide-react'
import { useAppStore } from '../../stores/app.store'
import { useFinanceSettings } from '../../layouts/FinanceLayout'
import { formatDate } from '../../utils/format-date'
import { amountInWords } from '../../utils/amount-in-words'

interface ReceiptRefund {
  amount: number
  date?: string
  reason?: string
  by?: string
}

/** Forward-compatible: renders the refund block only if the API adds it. */
type ReceiptWithRefund = Receipt & { refund?: ReceiptRefund | null }

interface PaymentReceiptProps {
  receipt: Receipt
  onBack?: () => void
  /** Originating invoice id (from the route's search) for deep links. */
  invoiceId?: string
}

export function PaymentReceipt({ receipt, onBack, invoiceId }: PaymentReceiptProps) {
  const { t } = useTranslation('payments')
  const settings = useFinanceSettings()
  const { format } = useCurrency(settings)
  const fmt = (amount: number) => format(amount)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const downloadReceipt = useDownloadReceiptPdf()
  const downloading = downloadReceipt.isPending

  const refund = (receipt as ReceiptWithRefund).refund ?? null
  const netTotal = receipt.grandTotal - (refund?.amount ?? 0)

  /**
   * Download the receipt as a server-rendered PDF (Sprint C.1.6 frontend).
   * Bails out (without erroring) when `activeSchoolId` hasn't hydrated.
   */
  const handleDownloadPdf = useCallback(() => {
    if (!activeSchoolId || downloading) return
    downloadReceipt.mutate({
      paymentId: receipt.paymentId,
      schoolId: activeSchoolId,
      receiptNumber: receipt.receiptNumber,
    })
  }, [activeSchoolId, downloading, downloadReceipt, receipt.paymentId, receipt.receiptNumber])

  // Print always renders light: the shell toggles theme via a `.dark`
  // class on <html> (no data-theme attr). Snapshot + restore around the
  // print lifecycle; never touch the shell's theme store from an MFE.
  useEffect(() => {
    let wasDark = false
    const before = () => {
      wasDark = document.documentElement.classList.contains('dark')
      document.documentElement.classList.remove('dark')
      document.documentElement.style.colorScheme = 'light'
    }
    const after = () => {
      if (wasDark) document.documentElement.classList.add('dark')
      document.documentElement.style.colorScheme = ''
    }
    window.addEventListener('beforeprint', before)
    window.addEventListener('afterprint', after)
    return () => {
      window.removeEventListener('beforeprint', before)
      window.removeEventListener('afterprint', after)
    }
  }, [])

  return (
    <div>
      {/* Action bar (hidden in print) */}
      <div className="mb-5 flex items-center gap-2 print:hidden">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-[rgb(var(--text-secondary))] transition-colors hover:text-[rgb(var(--text-primary))]"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('actions.back')}
          </button>
        )}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" />
            {t('receiptDetail.print')}
          </Button>
          <Button
            size="sm"
            onClick={handleDownloadPdf}
            disabled={downloading || !activeSchoolId}
            aria-label={t('receipt.downloadPdf')}
          >
            {downloading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            {t('receipt.downloadPdf')}
          </Button>
        </div>
      </div>

      {/* Paper document — theme-invariant cream artifact (hex by design) */}
      <div className="flex justify-center pb-8" data-receipt-paper>
        <div className="relative w-full max-w-2xl rounded-xl border border-[#E4DECF] bg-[#FBF8F1] px-8 py-10 text-[#262B33] shadow-lg sm:px-12">
          {/* Stamp */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute right-9 top-8 rotate-6 rounded-lg border-2 px-3.5 py-1 text-sm font-extrabold tracking-[0.22em] opacity-50 ${
              refund ? 'border-[#B45309] text-[#B45309]' : 'border-[#0E9F6E] text-[#0E9F6E]'
            }`}
          >
            {refund ? t('receiptDetail.stamp.partialRefund') : t('receiptDetail.stamp.paid')}
          </div>

          {/* Badge + title */}
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full border-2 border-[#0E9F6E] text-[#0E9F6E]">
            <Check className="h-5 w-5" strokeWidth={2.4} />
          </div>
          <h2 className="text-center font-display text-2xl font-medium tracking-tight !text-[#262B33]">
            {t('receipt.title')}
          </h2>
          <p className="mt-1.5 text-center font-mono text-xs !text-[#6B7280]">
            {t('receipt.receiptNumber')}
            {receipt.receiptNumber}
          </p>

          <DashRule />

          {/* School */}
          <div className="text-center">
            <p className="font-display text-lg font-medium !text-[#262B33]">{receipt.schoolName}</p>
            {(receipt.schoolAddress || receipt.taxBreakdown.panNumber) && (
              <p className="mt-1 text-xs !text-[#6B7280]">
                {[
                  receipt.schoolAddress,
                  receipt.taxBreakdown.panNumber
                    ? `${t('receipt.panNumber')} ${receipt.taxBreakdown.panNumber}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
          </div>

          <DashRule />

          {/* Key-value rows */}
          <div>
            <PaperKv label={t('receipt.studentName')} value={receipt.studentName} />
            {receipt.studentNumber && (
              <PaperKv label={t('receipt.studentNumber')} value={receipt.studentNumber} mono />
            )}
            {receipt.emisStudentId && (
              <PaperKv label={t('receipt.emisStudentId')} value={receipt.emisStudentId} mono />
            )}
            <PaperKv
              label={t('receipt.paymentDate')}
              value={<DateDisplay date={receipt.paidDate} format="long" showDual />}
            />
            <PaperKv label={t('receipt.paymentMethod')} value={receipt.gatewayDisplayName} />
            <PaperKv label={t('receipt.transactionId')} value={receipt.transactionId} mono />
            <PaperKv
              label={t('receiptDetail.fields.invoice')}
              value={
                invoiceId ? (
                  <Link
                    to="/invoices/$invoiceId"
                    params={{ invoiceId }}
                    className="border-b border-dashed border-[#0E9F6E] font-mono text-xs text-[#0E9F6E] no-underline"
                  >
                    {receipt.invoiceNumber}
                  </Link>
                ) : (
                  <span className="font-mono text-xs">{receipt.invoiceNumber}</span>
                )
              }
            />
            <PaperKv label={t('receipt.paidBy')} value={receipt.paidBy} />
          </div>

          <DashRule />

          {/* Line items + totals */}
          <div>
            {receipt.lineItems.map((item, idx) => (
              <div key={idx} className="flex justify-between gap-4 py-1.5 text-sm">
                <span>{item.description}</span>
                <span className="font-mono text-xs tabular-nums">{fmt(item.total)}</span>
              </div>
            ))}
            <div className="mt-2 border-t border-[#D8D0BC] pt-2.5">
              <div className="flex justify-between gap-4 py-1 text-sm">
                <span className="text-[#6B7280]">{t('summary.subtotal')}</span>
                <span className="font-mono text-xs tabular-nums">{fmt(receipt.subtotal)}</span>
              </div>
              {receipt.discountTotal > 0 && (
                <div className="flex justify-between gap-4 py-1 text-sm">
                  <span className="text-[#6B7280]">{t('summary.discountTotal')}</span>
                  <span className="font-mono text-xs tabular-nums">
                    −{fmt(receipt.discountTotal)}
                  </span>
                </div>
              )}
              {receipt.taxTotal > 0 && (
                <div className="flex justify-between gap-4 py-1 text-sm">
                  <span className="text-[#6B7280]">{t('summary.taxTotal')}</span>
                  <span className="font-mono text-xs tabular-nums">{fmt(receipt.taxTotal)}</span>
                </div>
              )}
              <div className="flex justify-between gap-4 py-1.5 text-base font-semibold">
                <span>{t('summary.grandTotal')}</span>
                <span className="font-mono tabular-nums">{fmt(receipt.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Amount in words */}
          <p className="mt-3.5 rounded-md bg-[#F3EEE1] px-3 py-2.5 text-xs !text-[#6B7280]">
            {t('receiptDetail.amountInWords')}{' '}
            <b className="font-semibold text-[#262B33]">{amountInWords(receipt.grandTotal)}</b>
          </p>

          {/* Refund block — dormant until the API carries refund fields */}
          {refund && (
            <div className="mt-3.5 rounded-lg border border-[#F3C6C6] bg-[#FBEDED] px-3.5 py-3 text-xs text-[#8C2F2F]">
              <p className="mb-1 flex items-center gap-1.5 font-semibold !text-[#8C2F2F]">
                <Undo2 className="h-3.5 w-3.5" />
                {t('receiptDetail.refund.title', { amount: fmt(refund.amount) })}
              </p>
              {[refund.reason, refund.date ? formatDate(refund.date, settings) : null, refund.by]
                .filter(Boolean)
                .join(' · ')}
              <p className="mt-1.5 font-semibold !text-[#8C2F2F]">
                {t('receiptDetail.refund.net', { amount: fmt(netTotal) })}
              </p>
            </div>
          )}

          <DashRule />

          <p className="text-center text-sm !text-[#4B5563]">{t('receipt.thankYou')}</p>
          <p className="mt-2 text-center text-2xs !text-[#9CA3AF]">
            {t('receiptDetail.fine', { date: formatDate(receipt.paidDate, settings) })}
          </p>
        </div>
      </div>

      {/* Print: hide app chrome, document full-width on white */}
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
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          main, [data-content] {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          [data-receipt-paper] {
            padding: 0 !important;
          }
          [data-receipt-paper] > div {
            max-width: 100% !important;
            border: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          @page {
            margin: 1.5cm;
          }
        }
      `}</style>
    </div>
  )
}

function DashRule() {
  return <hr className="my-5 border-0 border-t border-dashed border-[#D8D0BC]" />
}

function PaperKv({
  label,
  value,
  mono,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="flex-none text-[#6B7280]">{label}</span>
      <span
        className={`min-w-0 break-words text-right font-medium ${mono ? 'font-mono text-xs font-normal' : ''}`}
      >
        {value}
      </span>
    </div>
  )
}
