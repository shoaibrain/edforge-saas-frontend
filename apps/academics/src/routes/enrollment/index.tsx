/**
 * Enrollment Module
 *
 * Student enrollment and registration workflow for the Academics domain.
 * Manages the complete enrollment lifecycle from application to matriculation.
 */

import { UserPlus, FileText, CheckCircle, Clock, Calendar, ArrowRight } from 'lucide-react'

export function EnrollmentModule() {
  return (
    <div className="min-h-full">
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
              <UserPlus className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Enrollment</h1>
              <p className="text-text-secondary mt-1">
                Student registration, enrollment processing, and matriculation workflows
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={FileText}
            label="Applications"
            value="47"
            accent="text-blue-600 dark:text-blue-400"
            bg="bg-blue-500/10"
          />
          <StatCard
            icon={Clock}
            label="Pending Review"
            value="12"
            accent="text-amber-600 dark:text-amber-400"
            bg="bg-amber-500/10"
          />
          <StatCard
            icon={CheckCircle}
            label="Approved"
            value="31"
            accent="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-500/10"
          />
          <StatCard
            icon={Calendar}
            label="Enrollment Period"
            value="Open"
            accent="text-purple-600 dark:text-purple-400"
            bg="bg-purple-500/10"
          />
        </div>

        {/* Product Description */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-purple-500/10">
              <UserPlus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Enrollment Pipeline
              </h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                Process new student applications through configurable enrollment workflows.
                Collect required documents, verify residency, assign to grade levels, and
                complete registration. Supports lottery enrollment and waitlist management.
              </p>
              <ul className="text-sm text-text-secondary space-y-1">
                <li>• Online application intake with document upload</li>
                <li>• Residency and eligibility verification</li>
                <li>• Lottery and waitlist automation</li>
                <li>• Transfer and re-enrollment processing</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Enrollment Workflow */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Enrollment Stages</h3>
          <div className="flex items-center justify-between">
            {['Application', 'Review', 'Documents', 'Approval', 'Enrolled'].map((stage, index) => (
              <div key={stage} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    index < 3 ? 'bg-emerald-500 text-white' : 'bg-surface-hover text-text-secondary'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="text-xs text-text-secondary mt-2">{stage}</span>
                </div>
                {index < 4 && (
                  <ArrowRight className="w-4 h-4 text-text-tertiary mx-3" />
                )}
              </div>
            ))}
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
  icon: typeof UserPlus
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

export default EnrollmentModule

