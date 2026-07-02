/**
 * Activity timeline card — statusHistory + payments merged newest-first
 * with tone-colored dots (info = issued, danger = overdue/cancelled,
 * success = payment/paid) and dual-date right column.
 */

import type { ReactNode } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Send,
  Wallet,
  XCircle,
} from 'lucide-react'
import { cn } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import type { Invoice, Payment } from '@edforge/types'
import type { ResolvedSettings } from '@edforge/config/resolved-settings'
import { formatDate } from '../../../utils/format-date'
import { bsSubOf } from './invoice-detail-utils'
import { formatPaymentGateway } from './gateway-label'
import {
  buildInvoiceTimeline,
  type InvoiceTimelineEvent,
  type InvoiceTimelineEventKind,
} from './build-invoice-timeline'

export interface InvoiceActivityTimelineProps {
  invoice: Invoice
  payments: Payment[]
  settings: ResolvedSettings
  format: (amount: number) => string
}

type Tone = 'neutral' | 'info' | 'success' | 'danger'

const KIND_TONE: Record<InvoiceTimelineEventKind, Tone> = {
  created: 'neutral',
  issued: 'info',
  overdue: 'danger',
  payment: 'success',
  paid: 'success',
  cancelled: 'danger',
  written_off: 'danger',
}

const KIND_ICON: Record<InvoiceTimelineEventKind, ReactNode> = {
  created: <FileText className="h-3.5 w-3.5" />,
  issued: <Send className="h-3.5 w-3.5" />,
  overdue: <AlertTriangle className="h-3.5 w-3.5" />,
  payment: <Wallet className="h-3.5 w-3.5" />,
  paid: <CheckCircle2 className="h-3.5 w-3.5" />,
  cancelled: <XCircle className="h-3.5 w-3.5" />,
  written_off: <XCircle className="h-3.5 w-3.5" />,
}

const TONE_DOT: Record<Tone, string> = {
  neutral:
    'border-[rgb(var(--border-secondary))] bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))]',
  info: 'border-[rgb(var(--state-info-border)/0.4)] bg-[rgb(var(--state-info-bg))] text-[rgb(var(--state-info-fg))]',
  success:
    'border-[rgb(var(--state-success-border)/0.4)] bg-[rgb(var(--state-success-bg))] text-[rgb(var(--state-success-fg))]',
  danger:
    'border-[rgb(var(--state-danger-border)/0.4)] bg-[rgb(var(--state-danger-bg))] text-[rgb(var(--state-danger-fg))]',
}

export function InvoiceActivityTimeline({
  invoice,
  payments,
  settings,
  format,
}: InvoiceActivityTimelineProps) {
  const { t } = useTranslation('payments')
  const events = buildInvoiceTimeline(invoice, payments)

  const titleOf = (e: InvoiceTimelineEvent): string => {
    switch (e.kind) {
      case 'created':
        return t('invoiceDetail.timeline.created')
      case 'issued':
        return t('invoiceDetail.timeline.issued')
      case 'overdue':
        return t('invoiceDetail.timeline.overdue')
      case 'payment':
        return t('invoiceDetail.timeline.payment', { amount: format(e.amount ?? 0) })
      case 'paid':
        return t('invoiceDetail.timeline.paid')
      case 'cancelled':
        return t('invoiceDetail.timeline.cancelled')
      case 'written_off':
        return t('invoiceDetail.timeline.writtenOff')
    }
  }

  const subOf = (e: InvoiceTimelineEvent): string | null => {
    switch (e.kind) {
      case 'created':
        return e.by ? t('invoiceDetail.timeline.by', { name: e.by }) : null
      case 'issued':
        return e.by ? t('invoiceDetail.timeline.by', { name: e.by }) : null
      case 'overdue':
        return t('invoiceDetail.timeline.overdueSub')
      case 'payment': {
        const gateway = formatPaymentGateway(e.gateway, t)
        return e.receiptNumber
          ? t('invoiceDetail.timeline.paymentSub', { gateway, receipt: e.receiptNumber })
          : gateway
      }
      case 'paid':
        return t('invoiceDetail.timeline.paidSub')
      case 'cancelled':
        return [e.reason, e.by ? t('invoiceDetail.timeline.by', { name: e.by }) : null]
          .filter(Boolean)
          .join(' · ') || null
      case 'written_off':
        return e.by ? t('invoiceDetail.timeline.by', { name: e.by }) : null
    }
  }

  if (events.length === 0) return null

  return (
    <section className="overflow-hidden rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))]">
      <div className="flex items-center gap-2 border-b border-[rgb(var(--border-primary))] px-4 py-3">
        <Clock className="h-4 w-4 text-[rgb(var(--text-tertiary))]" />
        <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
          {t('invoiceDetail.aside.activity')}
        </h2>
      </div>
      <ol className="px-4 pb-3.5 pt-1.5">
        {events.map((e, i) => {
          const tone = KIND_TONE[e.kind]
          const bs = bsSubOf(e.at, settings)
          const sub = subOf(e)
          return (
            <li key={`${e.kind}-${e.at}-${i}`} className="relative flex gap-3 py-2.5">
              {i < events.length - 1 && (
                <span
                  className="absolute bottom-0 left-3.5 top-9 w-px bg-[rgb(var(--border-secondary))]"
                  aria-hidden="true"
                />
              )}
              <span
                className={cn(
                  'z-10 grid h-7 w-7 flex-none place-items-center rounded-full border',
                  TONE_DOT[tone]
                )}
              >
                {KIND_ICON[e.kind]}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{titleOf(e)}</p>
                {sub && <p className="mt-0.5 text-xs text-[rgb(var(--text-tertiary))]">{sub}</p>}
              </div>
              <div className="whitespace-nowrap pt-1 text-right text-xs text-[rgb(var(--text-tertiary))]">
                {formatDate(e.at, settings)}
                {bs && (
                  <span className="block font-mono text-2xs text-[rgb(var(--text-disabled))]">
                    BS {bs}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
