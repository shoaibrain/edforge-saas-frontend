/**
 * AtRiskStudentsCard — V2
 *
 * Shows top 5 at-risk students sorted by worst attendance rate.
 * Each student has a DiceBear avatar (with initials fallback),
 * name, grade, absent days, rate in semantic color, and a mini progress bar.
 */

import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { AnimatedProgressBar } from '@edforge/ui'
import { getStudentAvatar } from '../../lib/avatar'
import type { AttendanceAlert } from '../../hooks/useAcademicsOverview'

interface AtRiskStudentsCardProps {
  students: AttendanceAlert[]
  totalAtRisk: number
  isLoading: boolean
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full v2-skeleton-pulse flex-shrink-0 bg-[rgb(var(--background-tertiary))]" />
          <div className="flex-1 space-y-1">
            <div className="h-3 w-24 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
            <div className="h-2.5 w-16 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
          </div>
          <div className="h-3 w-8 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
        </div>
      ))}
    </div>
  )
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function getRateColor(rate: number): string {
  return rate < 80 ? '#E24B4A' : '#EF9F27'
}

/** Hash a string to a deterministic color from a palette */
function hashColor(name: string): string {
  const palette = ['#1D9E75', '#378ADD', '#7F77DD', '#D85A30', '#EF9F27', '#E24B4A', '#5C2D91', '#0a9396']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
  return palette[Math.abs(hash) % palette.length]
}

function StudentAvatar({ name, studentId }: { name: string; studentId: string }) {
  const [imgError, setImgError] = useState(false)
  const src = getStudentAvatar(studentId || name)
  const initials = getInitials(name)
  const bg = hashColor(name)

  if (imgError || !src) {
    return (
      <div
        // allow-presentation-style: per-student deterministic avatar color
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold text-[rgb(var(--action-primary-fg))]"
        style={{ background: bg }}
      >
        {initials}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name}
      width={30}
      height={30}
      // allow-presentation-style: per-student avatar bg shows behind the loading image
      className="w-8 h-8 rounded-full flex-shrink-0"
      style={{ background: bg, maxWidth: 30, maxHeight: 30 }}
      onError={() => setImgError(true)}
    />
  )
}

export function AtRiskStudentsCard({
  students,
  totalAtRisk,
  isLoading,
}: AtRiskStudentsCardProps) {
  const topStudents = students.slice(0, 5)

  return (
    <div
      // allow-presentation-style: card padding (18px) is off the 4px scale
      className="rounded-xl border flex flex-col bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary)/0.35)]"
      style={{ padding: 18 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[rgb(var(--text-secondary))]">
          At-risk student detail
        </h3>
        <span className="text-xs font-semibold text-[rgb(var(--state-danger-fg))]">
          {totalAtRisk} at risk
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <ListSkeleton />
        ) : totalAtRisk === 0 ? (
          <div className="flex items-center justify-center text-sm py-6 text-[rgb(var(--text-tertiary))]">
            No at-risk students
          </div>
        ) : (
          <div className="space-y-2.5">
            {topStudents.map((student) => {
              const color = getRateColor(student.attendanceRate)
              return (
                <div key={student.studentId} className="flex items-center gap-3">
                  <StudentAvatar name={student.studentName} studentId={student.studentId} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate text-[rgb(var(--text-secondary))]">
                      {student.studentName}
                    </p>
                    <p className="text-xs mt-0.5 text-[rgb(var(--text-disabled))]">
                      {student.gradeLevel ? `Grade ${student.gradeLevel}` : ''}{student.gradeLevel ? ' · ' : ''}{student.absentDays} absent
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      // allow-presentation-style: attendance-rate severity color (danger/warning)
                      className="text-xs font-semibold tabular-nums"
                      style={{ color }}
                    >
                      {student.attendanceRate.toFixed(1)}%
                    </span>
                    <div className="w-12">
                      <AnimatedProgressBar
                        percentage={student.attendanceRate}
                        color={color}
                        label={`${student.studentName}: ${student.attendanceRate.toFixed(1)}% attendance`}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-3 mt-3 border-t border-[rgb(var(--border-primary)/0.35)]">
        <Link
          to="/students"
          className="inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-80 text-[rgb(var(--accent-enrollment))]"
        >
          View all {totalAtRisk} at-risk students
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
