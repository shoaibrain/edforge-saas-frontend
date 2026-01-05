/**
 * Counseling Module
 *
 * School counseling case management for the Special Programs domain.
 * Session notes, intervention tracking, and referral workflows.
 */

import { Users, FileText, Calendar, MessageCircle, Clock, Shield, TrendingUp, Plus } from 'lucide-react'

export function CounselingModule() {
  return (
    <div className="min-h-full">
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20">
                <Users className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">School Counseling</h1>
                <p className="text-text-secondary mt-1">
                  Case management with session notes, intervention tracking, and referral workflows
                </p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors">
              <Plus className="w-4 h-4" />
              <span>New Session</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Active Cases"
            value="67"
            accent="text-teal-600 dark:text-teal-400"
            bg="bg-teal-500/10"
          />
          <StatCard
            icon={Calendar}
            label="Sessions Today"
            value="8"
            accent="text-blue-600 dark:text-blue-400"
            bg="bg-blue-500/10"
          />
          <StatCard
            icon={MessageCircle}
            label="Sessions (MTD)"
            value="156"
            accent="text-purple-600 dark:text-purple-400"
            bg="bg-purple-500/10"
          />
          <StatCard
            icon={TrendingUp}
            label="Referrals"
            value="12"
            accent="text-amber-600 dark:text-amber-400"
            bg="bg-amber-500/10"
          />
        </div>

        {/* Security Notice */}
        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg w-fit">
          <Shield className="w-3.5 h-3.5" />
          <span>Confidential student records. Access logged for FERPA compliance.</span>
        </div>

        {/* Product Description */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-teal-500/10">
              <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Case Management
              </h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                Manage student counseling cases with confidential session notes,
                intervention tracking, and external referral workflows. Schedule
                individual and group sessions, track academic and social-emotional
                progress, and coordinate with teachers and families.
              </p>
              <ul className="text-sm text-text-secondary space-y-1">
                <li className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-500" />
                  <span>Confidential session documentation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-500" />
                  <span>Appointment scheduling and reminders</span>
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-500" />
                  <span>Crisis intervention protocols and tracking</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Placeholder */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-8 text-center">
          <Users className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <h4 className="text-lg font-medium text-text-primary mb-2">
            Counseling Caseload
          </h4>
          <p className="text-text-secondary max-w-md mx-auto">
            View your active counseling caseload. Click a student to access
            session history, intervention logs, and referral information.
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

