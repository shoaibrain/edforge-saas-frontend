/**
 * GradedItemTimeline — Chronological list of graded assignments
 *
 * Shows grade pills, course tags, scores, dates.
 * Pending items at 55% opacity with "PEND" pill.
 */

import { useMemo } from 'react'
import { useTranslation } from '@edforge/i18n'
import { ContentSection, StatusPill, DashedDivider } from '@edforge/ui'
import type { CourseGradeResponseDto } from '@aibrains/shared-types'

export interface GradedItemTimelineProps {
  grades?: CourseGradeResponseDto[]
  loading?: boolean
  staggerIndex?: number
}

interface TimelineItem {
  id: string
  assignmentName: string
  courseName: string
  letterGrade?: string
  percentage?: number
  gradedAt?: string
  isPending: boolean
}

function flattenAssignments(grades: CourseGradeResponseDto[]): TimelineItem[] {
  const items: TimelineItem[] = []
  for (const course of grades) {
    if (!course.assignments) continue
    for (const a of course.assignments) {
      items.push({
        id: `${course.gradeId}-${a.assignmentId}`,
        assignmentName: a.assignmentName,
        courseName: course.courseName ?? '',
        letterGrade: a.letterGrade,
        percentage: a.percentage,
        gradedAt: a.gradedAt,
        isPending: !a.gradedAt && !a.letterGrade && a.percentage == null,
      })
    }
  }
  return items.sort((a, b) => {
    if (!a.gradedAt && !b.gradedAt) return 0
    if (!a.gradedAt) return 1
    if (!b.gradedAt) return -1
    return new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime()
  })
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function GradedItemTimeline({
  grades,
  loading,
  staggerIndex = 4,
}: GradedItemTimelineProps) {
  const { t } = useTranslation('portal')

  const items = useMemo(() => {
    if (!grades) return []
    return flattenAssignments(grades)
  }, [grades])

  if (loading) {
    return (
      <ContentSection staggerIndex={staggerIndex}>
        <div className="h-5 w-48 rounded bg-[var(--v2-bg-elevated)] v2-skeleton-pulse mb-3" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 rounded bg-[var(--v2-bg-elevated)] v2-skeleton-pulse" />
          ))}
        </div>
      </ContentSection>
    )
  }

  if (items.length === 0) return null

  return (
    <ContentSection
      heading={t('grades.gradedAssignments')}
      staggerIndex={staggerIndex}
    >
      <div
        className="rounded-xl border mt-3 overflow-hidden"
        style={{
          background: 'var(--v2-bg-surface)',
          borderColor: 'var(--v2-border-default)',
        }}
      >
        {items.map((item, i) => (
          <div key={item.id}>
            {i > 0 && <DashedDivider className="mx-4 my-0" />}
            <div
              className="flex items-center gap-3 px-4 py-3 transition-opacity"
              style={{ opacity: item.isPending ? 0.55 : 1 }}
            >
              {/* Grade pill */}
              <StatusPill
                variant={item.isPending ? 'pending' : item.letterGrade?.startsWith('F') ? 'overdue' : 'present'}
                label={item.isPending ? 'PEND' : (item.letterGrade ?? '—')}
              />

              {/* Assignment info */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: 'var(--v2-text-primary)' }}
                >
                  {item.assignmentName}
                </p>
                <p
                  className="text-[11px] truncate"
                  style={{ color: 'var(--v2-text-muted)' }}
                >
                  {item.courseName}
                </p>
              </div>

              {/* Score + date */}
              <div className="text-right shrink-0">
                {item.percentage != null && (
                  <p
                    className="text-[12px] font-mono tabular-nums"
                    style={{ color: 'var(--v2-text-secondary)' }}
                  >
                    {item.percentage.toFixed(0)}%
                  </p>
                )}
                {item.gradedAt && (
                  <p
                    className="text-[10px]"
                    style={{ color: 'var(--v2-text-hint)' }}
                  >
                    {formatDate(item.gradedAt)}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ContentSection>
  )
}
