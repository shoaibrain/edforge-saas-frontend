/**
 * ClassroomCardSkeleton — Loading placeholder for ClassroomCard
 * Matches the slim color-stripe card layout.
 */

export function ClassroomCardSkeleton() {
  return (
    <div className="rounded-xl border overflow-hidden animate-pulse bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary)/0.35)]">
      {/* Banner placeholder */}
      <div className="h-24 bg-[rgb(var(--background-tertiary))]" />
      <div className="p-4 space-y-3">
        {/* Title lines */}
        <div className="space-y-1.5">
          <div className="h-4 w-40 rounded bg-[rgb(var(--background-tertiary))]" />
          <div className="h-3.5 w-28 rounded bg-[rgb(var(--background-tertiary))]" />
        </div>
        {/* Teacher line */}
        <div className="h-3 w-32 rounded bg-[rgb(var(--background-tertiary))]" />
        {/* Enrollment bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="h-3 w-20 rounded bg-[rgb(var(--background-tertiary))]" />
            <div className="h-3 w-12 rounded bg-[rgb(var(--background-tertiary))]" />
          </div>
          <div className="h-1 rounded-sm bg-[rgb(var(--background-tertiary))]" />
        </div>
      </div>
    </div>
  )
}
