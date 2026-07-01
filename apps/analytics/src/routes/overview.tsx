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
    Wallet,
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
            iconBg: 'bg-[rgb(var(--state-info-bg)/0.18)]',
            iconColor: 'text-[rgb(var(--state-info-fg))]',
        },
        {
            label: 'Attendance Rate',
            value: '94.5%',
            change: '+1.2%',
            changeType: 'positive',
            icon: Calendar,
            iconBg: 'bg-[rgb(var(--state-info-bg)/0.18)]',
            iconColor: 'text-[rgb(var(--state-info-fg))]',
        },
        {
            label: 'Avg. GPA',
            value: '3.24',
            change: '+0.08',
            changeType: 'positive',
            icon: TrendingUp,
            iconBg: 'bg-[rgb(var(--state-success-bg)/0.18)]',
            iconColor: 'text-[rgb(var(--state-success-fg))]',
        },
        {
            label: 'Revenue MTD',
            value: '$1.2M',
            change: '+8.5%',
            changeType: 'positive',
            icon: Wallet,
            iconBg: 'bg-[rgb(var(--state-warning-bg)/0.18)]',
            iconColor: 'text-[rgb(var(--state-warning-fg))]',
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
            iconBg: 'bg-[rgb(var(--state-info-bg)/0.18)] group-hover:bg-[rgb(var(--state-info-bg)/0.26)]',
            iconColor: 'text-[rgb(var(--state-info-fg))]',
        },
        {
            id: 'attendance',
            title: 'Attendance Analytics',
            description: 'Attendance patterns and trends',
            icon: Calendar,
            href: '/analytics/attendance',
            iconBg: 'bg-[rgb(var(--state-info-bg)/0.18)] group-hover:bg-[rgb(var(--state-info-bg)/0.26)]',
            iconColor: 'text-[rgb(var(--state-info-fg))]',
        },
        {
            id: 'performance',
            title: 'Academic Performance',
            description: 'Grades and academic outcomes',
            icon: TrendingUp,
            href: '/analytics/performance',
            iconBg: 'bg-[rgb(var(--state-success-bg)/0.18)] group-hover:bg-[rgb(var(--state-success-bg)/0.26)]',
            iconColor: 'text-[rgb(var(--state-success-fg))]',
        },
        {
            id: 'finance',
            title: 'Financial Analytics',
            description: 'Revenue and expense analysis',
            icon: Wallet,
            href: '/analytics/finance',
            iconBg: 'bg-[rgb(var(--state-warning-bg)/0.18)] group-hover:bg-[rgb(var(--state-warning-bg)/0.26)]',
            iconColor: 'text-[rgb(var(--state-warning-fg))]',
        },
        {
            id: 'reports',
            title: 'Custom Reports',
            description: 'Build and export reports',
            icon: FileText,
            href: '/analytics/reports',
            iconBg: 'bg-[rgb(var(--state-danger-bg)/0.18)] group-hover:bg-[rgb(var(--state-danger-bg)/0.26)]',
            iconColor: 'text-[rgb(var(--state-danger-fg))]',
        },
        {
            id: 'dashboards',
            title: 'Dashboards',
            description: 'Custom analytics dashboards',
            icon: LayoutDashboard,
            href: '/analytics/dashboards',
            iconBg: 'bg-[rgb(var(--state-info-bg)/0.18)] group-hover:bg-[rgb(var(--state-info-bg)/0.26)]',
            iconColor: 'text-[rgb(var(--state-info-fg))]',
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

