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
            iconBg: 'bg-[rgb(var(--state-info-bg)/0.18)]',
            iconColor: 'text-[rgb(var(--state-info-fg))]',
        },
        {
            label: 'Upcoming Meetings',
            value: '3',
            change: 'This week',
            changeType: 'neutral',
            icon: Video,
            iconBg: 'bg-[rgb(var(--state-info-bg)/0.18)]',
            iconColor: 'text-[rgb(var(--state-info-fg))]',
        },
        {
            label: 'Announcements',
            value: '5',
            change: '+2 new',
            changeType: 'positive',
            icon: Megaphone,
            iconBg: 'bg-[rgb(var(--state-info-bg)/0.18)]',
            iconColor: 'text-[rgb(var(--state-info-fg))]',
        },
        {
            label: 'Response Rate',
            value: '94%',
            change: '+3%',
            changeType: 'positive',
            icon: Send,
            iconBg: 'bg-[rgb(var(--state-success-bg)/0.18)]',
            iconColor: 'text-[rgb(var(--state-success-fg))]',
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
            iconBg: 'bg-[rgb(var(--state-info-bg)/0.18)] group-hover:bg-[rgb(var(--state-info-bg)/0.26)]',
            iconColor: 'text-[rgb(var(--state-info-fg))]',
        },
        {
            id: 'announcements',
            title: 'Announcements',
            description: 'Broadcast messages to groups',
            icon: Megaphone,
            href: '/messages/announcements',
            iconBg: 'bg-[rgb(var(--state-info-bg)/0.18)] group-hover:bg-[rgb(var(--state-info-bg)/0.26)]',
            iconColor: 'text-[rgb(var(--state-info-fg))]',
        },
        {
            id: 'meetings',
            title: 'Meetings',
            description: 'Schedule and join video calls',
            icon: Video,
            href: '/messages/meetings',
            iconBg: 'bg-[rgb(var(--state-info-bg)/0.18)] group-hover:bg-[rgb(var(--state-info-bg)/0.26)]',
            iconColor: 'text-[rgb(var(--state-info-fg))]',
        },
        {
            id: 'calendar',
            title: 'Calendar',
            description: 'View scheduled events',
            icon: Calendar,
            href: '/messages/calendar',
            iconBg: 'bg-[rgb(var(--state-success-bg)/0.18)] group-hover:bg-[rgb(var(--state-success-bg)/0.26)]',
            iconColor: 'text-[rgb(var(--state-success-fg))]',
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
            iconBg: 'bg-[rgb(var(--background-tertiary))] group-hover:bg-[rgb(var(--background-tertiary))]',
            iconColor: 'text-[rgb(var(--text-secondary))]',
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

