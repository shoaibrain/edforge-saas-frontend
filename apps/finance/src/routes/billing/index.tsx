/**
 * Billing Module
 *
 * Student billing and payment management for the Finance domain.
 * Handles tuition, fees, payment plans, and family account management.
 */

import { CreditCard, FileText, Clock, DollarSign, Send, Settings, Users, CheckCircle } from 'lucide-react'

export function BillingModule() {
  return (
    <div className="min-h-full">
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                <CreditCard className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Student Billing</h1>
                <p className="text-text-secondary mt-1">
                  Generate invoices, process payments, and manage family accounts
                </p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors">
              <Send className="w-4 h-4" />
              <span>Send Invoices</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={FileText}
            label="Open Invoices"
            value="234"
            accent="text-blue-600 dark:text-blue-400"
            bg="bg-blue-500/10"
          />
          <StatCard
            icon={DollarSign}
            label="Outstanding"
            value="$89,450"
            accent="text-amber-600 dark:text-amber-400"
            bg="bg-amber-500/10"
          />
          <StatCard
            icon={CheckCircle}
            label="Collected (MTD)"
            value="$156,780"
            accent="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-500/10"
          />
          <StatCard
            icon={Clock}
            label="Overdue"
            value="18"
            accent="text-red-600 dark:text-red-400"
            bg="bg-red-500/10"
          />
        </div>

        {/* Product Description */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Comprehensive Billing System
              </h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                Generate invoices for tuition, fees, and services. Process online payments,
                manage payment plans, and send automated reminders to families. Supports
                multiple payment methods including credit cards, ACH, and payment plans.
              </p>
              <div className="flex items-center gap-2 text-sm text-text-tertiary">
                <Settings className="w-4 h-4" />
                <span>Configure fee structures and billing cycles in System Admin</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionCard
            icon={FileText}
            title="Generate Invoices"
            description="Create billing statements for selected students or families"
          />
          <ActionCard
            icon={Users}
            title="Family Accounts"
            description="View and manage individual family billing accounts"
          />
          <ActionCard
            icon={Clock}
            title="Payment Plans"
            description="Set up and monitor installment payment arrangements"
          />
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
  icon: typeof CreditCard
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

function ActionCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof CreditCard
  title: string
  description: string
}) {
  return (
    <div className="bg-surface-secondary rounded-xl border border-border-secondary p-5 hover:bg-surface-hover transition-colors cursor-pointer">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-emerald-500/10">
          <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h4 className="font-medium text-text-primary">{title}</h4>
      </div>
      <p className="text-sm text-text-secondary">{description}</p>
    </div>
  )
}

export default BillingModule

