/**
 * 504 Plans Module
 *
 * Section 504 accommodation plan management for the Special Programs domain.
 * Ensures ADA compliance and equal access for students with disabilities.
 */

import { ShieldCheck, Users, Calendar, FileText, CheckCircle, Clock, Plus } from 'lucide-react'

export function Plans504Module() {
  return (
    <div className="min-h-full">
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[rgb(var(--state-success-bg)/0.18)] to-[rgb(var(--state-success-bg)/0.10)]">
                <ShieldCheck className="w-6 h-6 text-[rgb(var(--state-success-fg))]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">504 Plans</h1>
                <p className="text-text-secondary mt-1">
                  Section 504 accommodation plans with implementation tracking and annual reviews
                </p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] rounded-lg hover:bg-[rgb(var(--action-primary-bg))]/90 transition-colors">
              <Plus className="w-4 h-4" />
              <span>New 504 Plan</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Active Plans"
            value="89"
            accent="text-[rgb(var(--state-success-fg))]"
            bg="bg-[rgb(var(--state-success-bg)/0.18)]"
          />
          <StatCard
            icon={Calendar}
            label="Reviews Due"
            value="8"
            accent="text-amber-600 dark:text-amber-400"
            bg="bg-amber-500/10"
          />
          <StatCard
            icon={CheckCircle}
            label="Implementation Rate"
            value="97%"
            accent="text-[rgb(var(--state-info-fg))]"
            bg="bg-[rgb(var(--state-info-bg)/0.18)]"
          />
          <StatCard
            icon={Clock}
            label="New This Term"
            value="12"
            accent="text-[rgb(var(--state-info-fg))]"
            bg="bg-[rgb(var(--state-info-bg)/0.18)]"
          />
        </div>

        {/* Product Description */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-[rgb(var(--state-success-bg)/0.18)]">
              <ShieldCheck className="w-5 h-5 text-[rgb(var(--state-success-fg))]" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Section 504 Compliance
              </h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                Create and manage Section 504 accommodation plans for students with disabilities
                who don't qualify for IDEA services but require accommodations for equal access.
                Track accommodation implementation and schedule annual eligibility reviews.
              </p>
              <ul className="text-sm text-text-secondary space-y-1">
                <li className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[rgb(var(--state-success-fg))]" />
                  <span>Eligibility determination and documentation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[rgb(var(--state-success-fg))]" />
                  <span>Accommodation plan creation and distribution</span>
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[rgb(var(--state-success-fg))]" />
                  <span>Annual review scheduling and compliance alerts</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Placeholder */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-8 text-center">
          <ShieldCheck className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <h4 className="text-lg font-medium text-text-primary mb-2">
            504 Plan Registry
          </h4>
          <p className="text-text-secondary max-w-md mx-auto">
            View all students with active 504 plans. Click a student to access
            their accommodation list and implementation status.
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
  icon: typeof ShieldCheck
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

