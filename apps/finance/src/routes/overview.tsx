/**
 * Finance Overview Page
 * 
 * Main landing page for the Finance module.
 * Uses ModuleOverviewPage for consistent, customizable layout.
 */

import {
    DollarSign,
    CreditCard,
    Receipt,
    Landmark,
    TrendingUp,
    Layers,
    BarChart3,
} from 'lucide-react'
import { ModuleOverviewPage, type ModuleStat, type ModuleActionCard } from '../components/ModuleOverviewPage'

export function Overview() {
    // Stats for the finance module
    const stats: ModuleStat[] = [
        {
            label: 'Revenue (MTD)',
            value: '$125,890',
            change: '+12.3%',
            changeType: 'positive',
            icon: DollarSign,
            iconBg: 'bg-amber-500/15 dark:bg-amber-500/20',
            iconColor: 'text-amber-600 dark:text-amber-400',
        },
        {
            label: 'Outstanding',
            value: '$23,456',
            change: '-5.2%',
            changeType: 'negative',
            icon: CreditCard,
            iconBg: 'bg-rose-400/20',
            iconColor: 'text-rose-600 dark:text-rose-400',
        },
        {
            label: 'Collected',
            value: '$89,234',
            change: '+2.1%',
            changeType: 'positive',
            icon: TrendingUp,
            iconBg: 'bg-blue-400/20',
            iconColor: 'text-blue-600 dark:text-blue-400',
        },
        {
            label: 'Expenses (MTD)',
            value: '$34,567',
            change: '+8.7%',
            changeType: 'positive',
            icon: Receipt,
            iconBg: 'bg-purple-400/20',
            iconColor: 'text-purple-600 dark:text-purple-400',
        },
    ]

    // Action cards linking to sub-routes
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
            id: 'general-ledger',
            title: 'General Ledger',
            description: 'View and manage financial accounts',
            icon: Landmark,
            href: '/finance/ledger',
            iconBg: 'bg-amber-500/15 group-hover:bg-amber-500/25',
            iconColor: 'text-amber-600 dark:text-amber-400',
        },
        {
            id: 'dashboard',
            title: 'Financial Dashboard',
            description: 'Overview of school finances and metrics',
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
            href: '/settings/fee-structures',
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
