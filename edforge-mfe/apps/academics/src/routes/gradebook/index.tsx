/**
 * Gradebook Module (Legacy Route)
 *
 * This route is maintained for backward compatibility.
 * New navigation uses /academics/grades which provides a consolidated view.
 *
 * Gradebook is the daily interface for teachers to enter and manage student grades.
 */

import { BookCheck, ArrowRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export function GradebookModule() {
  return (
    <div className="min-h-full">
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
              <BookCheck className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Gradebook</h1>
              <p className="text-text-secondary mt-1">
                Enter and manage student grades by class and assignment
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
                Access the enhanced Grades & Assessments page for a unified view of 
                gradebooks, assessments, and exams in one place.
              </p>
              <Link
                to="/grades"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>Go to Grades & Assessments</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-amber-500/10">
              <BookCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Traditional Gradebook View
              </h3>
              <p className="text-text-secondary leading-relaxed">
                This classic gradebook interface provides familiar spreadsheet-style grade entry.
                Configure grading scales, enter scores, calculate weighted averages, and generate
                progress reports. Supports standards-based grading with custom rubrics.
              </p>
            </div>
          </div>
        </div>

        {/* Placeholder */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-8 text-center">
          <BookCheck className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <h4 className="text-lg font-medium text-text-primary mb-2">
            Select a Class
          </h4>
          <p className="text-text-secondary max-w-md mx-auto">
            Choose a class from your teaching assignments to view and edit the gradebook.
          </p>
        </div>
      </div>
    </div>
  )
}

export default GradebookModule

