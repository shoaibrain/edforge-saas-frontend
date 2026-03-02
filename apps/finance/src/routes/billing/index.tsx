/**
 * Billing Overview Page
 *
 * Landing page for the Billing section showing real KPI stats
 * and action cards linking to invoices, payments, and accounts.
 * Route: /finance/billing
 */

import { motion } from 'framer-motion'
import { useNavigate } from '@tanstack/react-router'
import {
  CreditCard,
  FileText,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Receipt,
  Users,
  Loader2,
  Banknote,
} from 'lucide-react'
import { useAppStore } from '../../stores/app.store'
import { useDashboardSummary } from '@edforge/finance-services'

function formatNPR(amount: number): string {
  return `NPR ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatNPRShort(amount: number): string {
  if (amount >= 10_00_000) {
    return `NPR ${(amount / 10_00_000).toFixed(1)}M`
  }
  if (amount >= 1_00_000) {
    return `NPR ${(amount / 1_00_000).toFixed(1)}L`
  }
  return formatNPR(amount)
}

export function BillingModule() {
  const navigate = useNavigate()
  const schoolId = useAppStore((s) => s.activeSchoolId)
  const { data: summary, isLoading } = useDashboardSummary(schoolId ?? '')

  if (!schoolId) {
    return (
      <div className="p-6 text-center text-sm text-[rgb(var(--text-tertiary))]">
        Select a school to view billing.
      </div>
    )
  }

  return (
    <div className="min-h-full">
      <div className="border-b border-[rgb(var(--border-secondary))] bg-[rgb(var(--surface-secondary))]/50">
        <div className="px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
              <CreditCard className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Student Billing</h1>
              <p className="text-[rgb(var(--text-secondary))] mt-1">
                Generate invoices, process payments, and manage student accounts
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI Stats */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
          </div>
        ) : summary ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <StatCard
              icon={DollarSign}
              label="Total Invoiced"
              value={formatNPRShort(summary.totalInvoiced)}
              accent="text-blue-600 dark:text-blue-400"
              bg="bg-blue-500/10"
            />
            <StatCard
              icon={TrendingUp}
              label="Collected"
              value={formatNPRShort(summary.totalCollected)}
              accent="text-emerald-600 dark:text-emerald-400"
              bg="bg-emerald-500/10"
            />
            <StatCard
              icon={Receipt}
              label="Outstanding"
              value={formatNPRShort(summary.outstanding)}
              accent="text-amber-600 dark:text-amber-400"
              bg="bg-amber-500/10"
            />
            <StatCard
              icon={AlertTriangle}
              label="Overdue"
              value={formatNPRShort(summary.overdue)}
              accent="text-red-600 dark:text-red-400"
              bg="bg-red-500/10"
            />
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard icon={DollarSign} label="Total Invoiced" value="--" accent="text-blue-600 dark:text-blue-400" bg="bg-blue-500/10" />
            <StatCard icon={TrendingUp} label="Collected" value="--" accent="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-500/10" />
            <StatCard icon={Receipt} label="Outstanding" value="--" accent="text-amber-600 dark:text-amber-400" bg="bg-amber-500/10" />
            <StatCard icon={AlertTriangle} label="Overdue" value="--" accent="text-red-600 dark:text-red-400" bg="bg-red-500/10" />
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionCard
            icon={FileText}
            title="Invoices"
            description="Generate, issue, and manage student invoices"
            onClick={() => navigate({ to: '/finance/billing/invoices' as string })}
          />
          <ActionCard
            icon={CreditCard}
            title="Payments"
            description="View and manage all payment transactions"
            onClick={() => navigate({ to: '/finance/billing/payments' as string })}
          />
          <ActionCard
            icon={Users}
            title="Student Accounts"
            description="View student billing accounts and ledger"
            onClick={() => navigate({ to: '/finance/billing/accounts' as string })}
          />
          <ActionCard
            icon={Banknote}
            title="Record Payment"
            description="Manually record cash, bank, or cheque payments"
            onClick={() => navigate({ to: '/finance/billing/payments/record' as string })}
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
    <div className="bg-[rgb(var(--surface-secondary))] rounded-xl border border-[rgb(var(--border-secondary))] p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`w-4 h-4 ${accent}`} />
        </div>
        <div>
          <p className="text-sm text-[rgb(var(--text-secondary))]">{label}</p>
          <p className="text-xl font-semibold text-[rgb(var(--text-primary))]">{value}</p>
        </div>
      </div>
    </div>
  )
}

function ActionCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: typeof CreditCard
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-[rgb(var(--surface-secondary))] rounded-xl border border-[rgb(var(--border-secondary))] p-5 hover:bg-[rgb(var(--surface-hover))] transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-emerald-500/10">
          <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h4 className="font-medium text-[rgb(var(--text-primary))]">{title}</h4>
      </div>
      <p className="text-sm text-[rgb(var(--text-secondary))]">{description}</p>
    </button>
  )
}

export default BillingModule
