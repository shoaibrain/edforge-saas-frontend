/**
 * Special Programs Overview Page
 * 
 * Main landing page for the Special Programs module.
 * Uses ModuleOverviewPage for consistent, customizable layout.
 */

import {
    ShieldCheck,
    FileText,
    Calendar,
    TrendingUp,
    Users,
    Settings,
    Zap,
} from 'lucide-react'
import { ModuleOverviewPage, type ModuleStat, type ModuleActionCard } from '../components/ModuleOverviewPage'

export function Overview() {
    // Stats for the special programs module
    const stats: ModuleStat[] = [
        {
            label: 'Active IEPs',
            value: '127',
            change: '+8',
            changeType: 'positive',
            icon: FileText,
            iconBg: 'bg-[rgb(var(--state-info-bg)/0.18)]',
            iconColor: 'text-[rgb(var(--state-info-fg))]',
        },
        {
            label: '504 Plans',
            value: '84',
            change: '+3',
            changeType: 'positive',
            icon: ShieldCheck,
            iconBg: 'bg-[rgb(var(--state-info-bg)/0.18)]',
            iconColor: 'text-[rgb(var(--state-info-fg))]',
        },
        {
            label: 'Upcoming Meetings',
            value: '12',
            change: 'This week',
            changeType: 'neutral',
            icon: Calendar,
            iconBg: 'bg-[rgb(var(--state-info-bg)/0.18)]',
            iconColor: 'text-[rgb(var(--state-info-fg))]',
        },
        {
            label: 'Goal Progress',
            value: '78%',
            change: '+5%',
            changeType: 'positive',
            icon: TrendingUp,
            iconBg: 'bg-[rgb(var(--state-success-bg)/0.18)]',
            iconColor: 'text-[rgb(var(--state-success-fg))]',
        },
    ]

    // Action cards linking to sub-routes
    const actionCards: ModuleActionCard[] = [
        {
            id: 'ieps',
            title: 'IEPs',
            description: 'Manage Individualized Education Programs',
            icon: FileText,
            href: '/special-programs/ieps',
            iconBg: 'bg-[rgb(var(--state-info-bg)/0.18)] group-hover:bg-[rgb(var(--state-info-bg)/0.26)]',
            iconColor: 'text-[rgb(var(--state-info-fg))]',
        },
        {
            id: 'iep-meetings',
            title: 'IEP Meetings',
            description: 'Schedule and manage IEP meetings',
            icon: Calendar,
            href: '/special-programs/ieps/meetings',
            iconBg: 'bg-[rgb(var(--state-info-bg)/0.18)] group-hover:bg-[rgb(var(--state-info-bg)/0.26)]',
            iconColor: 'text-[rgb(var(--state-info-fg))]',
        },
        {
            id: 'iep-goals',
            title: 'Goals & Objectives',
            description: 'Track IEP goals and progress',
            icon: TrendingUp,
            href: '/special-programs/ieps/goals',
            iconBg: 'bg-[rgb(var(--state-success-bg)/0.18)] group-hover:bg-[rgb(var(--state-success-bg)/0.26)]',
            iconColor: 'text-[rgb(var(--state-success-fg))]',
        },
        {
            id: '504-plans',
            title: '504 Plans',
            description: 'Manage Section 504 accommodation plans',
            icon: ShieldCheck,
            href: '/special-programs/504-plans',
            iconBg: 'bg-[rgb(var(--state-info-bg)/0.18)] group-hover:bg-[rgb(var(--state-info-bg)/0.26)]',
            iconColor: 'text-[rgb(var(--state-info-fg))]',
        },
        {
            id: 'accommodations',
            title: 'Accommodations',
            description: 'Configure student accommodations',
            icon: Settings,
            href: '/special-programs/accommodations',
            iconBg: 'bg-[rgb(var(--surface-tertiary))] group-hover:bg-[rgb(var(--interactive-hover))]',
            iconColor: 'text-[rgb(var(--text-secondary))]',
        },
        {
            id: 'accessibility',
            title: 'Accessibility Services',
            description: 'Manage accessibility support services',
            icon: Zap,
            href: '/special-programs/accessibility',
            iconBg: 'bg-amber-400/20 group-hover:bg-amber-400/30',
            iconColor: 'text-amber-600 dark:text-amber-400',
        },
        {
            id: 'counseling',
            title: 'Counseling',
            description: 'Student counseling services',
            icon: Users,
            href: '/special-programs/counseling',
            iconBg: 'bg-[rgb(var(--state-danger-bg)/0.18)] group-hover:bg-[rgb(var(--state-danger-bg)/0.26)]',
            iconColor: 'text-[rgb(var(--state-danger-fg))]',
        },
        {
            id: 'interventions',
            title: 'Interventions',
            description: 'RTI and intervention tracking',
            icon: TrendingUp,
            href: '/special-programs/interventions',
            iconBg: 'bg-[rgb(var(--state-info-bg)/0.18)] group-hover:bg-[rgb(var(--state-info-bg)/0.26)]',
            iconColor: 'text-[rgb(var(--state-info-fg))]',
        },
    ]

    return (
        <ModuleOverviewPage
            moduleId="special-programs"
            title="Special Programs"
            description="Manage IEPs, 504 plans, accommodations, and support services"
            icon={ShieldCheck}
            stats={stats}
            actionCards={actionCards}
        />
    )
}

