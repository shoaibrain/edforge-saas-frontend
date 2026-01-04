/**
 * Classrooms Module (Legacy Route)
 *
 * Room and facility management for the Academics domain.
 * Now consolidated under /academics/scheduling for unified scheduling workflow.
 */

import { Building2, Users, MapPin, ArrowRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export function ClassroomsModule() {
  return (
    <div className="min-h-full">
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
              <Building2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Classrooms</h1>
              <p className="text-text-secondary mt-1">
                Room allocation, capacity management, and facility inventory
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Redirect Notice */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <ArrowRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                New Consolidated View Available
              </h3>
              <p className="text-text-secondary mb-4">
                Access the Master Scheduling page for a unified view of classrooms,
                schedules, and timetables in one place.
              </p>
              <Link
                to="/scheduling"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
            icon={Building2}
            label="Total Rooms"
            value="48"
            accent="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-500/10"
          />
          <StatCard
            icon={Users}
            label="Total Capacity"
            value="1,440"
            accent="text-blue-600 dark:text-blue-400"
            bg="bg-blue-500/10"
          />
          <StatCard
            icon={MapPin}
            label="Accessible"
            value="32"
            accent="text-purple-600 dark:text-purple-400"
            bg="bg-purple-500/10"
          />
        </div>

        {/* Product Description */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Facility Management
              </h3>
              <p className="text-text-secondary leading-relaxed">
                Define classrooms with capacity limits, equipment inventory, and accessibility features.
                Track room utilization and prevent scheduling conflicts. ADA compliance tracking
                ensures appropriate room assignments for students with accommodations.
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
  icon: typeof Building2
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

export default ClassroomsModule
