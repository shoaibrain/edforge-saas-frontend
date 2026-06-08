/**
 * GradedItemTimeline — Chronological list of graded assignments
 *
 * Modified to securely use the scoped DOM structures from prototype (.fp-t-row),
 * with added creative touches using lucide-react icons, status chips, and refined typography.
 */

import { useMemo } from 'react'
import type { CourseGradeResponseDto } from '@aibrains/shared-types'
import { Skeleton } from '@edforge/ui'
import { FileText, Clock, CheckCircle2, AlertCircle } from 'lucide-react'

export interface GradedItemTimelineProps {
  grades?: CourseGradeResponseDto[]
  loading?: boolean
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

export function GradedItemTimeline({ grades, loading }: GradedItemTimelineProps) {
  const items = useMemo(() => {
    if (!grades) return []
    return flattenAssignments(grades)
  }, [grades])

  if (loading) {
    return (
      <section className="fp-section">
        <div className="fp-section-head">
          <h2 className="fp-section-title">Graded items</h2>
        </div>
        <div className="fp-timeline-card">
          <Skeleton className="h-16 w-full mb-4" />
          <Skeleton className="h-16 w-full mb-4" />
          <Skeleton className="h-16 w-full" />
        </div>
      </section>
    )
  }

  if (items.length === 0) return null

  return (
    <section className="fp-section">
      <div className="fp-section-head">
        <h2 className="fp-section-title">Graded items <em>recent activity</em></h2>
        <a className="fp-section-link" href="#">Export report →</a>
      </div>
      <div className="fp-timeline-card">
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            let catClass = 'pend';
            let StatusIcon = Clock;
            let statusText = 'Pending';
            let iconColor = 'var(--fp-ink-4)';
            
            if (!item.isPending && item.letterGrade) {
              const first = item.letterGrade.charAt(0).toUpperCase()
              if (first === 'A' || first === 'B') {
                catClass = 'high';
                StatusIcon = CheckCircle2;
                statusText = 'Excellent';
                iconColor = 'var(--fp-sage)';
              }
              else if (first === 'C') {
                catClass = 'mid';
                StatusIcon = AlertCircle;
                statusText = 'Average';
                iconColor = 'var(--fp-butter)';
              }
              else {
                catClass = 'low';
                StatusIcon = AlertCircle;
                statusText = 'Needs Work';
                iconColor = 'var(--fp-terracotta)';
              }
            } else if (!item.isPending && item.percentage != null) {
               // Graded without a letter grade
               catClass = item.percentage >= 80 ? 'high' : item.percentage >= 60 ? 'mid' : 'low';
               StatusIcon = CheckCircle2;
               statusText = 'Graded';
               iconColor = item.percentage >= 80 ? 'var(--fp-sage)' : item.percentage >= 60 ? 'var(--fp-butter)' : 'var(--fp-terracotta)';
            }

            return (
              <div key={item.id} className={`fp-t-row group ${item.isPending ? 'pending' : ''}`}>
                
                {/* Visual Icon / Letter Badge */}
                <div className={`fp-t-letter flex items-center justify-center ${catClass} group-hover:scale-105 transition-transform`} style={{ width: '48px', height: '48px', flexShrink: 0 }}>
                  {item.isPending ? (
                     <FileText size={20} strokeWidth={1.5} color="var(--fp-ink-3)" />
                  ) : (
                     item.letterGrade ?? <FileText size={20} strokeWidth={1.5} color={iconColor} />
                  )}
                </div>

                {/* Main Content Body */}
                <div className="fp-t-body flex flex-col justify-center">
                  <strong className="text-sm mb-[2px] tracking-tight">{item.assignmentName}</strong>
                  <div className="flex items-center gap-2">
                    <span>{item.courseName}</span>
                    <div className="w-1 h-1 rounded-full bg-[var(--fp-hairline)]" />
                    <div className="flex items-center gap-1" style={{ color: iconColor }}>
                      <StatusIcon size={12} strokeWidth={2.5} />
                      <span style={{ color: 'inherit', fontWeight: 600, fontSize: '10px' }}>{statusText}</span>
                    </div>
                  </div>
                </div>

                {/* Score Section */}
                <div className="fp-t-num flex flex-col items-end justify-center">
                  <div className="font-display text-xl font-medium" style={{ color: 'var(--fp-ink)', fontVariationSettings: '"SOFT" 40' }}>
                    {item.percentage != null ? `${item.percentage.toFixed(0)}%` : '—'}
                  </div>
                  <span>Score</span>
                </div>

                {/* Date Section */}
                <div className="fp-t-date flex flex-col items-end justify-center px-2">
                  <span className="opacity-70">
                    {item.gradedAt ? formatDate(item.gradedAt) : '—'}
                  </span>
                </div>

              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
