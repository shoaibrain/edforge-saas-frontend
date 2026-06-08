/**
 * Class Schedules Module (Legacy Route)
 *
 * Section and period assignments for the Academics domain.
 * Now consolidated under /academics/scheduling for unified scheduling workflow.
 */

import { CalendarDays, Users, Clock, ArrowRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export function SchedulesModule() {
  return (
    <div className="min-h-full">
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[rgb(var(--state-info-bg)/0.20)] to-[rgb(var(--state-info-bg)/0.14)]">
              <CalendarDays className="w-6 h-6 text-[rgb(var(--state-info-fg))]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Class Schedules</h1>
              <p className="text-text-secondary mt-1">
                Course section assignments, meeting times, and teacher scheduling
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Redirect Notice */}
        <div className="bg-[rgb(var(--state-info-bg)/0.18)] border border-[rgb(var(--state-info-border)/0.35)] rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-[rgb(var(--state-info-fg))]/20">
              <ArrowRight className="w-5 h-5 text-[rgb(var(--state-info-fg))]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                New Consolidated View Available
              </h3>
              <p className="text-text-secondary mb-4">
                Access the Master Scheduling page for a unified view of schedules,
                timetables, and classrooms in one place.
              </p>
              <Link
                to="/classrooms"
                search={{ tab: undefined }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] rounded-lg hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors"
              >
                <span>Go to Master Scheduling</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={CalendarDays}
            label="Active Sections"
            value="156"
            accent="text-[rgb(var(--state-info-fg))]"
            bg="bg-[rgb(var(--state-info-bg)/0.18)]"
          />
          <StatCard
            icon={Users}
            label="Teachers Scheduled"
            value="42"
            accent="text-[rgb(var(--state-success-fg))]"
            bg="bg-[rgb(var(--state-success-bg)/0.18)]"
          />
          <StatCard
            icon={Clock}
            label="Time Periods"
            value="8"
            accent="text-[rgb(var(--state-info-fg))]"
            bg="bg-[rgb(var(--state-info-bg)/0.18)]"
          />
        </div>

        {/* Product Description */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-[rgb(var(--state-info-bg)/0.18)]">
              <CalendarDays className="w-5 h-5 text-[rgb(var(--state-info-fg))]" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Section Scheduling
              </h3>
              <p className="text-text-secondary leading-relaxed">
                Assign teachers to course sections, set meeting times, and manage enrollment caps.
                The scheduling engine automatically detects conflicts when teachers or rooms are
                double-booked and suggests resolution options.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  bg,
}: {
  icon: typeof CalendarDays
  label: string
  value: string
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

export default SchedulesModule
