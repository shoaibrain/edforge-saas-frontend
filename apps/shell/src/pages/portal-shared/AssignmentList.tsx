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
  /** Humanized empty-state message */
  emptyMessage?: { line1: string; line2?: string }
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
  emptyMessage,
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
        /* Humanized empty state — editorial card with italic serif headline */
        <div
          className="border mt-4"
          style={{
            background: 'var(--v2-bg-surface)',
            borderColor: 'var(--v2-border-default)',
            borderRadius: 22,
            padding: '40px 30px',
            boxShadow: 'var(--v2-shadow-card, 0 1px 3px rgba(0,0,0,0.06))',
            textAlign: 'center',
          }}
        >
          <p
            className="font-display italic"
            style={{
              fontSize: 18,
              fontWeight: 400,
              color: 'var(--v2-text-secondary)',
              marginBottom: 6,
            }}
          >
            {emptyMessage?.line1 ?? t('home.noAssignmentsThisWeek')}
          </p>
          {emptyMessage?.line2 && (
            <p style={{ fontSize: 13, color: 'var(--v2-text-muted)' }}>
              {emptyMessage.line2}
            </p>
          )}
        </div>
      ) : (
        <div
          className="border mt-4 overflow-hidden"
          style={{
            background: 'var(--v2-bg-surface)',
            borderColor: 'var(--v2-border-default)',
            borderRadius: 22,
            padding: '20px 30px',
            boxShadow: 'var(--v2-shadow-card, 0 1px 3px rgba(0,0,0,0.06))',
          }}
        >
          {thisWeekItems.map((item, i) => {
            const status = getAssignmentStatus(item.dueDate)
            return (
              <div key={item.id}>
                {i > 0 && <DashedDivider className="my-0" />}
                <div className="flex items-center gap-3 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-display truncate"
                      style={{
                        fontSize: 17,
                        fontWeight: 500,
                        letterSpacing: '-0.005em',
                        color: 'var(--v2-text-primary)',
                      }}
                    >
                      {item.title}
                    </p>
                    {item.courseName && (
                      <p
                        className="font-mono uppercase truncate"
                        style={{
                          fontSize: 10,
                          letterSpacing: '0.08em',
                          color: 'var(--v2-text-muted)',
                          marginTop: 3,
                        }}
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
          className="inline-block text-xs font-medium mt-2"
          style={{ color: 'var(--v2-brand-primary)' }}
        >
          {t('home.viewAll')} →
        </a>
      )}
    </ContentSection>
  )
}
