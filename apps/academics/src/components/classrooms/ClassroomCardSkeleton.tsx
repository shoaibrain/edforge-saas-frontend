/**
 * ClassroomCardSkeleton — Loading placeholder for ClassroomCard
 */

export function ClassroomCardSkeleton() {
  return (
    <div className="bg-surface-primary rounded-xl border border-border-primary overflow-hidden animate-pulse">
      <div className="h-20 bg-surface-secondary" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-surface-secondary" />
          <div className="h-3 w-24 rounded bg-surface-secondary" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3 w-32 rounded bg-surface-secondary" />
          <div className="h-1.5 rounded-full bg-surface-secondary" />
        </div>
      </div>
    </div>
  )
}
