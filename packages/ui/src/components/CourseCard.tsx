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
  if (!letter) return 'rgb(var(--text-tertiary))'
  const first = letter.charAt(0).toUpperCase()
  if (first === 'A' || first === 'B') return 'rgb(var(--state-success-fg))'
  if (first === 'C') return 'rgb(var(--state-warning-fg))'
  return 'rgb(var(--state-danger-fg))'
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
          'bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary)/0.35)]',
          className
        )}
        {...props}
      >
        {/* Color stripe */}
        <div
          // allow-presentation-style: stripe color is the deterministic per-course hue
          className="h-1.5"
          style={{ background: color }}
        />

        <div className="p-4">
          {/* Header: course name + grade badge */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              {courseCode && (
                <p className="text-xs font-mono uppercase tracking-[0.06em] mb-0.5 text-[rgb(var(--text-tertiary))]">
                  {courseCode}
                </p>
              )}
              <h3 className="font-display text-base font-medium italic truncate text-[rgb(var(--text-primary))]">
                {courseName}
              </h3>
            </div>

            {/* Grade badge */}
            <div
              // allow-presentation-style: grade badge bg/border are derived from the grade tier
              className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                background: hasGrade
                  ? `color-mix(in srgb, ${gradeTokenColor(letterGrade)} 12%, transparent)`
                  : 'rgb(var(--background-tertiary) / 0.5)',
                border: hasGrade ? 'none' : '1px dashed rgb(var(--border-primary) / 0.35)',
              }}
            >
              <span
                // allow-presentation-style: grade letter color is derived from the grade tier
                className="text-base font-bold"
                style={{ color: hasGrade ? gradeTokenColor(letterGrade) : 'rgb(var(--text-tertiary))' }}
              >
                {letterGrade ?? '—'}
              </span>
            </div>
          </div>

          {/* Score row */}
          {hasGrade && (
            <div className="flex items-center gap-4 text-xs mb-3">
              <span className="text-[rgb(var(--text-tertiary))]">
                <span className="font-mono tabular-nums text-[rgb(var(--text-secondary))]">
                  {numericGrade != null ? numericGrade.toFixed(1) : '—'}
                </span>
                /100
              </span>
              <span className="text-[rgb(var(--text-tertiary))]">
                <span className="font-mono tabular-nums text-[rgb(var(--text-secondary))]">
                  {gpaPoints != null ? gpaPoints.toFixed(2) : '—'}
                </span>
                {' GPA'}
              </span>
              <span
                // allow-presentation-style: status pill colors switch on final vs in-progress state
                className="text-xs px-1.5 py-0.5 rounded-full"
                style={{
                  background: isFinal ? 'rgb(var(--state-success-bg))' : 'rgb(var(--state-info-bg))',
                  color: isFinal ? '#1D9E75' : 'rgb(var(--state-info-fg))',
                }}
              >
                {isFinal ? 'Final' : 'In Progress'}
              </span>
            </div>
          )}

          {/* Not graded state */}
          {!hasGrade && (
            <p className="text-xs mb-3 text-[rgb(var(--text-tertiary))]">
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
              <p className="text-xs text-[rgb(var(--text-tertiary))]">
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
