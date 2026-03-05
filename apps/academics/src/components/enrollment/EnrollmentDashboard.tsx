/**
 * EnrollmentDashboard Component
 *
 * Summary statistics for enrollment: total, by-grade, by-status breakdowns.
 *
 * Sprint Alaska changes:
 * - Added academic year context (name, dates, status badge) (AK-3.4)
 * - Setup prompt when no active year exists (AK-3.4)
 */

import { useMemo } from 'react'
import { Calendar, AlertTriangle } from 'lucide-react'
import type { EnrollmentSummaryResponse } from '../../services/academics.service'
import type { AcademicYearResponseDto } from '../../services/school.service'

interface EnrollmentDashboardProps {
  summary: EnrollmentSummaryResponse | undefined
  isLoading: boolean
  activeYear?: AcademicYearResponseDto | null
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    planning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    completed: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    archived: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] || styles.archived}`}>
      {status}
    </span>
  )
}

function YearProgressBar({ startDate, endDate }: { startDate: string; endDate: string }) {
  const progress = useMemo(() => {
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    const now = Date.now()
    if (now <= start) return 0
    if (now >= end) return 100
    return Math.round(((now - start) / (end - start)) * 100)
  }, [startDate, endDate])

  return (
    <div className="flex items-center gap-2 text-xs text-text-tertiary">
      <div className="w-20 h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span>{progress}%</span>
    </div>
  )
}

export function EnrollmentDashboard({ summary, isLoading, activeYear }: EnrollmentDashboardProps) {
  // No active year — show setup prompt
  if (!isLoading && !activeYear) {
    return (
      <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          No active academic year for this school
        </h3>
        <p className="text-sm text-text-secondary max-w-md mx-auto mb-4">
          Set up and activate an academic year in School Settings to begin enrolling students and viewing enrollment data.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {activeYear && (
          <div className="h-16 bg-surface-secondary rounded-xl animate-pulse" />
        )}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-surface-secondary rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const activeCount = summary?.byStatus?.enrolled ?? summary?.byStatus?.active ?? 0
  const pendingCount = summary?.byStatus?.pending ?? 0
  const gradeLevelCount = Object.keys(summary?.byGradeLevel || {}).length

  return (
    <div className="space-y-4">
      {/* Year + Stats Compact Bar */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-surface-secondary border border-border-secondary px-4 py-3">
        {activeYear && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-teal-500" />
            <span className="font-medium text-text-primary">{activeYear.name}</span>
            <StatusBadge status={activeYear.status} />
            <YearProgressBar startDate={activeYear.startDate} endDate={activeYear.endDate} />
          </div>
        )}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-text-secondary">
            <span className="font-semibold text-text-primary">{summary?.totalEnrolled ?? '--'}</span> enrolled
          </span>
          <span className="text-text-secondary">
            <span className="font-semibold text-text-primary">{activeCount}</span> active
          </span>
          <span className="text-text-secondary">
            <span className="font-semibold text-text-primary">{gradeLevelCount}</span> grade levels
          </span>
          {pendingCount > 0 && (
            <span className="text-amber-600 dark:text-amber-400">
              <span className="font-semibold">{pendingCount}</span> pending
            </span>
          )}
        </div>
      </div>

    </div>
  )
}
