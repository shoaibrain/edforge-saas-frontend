/**
 * ClassroomCardGrid — Responsive grid of ClassroomCard components
 */

import { Loader2, School } from 'lucide-react'
import type { SectionResponseDto } from '@aibrains/shared-types'
import { ClassroomCard } from './ClassroomCard'
import { ClassroomCardSkeleton } from './ClassroomCardSkeleton'

interface ClassroomCardGridProps {
  sections: SectionResponseDto[]
  isLoading: boolean
  hasMore?: boolean
  isFetchingMore?: boolean
  /** courseId → subjectArea lookup for sections missing subjectArea */
  subjectAreaMap?: Map<string, string>
  onLoadMore?: () => void
  onNavigate: (sectionId: string) => void
  onEdit?: (sectionId: string) => void
  onToggleActive?: (section: SectionResponseDto) => void
}

export function ClassroomCardGrid({
  sections,
  isLoading,
  hasMore,
  isFetchingMore,
  subjectAreaMap,
  onLoadMore,
  onNavigate,
  onEdit,
  onToggleActive,
}: ClassroomCardGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <ClassroomCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (sections.length === 0) {
    return (
      <div
        className="rounded-xl border p-12 text-center"
        style={{ background: 'var(--v2-bg-surface)', borderColor: 'var(--v2-border-default)' }}
      >
        <School className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--v2-text-hint)' }} />
        <h4 className="text-lg font-medium mb-2" style={{ color: 'var(--v2-text-primary)' }}>No classes yet</h4>
        <p className="max-w-md mx-auto" style={{ color: 'var(--v2-text-muted)' }}>
          Create your first class section to get started. Classes will appear here as cards.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {sections.map((section) => (
          <ClassroomCard
            key={section.sectionId}
            section={section}
            subjectAreaOverride={subjectAreaMap?.get(section.courseId)}
            onNavigate={onNavigate}
            onEdit={onEdit}
            onToggleActive={onToggleActive}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isFetchingMore}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            style={{
              color: 'var(--v2-text-secondary)',
              borderColor: 'var(--v2-border-default)',
              border: '1px solid var(--v2-border-default)',
            }}
          >
            {isFetchingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
