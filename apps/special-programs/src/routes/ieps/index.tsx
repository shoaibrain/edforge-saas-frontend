/**
 * IEPs Module
 *
 * Individualized Education Program management for the Special Programs domain.
 * Core compliance functionality for IDEA requirements.
 */

import { FileText, Users, Calendar, Target, Clock, CheckCircle, AlertTriangle, Plus } from 'lucide-react'

export function IEPsModule() {
  return (
    <div className="min-h-full">
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Individualized Education Programs</h1>
                <p className="text-text-secondary mt-1">
                  IDEA-compliant IEP management with goal tracking, service logs, and compliance monitoring
                </p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors">
              <Plus className="w-4 h-4" />
              <span>New IEP</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Active IEPs"
            value="147"
            accent="text-blue-600 dark:text-blue-400"
            bg="bg-blue-500/10"
          />
          <StatCard
            icon={Calendar}
            label="Annual Reviews Due"
            value="12"
            accent="text-amber-600 dark:text-amber-400"
            bg="bg-amber-500/10"
          />
          <StatCard
            icon={Target}
            label="Goals On Track"
            value="89%"
            accent="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-500/10"
          />
          <StatCard
            icon={AlertTriangle}
            label="Compliance Alerts"
            value="3"
            accent="text-red-600 dark:text-red-400"
            bg="bg-red-500/10"
          />
        </div>

        {/* Product Description */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                IDEA Compliance Management
              </h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                Create and manage Individualized Education Programs with full compliance tracking
                for IDEA requirements. Monitor goal progress, log service delivery, and schedule
                annual reviews. Automated alerts ensure timely evaluations and plan renewals.
              </p>
              <ul className="text-sm text-text-secondary space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Present levels, goals, and accommodations management</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <span>Service delivery tracking and progress monitoring</span>
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  <span>Annual review and triennial evaluation scheduling</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Placeholder */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-8 text-center">
          <FileText className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <h4 className="text-lg font-medium text-text-primary mb-2">
            IEP Roster
          </h4>
          <p className="text-text-secondary max-w-md mx-auto">
            View all students with active IEPs. Click a student to access their
            complete IEP document, service logs, and progress reports.
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
  icon: typeof FileText
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

