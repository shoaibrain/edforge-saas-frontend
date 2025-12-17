/**
 * Communications Module Layout
 * 
 * Provides nested routing support for the Communications module.
 * Renders the overview page at /communications and child routes via Outlet.
 */

import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'
import {
  MessageSquare,
  Megaphone,
  Mail,
  Bell,
  Users,
  TrendingUp,
  Send,
  Inbox,
} from 'lucide-react'
import { ModuleOverviewPage } from '@/components/layout/ModuleOverviewPage'
import type { ModuleStat, ModuleActionCard } from '@/components/layout/ModuleOverviewPage'

export const Route = createFileRoute('/_protected/communications')({
  component: CommunicationsLayout,
})

// ============================================================================
// LAYOUT COMPONENT
// ============================================================================

function CommunicationsLayout() {
  const matches = useMatches()
  // Check if we're at exactly /communications (not a child route)
  const isExactRoute = matches[matches.length - 1]?.routeId === '/_protected/communications'
  
  if (isExactRoute) {
    return <CommunicationsOverviewPage />
  }
  
  // Render child routes
  return <Outlet />
}

// ============================================================================
// OVERVIEW PAGE
// ============================================================================

function CommunicationsOverviewPage() {
  // Stats for the communications module
  const stats: ModuleStat[] = [
    {
      label: 'Total Messages',
      value: '1,248',
      change: '+156 this week',
      changeType: 'positive',
      icon: Mail,
      iconBg: 'bg-teal-500/15 dark:bg-cyan-500/20',
      iconColor: 'text-teal-600 dark:text-cyan-400',
    },
    {
      label: 'Announcements',
      value: '24',
      change: '+3 this month',
      changeType: 'positive',
      icon: Megaphone,
      iconBg: 'bg-golden-400/20',
      iconColor: 'text-golden-600 dark:text-golden-400',
    },
    {
      label: 'Active Recipients',
      value: '2,156',
      change: '96% delivery rate',
      changeType: 'positive',
      icon: Users,
      iconBg: 'bg-aqua-400/20',
      iconColor: 'text-aqua-700 dark:text-aqua-400',
    },
    {
      label: 'Response Rate',
      value: '78%',
      change: '+5%',
      changeType: 'positive',
      icon: TrendingUp,
      iconBg: 'bg-vanilla-400/30 dark:bg-vanilla-400/20',
      iconColor: 'text-vanilla-700 dark:text-vanilla-500',
    },
  ]

  // Action cards linking to sub-routes
  const actionCards: ModuleActionCard[] = [
    {
      id: 'announcements',
      title: 'Announcements',
      description: 'School-wide and targeted announcements',
      icon: Megaphone,
      href: '/communications/announcements',
      iconBg: 'bg-golden-400/20 group-hover:bg-golden-400/30',
      iconColor: 'text-golden-600 dark:text-golden-400',
      permission: { action: 'view', resource: 'staff' },
    },
    {
      id: 'messages',
      title: 'Messages',
      description: 'Direct messaging with parents and staff',
      icon: Mail,
      href: '/communications/messages',
      iconBg: 'bg-teal-500/15 dark:bg-cyan-500/20 group-hover:bg-teal-500/25 dark:group-hover:bg-cyan-500/30',
      iconColor: 'text-teal-600 dark:text-cyan-400',
      permission: { action: 'view', resource: 'staff' },
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'System notifications and alerts',
      icon: Bell,
      href: '/communications/notifications',
      iconBg: 'bg-aqua-400/20 group-hover:bg-aqua-400/30',
      iconColor: 'text-aqua-700 dark:text-aqua-400',
      permission: { action: 'view', resource: 'staff' },
    },
    {
      id: 'inbox',
      title: 'Inbox',
      description: 'View all received messages',
      icon: Inbox,
      href: '/communications/inbox',
      iconBg: 'bg-caramel-400/20 group-hover:bg-caramel-400/30',
      iconColor: 'text-caramel-600 dark:text-caramel-400',
      permission: { action: 'view', resource: 'staff' },
    },
    {
      id: 'sent',
      title: 'Sent Messages',
      description: 'Track sent communications',
      icon: Send,
      href: '/communications/sent',
      iconBg: 'bg-vanilla-400/25 dark:bg-vanilla-400/20 group-hover:bg-vanilla-400/35 dark:group-hover:bg-vanilla-400/30',
      iconColor: 'text-vanilla-700 dark:text-vanilla-500',
      permission: { action: 'view', resource: 'staff' },
    },
  ]

  return (
    <ModuleOverviewPage
      title="Communications"
      description="Manage announcements, messages, and notifications"
      icon={MessageSquare}
      stats={stats}
      actionCards={actionCards}
    />
  )
}

