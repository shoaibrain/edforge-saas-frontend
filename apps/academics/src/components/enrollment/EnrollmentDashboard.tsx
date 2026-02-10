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
import { Users, TrendingUp, BookOpen, AlertCircle, Calendar, AlertTriangle } from 'lucide-react'
import type { EnrollmentSummaryResponse } from '../../services/academics.service'
import type { AcademicYearResponseDto } from '../../services/school.service'

interface EnrollmentDashboardProps {
  summary: EnrollmentSummaryResponse | undefined
  isLoading: boolean
  activeYear?: AcademicYearResponseDto | null
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  bg,
}: {
  icon: typeof Users
  label: string
  value: string | number
  accent: string
  bg: string
}) {
  return (
    <div className="bg-surface-secondary rounded-xl border border-border-secondary p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`w-4 h-4 ${accent}`} />
        </div>
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="text-xl font-semibold text-text-primary">{value}</p>
        </div>
      </div>
    </div>
  )
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
    <div className="w-full">
      <div className="flex justify-between text-xs text-text-tertiary mb-1">
        <span>{startDate}</span>
        <span>{progress}% complete</span>
        <span>{endDate}</span>
      </div>
      <div className="h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
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
      {/* Academic Year Context Banner */}
      {activeYear && (
        <div className="rounded-xl bg-surface-secondary border border-border-secondary p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-teal-500" />
              <div>
                <span className="text-sm font-semibold text-text-primary">
                  {activeYear.name}
                </span>
                <span className="ml-2">
                  <StatusBadge status={activeYear.status} />
                </span>
              </div>
            </div>
          </div>
          <YearProgressBar startDate={activeYear.startDate} endDate={activeYear.endDate} />
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Enrolled"
          value={summary?.totalEnrolled ?? '--'}
          accent="text-blue-600 dark:text-blue-400"
          bg="bg-blue-500/10"
        />
        <StatCard
          icon={TrendingUp}
          label="Active"
          value={activeCount}
          accent="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <StatCard
          icon={BookOpen}
          label="Grade Levels"
          value={gradeLevelCount}
          accent="text-purple-600 dark:text-purple-400"
          bg="bg-purple-500/10"
        />
        <StatCard
          icon={AlertCircle}
          label="Pending"
          value={pendingCount}
          accent="text-amber-600 dark:text-amber-400"
          bg="bg-amber-500/10"
        />
      </div>

      {/* Grade Level Breakdown */}
      {summary?.byGradeLevel && Object.keys(summary.byGradeLevel).length > 0 && (
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-5">
          <h4 className="text-sm font-semibold text-text-primary mb-3">
            Enrollment by Grade Level
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(summary.byGradeLevel)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([grade, count]) => (
                <div
                  key={grade}
                  className="text-center p-3 bg-surface-primary rounded-lg border border-border-secondary"
                >
                  <div className="text-xs text-text-tertiary mb-1">{grade}</div>
                  <div className="text-lg font-semibold text-text-primary">{count}</div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
