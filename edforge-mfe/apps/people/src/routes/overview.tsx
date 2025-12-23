/**
 * People Overview Page
 * 
 * Main landing page for the People module.
 * Uses ModuleOverviewPage for consistent, customizable layout.
 */

import {
    Users,
    UserCircle,
    Briefcase,
    UserPlus,
    Building,
    Shield,
    UserCog,
    TrendingUp,
} from 'lucide-react'
import { ModuleOverviewPage, type ModuleStat, type ModuleActionCard } from '../components/ModuleOverviewPage'

export function Overview() {
    // Stats for the people module
    const stats: ModuleStat[] = [
        {
            label: 'Total Staff',
            value: '342',
            change: '+8',
            changeType: 'positive',
            icon: Users,
            iconBg: 'bg-blue-500/15 dark:bg-blue-500/20',
            iconColor: 'text-blue-600 dark:text-blue-400',
        },
        {
            label: 'Active Teachers',
            value: '186',
            change: '+3',
            changeType: 'positive',
            icon: UserCircle,
            iconBg: 'bg-indigo-400/20',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
        },
        {
            label: 'Support Staff',
            value: '89',
            change: '+2',
            changeType: 'positive',
            icon: Briefcase,
            iconBg: 'bg-purple-400/20',
            iconColor: 'text-purple-600 dark:text-purple-400',
        },
        {
            label: 'Administrators',
            value: '24',
            change: 'No change',
            changeType: 'neutral',
            icon: Shield,
            iconBg: 'bg-emerald-400/20',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
        },
    ]

    // Action cards linking to sub-routes
    const actionCards: ModuleActionCard[] = [
        {
            id: 'staff',
            title: 'Staff Directory',
            description: 'View and manage all staff members',
            icon: Users,
            href: '/people/staff',
            iconBg: 'bg-blue-500/15 group-hover:bg-blue-500/25',
            iconColor: 'text-blue-600 dark:text-blue-400',
        },
        {
            id: 'new-person',
            title: 'Add New Person',
            description: 'Onboard a new staff member',
            icon: UserPlus,
            href: '/people/new',
            iconBg: 'bg-emerald-400/20 group-hover:bg-emerald-400/30',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
        },
        {
            id: 'departments',
            title: 'Departments',
            description: 'Manage organizational structure',
            icon: Building,
            href: '/people/departments',
            iconBg: 'bg-purple-400/20 group-hover:bg-purple-400/30',
            iconColor: 'text-purple-600 dark:text-purple-400',
        },
        {
            id: 'roles',
            title: 'Roles & Permissions',
            description: 'Configure access and permissions',
            icon: Shield,
            href: '/people/roles',
            iconBg: 'bg-amber-400/20 group-hover:bg-amber-400/30',
            iconColor: 'text-amber-600 dark:text-amber-400',
        },
        {
            id: 'profiles',
            title: 'Profile Settings',
            description: 'Manage profile configurations',
            icon: UserCog,
            href: '/people/settings',
            iconBg: 'bg-slate-400/20 group-hover:bg-slate-400/30',
            iconColor: 'text-slate-600 dark:text-slate-400',
        },
        {
            id: 'reports',
            title: 'People Analytics',
            description: 'View workforce analytics',
            icon: TrendingUp,
            href: '/people/analytics',
            iconBg: 'bg-cyan-400/20 group-hover:bg-cyan-400/30',
            iconColor: 'text-cyan-600 dark:text-cyan-400',
        },
    ]

    return (
        <ModuleOverviewPage
            moduleId="people"
            title="People"
            description="Manage staff, roles, and organizational structure"
            icon={Users}
            stats={stats}
            actionCards={actionCards}
        />
    )
}

