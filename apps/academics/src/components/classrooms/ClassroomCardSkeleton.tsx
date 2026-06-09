/**
 * ClassroomCardSkeleton — Loading placeholder for ClassroomCard
 * Matches the slim color-stripe card layout.
 */

export function ClassroomCardSkeleton() {
  return (
    <div
      className="rounded-xl border overflow-hidden animate-pulse"
      style={{ background: 'rgb(var(--background-secondary))', borderColor: 'rgb(var(--border-primary) / 0.35)' }}
    >
      {/* Banner placeholder */}
      <div className="h-24" style={{ background: 'rgb(var(--background-tertiary))' }} />
      <div className="p-4 space-y-3">
        {/* Title lines */}
        <div className="space-y-1.5">
          <div className="h-4 w-40 rounded" style={{ background: 'rgb(var(--background-tertiary))' }} />
          <div className="h-3.5 w-28 rounded" style={{ background: 'rgb(var(--background-tertiary))' }} />
        </div>
        {/* Teacher line */}
        <div className="h-3 w-32 rounded" style={{ background: 'rgb(var(--background-tertiary))' }} />
        {/* Enrollment bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="h-3 w-20 rounded" style={{ background: 'rgb(var(--background-tertiary))' }} />
            <div className="h-3 w-12 rounded" style={{ background: 'rgb(var(--background-tertiary))' }} />
          </div>
          <div className="h-1 rounded-sm" style={{ background: 'rgb(var(--background-tertiary))' }} />
        </div>
      </div>
    </div>
  )
}
