/**
 * CourseCard — Shared course grade card for Grades and Schedule pages
 *
 * Features: color stripe, grade badge, category breakdown bars,
 * teacher footer, empty/ungraded state.
 */

import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../utils'
import { CategoryBar } from './CategoryBar'
import { DashedDivider } from './DashedDivider'

// Deterministic color from course name
const COURSE_COLORS = [
  '#1D9E75', '#378ADD', '#7F77DD', '#D85A30',
  '#EF9F27', '#E24B4A', '#0a9396', '#ca6702',
]

function courseColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
  }
  return COURSE_COLORS[Math.abs(hash) % COURSE_COLORS.length]
}

function gradeTokenColor(letter?: string | null): string {
  if (!letter) return 'var(--v2-grade-none)'
  const first = letter.charAt(0).toUpperCase()
  if (first === 'A' || first === 'B') return 'var(--v2-grade-high)'
  if (first === 'C') return 'var(--v2-grade-mid)'
  return 'var(--v2-grade-low)'
}

export interface CourseCardCategory {
  name: string
  weight: number
  /** Achievement percentage (0-100) */
  percentage: number
}

export interface CourseCardProps extends HTMLAttributes<HTMLDivElement> {
  courseName: string
  courseCode?: string
  letterGrade?: string | null
  numericGrade?: number | null
  gpaPoints?: number | null
  isFinal?: boolean
  teacherName?: string
  categories?: CourseCardCategory[]
}

export const CourseCard = forwardRef<HTMLDivElement, CourseCardProps>(
  (
    {
      className,
      courseName,
      courseCode,
      letterGrade,
      numericGrade,
      gpaPoints,
      isFinal,
      teacherName,
      categories,
      ...props
    },
    ref
  ) => {
    const color = courseColor(courseName)
    const hasGrade = letterGrade != null

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl border overflow-hidden transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-md',
          className
        )}
        style={{
          background: 'var(--v2-bg-surface)',
          borderColor: 'var(--v2-border-default)',
        }}
        {...props}
      >
        {/* Color stripe */}
        <div className="h-1.5" style={{ background: color }} />

        <div className="p-4">
          {/* Header: course name + grade badge */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              {courseCode && (
                <p
                  className="text-[10px] font-mono uppercase tracking-[0.06em] mb-0.5"
                  style={{ color: 'var(--v2-text-hint)' }}
                >
                  {courseCode}
                </p>
              )}
              <h3
                className="font-display text-base font-medium italic truncate"
                style={{ color: 'var(--v2-text-primary)' }}
              >
                {courseName}
              </h3>
            </div>

            {/* Grade badge */}
            <div
              className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                background: hasGrade
                  ? `color-mix(in srgb, ${gradeTokenColor(letterGrade)} 12%, transparent)`
                  : 'var(--v2-surface-inset)',
                border: hasGrade ? 'none' : '1px dashed var(--v2-border-default)',
              }}
            >
              <span
                className="text-base font-bold"
                style={{ color: hasGrade ? gradeTokenColor(letterGrade) : 'var(--v2-text-hint)' }}
              >
                {letterGrade ?? '—'}
              </span>
            </div>
          </div>

          {/* Score row */}
          {hasGrade && (
            <div className="flex items-center gap-4 text-[12px] mb-3">
              <span style={{ color: 'var(--v2-text-muted)' }}>
                <span className="font-mono tabular-nums" style={{ color: 'var(--v2-text-secondary)' }}>
                  {numericGrade != null ? numericGrade.toFixed(1) : '—'}
                </span>
                /100
              </span>
              <span style={{ color: 'var(--v2-text-muted)' }}>
                <span className="font-mono tabular-nums" style={{ color: 'var(--v2-text-secondary)' }}>
                  {gpaPoints != null ? gpaPoints.toFixed(2) : '—'}
                </span>
                {' GPA'}
              </span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{
                  background: isFinal ? 'var(--v2-success-bg)' : 'var(--v2-info-bg)',
                  color: isFinal ? 'var(--v2-brand-primary)' : 'var(--v2-info)',
                }}
              >
                {isFinal ? 'Final' : 'In Progress'}
              </span>
            </div>
          )}

          {/* Not graded state */}
          {!hasGrade && (
            <p
              className="text-[12px] mb-3"
              style={{ color: 'var(--v2-text-hint)' }}
            >
              Not graded yet
            </p>
          )}

          {/* Category breakdown bars */}
          {categories && categories.length > 0 && (
            <>
              <DashedDivider className="my-3" />
              <div className="space-y-2">
                {categories.map((cat) => (
                  <CategoryBar
                    key={cat.name}
                    label={cat.name}
                    weight={cat.weight}
                    fill={cat.percentage}
                    color={color}
                  />
                ))}
              </div>
            </>
          )}

          {/* Teacher footer */}
          {teacherName && (
            <>
              <DashedDivider className="my-3" />
              <p
                className="text-[12px]"
                style={{ color: 'var(--v2-text-muted)' }}
              >
                {teacherName}
              </p>
            </>
          )}
        </div>
      </div>
    )
  }
)

CourseCard.displayName = 'CourseCard'
