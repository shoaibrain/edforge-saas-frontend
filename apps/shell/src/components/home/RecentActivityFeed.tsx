/**
 * RecentActivityFeed
 *
 * Bottom-row panel showing recent finance and system events
 * with colored dots per event type.
 */

import { Link } from '@tanstack/react-router'
import { useTranslation } from '@edforge/i18n'

export interface ActivityItem {
  id: string
  text: string
  timestamp: string
  type: 'payment' | 'overdue' | 'attendance' | 'bulk' | 'system'
}

const DOT_COLORS: Record<ActivityItem['type'], string> = {
  payment: '#1D9E75',
  overdue: '#E24B4A',
  attendance: '#378ADD',
  bulk: '#7F77DD',
  system: '#9aa0b8',
}

interface RecentActivityFeedProps {
  items: ActivityItem[]
  isLoading: boolean
}

function FeedSkeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-2.5 py-2"
          style={{ borderBottom: i < 4 ? '1px solid rgb(var(--border-primary) / 0.35)' : 'none' }}
        >
          <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1 v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
          <div className="flex-1 space-y-1">
            <div
              className="h-3 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]"
              style={{ width: `${70 + Math.random() * 30}%` }}
            />
            <div className="h-2.5 w-32 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function RecentActivityFeed({ items, isLoading }: RecentActivityFeedProps) {
  const { t } = useTranslation('dashboard')

  return (
    <div
      // allow-presentation-style: card padding (18px) is off the 4px scale
      className="rounded-xl border bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary)/0.35)]"
      style={{ padding: 18 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[rgb(var(--text-secondary))]">
          {t('homeV2.activity.recentActivity')}
        </span>
        <Link
          to="/finance/$"
          params={{ _splat: 'billing' }}
          className="text-xs cursor-pointer transition-opacity hover:opacity-80 text-[#1D9E75]"
        >
          {t('homeV2.activity.viewAll')}
        </Link>
      </div>

      {/* Feed list */}
      {isLoading ? (
        <FeedSkeleton />
      ) : items.length === 0 ? (
        <p className="text-sm py-6 text-center text-[rgb(var(--text-tertiary))]">
          {t('homeV2.activity.noActivity')}
        </p>
      ) : (
        <div className="flex flex-col">
          {items.map((item, i) => (
            <div
              key={item.id}
              className="flex items-start gap-2.5 py-2"
              style={{
                borderBottom:
                  i < items.length - 1
                    ? '1px solid rgb(var(--border-primary) / 0.35)'
                    : 'none',
              }}
            >
              <div
                // allow-presentation-style: per-activity-type dot color
                className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                style={{ background: DOT_COLORS[item.type] }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-snug text-[rgb(var(--text-tertiary))]">
                  {item.text}
                </p>
                <p className="text-xs mt-0.5 text-[rgb(var(--text-disabled))]">
                  {item.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
