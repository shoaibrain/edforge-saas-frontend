/**
 * Table Loading Skeleton
 *
 * Placeholder skeleton for table loading states.
 * Renders shimmer rows that match typical table layouts.
 */

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-[rgb(var(--surface-tertiary))] animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="border border-[rgb(var(--border-primary))] rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-[rgb(var(--surface-secondary))] border-b border-[rgb(var(--border-primary))]">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <div className="h-3 w-16 rounded bg-[rgb(var(--surface-tertiary))] animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[rgb(var(--border-primary))]">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
