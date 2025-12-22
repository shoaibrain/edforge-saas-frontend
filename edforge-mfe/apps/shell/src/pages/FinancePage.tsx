/**
 * Finance Module Layout
 * 
 * Provides nested routing support for the Finance module.
 * Renders the overview page at /finance and child routes via Outlet.
 */

import { Outlet, useLocation } from '@tanstack/react-router'
import {
  DollarSign,
  Landmark,
  CreditCard,
  Receipt,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  BanknoteIcon,
} from 'lucide-react'
import { ModuleOverviewPage } from '../components/layout/ModuleOverviewPage'
import type { ModuleStat, ModuleActionCard } from '../components/layout/ModuleOverviewPage'

// ============================================================================
// LAYOUT COMPONENT
// ============================================================================

export default function FinancePage() {
  const location = useLocation()
  // Check if we're at exactly /finance (not a child route like /finance/payroll)
  const isExactRoute = location.pathname === '/finance'
  
  if (isExactRoute) {
    return <FinanceOverviewPage />
  }
  
  // Render child routes (financials, payroll, etc.)
  return <Outlet />
}

// ============================================================================
// OVERVIEW PAGE
// ============================================================================

function FinanceOverviewPage() {
  // Stats for the finance module
  const stats: ModuleStat[] = [
    {
      label: 'Revenue (MTD)',
      value: '$145,230',
      change: '+18%',
      changeType: 'positive',
      icon: TrendingUp,
      iconBg: 'bg-teal-500/15 dark:bg-cyan-500/20',
      iconColor: 'text-teal-600 dark:text-cyan-400',
    },
    {
      label: 'Outstanding Fees',
      value: '$23,450',
      change: '-12%',
      changeType: 'positive',
      icon: Wallet,
      iconBg: 'bg-golden-400/20',
      iconColor: 'text-golden-600 dark:text-golden-400',
    },
    {
      label: 'Payroll Due',
      value: '$89,200',
      change: 'Due in 5 days',
      changeType: 'neutral',
      icon: CreditCard,
      iconBg: 'bg-aqua-400/20',
      iconColor: 'text-aqua-700 dark:text-aqua-400',
    },
    {
      label: 'Total Expenses',
      value: '$34,780',
      change: '+8%',
      changeType: 'negative',
      icon: TrendingDown,
      iconBg: 'bg-rust-400/20',
      iconColor: 'text-rust-600 dark:text-rust-400',
    },
  ]

  // Action cards linking to sub-routes
  const actionCards: ModuleActionCard[] = [
    {
      id: 'financials',
      title: 'Financials',
      description: 'Overview of all financial transactions',
      icon: Landmark,
      href: '/finance/financials',
      iconBg: 'bg-teal-500/15 dark:bg-cyan-500/20 group-hover:bg-teal-500/25 dark:group-hover:bg-cyan-500/30',
      iconColor: 'text-teal-600 dark:text-cyan-400',
      permission: { action: 'view', resource: 'billing' },
    },
    {
      id: 'payroll',
      title: 'Payroll',
      description: 'Salary and compensation management',
      icon: CreditCard,
      href: '/finance/payroll',
      iconBg: 'bg-aqua-400/20 group-hover:bg-aqua-400/30',
      iconColor: 'text-aqua-700 dark:text-aqua-400',
      permission: { action: 'view', resource: 'payroll' },
    },
    {
      id: 'tuitionfees',
      title: 'Tuition & Fees',
      description: 'Fee structures and collections',
      icon: BanknoteIcon,
      href: '/finance/tuitionandfees',
      iconBg: 'bg-golden-400/20 group-hover:bg-golden-400/30',
      iconColor: 'text-golden-600 dark:text-golden-400',
      permission: { action: 'view', resource: 'billing' },
    },
    {
      id: 'expenses',
      title: 'Expenses',
      description: 'Track and approve expenses',
      icon: Receipt,
      href: '/finance/expenses',
      iconBg: 'bg-caramel-400/20 group-hover:bg-caramel-400/30',
      iconColor: 'text-caramel-600 dark:text-caramel-400',
      permission: { action: 'view', resource: 'expenses' },
    },
    {
      id: 'reports',
      title: 'Reports',
      description: 'Financial analytics and insights',
      icon: BarChart3,
      href: '/finance/reports',
      iconBg: 'bg-vanilla-400/25 dark:bg-vanilla-400/20 group-hover:bg-vanilla-400/35 dark:group-hover:bg-vanilla-400/30',
      iconColor: 'text-vanilla-700 dark:text-vanilla-500',
      permission: { action: 'view', resource: 'reports:finance' },
    },
  ]

  return (
    <ModuleOverviewPage
      moduleId="finance"
      title="Finance"
      description="Manage billing, payroll, expenses, and financial reports"
      icon={DollarSign}
      stats={stats}
      actionCards={actionCards}
    />
  )
}
