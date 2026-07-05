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
        'overflow-hidden rounded-xl border border-[rgb(var(--border-primary)/0.5)] shadow-[0_1px_3px_0_rgb(0_0_0/0.08),0_1px_2px_-1px_rgb(0_0_0/0.08)] bg-[rgb(var(--background-secondary))]',
        className
      )}
    >
      <table className="w-full">
        <thead>
          <tr className="border-b border-[rgb(var(--border-primary)/0.3)]">
            {Array.from({ length: totalCols }).map((_, i) => (
              <th
                key={i}
                className="px-4 py-2.5 text-start bg-[rgb(var(--background-tertiary))]"
              >
                <div
                  className="h-2.5 bg-[rgb(var(--border-secondary))] rounded animate-pulse"
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
              className="border-b border-[rgb(var(--border-secondary)/0.7)] last:border-b-0"
            >
              {Array.from({ length: columnCount }).map((_, colIndex) => (
                <td key={colIndex} className="px-4 py-2.5">
                  <div
                    className="h-3.5 bg-[rgb(var(--background-tertiary))] rounded animate-pulse"
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
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-2">
                    <div className="w-8 h-8 bg-[rgb(var(--background-tertiary))] rounded animate-pulse" />
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
