/**
 * EnrollmentSnapshotCard — V2
 *
 * Key-value summary card with enrollment metrics
 * and academic year info pill.
 */

interface EnrollmentSnapshotCardProps {
  totalEnrolled: number | null
  activeCount?: number
  recentEnrollments?: number
  withdrawals?: number
  activeSections: number | null
  gradeLevelCount: number
  academicYear?: {
    name: string
    startDate: string
    endDate: string
  } | null
  isLoading: boolean
}

function SnapshotSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="h-3 w-20 rounded v2-skeleton-pulse" style={{ background: 'rgb(var(--background-tertiary))' }} />
          <div className="h-3 w-10 rounded v2-skeleton-pulse" style={{ background: 'rgb(var(--background-tertiary))' }} />
        </div>
      ))}
    </div>
  )
}

function MetricRow({
  label,
  value,
  valueColor,
  valuePrefix,
}: {
  label: string
  value: string | number | null
  valueColor?: string
  valuePrefix?: string
}) {
  return (
    <div
      className="flex items-center justify-between py-1.5"
      style={{ borderBottom: '1px solid rgb(var(--border-primary) / 0.35)' }}
    >
      <span className="text-xs" style={{ color: 'rgb(var(--text-disabled))' }}>
        {label}
      </span>
      <span
        className="text-xs font-medium"
        style={{ color: valueColor || 'rgb(var(--text-primary))' }}
      >
        {valuePrefix}{value ?? '—'}
      </span>
    </div>
  )
}

export function EnrollmentSnapshotCard({
  totalEnrolled,
  activeCount,
  recentEnrollments,
  withdrawals,
  activeSections,
  gradeLevelCount,
  academicYear,
  isLoading,
}: EnrollmentSnapshotCardProps) {
  return (
    <div
      className="rounded-xl border flex flex-col"
      style={{
        background: 'rgb(var(--background-secondary))',
        borderColor: 'rgb(var(--border-primary) / 0.35)',
        padding: 18,
      }}
    >
      {/* Header */}
      <h3
        className="text-sm font-medium mb-3"
        style={{ color: 'rgb(var(--text-secondary))' }}
      >
        Enrollment snapshot
      </h3>

      {/* Metrics */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <SnapshotSkeleton />
        ) : (
          <div>
            <MetricRow
              label="Total enrolled"
              value={totalEnrolled?.toLocaleString() ?? '—'}
              valueColor="rgb(var(--text-primary))"
            />
            <MetricRow
              label="Active status"
              value={activeCount ?? totalEnrolled ?? '—'}
              valueColor="#1D9E75"
            />
            <MetricRow
              label="Recent enrollments"
              value={recentEnrollments ?? 0}
              valueColor="#378ADD"
              valuePrefix="+"
            />
            <MetricRow
              label="Withdrawals"
              value={withdrawals ?? 0}
              valueColor="rgb(var(--text-disabled))"
            />
            <MetricRow
              label="Active sections"
              value={activeSections}
            />
            <MetricRow
              label="Grade levels covered"
              value={gradeLevelCount}
            />
          </div>
        )}
      </div>

      {/* Academic year pill */}
      {academicYear && (
        <div
          className="mt-3 rounded-[7px] p-3"
          style={{
            background: 'rgba(29, 158, 117, 0.07)',
            border: '1px solid rgba(29, 158, 117, 0.15)',
          }}
        >
          <p className="text-xs font-medium" style={{ color: '#1D9E75' }}>
            Academic year on track
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-disabled))' }}>
            {academicYear.name} · {new Date(academicYear.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(academicYear.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      )}
    </div>
  )
}
