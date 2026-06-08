/**
 * Standards Module (Legacy Route)
 *
 * Learning standards alignment for the Academics domain.
 * Now consolidated under /academics/curriculum for unified curriculum management.
 */

import { Target, FileText, CheckCircle, ArrowRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export function StandardsModule() {
  return (
    <div className="min-h-full">
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
              <Target className="w-6 h-6 text-[rgb(var(--state-info-fg))]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Learning Standards</h1>
              <p className="text-text-secondary mt-1">
                State and district learning standards for curriculum alignment
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Redirect Notice */}
        <div className="bg-[rgb(var(--state-info-bg)/0.18)] border border-blue-500/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-[rgb(var(--state-info-fg))]/20">
              <ArrowRight className="w-5 h-5 text-[rgb(var(--state-info-fg))]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                New Consolidated View Available
              </h3>
              <p className="text-text-secondary mb-4">
                Access the Curriculum Management page for a unified view of standards,
                courses, and grade levels in one place.
              </p>
              <Link
                to="/curriculum"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-[rgb(var(--action-primary-fg))] rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>Go to Curriculum Management</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Standards Frameworks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface-secondary rounded-xl border border-border-secondary p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[rgb(var(--state-info-bg)/0.18)]">
                <Target className="w-4 h-4 text-[rgb(var(--state-info-fg))]" />
              </div>
              <div>
                <h4 className="font-medium text-text-primary">Common Core State Standards</h4>
                <p className="text-xs text-text-secondary">ELA & Mathematics</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-tertiary">
              <FileText className="w-4 h-4" />
              <span>1,247 standards imported</span>
            </div>
          </div>

          <div className="bg-surface-secondary rounded-xl border border-border-secondary p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[rgb(var(--state-success-bg)/0.18)]">
                <Target className="w-4 h-4 text-[rgb(var(--state-success-fg))]" />
              </div>
              <div>
                <h4 className="font-medium text-text-primary">Next Generation Science Standards</h4>
                <p className="text-xs text-text-secondary">Science & Engineering</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-tertiary">
              <FileText className="w-4 h-4" />
              <span>342 standards imported</span>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-[rgb(var(--state-info-bg)/0.18)]">
              <Target className="w-5 h-5 text-[rgb(var(--state-info-fg))]" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Standards Alignment
              </h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                Import and manage learning standards from Common Core, NGSS, or state-specific
                frameworks. Link standards to courses and assessments for competency-based
                reporting and standards mastery tracking.
              </p>
              <ul className="text-sm text-text-secondary space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[rgb(var(--state-success-fg))]" />
                  <span>CASE-compliant standards import</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[rgb(var(--state-success-fg))]" />
                  <span>Hierarchical organization (domains, clusters, standards)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[rgb(var(--state-success-fg))]" />
                  <span>Student mastery tracking by standard</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StandardsModule
