/**
 * ClassroomCardSkeleton — Loading placeholder for ClassroomCard
 * Matches the slim color-stripe card layout.
 */

export function ClassroomCardSkeleton() {
  return (
    <div className="bg-surface-primary rounded-xl border border-border-primary overflow-hidden animate-pulse">
      {/* Slim color stripe placeholder */}
      <div className="h-1.5 bg-surface-secondary" />
      <div className="p-4 space-y-3">
        {/* Title lines */}
        <div className="space-y-1.5">
          <div className="h-4 w-40 rounded bg-surface-secondary" />
          <div className="h-3.5 w-28 rounded bg-surface-secondary" />
        </div>
        {/* Teacher line */}
        <div className="h-3 w-32 rounded bg-surface-secondary" />
        {/* Enrollment bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="h-3 w-20 rounded bg-surface-secondary" />
            <div className="h-3 w-12 rounded bg-surface-secondary" />
          </div>
          <div className="h-1 rounded-full bg-surface-secondary" />
        </div>
      </div>
    </div>
  )
}
