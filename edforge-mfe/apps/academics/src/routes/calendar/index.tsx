/**
 * Academic Calendar Module
 *
 * School year calendar management for the Academics domain.
 * Defines terms, holidays, and important academic dates.
 */

import { Calendar, CalendarDays, Sun, Star, Clock, Plus } from 'lucide-react'

export function CalendarModule() {
  return (
    <div className="min-h-full">
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                <Calendar className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Academic Calendar</h1>
                <p className="text-text-secondary mt-1">
                  School year structure, terms, holidays, and important dates
                </p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors">
              <Plus className="w-4 h-4" />
              <span>Add Event</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Current Term Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={CalendarDays}
            label="Current Term"
            value="Fall 2024"
            accent="text-blue-600 dark:text-blue-400"
            bg="bg-blue-500/10"
          />
          <StatCard
            icon={Clock}
            label="Days Remaining"
            value="47"
            accent="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-500/10"
          />
          <StatCard
            icon={Sun}
            label="Next Break"
            value="Winter"
            accent="text-amber-600 dark:text-amber-400"
            bg="bg-amber-500/10"
          />
          <StatCard
            icon={Star}
            label="School Days (YTD)"
            value="89"
            accent="text-purple-600 dark:text-purple-400"
            bg="bg-purple-500/10"
          />
        </div>

        {/* Product Description */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                School Year Structure
              </h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                Define the academic year with terms, grading periods, and instructional days.
                Mark holidays, professional development days, and early dismissals. The calendar
                drives attendance tracking, grade period close dates, and state reporting.
              </p>
              <ul className="text-sm text-text-secondary space-y-1">
                <li>• Term and semester date management</li>
                <li>• Holiday and break scheduling</li>
                <li>• School-wide events and announcements</li>
                <li>• State-required instructional day tracking</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Mini Calendar Placeholder */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-8 text-center">
          <Calendar className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <h4 className="text-lg font-medium text-text-primary mb-2">
            Calendar View
          </h4>
          <p className="text-text-secondary max-w-md mx-auto">
            View the full academic calendar with terms, holidays, and events.
            Click any date to add or view events for that day.
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
  accent,
  bg,
}: {
  icon: typeof Calendar
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

export default CalendarModule
