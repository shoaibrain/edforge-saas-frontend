/**
 * Expenses Module
 *
 * Expense tracking and approval workflow for the Finance domain.
 * Handles purchase requests, expense reports, and budget monitoring.
 */

import { Receipt, DollarSign, Clock, CheckCircle, FileText, TrendingUp, AlertTriangle, Plus } from 'lucide-react'

export function ExpensesModule() {
  return (
    <div className="min-h-full">
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20">
                <Receipt className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Expense Management</h1>
                <p className="text-text-secondary mt-1">
                  Submit, approve, and track operational expenses by department
                </p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors">
              <Plus className="w-4 h-4" />
              <span>New Expense</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={Clock}
            label="Pending Approval"
            value="12"
            accent="text-amber-600 dark:text-amber-400"
            bg="bg-amber-500/10"
          />
          <StatCard
            icon={DollarSign}
            label="Submitted (MTD)"
            value="$34,567"
            accent="text-blue-600 dark:text-blue-400"
            bg="bg-blue-500/10"
          />
          <StatCard
            icon={CheckCircle}
            label="Approved (MTD)"
            value="$28,450"
            accent="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-500/10"
          />
          <StatCard
            icon={TrendingUp}
            label="Budget Used"
            value="67%"
            accent="text-purple-600 dark:text-purple-400"
            bg="bg-purple-500/10"
          />
        </div>

        {/* Product Description */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-orange-500/10">
              <Receipt className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Expense Workflow
              </h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                Submit and approve operational expenses with receipt attachment and
                budget code assignment. Monitor budget utilization by department or cost
                center. Generate expenditure reports for financial planning.
              </p>
              <ul className="text-sm text-text-secondary space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Multi-level approval workflows</span>
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span>Receipt capture and document storage</span>
                </li>
                <li className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-emerald-500" />
                  <span>Budget threshold alerts and notifications</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionCard
            icon={Clock}
            title="Pending Approvals"
            description="Review and approve submitted expense requests"
          />
          <ActionCard
            icon={FileText}
            title="Expense Reports"
            description="Generate reports by date range or department"
          />
          <ActionCard
            icon={TrendingUp}
            title="Budget Status"
            description="View budget utilization across cost centers"
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
  icon: typeof Receipt
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
  icon: typeof Receipt
  title: string
  description: string
}) {
  return (
    <div className="bg-surface-secondary rounded-xl border border-border-secondary p-5 hover:bg-surface-hover transition-colors cursor-pointer">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-orange-500/10">
          <Icon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
        </div>
        <h4 className="font-medium text-text-primary">{title}</h4>
      </div>
      <p className="text-sm text-text-secondary">{description}</p>
    </div>
  )
}

export default ExpensesModule

