/**
 * Analytics Overview Page
 * 
 * Main landing page for the Analytics module.
 * Uses ModuleOverviewPage for consistent, customizable layout.
 */

import {
    BarChart3,
    Users,
    TrendingUp,
    DollarSign,
    FileText,
    LayoutDashboard,
    Calendar,
} from 'lucide-react'
import { ModuleOverviewPage, type ModuleStat, type ModuleActionCard } from '../components/ModuleOverviewPage'

export function Overview() {
    // Stats for the analytics module
    const stats: ModuleStat[] = [
        {
            label: 'Total Enrollment',
            value: '2,847',
            change: '+12%',
            changeType: 'positive',
            icon: Users,
            iconBg: 'bg-violet-500/15 dark:bg-violet-500/20',
            iconColor: 'text-violet-600 dark:text-violet-400',
        },
        {
            label: 'Attendance Rate',
            value: '94.5%',
            change: '+1.2%',
            changeType: 'positive',
            icon: Calendar,
            iconBg: 'bg-blue-400/20',
            iconColor: 'text-blue-600 dark:text-blue-400',
        },
        {
            label: 'Avg. GPA',
            value: '3.24',
            change: '+0.08',
            changeType: 'positive',
            icon: TrendingUp,
            iconBg: 'bg-emerald-400/20',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
        },
        {
            label: 'Revenue MTD',
            value: '$1.2M',
            change: '+8.5%',
            changeType: 'positive',
            icon: DollarSign,
            iconBg: 'bg-amber-400/20',
            iconColor: 'text-amber-600 dark:text-amber-400',
        },
    ]

    // Action cards linking to sub-routes
    const actionCards: ModuleActionCard[] = [
        {
            id: 'enrollment',
            title: 'Enrollment Analytics',
            description: 'Enrollment trends and projections',
            icon: Users,
            href: '/analytics/enrollment',
            iconBg: 'bg-violet-500/15 group-hover:bg-violet-500/25',
            iconColor: 'text-violet-600 dark:text-violet-400',
        },
        {
            id: 'attendance',
            title: 'Attendance Analytics',
            description: 'Attendance patterns and trends',
            icon: Calendar,
            href: '/analytics/attendance',
            iconBg: 'bg-blue-400/20 group-hover:bg-blue-400/30',
            iconColor: 'text-blue-600 dark:text-blue-400',
        },
        {
            id: 'performance',
            title: 'Academic Performance',
            description: 'Grades and academic outcomes',
            icon: TrendingUp,
            href: '/analytics/performance',
            iconBg: 'bg-emerald-400/20 group-hover:bg-emerald-400/30',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
        },
        {
            id: 'finance',
            title: 'Financial Analytics',
            description: 'Revenue and expense analysis',
            icon: DollarSign,
            href: '/analytics/finance',
            iconBg: 'bg-amber-400/20 group-hover:bg-amber-400/30',
            iconColor: 'text-amber-600 dark:text-amber-400',
        },
        {
            id: 'reports',
            title: 'Custom Reports',
            description: 'Build and export reports',
            icon: FileText,
            href: '/analytics/reports',
            iconBg: 'bg-rose-400/20 group-hover:bg-rose-400/30',
            iconColor: 'text-rose-600 dark:text-rose-400',
        },
        {
            id: 'dashboards',
            title: 'Dashboards',
            description: 'Custom analytics dashboards',
            icon: LayoutDashboard,
            href: '/analytics/dashboards',
            iconBg: 'bg-cyan-400/20 group-hover:bg-cyan-400/30',
            iconColor: 'text-cyan-600 dark:text-cyan-400',
        },
    ]

    return (
        <ModuleOverviewPage
            moduleId="analytics"
            title="Analytics"
            description="Insights, reports, and data visualization for informed decisions"
            icon={BarChart3}
            stats={stats}
            actionCards={actionCards}
        />
    )
}

