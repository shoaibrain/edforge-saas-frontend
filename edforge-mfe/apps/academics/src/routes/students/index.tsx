/**
 * Students Module
 *
 * Comprehensive student roster and management for the Academics domain.
 * This is the primary entry point for viewing and managing student records.
 *
 * Design Philosophy:
 * The Student Directory serves as the hub for all student-related operations.
 * Enrollment and Profiles are accessible as tabs/actions within individual records,
 * following the "Object-Oriented" navigation pattern that reduces sidebar clutter.
 */

import { Users, Search, Filter, Plus, GraduationCap, UserCheck, AlertCircle } from 'lucide-react'

export function StudentsModule() {
  return (
    <div className="min-h-full">
      {/* Page Header */}
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20">
                <Users className="w-6 h-6 text-teal-600 dark:text-cyan-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Student Directory</h1>
                <p className="text-text-secondary mt-1">
                  Comprehensive student roster with enrollment status, demographics, and academic standing
                </p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors">
              <Plus className="w-4 h-4" />
              <span>Add Student</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Total Enrolled"
            value="1,247"
            accent="text-teal-600 dark:text-cyan-400"
            bg="bg-teal-500/10"
          />
          <StatCard
            icon={GraduationCap}
            label="Active This Term"
            value="1,198"
            accent="text-blue-600 dark:text-blue-400"
            bg="bg-blue-500/10"
          />
          <StatCard
            icon={UserCheck}
            label="New Enrollments"
            value="23"
            accent="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-500/10"
          />
          <StatCard
            icon={AlertCircle}
            label="Pending Review"
            value="8"
            accent="text-amber-600 dark:text-amber-400"
            bg="bg-amber-500/10"
          />
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search by name, ID, or grade level..."
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
            <div className="p-3 rounded-lg bg-teal-500/10">
              <Users className="w-5 h-5 text-teal-600 dark:text-cyan-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Unified Student Records
              </h3>
              <p className="text-text-secondary leading-relaxed">
                Access individual student profiles with complete academic history, enrollment records, 
                and demographic information. Click any student to view their detailed profile including 
                grades, attendance, special program participation, and family contacts. Bulk operations 
                support mass updates for grade promotions and term transitions.
              </p>
            </div>
          </div>
        </div>

        {/* Placeholder Table */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-8 text-center">
          <Users className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <h4 className="text-lg font-medium text-text-primary mb-2">
            Student Roster
          </h4>
          <p className="text-text-secondary max-w-md mx-auto">
            View all enrolled students organized by grade level or homeroom.
            Click a student row to open their full profile with academic history.
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

export default StudentsModule

