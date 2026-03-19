/**
 * HomeStatCard
 *
 * Stat tile for the home page command center.
 * Mirrors the visual design of the academics ModuleOverviewPage StatCard.
 */

import { motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface HomeStatCardProps {
  label: string
  value: string
  subtitle?: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  loading?: boolean
  error?: boolean
  onRetry?: () => void
  /** Color class for the value text (e.g. for attendance color coding) */
  valueColor?: string
}

export function HomeStatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
  loading,
  error,
  onRetry,
  valueColor,
}: HomeStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col p-5 rounded-2xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary)/0.6)] shadow-sm"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="mt-auto pt-4">
        <p className="text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wide mb-1 truncate">
          {label}
        </p>
        {loading ? (
          <div className="space-y-1.5">
            <div className="h-8 w-16 bg-[rgb(var(--surface-tertiary))] rounded motion-safe:animate-pulse" />
            <div className="h-3.5 w-12 bg-[rgb(var(--surface-tertiary))] rounded motion-safe:animate-pulse" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-semibold text-[rgb(var(--text-tertiary))]">—</span>
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
                title="Retry loading"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Retry
              </button>
            )}
          </div>
        ) : (
          <>
            <span className={`text-2xl font-semibold ${valueColor || 'text-[rgb(var(--text-primary))]'}`}>
              {value}
            </span>
            {subtitle && (
              <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
                {subtitle}
              </p>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}
