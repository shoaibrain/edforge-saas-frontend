/**
 * HR Administration Module
 *
 * Unified human resources interface for the People domain.
 * This consolidated view brings together sensitive HR functionality:
 * - Compensation: Payroll processing and contract management
 * - Development: Professional development and certifications
 * - Performance: Employee reviews and goal tracking
 *
 * Design Philosophy:
 * HR data is sensitive and requires careful access control.
 * This consolidated view groups related functions while
 * maintaining clear separation for audit compliance.
 */

import { useState } from 'react'
import {
  BriefcaseBusiness,
  DollarSign,
  FileText,
  GraduationCap,
  Award,
  Calendar,
  Users,
  TrendingUp,
  Settings,
  Shield,
  Clock,
  Target,
} from 'lucide-react'

type HRTab = 'compensation' | 'development' | 'performance'

export function HRAdminModule() {
  const [activeTab, setActiveTab] = useState<HRTab>('compensation')

  const tabs = [
    {
      id: 'compensation' as const,
      label: 'Compensation',
      icon: DollarSign,
      description: 'Payroll and contracts',
    },
    {
      id: 'development' as const,
      label: 'Development',
      icon: GraduationCap,
      description: 'Training and certifications',
    },
    {
      id: 'performance' as const,
      label: 'Performance',
      icon: TrendingUp,
      description: 'Reviews and goals',
    },
  ]

  return (
    <div className="min-h-full">
      {/* Page Header */}
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
              <BriefcaseBusiness className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                HR Administration
              </h1>
              <p className="text-text-secondary mt-1">
                Manage compensation, professional development, and performance evaluations
              </p>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-4 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg w-fit">
            <Shield className="w-3.5 h-3.5" />
            <span>Sensitive HR data. Access logged for compliance.</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <nav className="flex gap-1" aria-label="HR tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg
                  transition-colors duration-150
                  ${
                    activeTab === tab.id
                      ? 'bg-surface-primary text-text-primary border-t border-x border-border-secondary -mb-px'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }
                `}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'compensation' && <CompensationContent />}
        {activeTab === 'development' && <DevelopmentContent />}
        {activeTab === 'performance' && <PerformanceContent />}
      </div>
    </div>
  )
}

function CompensationContent() {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Active Employees"
          value="156"
          accent="text-blue-600 dark:text-blue-400"
          bg="bg-blue-500/10"
        />
        <StatCard
          icon={DollarSign}
          label="Monthly Payroll"
          value="$487K"
          accent="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <StatCard
          icon={FileText}
          label="Active Contracts"
          value="142"
          accent="text-purple-600 dark:text-purple-400"
          bg="bg-purple-500/10"
        />
        <StatCard
          icon={Calendar}
          label="Next Payroll"
          value="Jan 15"
          accent="text-amber-600 dark:text-amber-400"
          bg="bg-amber-500/10"
        />
      </div>

      {/* Product Description Card */}
      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-emerald-500/10">
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Payroll & Contracts
            </h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Process payroll, manage employment contracts, and track compensation changes.
              Supports multiple pay schedules, tax withholding calculations, and direct deposit.
              All payroll data syncs with the Finance module's general ledger.
            </p>
            <div className="flex items-center gap-2 text-sm text-text-tertiary">
              <Settings className="w-4 h-4" />
              <span>Configure pay schedules and tax tables in System Admin → Schools</span>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder */}
      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-8 text-center">
        <DollarSign className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
        <h4 className="text-lg font-medium text-text-primary mb-2">
          Payroll Dashboard
        </h4>
        <p className="text-text-secondary max-w-md mx-auto">
          View upcoming payroll runs, pending approvals, and compensation changes.
          Click "Run Payroll" to process the next pay period.
        </p>
      </div>
    </div>
  )
}

function DevelopmentContent() {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={GraduationCap}
          label="Training Courses"
          value="24"
          accent="text-blue-600 dark:text-blue-400"
          bg="bg-blue-500/10"
        />
        <StatCard
          icon={Award}
          label="Certifications"
          value="312"
          accent="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <StatCard
          icon={Clock}
          label="PD Hours (YTD)"
          value="1,847"
          accent="text-purple-600 dark:text-purple-400"
          bg="bg-purple-500/10"
        />
        <StatCard
          icon={Calendar}
          label="Expiring Soon"
          value="8"
          accent="text-amber-600 dark:text-amber-400"
          bg="bg-amber-500/10"
        />
      </div>

      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-blue-500/10">
            <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Professional Development
            </h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Track certifications, continuing education credits, and professional development hours.
              Set up training requirements by role and receive alerts when certifications are 
              expiring. Supports state licensure tracking for educators.
            </p>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>• Teaching license and endorsement tracking</li>
              <li>• Professional development hour logging</li>
              <li>• Course catalog and enrollment management</li>
              <li>• Certification expiration alerts</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-8 text-center">
        <Award className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
        <h4 className="text-lg font-medium text-text-primary mb-2">
          Certification Registry
        </h4>
        <p className="text-text-secondary max-w-md mx-auto">
          View all staff certifications organized by type and expiration date.
          Filter by department or role to identify compliance gaps.
        </p>
      </div>
    </div>
  )
}

function PerformanceContent() {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="Reviews Due"
          value="12"
          accent="text-amber-600 dark:text-amber-400"
          bg="bg-amber-500/10"
        />
        <StatCard
          icon={Target}
          label="Active Goals"
          value="234"
          accent="text-blue-600 dark:text-blue-400"
          bg="bg-blue-500/10"
        />
        <StatCard
          icon={TrendingUp}
          label="Completed Reviews"
          value="144"
          accent="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <StatCard
          icon={Calendar}
          label="Review Cycle"
          value="Annual"
          accent="text-purple-600 dark:text-purple-400"
          bg="bg-purple-500/10"
        />
      </div>

      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-purple-500/10">
            <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Performance Reviews
            </h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Conduct annual or periodic performance evaluations with customizable rubrics.
              Set professional goals, track progress, and maintain evaluation history.
              Supports 360-degree feedback and self-assessments.
            </p>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>• Customizable evaluation templates</li>
              <li>• Goal setting and progress tracking</li>
              <li>• Manager and self-assessment workflows</li>
              <li>• Historical performance trends</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-8 text-center">
        <TrendingUp className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
        <h4 className="text-lg font-medium text-text-primary mb-2">
          Evaluation Dashboard
        </h4>
        <p className="text-text-secondary max-w-md mx-auto">
          View pending evaluations, completed reviews, and aggregate performance metrics.
          Managers can initiate new review cycles from this dashboard.
        </p>
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
  icon: typeof BriefcaseBusiness
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

export default HRAdminModule

