/**
 * AgingReportCard — V2
 *
 * 5-bucket horizontal grid showing overdue aging distribution.
 * Non-zero buckets are highlighted in red.
 */

import { formatNPRShort } from '@edforge/types'

interface AgingBucket {
  label: string
  minDays: number
  maxDays: number | null
  count: number
  amount: number
}

interface AgingReportCardProps {
  agingReport: AgingBucket[]
  isLoading: boolean
}

function AgingSkeleton() {
  return (
    <div className="grid grid-cols-5 max-sm:grid-cols-3 gap-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="rounded-lg p-3 space-y-2"
          style={{ background: 'var(--v2-bg-elevated)', border: '1px solid var(--v2-border-default)' }}
        >
          <div className="h-2.5 w-12 rounded v2-skeleton-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="h-4 w-8 rounded v2-skeleton-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="h-2.5 w-16 rounded v2-skeleton-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>
      ))}
    </div>
  )
}

// Default 5 buckets when API returns fewer
const DEFAULT_BUCKETS: AgingBucket[] = [
  { label: '0–30 days', minDays: 0, maxDays: 30, count: 0, amount: 0 },
  { label: '31–60 days', minDays: 31, maxDays: 60, count: 0, amount: 0 },
  { label: '61–90 days', minDays: 61, maxDays: 90, count: 0, amount: 0 },
  { label: '91–180 days', minDays: 91, maxDays: 180, count: 0, amount: 0 },
  { label: '180+ days', minDays: 181, maxDays: null, count: 0, amount: 0 },
]

export function AgingReportCard({ agingReport, isLoading }: AgingReportCardProps) {
  const buckets = agingReport.length > 0 ? agingReport : DEFAULT_BUCKETS
  const hasAnyOverdue = buckets.some((b) => b.count > 0)

  return (
    <div
      className="rounded-xl border flex flex-col"
      style={{
        background: 'var(--v2-bg-surface)',
        borderColor: 'var(--v2-border-default)',
        padding: 18,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-medium" style={{ color: 'var(--v2-text-secondary)' }}>
          Overdue aging report
        </h3>
        {!isLoading && !hasAnyOverdue && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(29,158,117,0.12)', color: '#1D9E75' }}>
            All clear
          </span>
        )}
      </div>

      {isLoading ? (
        <AgingSkeleton />
      ) : (
        <div className="grid gap-2 grid-cols-5 max-sm:grid-cols-3">
          {buckets.map((bucket) => {
            const isActive = bucket.count > 0
            return (
              <div
                key={bucket.label}
                className="rounded-lg p-3 text-center transition-colors"
                role="group"
                aria-label={`${bucket.label}: ${bucket.count} invoices, ${formatNPRShort(bucket.amount)}`}
                style={{
                  background: isActive ? 'rgba(226, 75, 74, 0.08)' : 'var(--v2-bg-elevated)',
                  border: `1px solid ${isActive ? 'rgba(226, 75, 74, 0.25)' : 'var(--v2-border-default)'}`,
                }}
              >
                <div
                  className="text-[10px] font-medium mb-1.5"
                  style={{ color: isActive ? '#E24B4A' : 'var(--v2-text-faint)' }}
                >
                  {bucket.label}
                </div>
                <div
                  className="text-[18px] font-bold leading-tight"
                  style={{ color: isActive ? '#E24B4A' : 'var(--v2-text-hint)' }}
                >
                  {bucket.count}
                </div>
                <div
                  className="text-[10px] mt-1"
                  style={{ color: isActive ? 'rgba(226, 75, 74, 0.7)' : 'var(--v2-text-faint)' }}
                >
                  {formatNPRShort(bucket.amount)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
