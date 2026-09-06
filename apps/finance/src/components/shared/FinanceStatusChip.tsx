/**
 * FinanceStatusChip — status chip for invoices, payments, and ledger entries.
 *
 * Thin wrapper over the design-system StatusBadge: maps each domain status to a
 * semantic tone and renders the canonical dotted pill. The `size` prop is kept
 * for call-site compatibility (the badge renders at a single compact size).
 */

import { StatusBadge, type StatusTone } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'

export interface FinanceStatusChipProps {
  status: string
  size?: 'xs' | 'sm'
}

const STATUS_TONE: Record<string, StatusTone> = {
  // Invoice statuses
  paid: 'success',
  issued: 'info',
  overdue: 'danger',
  draft: 'neutral',
  partially_paid: 'warning',
  cancelled: 'neutral',
  written_off: 'neutral',

  // Payment statuses
  completed: 'success',
  failed: 'danger',
  refunded: 'warning',
  partially_refunded: 'warning',
  pending: 'warning',
  processing: 'info',

  // Ledger entry types
  debit: 'danger',
  credit: 'success',

  // Agreement statuses (draft/cancelled already covered above)
  active: 'success',
  expired: 'neutral',
  superseded: 'neutral',
}

const STATUS_LABELS: Record<string, string> = {
  partially_paid: 'Partial',
  partially_refunded: 'Partial refund',
  written_off: 'Written off',
}

function normalizeStatus(status: string): string {
  return status.toLowerCase().replace(/ /g, '_')
}

function getStatusLabel(normalized: string, original: string): string {
  return STATUS_LABELS[normalized] ?? original.replace(/_/g, ' ')
}

export function FinanceStatusChip({ status }: FinanceStatusChipProps) {
  const { t } = useTranslation('payments')
  const normalized = normalizeStatus(status)
  const tone = STATUS_TONE[normalized] ?? 'neutral'
  const label = t(`status.${normalized}`, {
    defaultValue: getStatusLabel(normalized, status),
  })

  return (
    <StatusBadge tone={tone} dot size="sm" className="capitalize">
      {label}
    </StatusBadge>
  )
}
