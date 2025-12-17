/**
 * Analytics Module Layout
 * 
 * Provides nested routing support for the Analytics module.
 * Renders the overview page at /analytics and child routes via Outlet.
 */

import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'
import {
  BarChart3,
  TrendingUp,
  GraduationCap,
  DollarSign,
  Users,
  ClipboardCheck,
  PieChart,
  LineChart,
} from 'lucide-react'
import { ModuleOverviewPage } from '@/components/layout/ModuleOverviewPage'
import type { ModuleStat, ModuleActionCard } from '@/components/layout/ModuleOverviewPage'

export const Route = createFileRoute('/_protected/analytics')({
  component: AnalyticsLayout,
})

// ============================================================================
// LAYOUT COMPONENT
// ============================================================================

function AnalyticsLayout() {
  const matches = useMatches()
  // Check if we're at exactly /analytics (not a child route)
  const isExactRoute = matches[matches.length - 1]?.routeId === '/_protected/analytics'
  
  if (isExactRoute) {
    return <AnalyticsOverviewPage />
  }
  
  // Render child routes
  return <Outlet />
}

// ============================================================================
// OVERVIEW PAGE
// ============================================================================

function AnalyticsOverviewPage() {
  // Stats for the analytics module
  const stats: ModuleStat[] = [
    {
      label: 'Overall Performance',
      value: '87%',
      change: '+3% vs last term',
      changeType: 'positive',
      icon: TrendingUp,
      iconBg: 'bg-teal-500/15 dark:bg-cyan-500/20',
      iconColor: 'text-teal-600 dark:text-cyan-400',
    },
    {
      label: 'Attendance Rate',
      value: '94.2%',
      change: '+1.2%',
      changeType: 'positive',
      icon: ClipboardCheck,
      iconBg: 'bg-aqua-400/20',
      iconColor: 'text-aqua-700 dark:text-aqua-400',
    },
    {
      label: 'Revenue (YTD)',
      value: '$1.2M',
      change: '+15%',
      changeType: 'positive',
      icon: DollarSign,
      iconBg: 'bg-golden-400/20',
      iconColor: 'text-golden-600 dark:text-golden-400',
    },
    {
      label: 'Active Students',
      value: '1,247',
      change: '+48 this term',
      changeType: 'positive',
      icon: Users,
      iconBg: 'bg-vanilla-400/30 dark:bg-vanilla-400/20',
      iconColor: 'text-vanilla-700 dark:text-vanilla-500',
    },
  ]

  // Action cards linking to sub-routes
  const actionCards: ModuleActionCard[] = [
    {
      id: 'academic',
      title: 'Academic Analytics',
      description: 'Student performance, grades, and trends',
      icon: GraduationCap,
      href: '/analytics/academic',
      iconBg: 'bg-teal-500/15 dark:bg-cyan-500/20 group-hover:bg-teal-500/25 dark:group-hover:bg-cyan-500/30',
      iconColor: 'text-teal-600 dark:text-cyan-400',
      permission: { action: 'view', resource: 'grades' },
    },
    {
      id: 'attendance',
      title: 'Attendance Analytics',
      description: 'Attendance patterns and insights',
      icon: ClipboardCheck,
      href: '/analytics/attendance',
      iconBg: 'bg-aqua-400/20 group-hover:bg-aqua-400/30',
      iconColor: 'text-aqua-700 dark:text-aqua-400',
      permission: { action: 'view', resource: 'attendance' },
    },
    {
      id: 'financial',
      title: 'Financial Analytics',
      description: 'Revenue, expenses, and projections',
      icon: DollarSign,
      href: '/analytics/financial',
      iconBg: 'bg-golden-400/20 group-hover:bg-golden-400/30',
      iconColor: 'text-golden-600 dark:text-golden-400',
      permission: { action: 'view', resource: 'reports:finance' },
    },
    {
      id: 'enrollment',
      title: 'Enrollment Trends',
      description: 'Admission and retention metrics',
      icon: Users,
      href: '/analytics/enrollment',
      iconBg: 'bg-caramel-400/20 group-hover:bg-caramel-400/30',
      iconColor: 'text-caramel-600 dark:text-caramel-400',
      permission: { action: 'view', resource: 'enrollment' },
    },
    {
      id: 'comparisons',
      title: 'Comparative Analysis',
      description: 'Year-over-year and cohort comparisons',
      icon: LineChart,
      href: '/analytics/comparisons',
      iconBg: 'bg-vanilla-400/25 dark:bg-vanilla-400/20 group-hover:bg-vanilla-400/35 dark:group-hover:bg-vanilla-400/30',
      iconColor: 'text-vanilla-700 dark:text-vanilla-500',
      permission: { action: 'view', resource: 'grades' },
    },
    {
      id: 'custom',
      title: 'Custom Reports',
      description: 'Build custom analytics dashboards',
      icon: PieChart,
      href: '/analytics/custom',
      iconBg: 'bg-rust-400/20 group-hover:bg-rust-400/30',
      iconColor: 'text-rust-600 dark:text-rust-400',
      permission: { action: 'view', resource: 'reports:finance' },
    },
  ]

  return (
    <ModuleOverviewPage
      title="Analytics"
      description="Data-driven insights for informed decision making"
      icon={BarChart3}
      stats={stats}
      actionCards={actionCards}
    />
  )
}

