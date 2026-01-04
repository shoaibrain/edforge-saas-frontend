/**
 * Attendance Module
 *
 * Real-time attendance tracking for the Academics domain.
 * This is a high-frequency daily task elevated to top-level navigation.
 *
 * Design Philosophy:
 * Attendance is recorded every day by most staff—it deserves prominent placement.
 * The interface is optimized for speed: quick mark-all, period-by-period entry,
 * and immediate visibility of absence patterns.
 */

import { ClipboardCheck, Calendar, AlertTriangle, TrendingUp, Clock, Users, Bell } from 'lucide-react'

export function AttendanceModule() {
  return (
    <div className="min-h-full">
      {/* Page Header */}
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                <ClipboardCheck className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Daily Attendance</h1>
                <p className="text-text-secondary mt-1">
                  Real-time attendance tracking with period-by-period recording and truancy alerts
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Calendar className="w-4 h-4" />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Present Today"
            value="1,156"
            subtext="92.7%"
            accent="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-500/10"
          />
          <StatCard
            icon={AlertTriangle}
            label="Absent"
            value="67"
            subtext="5.4%"
            accent="text-red-600 dark:text-red-400"
            bg="bg-red-500/10"
          />
          <StatCard
            icon={Clock}
            label="Tardy"
            value="24"
            subtext="1.9%"
            accent="text-amber-600 dark:text-amber-400"
            bg="bg-amber-500/10"
          />
          <StatCard
            icon={TrendingUp}
            label="Weekly Average"
            value="94.2%"
            subtext="+1.2%"
            accent="text-blue-600 dark:text-blue-400"
            bg="bg-blue-500/10"
          />
        </div>

        {/* Product Description */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-amber-500/10">
              <ClipboardCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Integrated Attendance System
              </h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                Record attendance by class period or homeroom with automatic absence notifications 
                to parents. Truancy patterns trigger alerts for intervention teams. All attendance 
                data syncs with state reporting requirements and Ed-Fi submissions.
              </p>
              <div className="flex items-center gap-4 text-sm text-text-tertiary">
                <div className="flex items-center gap-1.5">
                  <Bell className="w-4 h-4" />
                  <span>Auto-notifications enabled</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  <span>Truancy threshold: 3 days</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Entry Placeholder */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-8 text-center">
          <ClipboardCheck className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <h4 className="text-lg font-medium text-text-primary mb-2">
            Select a Class to Take Attendance
          </h4>
          <p className="text-text-secondary max-w-md mx-auto">
            Choose a class from your schedule to record today's attendance.
            Use quick actions to mark all present, then adjust individual students.
          </p>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  accent,
  bg,
}: {
  icon: typeof ClipboardCheck
  label: string
  value: string
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

export default AttendanceModule

