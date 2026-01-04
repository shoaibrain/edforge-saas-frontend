/**
 * Courses Module (Legacy Route)
 *
 * Course catalog management for the Academics domain.
 * Now consolidated under /academics/curriculum for unified curriculum management.
 */

import { BookOpen, FileText, CheckCircle, Clock, ArrowRight, Search, Filter, Plus } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export function CoursesModule() {
  return (
    <div className="min-h-full">
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20">
                <BookOpen className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Course Catalog</h1>
                <p className="text-text-secondary mt-1">
                  Define and manage course offerings, credits, and prerequisites
                </p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors">
              <Plus className="w-4 h-4" />
              <span>Add Course</span>
            </button>
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
                Access the Curriculum Management page for a unified view of courses,
                grade levels, and standards in one place.
              </p>
              <Link
                to="/curriculum"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>Go to Curriculum Management</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={BookOpen}
            label="Total Courses"
            value="87"
            accent="text-rose-600 dark:text-rose-400"
            bg="bg-rose-500/10"
          />
          <StatCard
            icon={CheckCircle}
            label="Active This Term"
            value="64"
            accent="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-500/10"
          />
          <StatCard
            icon={FileText}
            label="Electives"
            value="23"
            accent="text-blue-600 dark:text-blue-400"
            bg="bg-blue-500/10"
          />
          <StatCard
            icon={Clock}
            label="Pending Approval"
            value="5"
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
              placeholder="Search by course name, code, or department..."
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
            <div className="p-3 rounded-lg bg-rose-500/10">
              <BookOpen className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Course Definition
              </h3>
              <p className="text-text-secondary leading-relaxed">
                Define courses with credit hours, prerequisites, grade level eligibility,
                and standards alignment. Courses flow into the master schedule and gradebook
                automatically. Approval workflows ensure curriculum governance.
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
  icon: typeof BookOpen
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

export default CoursesModule
