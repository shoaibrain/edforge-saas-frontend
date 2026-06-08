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
          style={{ borderBottom: i < 4 ? '1px solid var(--v2-border-default)' : 'none' }}
        >
          <div
            className="w-2 h-2 rounded-full flex-shrink-0 mt-1 v2-skeleton-pulse"
            style={{ background: 'var(--v2-bg-elevated)' }}
          />
          <div className="flex-1 space-y-1">
            <div
              className="h-3 rounded v2-skeleton-pulse"
              style={{
                width: `${70 + Math.random() * 30}%`,
                background: 'var(--v2-bg-elevated)',
              }}
            />
            <div
              className="h-2.5 w-32 rounded v2-skeleton-pulse"
              style={{ background: 'var(--v2-bg-elevated)' }}
            />
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
      className="rounded-xl border"
      style={{
        background: 'var(--v2-bg-surface)',
        borderColor: 'var(--v2-border-default)',
        padding: 18,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-sm font-medium"
          style={{ color: 'var(--v2-text-secondary)' }}
        >
          {t('homeV2.activity.recentActivity')}
        </span>
        <Link
          to="/finance/$"
          params={{ _splat: 'billing' }}
          className="text-xs cursor-pointer transition-opacity hover:opacity-80"
          style={{ color: 'var(--v2-brand-primary)' }}
        >
          {t('homeV2.activity.viewAll')}
        </Link>
      </div>

      {/* Feed list */}
      {isLoading ? (
        <FeedSkeleton />
      ) : items.length === 0 ? (
        <p className="text-sm py-6 text-center" style={{ color: 'var(--v2-text-hint)' }}>
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
                    ? '1px solid var(--v2-border-default)'
                    : 'none',
              }}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                style={{ background: DOT_COLORS[item.type] }}
              />
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs leading-snug"
                  style={{ color: 'var(--v2-text-muted)' }}
                >
                  {item.text}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: 'var(--v2-text-ghost)' }}
                >
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
