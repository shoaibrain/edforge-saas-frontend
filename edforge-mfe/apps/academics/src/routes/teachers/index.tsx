/**
 * Teachers Module
 *
 * Faculty directory and assignment management for the Academics domain.
 * View teaching staff, their course assignments, and certifications.
 */

import { GraduationCap, Users, BookOpen, Award, Calendar, Search, Filter } from 'lucide-react'

export function TeachersModule() {
  return (
    <div className="min-h-full">
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
              <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Faculty Directory</h1>
              <p className="text-text-secondary mt-1">
                Teaching staff profiles, course assignments, and certification tracking
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Active Teachers"
            value="87"
            accent="text-blue-600 dark:text-blue-400"
            bg="bg-blue-500/10"
          />
          <StatCard
            icon={BookOpen}
            label="Course Sections"
            value="156"
            accent="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-500/10"
          />
          <StatCard
            icon={Award}
            label="Certifications"
            value="234"
            accent="text-purple-600 dark:text-purple-400"
            bg="bg-purple-500/10"
          />
          <StatCard
            icon={Calendar}
            label="Sub Requests"
            value="3"
            accent="text-amber-600 dark:text-amber-400"
            bg="bg-amber-500/10"
          />
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search by name, department, or subject..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-secondary border border-border-secondary rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-surface-secondary border border-border-secondary rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Product Description */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Faculty Management
              </h3>
              <p className="text-text-secondary leading-relaxed">
                View all teaching staff with their assigned courses, classroom locations, and
                teaching schedules. Access certification status and professional development
                records. Coordinate substitute teacher assignments for absences.
              </p>
            </div>
          </div>
        </div>

        {/* Placeholder */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-8 text-center">
          <Users className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <h4 className="text-lg font-medium text-text-primary mb-2">
            Faculty Roster
          </h4>
          <p className="text-text-secondary max-w-md mx-auto">
            Browse all teaching staff by department or subject area.
            Click a teacher to view their full profile and course schedule.
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
  icon: typeof GraduationCap
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

export default TeachersModule

