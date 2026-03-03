/**
 * Finance Overview Page
 *
 * Main landing page for the Finance module.
 * Uses ModuleOverviewPage for consistent, customizable layout.
 * Fetches real dashboard metrics from the Finance API.
 */

import {
    DollarSign,
    CreditCard,
    TrendingUp,
    AlertTriangle,
    Users,
    BarChart3,
    Layers,
    Loader2,
} from 'lucide-react'
import { ModuleOverviewPage, type ModuleStat, type ModuleActionCard } from '../components/ModuleOverviewPage'
import { useAppStore } from '../stores/app.store'
import { useDashboardSummary } from '@edforge/finance-services'
import { formatNPRShort } from '@edforge/types'

export function Overview() {
    const schoolId = useAppStore((s) => s.activeSchoolId)
    const { data: summary, isLoading } = useDashboardSummary(schoolId ?? '')

    if (!schoolId) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <DollarSign className="w-12 h-12 mx-auto text-[rgb(var(--text-tertiary))] mb-4" />
                    <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-1">Select a School</h2>
                    <p className="text-sm text-[rgb(var(--text-tertiary))]">
                        Choose a school from the top navigation to view financial data.
                    </p>
                </div>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
            </div>
        )
    }

    const stats: ModuleStat[] = summary
        ? [
              {
                  label: 'Total Collected',
                  value: formatNPRShort(summary.totalCollected),
                  change: `${summary.collectionRate}% collected`,
                  changeType: summary.collectionRate >= 50 ? 'positive' : 'negative',
                  icon: DollarSign,
                  iconBg: 'bg-amber-500/15 dark:bg-amber-500/20',
                  iconColor: 'text-amber-600 dark:text-amber-400',
              },
              {
                  label: 'Outstanding',
                  value: formatNPRShort(summary.outstanding),
                  changeType: 'neutral',
                  icon: CreditCard,
                  iconBg: 'bg-rose-400/20',
                  iconColor: 'text-rose-600 dark:text-rose-400',
              },
              {
                  label: 'Total Invoiced',
                  value: formatNPRShort(summary.totalInvoiced),
                  changeType: 'neutral',
                  icon: TrendingUp,
                  iconBg: 'bg-blue-400/20',
                  iconColor: 'text-blue-600 dark:text-blue-400',
              },
              {
                  label: 'Overdue',
                  value: formatNPRShort(summary.overdue),
                  changeType: summary.overdue > 0 ? 'negative' : 'positive',
                  icon: AlertTriangle,
                  iconBg: 'bg-red-400/20',
                  iconColor: 'text-red-600 dark:text-red-400',
              },
          ]
        : []

    const actionCards: ModuleActionCard[] = [
        {
            id: 'billing',
            title: 'Billing',
            description: 'Manage student invoices and payments',
            icon: CreditCard,
            href: '/finance/billing',
            iconBg: 'bg-emerald-400/20 group-hover:bg-emerald-400/30',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
        },
        {
            id: 'student-accounts',
            title: 'Student Accounts',
            description: 'View student billing accounts and ledger',
            icon: Users,
            href: '/finance/billing/accounts',
            iconBg: 'bg-amber-500/15 group-hover:bg-amber-500/25',
            iconColor: 'text-amber-600 dark:text-amber-400',
        },
        {
            id: 'reports',
            title: 'Financial Reports',
            description: 'View financial metrics and breakdowns',
            icon: BarChart3,
            href: '/finance/dashboard',
            iconBg: 'bg-cyan-400/20 group-hover:bg-cyan-400/30',
            iconColor: 'text-cyan-600 dark:text-cyan-400',
        },
        {
            id: 'fee-structures',
            title: 'Fee Structures',
            description: 'Configure pricing and fee schedules',
            icon: Layers,
            href: '/finance/configuration/fee-structures',
            iconBg: 'bg-blue-400/20 group-hover:bg-blue-400/30',
            iconColor: 'text-blue-600 dark:text-blue-400',
        },
    ]

    return (
        <ModuleOverviewPage
            moduleId="finance"
            title="Finance"
            description="Manage billing, payments, and financial operations"
            icon={DollarSign}
            stats={stats}
            actionCards={actionCards}
        />
    )
}
