/**
 * Shared StatusBadge Component
 *
 * Unified status badge for invoices, payments, and ledger entries.
 * Replaces duplicate statusBadge/paymentStatusBadge functions across pages.
 */

const STATUS_STYLES: Record<string, string> = {
  // Invoice statuses
  draft: 'bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-secondary))]',
  issued: 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))]',
  partially_paid: 'bg-[rgb(var(--state-warning-bg)/0.18)] text-[rgb(var(--state-warning-fg))]',
  paid: 'bg-[rgb(var(--state-success-bg)/0.18)] text-[rgb(var(--state-success-fg))]',
  overdue: 'bg-[rgb(var(--state-danger-bg)/0.18)] text-[rgb(var(--state-danger-fg))]',
  cancelled: 'bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-tertiary))]',
  written_off: 'bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-tertiary))]',

  // Payment statuses
  completed: 'bg-[rgb(var(--state-success-bg)/0.18)] text-[rgb(var(--state-success-fg))]',
  failed: 'bg-[rgb(var(--state-danger-bg)/0.18)] text-[rgb(var(--state-danger-fg))]',
  refunded: 'bg-[rgb(var(--state-warning-bg)/0.18)] text-[rgb(var(--state-warning-fg))]',
  partially_refunded: 'bg-[rgb(var(--state-warning-bg)/0.18)] text-[rgb(var(--state-warning-fg))]',
  pending: 'bg-[rgb(var(--state-warning-bg)/0.18)] text-[rgb(var(--state-warning-fg))]',
  processing: 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))]',

  // Ledger entry types
  debit: 'bg-[rgb(var(--state-danger-bg)/0.18)] text-[rgb(var(--state-danger-fg))]',
  credit: 'bg-[rgb(var(--state-success-bg)/0.18)] text-[rgb(var(--state-success-fg))]',
}

const DEFAULT_STYLE = 'bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-tertiary))]'

export function StatusBadge({ status, size = 'sm' }: { status: string; size?: 'xs' | 'sm' }) {
  const sizeClass = size === 'xs'
    ? 'px-1.5 py-0.5 text-xs'
    : 'px-2 py-0.5 text-xs'

  return (
    <span className={`inline-flex rounded-full font-medium ${sizeClass} ${STATUS_STYLES[status] || DEFAULT_STYLE}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}
