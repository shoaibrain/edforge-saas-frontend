/**
 * Exams Module (Legacy Route)
 *
 * High-stakes examination management for the Academics domain.
 * Now consolidated under /academics/grades for unified grading workflow.
 */

import { Calculator, Calendar, Shield, ArrowRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export function ExamsModule() {
  return (
    <div className="min-h-full">
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
              <Calculator className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Examinations</h1>
              <p className="text-text-secondary mt-1">
                Midterms, finals, and standardized test management
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
                Access the Grades & Assessments page for a unified view of gradebooks,
                assessments, and exams in one place.
              </p>
              <Link
                to="/classrooms"
                search={{ tab: 'gradebook' }}
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
            <div className="p-3 rounded-lg bg-purple-500/10">
              <Calculator className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Examination Management
              </h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                Manage high-stakes examinations including midterms, finals, and state-mandated
                standardized tests. Track testing accommodations for students with IEPs and
                504 plans to ensure compliance.
              </p>
              <ul className="text-sm text-text-secondary space-y-1">
                <li className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  <span>Exam scheduling with room and proctor assignments</span>
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-500" />
                  <span>Accommodation tracking integrated with Special Programs</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExamsModule
