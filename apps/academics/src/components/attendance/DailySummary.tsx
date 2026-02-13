/**
 * DailySummary Component
 *
 * Dashboard showing daily attendance metrics with rate and breakdown.
 */

import {
  Users,
  UserCheck,
  UserX,
  Clock,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import type { DailyAttendanceSummary } from '../../services/academics.service'

interface DailySummaryProps {
  summary: DailyAttendanceSummary | undefined
  isLoading: boolean
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  accent,
  bg,
}: {
  icon: typeof Users
  label: string
  value: string | number
  subtext?: string
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
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-semibold text-text-primary">{value}</p>
            {subtext && <span className={`text-sm ${accent}`}>{subtext}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-surface-secondary rounded-xl border border-border-secondary p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-surface-hover rounded-lg" />
        <div className="space-y-2">
          <div className="h-3 w-20 bg-surface-hover rounded" />
          <div className="h-5 w-12 bg-surface-hover rounded" />
        </div>
      </div>
    </div>
  )
}

export function DailySummary({ summary, isLoading }: DailySummaryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Students"
          value="--"
          accent="text-text-tertiary"
          bg="bg-surface-hover"
        />
        <StatCard
          icon={UserCheck}
          label="Present"
          value="--"
          accent="text-text-tertiary"
          bg="bg-surface-hover"
        />
        <StatCard
          icon={UserX}
          label="Absent"
          value="--"
          accent="text-text-tertiary"
          bg="bg-surface-hover"
        />
        <StatCard
          icon={TrendingUp}
          label="Attendance Rate"
          value="--"
          accent="text-text-tertiary"
          bg="bg-surface-hover"
        />
      </div>
    )
  }

  const rate = summary.attendanceRate
  const rateColor =
    rate >= 95
      ? 'text-emerald-600 dark:text-emerald-400'
      : rate >= 90
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400'

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        icon={UserCheck}
        label="Present"
        value={summary.present}
        subtext={summary.totalStudents > 0 ? `${((summary.present / summary.totalStudents) * 100).toFixed(1)}%` : undefined}
        accent="text-emerald-600 dark:text-emerald-400"
        bg="bg-emerald-500/10"
      />
      <StatCard
        icon={UserX}
        label="Absent"
        value={summary.absent}
        subtext={summary.totalStudents > 0 ? `${((summary.absent / summary.totalStudents) * 100).toFixed(1)}%` : undefined}
        accent="text-red-600 dark:text-red-400"
        bg="bg-red-500/10"
      />
      <StatCard
        icon={Clock}
        label="Late"
        value={summary.late}
        accent="text-amber-600 dark:text-amber-400"
        bg="bg-amber-500/10"
      />
      <StatCard
        icon={ShieldCheck}
        label="Excused"
        value={summary.excused}
        accent="text-blue-600 dark:text-blue-400"
        bg="bg-blue-500/10"
      />
      <StatCard
        icon={TrendingUp}
        label="Attendance Rate"
        value={`${rate.toFixed(1)}%`}
        accent={rateColor}
        bg={rate >= 95 ? 'bg-emerald-500/10' : rate >= 90 ? 'bg-amber-500/10' : 'bg-red-500/10'}
      />
    </div>
  )
}
