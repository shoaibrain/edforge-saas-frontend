/**
 * Shared StatusBadge Component
 *
 * Unified status badge for invoices, payments, and ledger entries.
 * Replaces duplicate statusBadge/paymentStatusBadge functions across pages.
 */

const STATUS_STYLES: Record<string, string> = {
  // Invoice statuses
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  issued: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  partially_paid: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
  written_off: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',

  // Payment statuses
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  refunded: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  partially_refunded: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',

  // Ledger entry types
  debit: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  credit: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

const DEFAULT_STYLE = 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'

export function StatusBadge({ status, size = 'sm' }: { status: string; size?: 'xs' | 'sm' }) {
  const sizeClass = size === 'xs'
    ? 'px-1.5 py-0.5 text-[10px]'
    : 'px-2 py-0.5 text-xs'

  return (
    <span className={`inline-flex rounded-full font-medium ${sizeClass} ${STATUS_STYLES[status] || DEFAULT_STYLE}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}
