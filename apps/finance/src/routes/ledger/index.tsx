/**
 * General Ledger Module
 *
 * Unified accounting interface for the Finance domain.
 * This consolidated view brings together all accounting-related functionality:
 * - General Ledger: Chart of accounts and journal entries
 * - Accounts Payable: Vendor invoices and payments
 * - Accounts Receivable: Customer invoices and collections
 *
 * Design Philosophy:
 * While day-to-day users interact with Billing and Expenses,
 * the Ledger provides the accounting backbone for financial reporting.
 * This view is optimized for accountants and financial administrators.
 */

import { useState } from 'react'
import {
  Landmark,
  ArrowDownCircle,
  ArrowUpCircle,
  FileText,
  Calculator,
  TrendingUp,
  Calendar,
  Settings,
  DollarSign,
  Scale,
} from 'lucide-react'

type LedgerTab = 'general-ledger' | 'accounts-payable' | 'accounts-receivable'

export function LedgerModule() {
  const [activeTab, setActiveTab] = useState<LedgerTab>('general-ledger')

  const tabs = [
    {
      id: 'general-ledger' as const,
      label: 'General Ledger',
      icon: Landmark,
      description: 'Chart of accounts and journal entries',
    },
    {
      id: 'accounts-payable' as const,
      label: 'Accounts Payable',
      icon: ArrowDownCircle,
      description: 'Vendor invoices and payments',
    },
    {
      id: 'accounts-receivable' as const,
      label: 'Accounts Receivable',
      icon: ArrowUpCircle,
      description: 'Customer invoices and collections',
    },
  ]

  return (
    <div className="min-h-full">
      {/* Page Header */}
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
              <Landmark className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                General Ledger
              </h1>
              <p className="text-text-secondary mt-1">
                Double-entry accounting with chart of accounts, journal entries, and trial balance
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <nav className="flex gap-1" aria-label="Ledger tabs">
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
        {activeTab === 'general-ledger' && <GeneralLedgerContent />}
        {activeTab === 'accounts-payable' && <AccountsPayableContent />}
        {activeTab === 'accounts-receivable' && <AccountsReceivableContent />}
      </div>
    </div>
  )
}

function GeneralLedgerContent() {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="Chart of Accounts"
          value="147"
          accent="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <StatCard
          icon={Calculator}
          label="Journal Entries (MTD)"
          value="342"
          accent="text-blue-600 dark:text-blue-400"
          bg="bg-blue-500/10"
        />
        <StatCard
          icon={Scale}
          label="Trial Balance"
          value="Balanced"
          accent="text-green-600 dark:text-green-400"
          bg="bg-green-500/10"
        />
        <StatCard
          icon={Calendar}
          label="Fiscal Period"
          value="FY24 Q2"
          accent="text-purple-600 dark:text-purple-400"
          bg="bg-purple-500/10"
        />
      </div>

      {/* Product Description Card */}
      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-emerald-500/10">
            <Landmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Double-Entry Accounting
            </h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Maintain a complete chart of accounts following GAAP/GASB standards for educational 
              institutions. Create journal entries, view account balances, and generate trial 
              balances for period-end close. All entries maintain full audit trails.
            </p>
            <div className="flex items-center gap-2 text-sm text-text-tertiary">
              <Settings className="w-4 h-4" />
              <span>Configure fiscal years and accounting periods in System Admin → Schools</span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Categories Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { name: 'Assets', count: 32, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
          { name: 'Liabilities', count: 18, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
          { name: 'Equity', count: 12, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' },
          { name: 'Revenue', count: 45, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
          { name: 'Expenses', count: 40, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
        ].map((category) => (
          <div
            key={category.name}
            className="bg-surface-secondary rounded-lg border border-border-secondary p-4 hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <div className={`text-sm font-medium ${category.color} mb-1`}>{category.name}</div>
            <div className="text-xl font-semibold text-text-primary">{category.count} accounts</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AccountsPayableContent() {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="Open Invoices"
          value="23"
          accent="text-amber-600 dark:text-amber-400"
          bg="bg-amber-500/10"
        />
        <StatCard
          icon={DollarSign}
          label="Total Payable"
          value="$47,250"
          accent="text-red-600 dark:text-red-400"
          bg="bg-red-500/10"
        />
        <StatCard
          icon={Calendar}
          label="Due This Week"
          value="8"
          accent="text-orange-600 dark:text-orange-400"
          bg="bg-orange-500/10"
        />
        <StatCard
          icon={TrendingUp}
          label="Aging 30+ Days"
          value="$12,400"
          accent="text-purple-600 dark:text-purple-400"
          bg="bg-purple-500/10"
        />
      </div>

      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-amber-500/10">
            <ArrowDownCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Vendor Invoice Management
            </h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Track vendor invoices from receipt to payment. Generate aging reports, 
              schedule payment runs, and maintain vendor relationships. Integrates with 
              Expenses for purchase order matching and approval workflows.
            </p>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>• Invoice capture and approval workflows</li>
              <li>• Three-way matching (PO, receipt, invoice)</li>
              <li>• Payment scheduling and check runs</li>
              <li>• Vendor 1099 tracking and reporting</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-8 text-center">
        <ArrowDownCircle className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
        <h4 className="text-lg font-medium text-text-primary mb-2">
          Invoice Queue
        </h4>
        <p className="text-text-secondary max-w-md mx-auto">
          View and process pending vendor invoices. Filter by due date, vendor, 
          or approval status to prioritize payments.
        </p>
      </div>
    </div>
  )
}

function AccountsReceivableContent() {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="Outstanding"
          value="156"
          accent="text-blue-600 dark:text-blue-400"
          bg="bg-blue-500/10"
        />
        <StatCard
          icon={DollarSign}
          label="Total Receivable"
          value="$234,500"
          accent="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <StatCard
          icon={Calendar}
          label="Overdue"
          value="12"
          accent="text-red-600 dark:text-red-400"
          bg="bg-red-500/10"
        />
        <StatCard
          icon={TrendingUp}
          label="Collected MTD"
          value="$89,750"
          accent="text-purple-600 dark:text-purple-400"
          bg="bg-purple-500/10"
        />
      </div>

      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-emerald-500/10">
            <ArrowUpCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Collections & Aging
            </h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Monitor outstanding balances from student billing and other receivables. 
              Generate aging reports, send automated reminders, and track payment 
              history. Integrates with the Billing module for seamless invoice generation.
            </p>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>• Aging buckets (Current, 30, 60, 90+ days)</li>
              <li>• Automated payment reminders</li>
              <li>• Payment plan tracking</li>
              <li>• Bad debt write-off workflows</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-8 text-center">
        <ArrowUpCircle className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
        <h4 className="text-lg font-medium text-text-primary mb-2">
          Aging Report
        </h4>
        <p className="text-text-secondary max-w-md mx-auto">
          View outstanding balances by aging bucket. Click a family account 
          to see detailed transaction history and send payment reminders.
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
  icon: typeof Landmark
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

export default LedgerModule

