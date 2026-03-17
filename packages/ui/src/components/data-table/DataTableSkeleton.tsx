import { cn } from '../../utils'

interface DataTableSkeletonProps {
  columnCount?: number
  rowCount?: number
  showActions?: boolean
  className?: string
}

export function DataTableSkeleton({
  columnCount = 5,
  rowCount = 5,
  showActions = false,
  className,
}: DataTableSkeletonProps) {
  const totalCols = showActions ? columnCount + 1 : columnCount

  return (
    <div
      className={cn(
        'overflow-x-auto rounded-xl border border-[rgb(var(--border-primary)/0.6)] shadow-sm bg-[rgb(var(--surface-primary))]',
        className
      )}
    >
      <table className="w-full">
        <thead>
          <tr className="border-b border-[rgb(var(--border-secondary))]">
            {Array.from({ length: totalCols }).map((_, i) => (
              <th
                key={i}
                className="px-6 py-3 text-left bg-[rgb(var(--surface-tertiary)/0.5)]"
              >
                <div
                  className="h-3 bg-[rgb(var(--surface-tertiary))] rounded animate-pulse"
                  style={{ width: i === 0 ? '60%' : '40%' }}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-[rgb(var(--border-secondary))] last:border-b-0"
            >
              {Array.from({ length: columnCount }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <div
                    className="h-4 bg-[rgb(var(--surface-tertiary))] rounded animate-pulse"
                    style={{
                      width:
                        colIndex === 0
                          ? '80%'
                          : rowIndex % 2 === 0
                            ? '60%'
                            : '45%',
                    }}
                  />
                </td>
              ))}
              {showActions && (
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <div className="w-8 h-8 bg-[rgb(var(--surface-tertiary))] rounded animate-pulse" />
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
