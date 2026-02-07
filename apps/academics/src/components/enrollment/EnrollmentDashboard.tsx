/**
 * EnrollmentDashboard Component
 *
 * Summary statistics for enrollment: total, by-grade, by-status breakdowns.
 */

import { Users, TrendingUp, BookOpen, AlertCircle } from 'lucide-react'
import type { EnrollmentSummaryResponse } from '../../services/academics.service'

interface EnrollmentDashboardProps {
  summary: EnrollmentSummaryResponse | undefined
  isLoading: boolean
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

export function EnrollmentDashboard({ summary, isLoading }: EnrollmentDashboardProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-surface-secondary rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Enrolled" value="--" accent="text-text-tertiary" bg="bg-surface-hover" />
        <StatCard icon={TrendingUp} label="Active" value="--" accent="text-text-tertiary" bg="bg-surface-hover" />
        <StatCard icon={BookOpen} label="Grade Levels" value="--" accent="text-text-tertiary" bg="bg-surface-hover" />
        <StatCard icon={AlertCircle} label="Pending" value="--" accent="text-text-tertiary" bg="bg-surface-hover" />
      </div>
    )
  }

  const activeCount = summary.byStatus?.enrolled ?? summary.byStatus?.active ?? 0
  const pendingCount = summary.byStatus?.pending ?? 0
  const gradeLevelCount = Object.keys(summary.byGradeLevel || {}).length

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Enrolled"
          value={summary.totalEnrolled}
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
      {summary.byGradeLevel && Object.keys(summary.byGradeLevel).length > 0 && (
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
