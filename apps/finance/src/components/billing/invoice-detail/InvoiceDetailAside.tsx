/**
 * Right-column sidebar: Details card (status / issued / due / billing
 * period / academic year with dual dates), Student card, and the Activity
 * timeline. Fields the invoice payload doesn't carry (grade, EMIS,
 * guardian) are omitted rather than fabricated.
 */

import { Link } from '@tanstack/react-router'
import { ArrowRight, Info, Users } from 'lucide-react'
import { Avatar } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import type { Invoice, Payment } from '@edforge/types'
import type { ResolvedSettings } from '@edforge/config/resolved-settings'
import { FinanceStatusChip } from '../../shared'
import { formatDate } from '../../../utils/format-date'
import { bsSubOf } from './invoice-detail-utils'
import { InvoiceActivityTimeline } from './InvoiceActivityTimeline'
import type { ReactNode } from 'react'

export interface InvoiceDetailAsideProps {
  invoice: Invoice
  payments: Payment[]
  settings: ResolvedSettings
  format: (amount: number) => string
}

function KvRow({ label, value, sub }: { label: string; value: ReactNode; sub?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[rgb(var(--border-primary))] px-4 py-2.5 text-sm last:border-b-0">
      <span className="flex-none text-[rgb(var(--text-tertiary))]">{label}</span>
      <span className="min-w-0 text-right font-medium text-[rgb(var(--text-primary))]">
        {value}
        {sub && (
          <span className="block font-mono text-2xs font-normal text-[rgb(var(--text-tertiary))]">
            {sub}
          </span>
        )}
      </span>
    </div>
  )
}

export function InvoiceDetailAside({
  invoice,
  payments,
  settings,
  format,
}: InvoiceDetailAsideProps) {
  const { t } = useTranslation('payments')
  const issuedBs = bsSubOf(invoice.issuedDate, settings)
  const dueBs = bsSubOf(invoice.dueDate, settings)

  return (
    <div className="space-y-4">
      {/* Details */}
      <section className="overflow-hidden rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))]">
        <div className="flex items-center gap-2 border-b border-[rgb(var(--border-primary))] px-4 py-3">
          <Info className="h-4 w-4 text-[rgb(var(--text-tertiary))]" />
          <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
            {t('invoiceDetail.aside.details')}
          </h2>
        </div>
        <KvRow label={t('invoiceDetail.aside.status')} value={<FinanceStatusChip status={invoice.status} />} />
        <KvRow
          label={t('invoiceDetail.aside.issued')}
          value={
            invoice.issuedDate
              ? formatDate(invoice.issuedDate, settings)
              : t('invoiceDetail.aside.notIssuedYet')
          }
          sub={invoice.issuedDate && issuedBs ? `BS ${issuedBs}` : null}
        />
        <KvRow
          label={t('invoiceDetail.aside.due')}
          value={invoice.dueDate ? formatDate(invoice.dueDate, settings) : '—'}
          sub={dueBs ? `BS ${dueBs}` : null}
        />
        {invoice.billingPeriod && (
          <KvRow label={t('invoiceDetail.aside.billingPeriod')} value={invoice.billingPeriod} />
        )}
        <KvRow label={t('invoiceDetail.aside.academicYear')} value={invoice.academicYear} />
      </section>

      {/* Student */}
      <section className="overflow-hidden rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))]">
        <div className="flex items-center gap-3 border-b border-[rgb(var(--border-primary))] px-4 py-3">
          <Avatar name={invoice.studentName} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">
              {invoice.studentName}
            </p>
          </div>
        </div>
        <Link
          to="/accounts"
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[rgb(var(--state-success-fg))] transition-colors hover:bg-[rgb(var(--background-tertiary))] print:hidden"
        >
          <Users className="h-3.5 w-3.5" />
          {t('invoiceDetail.aside.viewStudentAccount')}
          <ArrowRight className="ml-auto h-3.5 w-3.5" />
        </Link>
      </section>

      <InvoiceActivityTimeline
        invoice={invoice}
        payments={payments}
        settings={settings}
        format={format}
      />
    </div>
  )
}
