/**
 * Timetables Module (Legacy Route)
 *
 * Visual weekly/daily schedule grids for the Academics domain.
 * Now consolidated under /academics/scheduling for unified scheduling workflow.
 */

import { LayoutGrid, Calendar, User, ArrowRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export function TimetablesModule() {
  return (
    <div className="min-h-full">
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
              <LayoutGrid className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Timetables</h1>
              <p className="text-text-secondary mt-1">
                Visual weekly and daily schedule grids for teachers, students, and rooms
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
                Access the Master Scheduling page for a unified view of timetables,
                schedules, and classrooms in one place.
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

        {/* View Types */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-secondary rounded-xl border border-border-secondary p-5 hover:bg-surface-hover transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-medium text-text-primary">Teacher View</h4>
            </div>
            <p className="text-sm text-text-secondary">
              View a teacher's weekly schedule with all assigned sections.
            </p>
          </div>

          <div className="bg-surface-secondary rounded-xl border border-border-secondary p-5 hover:bg-surface-hover transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h4 className="font-medium text-text-primary">Student View</h4>
            </div>
            <p className="text-sm text-text-secondary">
              View a student's personal schedule with class times and rooms.
            </p>
          </div>

          <div className="bg-surface-secondary rounded-xl border border-border-secondary p-5 hover:bg-surface-hover transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="font-medium text-text-primary">Room View</h4>
            </div>
            <p className="text-sm text-text-secondary">
              View a room's daily schedule with all classes meeting there.
            </p>
          </div>
        </div>

        {/* Product Description */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-indigo-500/10">
              <LayoutGrid className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Visual Schedule Grid
              </h3>
              <p className="text-text-secondary leading-relaxed">
                View and print weekly timetables for teachers, students, or classrooms.
                The visual grid makes it easy to spot gaps, overlaps, and optimization
                opportunities. Export to PDF for distribution or display.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TimetablesModule
