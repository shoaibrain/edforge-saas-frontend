/**
 * Messages Overview Page
 * 
 * Main landing page for the Messages module.
 * Uses ModuleOverviewPage for consistent, customizable layout.
 */

import {
    MessageCircle,
    Inbox,
    Megaphone,
    Video,
    Calendar,
    Send,
    Bell,
    Settings,
} from 'lucide-react'
import { ModuleOverviewPage, type ModuleStat, type ModuleActionCard } from '../components/ModuleOverviewPage'

export function Overview() {
    // Stats for the messages module
    const stats: ModuleStat[] = [
        {
            label: 'Unread Messages',
            value: '12',
            change: '+4 today',
            changeType: 'positive',
            icon: Inbox,
            iconBg: 'bg-teal-500/15 dark:bg-cyan-500/20',
            iconColor: 'text-teal-600 dark:text-cyan-400',
        },
        {
            label: 'Upcoming Meetings',
            value: '3',
            change: 'This week',
            changeType: 'neutral',
            icon: Video,
            iconBg: 'bg-blue-400/20',
            iconColor: 'text-blue-600 dark:text-blue-400',
        },
        {
            label: 'Announcements',
            value: '5',
            change: '+2 new',
            changeType: 'positive',
            icon: Megaphone,
            iconBg: 'bg-purple-400/20',
            iconColor: 'text-purple-600 dark:text-purple-400',
        },
        {
            label: 'Response Rate',
            value: '94%',
            change: '+3%',
            changeType: 'positive',
            icon: Send,
            iconBg: 'bg-emerald-400/20',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
        },
    ]

    // Action cards linking to sub-routes
    const actionCards: ModuleActionCard[] = [
        {
            id: 'inbox',
            title: 'Inbox',
            description: 'View and respond to messages',
            icon: Inbox,
            href: '/messages/inbox',
            iconBg: 'bg-teal-500/15 group-hover:bg-teal-500/25',
            iconColor: 'text-teal-600 dark:text-cyan-400',
        },
        {
            id: 'announcements',
            title: 'Announcements',
            description: 'Broadcast messages to groups',
            icon: Megaphone,
            href: '/messages/announcements',
            iconBg: 'bg-purple-400/20 group-hover:bg-purple-400/30',
            iconColor: 'text-purple-600 dark:text-purple-400',
        },
        {
            id: 'meetings',
            title: 'Meetings',
            description: 'Schedule and join video calls',
            icon: Video,
            href: '/messages/meetings',
            iconBg: 'bg-blue-400/20 group-hover:bg-blue-400/30',
            iconColor: 'text-blue-600 dark:text-blue-400',
        },
        {
            id: 'calendar',
            title: 'Calendar',
            description: 'View scheduled events',
            icon: Calendar,
            href: '/messages/calendar',
            iconBg: 'bg-emerald-400/20 group-hover:bg-emerald-400/30',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
        },
        {
            id: 'notifications',
            title: 'Notifications',
            description: 'Manage notification preferences',
            icon: Bell,
            href: '/messages/notifications',
            iconBg: 'bg-amber-400/20 group-hover:bg-amber-400/30',
            iconColor: 'text-amber-600 dark:text-amber-400',
        },
        {
            id: 'settings',
            title: 'Settings',
            description: 'Configure messaging options',
            icon: Settings,
            href: '/messages/settings',
            iconBg: 'bg-slate-400/20 group-hover:bg-slate-400/30',
            iconColor: 'text-slate-600 dark:text-slate-400',
        },
    ]

    return (
        <ModuleOverviewPage
            moduleId="messages"
            title="Messages"
            description="Communicate with staff, parents, and students"
            icon={MessageCircle}
            stats={stats}
            actionCards={actionCards}
        />
    )
}

