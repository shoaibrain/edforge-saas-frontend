/**
 * AssignmentList — Shared assignments section for portal home pages
 *
 * Shows assignments due this week from aggregated classwork.
 */

import { useMemo } from 'react'
import { useTranslation } from '@edforge/i18n'
import { ContentSection, StatusPill, DashedDivider, Skeleton } from '@edforge/ui'
import type { StatusPillVariant } from '@edforge/ui'
import type { ClassworkItem } from '../../hooks/useStudentClasswork'

export interface AssignmentListProps {
  items?: ClassworkItem[]
  loading?: boolean
  staggerIndex?: number
  /** Max items to show before "View all" */
  limit?: number
  /** Link target for "View all" */
  viewAllHref?: string
}

function getAssignmentStatus(dueDate?: string): { variant: StatusPillVariant; label: string } {
  if (!dueDate) return { variant: 'pending', label: 'No due date' }

  const now = new Date()
  const due = new Date(dueDate)
  const diffMs = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { variant: 'overdue', label: 'Overdue' }
  if (diffDays === 0) return { variant: 'upcoming', label: 'Due today' }
  if (diffDays === 1) return { variant: 'upcoming', label: 'Due tomorrow' }
  return { variant: 'pending', label: `Due in ${diffDays}d` }
}

function isThisWeek(dateStr?: string): boolean {
  if (!dateStr) return false
  const date = new Date(dateStr)
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 7)
  return date >= startOfWeek && date < endOfWeek
}

export function AssignmentList({
  items,
  loading,
  staggerIndex = 3,
  limit = 5,
  viewAllHref,
}: AssignmentListProps) {
  const { t } = useTranslation('portal')

  const thisWeekItems = useMemo(() => {
    if (!items) return []
    return items
      .filter((item) => isThisWeek(item.dueDate))
      .slice(0, limit)
  }, [items, limit])

  if (loading) {
    return (
      <ContentSection staggerIndex={staggerIndex}>
        <Skeleton className="h-5 w-48 mb-3" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      </ContentSection>
    )
  }

  return (
    <ContentSection
      heading={t('home.thisWeekAssignments')}
      staggerIndex={staggerIndex}
    >
      {thisWeekItems.length === 0 ? (
        <p
          className="text-sm py-4"
          style={{ color: 'var(--v2-text-muted)' }}
        >
          {t('home.noAssignmentsThisWeek')}
        </p>
      ) : (
        <div
          className="rounded-xl border mt-3 overflow-hidden"
          style={{
            background: 'var(--v2-bg-surface)',
            borderColor: 'var(--v2-border-default)',
          }}
        >
          {thisWeekItems.map((item, i) => {
            const status = getAssignmentStatus(item.dueDate)
            return (
              <div key={item.id}>
                {i > 0 && <DashedDivider className="mx-4 my-0" />}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: 'var(--v2-text-primary)' }}
                    >
                      {item.title}
                    </p>
                    {item.courseName && (
                      <p
                        className="text-[11px] truncate"
                        style={{ color: 'var(--v2-text-muted)' }}
                      >
                        {item.courseName}
                      </p>
                    )}
                  </div>
                  <StatusPill variant={status.variant} label={status.label} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {viewAllHref && thisWeekItems.length > 0 && (
        <a
          href={viewAllHref}
          className="inline-block text-[12px] font-medium mt-2"
          style={{ color: 'var(--v2-brand-primary)' }}
        >
          {t('home.viewAll')} →
        </a>
      )}
    </ContentSection>
  )
}
