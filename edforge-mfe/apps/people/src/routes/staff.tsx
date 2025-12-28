/**
 * Staff Directory Page
 *
 * Complete employee roster for the People domain.
 * Primary view for accessing staff profiles, assignments, and contact information.
 */

import { Navigate } from '@tanstack/react-router'
import { can } from '@edforge/abac'
import { UsersRound, Search, Filter, Plus, Users, GraduationCap, Briefcase, Award } from 'lucide-react'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'

export default function StaffPage() {
  const { user } = useAuthStore.getState()
  const { activeSchoolId } = useAppStore.getState()

  if (!can(user, { action: 'view', resource: 'staff', schoolId: activeSchoolId ?? undefined })) {
    return <Navigate to={'/forbidden' as any} />
  }

  return (
    <div className="min-h-full">
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
                <UsersRound className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Staff Directory</h1>
                <p className="text-text-secondary mt-1">
                  Complete employee roster with contact information, certifications, and assignments
                </p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors">
              <Plus className="w-4 h-4" />
              <span>Add Staff</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Total Staff"
            value="156"
            accent="text-blue-600 dark:text-blue-400"
            bg="bg-blue-500/10"
          />
          <StatCard
            icon={GraduationCap}
            label="Teachers"
            value="87"
            accent="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-500/10"
          />
          <StatCard
            icon={Briefcase}
            label="Support Staff"
            value="45"
            accent="text-purple-600 dark:text-purple-400"
            bg="bg-purple-500/10"
          />
          <StatCard
            icon={Award}
            label="Administrators"
            value="24"
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
              placeholder="Search by name, department, or role..."
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
              <UsersRound className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Employee Management
              </h3>
              <p className="text-text-secondary leading-relaxed">
                View all staff members with their contact information, department assignments,
                and employment status. Filter by department, role, or employment type. Click
                any staff member to view their full profile including certifications and
                school assignments.
              </p>
            </div>
          </div>
        </div>

        {/* Placeholder Table */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-8 text-center">
          <Users className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <h4 className="text-lg font-medium text-text-primary mb-2">
            Staff Roster
          </h4>
          <p className="text-text-secondary max-w-md mx-auto">
            Browse all staff members organized by department or role.
            Click a row to view the full employee profile.
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
  icon: typeof Users
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
