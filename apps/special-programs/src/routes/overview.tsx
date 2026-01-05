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
            iconBg: 'bg-indigo-500/15 dark:bg-indigo-500/20',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
        },
        {
            label: '504 Plans',
            value: '84',
            change: '+3',
            changeType: 'positive',
            icon: ShieldCheck,
            iconBg: 'bg-purple-400/20',
            iconColor: 'text-purple-600 dark:text-purple-400',
        },
        {
            label: 'Upcoming Meetings',
            value: '12',
            change: 'This week',
            changeType: 'neutral',
            icon: Calendar,
            iconBg: 'bg-blue-400/20',
            iconColor: 'text-blue-600 dark:text-blue-400',
        },
        {
            label: 'Goal Progress',
            value: '78%',
            change: '+5%',
            changeType: 'positive',
            icon: TrendingUp,
            iconBg: 'bg-emerald-400/20',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
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
            iconBg: 'bg-indigo-500/15 group-hover:bg-indigo-500/25',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
        },
        {
            id: 'iep-meetings',
            title: 'IEP Meetings',
            description: 'Schedule and manage IEP meetings',
            icon: Calendar,
            href: '/special-programs/ieps/meetings',
            iconBg: 'bg-blue-400/20 group-hover:bg-blue-400/30',
            iconColor: 'text-blue-600 dark:text-blue-400',
        },
        {
            id: 'iep-goals',
            title: 'Goals & Objectives',
            description: 'Track IEP goals and progress',
            icon: TrendingUp,
            href: '/special-programs/ieps/goals',
            iconBg: 'bg-emerald-400/20 group-hover:bg-emerald-400/30',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
        },
        {
            id: '504-plans',
            title: '504 Plans',
            description: 'Manage Section 504 accommodation plans',
            icon: ShieldCheck,
            href: '/special-programs/504-plans',
            iconBg: 'bg-purple-400/20 group-hover:bg-purple-400/30',
            iconColor: 'text-purple-600 dark:text-purple-400',
        },
        {
            id: 'accommodations',
            title: 'Accommodations',
            description: 'Configure student accommodations',
            icon: Settings,
            href: '/special-programs/accommodations',
            iconBg: 'bg-slate-400/20 group-hover:bg-slate-400/30',
            iconColor: 'text-slate-600 dark:text-slate-400',
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
            iconBg: 'bg-rose-400/20 group-hover:bg-rose-400/30',
            iconColor: 'text-rose-600 dark:text-rose-400',
        },
        {
            id: 'interventions',
            title: 'Interventions',
            description: 'RTI and intervention tracking',
            icon: TrendingUp,
            href: '/special-programs/interventions',
            iconBg: 'bg-cyan-400/20 group-hover:bg-cyan-400/30',
            iconColor: 'text-cyan-600 dark:text-cyan-400',
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

