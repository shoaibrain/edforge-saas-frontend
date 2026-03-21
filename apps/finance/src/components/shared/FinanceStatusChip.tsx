/**
 * FinanceStatusChip — V2 status chip with dot indicator.
 *
 * Replaces StatusBadge across finance pages with V2-styled dots + text.
 * Supports invoice statuses, payment statuses, and ledger entry types.
 */

export interface FinanceStatusChipProps {
  status: string
  size?: 'xs' | 'sm'
}

const STATUS_COLORS: Record<string, string> = {
  // Invoice statuses
  paid: '#1D9E75',
  issued: '#378ADD',
  overdue: '#E24B4A',
  draft: 'var(--v2-text-hint, #4a5068)',
  partially_paid: '#EF9F27',
  cancelled: 'var(--v2-text-ghost, #2a3045)',
  written_off: 'var(--v2-text-ghost, #2a3045)',

  // Payment statuses
  completed: '#1D9E75',
  failed: '#E24B4A',
  refunded: '#EF9F27',
  partially_refunded: '#EF9F27',
  pending: '#EF9F27',
  processing: '#378ADD',

  // Ledger entry types
  debit: '#E24B4A',
  credit: '#1D9E75',
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

export function FinanceStatusChip({ status, size = 'sm' }: FinanceStatusChipProps) {
  const normalized = normalizeStatus(status)
  const color = STATUS_COLORS[normalized] ?? 'var(--v2-text-hint, #4a5068)'
  const label = getStatusLabel(normalized, status)

  const dotSize = size === 'xs' ? 5 : 6
  const fontSize = size === 'xs' ? '10px' : '11px'
  const gap = size === 'xs' ? 4 : 5

  return (
    <span
      className="inline-flex items-center"
      style={{ gap }}
    >
      <span
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
          display: 'inline-block',
        }}
      />
      <span
        style={{
          fontSize,
          fontWeight: 500,
          color,
          textTransform: 'capitalize',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </span>
  )
}
