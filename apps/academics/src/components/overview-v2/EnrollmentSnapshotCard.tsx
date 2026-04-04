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
          <div className="h-3 w-20 rounded v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
          <div className="h-3 w-10 rounded v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
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
      style={{ borderBottom: '1px solid var(--v2-border-default)' }}
    >
      <span className="text-[11px]" style={{ color: 'var(--v2-text-faint)' }}>
        {label}
      </span>
      <span
        className="text-[11px] font-medium"
        style={{ color: valueColor || 'var(--v2-text-primary)' }}
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
        background: 'var(--v2-bg-surface)',
        borderColor: 'var(--v2-border-default)',
        padding: 18,
      }}
    >
      {/* Header */}
      <h3
        className="text-[13px] font-medium mb-3"
        style={{ color: 'var(--v2-text-secondary)' }}
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
              valueColor="var(--v2-text-primary)"
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
              valueColor="var(--v2-text-faint)"
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
          <p className="text-[11px] font-medium" style={{ color: '#1D9E75' }}>
            Academic year on track
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--v2-text-faint)' }}>
            {academicYear.name} · {new Date(academicYear.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(academicYear.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      )}
    </div>
  )
}
