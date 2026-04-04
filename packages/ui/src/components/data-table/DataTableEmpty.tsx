import type { DataTableEmptyStateConfig } from './types'
import { cn } from '../../utils'

interface DataTableEmptyProps {
  config: DataTableEmptyStateConfig
  className?: string
}

export function DataTableEmpty({ config, className }: DataTableEmptyProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl border border-[rgb(var(--border-primary)/0.5)] shadow-[0_1px_3px_0_rgb(0_0_0/0.08),0_1px_2px_-1px_rgb(0_0_0/0.08)] bg-[rgb(var(--surface-primary))]',
        className
      )}
    >
      {config.icon && (
        <div className="mb-4 text-[rgb(var(--text-tertiary))]">
          {config.icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-[rgb(var(--text-primary))] mb-2">
        {config.title}
      </h3>
      {config.description && (
        <p className="text-[rgb(var(--text-secondary))] mb-6 max-w-sm">
          {config.description}
        </p>
      )}
      {config.action && (
        <button
          type="button"
          onClick={config.action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:ring-offset-2"
        >
          {config.action.label}
        </button>
      )}
    </div>
  )
}
