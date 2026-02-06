/**
 * EnrollmentTab Component
 *
 * Displays enrollment history in a clean table/list format.
 * Current enrollment highlighted, historical entries below.
 */

import {
  GraduationCap,
  Calendar,
  Clock,
  Building2,
  CheckCircle2,
} from 'lucide-react'
import type { StudentProfileResponseDto } from '@edforge/shared-types'

// ============================================================================
// TYPES
// ============================================================================

export interface EnrollmentTabProps {
  student: StudentProfileResponseDto
}

type CurrentEnrollment = NonNullable<StudentProfileResponseDto['currentEnrollment']>
type EnrollmentHistory = NonNullable<StudentProfileResponseDto['enrollmentHistory']>[number]

// ============================================================================
// HELPERS
// ============================================================================

const statusStyles: Record<string, { bg: string; text: string }> = {
  active: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
  withdrawn: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400' },
  transferred: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
  graduated: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
  completed: { bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400' },
}

function getStatusStyle(status: string) {
  return statusStyles[status.toLowerCase()] || statusStyles.completed
}

function formatDate(dateStr: string, format: 'short' | 'full' = 'full'): string {
  try {
    const date = new Date(dateStr)
    if (format === 'short') {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

// ============================================================================
// CURRENT ENROLLMENT
// ============================================================================

function CurrentEnrollmentSection({ enrollment }: { enrollment: CurrentEnrollment }) {
  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        Current Enrollment
      </h3>
      <div className="p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div>
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">Grade Level</p>
            <p className="text-lg font-semibold text-text-primary">Grade {enrollment.gradeLevel}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">Academic Year</p>
            <p className="text-sm text-text-primary flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-text-tertiary" />
              {enrollment.academicYearName || '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">Enrollment Date</p>
            <p className="text-sm text-text-primary flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-text-tertiary" />
              {formatDate(enrollment.enrollmentDate)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">Homeroom</p>
            <p className="text-sm text-text-primary flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-text-tertiary" />
              {enrollment.homeroomName || '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ENROLLMENT HISTORY TABLE
// ============================================================================

function EnrollmentHistoryTable({ history }: { history: EnrollmentHistory[] }) {
  if (history.length === 0) return null

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-text-tertiary" />
        Enrollment History
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-secondary">
              <th className="text-left py-2.5 px-3 text-xs font-medium text-text-tertiary uppercase tracking-wide">Grade</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-text-tertiary uppercase tracking-wide">School</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-text-tertiary uppercase tracking-wide">Academic Year</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-text-tertiary uppercase tracking-wide">Enrolled</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-text-tertiary uppercase tracking-wide">Withdrawn</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-text-tertiary uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((enrollment) => {
              const style = getStatusStyle(enrollment.status)
              return (
                <tr
                  key={enrollment.enrollmentId}
                  className="border-b border-border-tertiary last:border-0 hover:bg-surface-secondary/50 transition-colors"
                >
                  <td className="py-3 px-3 font-medium text-text-primary">
                    Grade {enrollment.gradeLevel}
                  </td>
                  <td className="py-3 px-3 text-text-secondary">
                    {enrollment.schoolName || '—'}
                  </td>
                  <td className="py-3 px-3 text-text-secondary">
                    {enrollment.academicYearName || '—'}
                  </td>
                  <td className="py-3 px-3 text-text-secondary">
                    {formatDate(enrollment.enrollmentDate, 'short')}
                  </td>
                  <td className="py-3 px-3 text-text-secondary">
                    {enrollment.withdrawalDate
                      ? formatDate(enrollment.withdrawalDate, 'short')
                      : '—'}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${style.bg} ${style.text}`}>
                      {enrollment.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EnrollmentTab({ student }: EnrollmentTabProps) {
  const currentEnrollment = student.currentEnrollment
  const enrollmentHistory = (student.enrollmentHistory || [])
    .filter((e) => e.enrollmentId !== currentEnrollment?.enrollmentId)
    .sort((a, b) => new Date(b.enrollmentDate).getTime() - new Date(a.enrollmentDate).getTime())

  const hasNoData = !currentEnrollment && enrollmentHistory.length === 0

  if (hasNoData) {
    return (
      <div className="text-center py-16">
        <GraduationCap className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
        <p className="text-text-secondary font-medium">No enrollment records</p>
        <p className="text-sm text-text-tertiary mt-1">
          Enrollment data will appear here once the student is enrolled in an academic year.
        </p>
      </div>
    )
  }

  return (
    <div>
      {currentEnrollment && (
        <CurrentEnrollmentSection enrollment={currentEnrollment} />
      )}
      {!currentEnrollment && (
        <div className="mb-6 p-4 rounded-lg bg-amber-500/5 border border-amber-500/15">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            No active enrollment on file for the current academic year.
          </p>
        </div>
      )}
      <EnrollmentHistoryTable history={enrollmentHistory} />
    </div>
  )
}

// ============================================================================
// SKELETON
// ============================================================================

export function EnrollmentTabSkeleton() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-4 h-4 rounded bg-surface-tertiary animate-pulse" />
        <div className="h-4 w-32 bg-surface-tertiary rounded animate-pulse" />
      </div>
      <div className="h-28 w-full bg-surface-tertiary rounded-xl animate-pulse mb-8" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 w-full bg-surface-tertiary rounded animate-pulse" />
        ))}
      </div>
    </div>
  )
}
