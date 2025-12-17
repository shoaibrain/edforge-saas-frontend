/**
 * Financial Analytics Page
 * 
 * Comprehensive financial analytics with:
 * - Revenue and expense trends
 * - Budget vs actual comparisons
 * - Fee collection status
 * - Financial projections
 */

import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSpring, animated, config } from '@react-spring/web'
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Receipt,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  PieChart,
} from 'lucide-react'
import { can } from '@/lib/abac'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export const Route = createFileRoute('/_protected/analytics/financial')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState()
    const { activeSchoolId } = useAppStore.getState()

    if (!can(user, { action: 'view', resource: 'reports:finance', schoolId: activeSchoolId ?? undefined })) {
      throw redirect({ to: '/forbidden' })
    }
  },
  component: FinancialAnalyticsPage,
})

// Mock financial data
const MOCK_STATS = {
  totalRevenue: 1247500,
  revenueChange: 15.3,
  totalExpenses: 892300,
  expenseChange: 8.7,
  netIncome: 355200,
  netIncomeChange: 28.4,
  outstandingFees: 45680,
  collectionRate: 96.5,
}

const MOCK_REVENUE_BREAKDOWN = [
  { category: 'Tuition Fees', amount: 856000, percentage: 68.6 },
  { category: 'Transport Fees', amount: 156000, percentage: 12.5 },
  { category: 'Lab & Activity Fees', amount: 125500, percentage: 10.1 },
  { category: 'Library Fees', amount: 45000, percentage: 3.6 },
  { category: 'Other Income', amount: 65000, percentage: 5.2 },
]

const MOCK_EXPENSE_BREAKDOWN = [
  { category: 'Salaries & Benefits', amount: 534000, percentage: 59.8 },
  { category: 'Facilities & Maintenance', amount: 178500, percentage: 20.0 },
  { category: 'Educational Materials', amount: 89230, percentage: 10.0 },
  { category: 'Utilities', amount: 53540, percentage: 6.0 },
  { category: 'Administrative', amount: 37030, percentage: 4.2 },
]

const MOCK_MONTHLY_TREND = [
  { month: 'Sep', revenue: 145000, expenses: 98000 },
  { month: 'Oct', revenue: 142000, expenses: 95000 },
  { month: 'Nov', revenue: 138000, expenses: 92000 },
  { month: 'Dec', revenue: 125000, expenses: 88000 },
  { month: 'Jan', revenue: 148000, expenses: 102000 },
  { month: 'Feb', revenue: 152000, expenses: 98000 },
]

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

function StatCard({ 
  label, 
  value, 
  change,
  changeType,
  icon: Icon, 
  iconBg, 
  iconColor,
  prefix = '$',
}: { 
  label: string
  value: number
  change: number
  changeType: 'positive' | 'negative'
  icon: typeof DollarSign
  iconBg: string
  iconColor: string
  prefix?: string
}) {
  const [hovered, setHovered] = useState(false)
  
  const springProps = useSpring({
    scale: hovered ? 1.02 : 1,
    y: hovered ? -4 : 0,
    config: config.gentle,
  })

  const TrendIcon = changeType === 'positive' ? ArrowUpRight : ArrowDownRight
  const formattedValue = value >= 1000000 
    ? `${(value / 1000000).toFixed(2)}M`
    : value >= 1000 
      ? `${(value / 1000).toFixed(1)}K`
      : value.toFixed(0)

  return (
    <animated.div
      style={{
        transform: springProps.scale.to(s => `scale(${s}) translateY(${springProps.y.get()}px)`),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-[rgb(var(--text-tertiary))]">{label}</p>
            <p className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))]">
              {prefix}{formattedValue}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${iconBg}`}>
            <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor}`} />
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-[rgb(var(--border-secondary))]">
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
            changeType === 'positive' 
              ? 'bg-aqua-400/20 text-aqua-700 dark:text-aqua-400' 
              : 'bg-rust-100 text-rust-600 dark:bg-rust-900/30 dark:text-rust-400'
          }`}>
            <TrendIcon className="w-3 h-3" />
            {change > 0 ? '+' : ''}{change}%
          </div>
          <span className="text-xs text-[rgb(var(--text-tertiary))]">vs last year</span>
        </div>
      </Card>
    </animated.div>
  )
}

// ============================================================================
// BREAKDOWN ITEM
// ============================================================================

function BreakdownItem({ category, amount, percentage, color }: { category: string; amount: number; percentage: number; color: string }) {
  const [hovered, setHovered] = useState(false)
  
  const springProps = useSpring({
    width: `${percentage}%`,
    config: { tension: 280, friction: 60 },
  })

  return (
    <div 
      className="space-y-2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[rgb(var(--text-primary))]">{category}</span>
        <span className="text-sm text-[rgb(var(--text-tertiary))]">
          ${amount.toLocaleString()} ({percentage}%)
        </span>
      </div>
      <div className="h-2 bg-[rgb(var(--surface-tertiary))] rounded-full overflow-hidden">
        <animated.div
          style={springProps}
          className={`h-full ${color} rounded-full transition-opacity ${hovered ? 'opacity-100' : 'opacity-80'}`}
        />
      </div>
    </div>
  )
}

// ============================================================================
// TREND BAR
// ============================================================================

function TrendBar({ month, revenue, expenses, maxValue }: { month: string; revenue: number; expenses: number; maxValue: number }) {
  const revenueHeight = (revenue / maxValue) * 100
  const expenseHeight = (expenses / maxValue) * 100

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-end gap-1 h-32">
        <div 
          className="w-6 bg-teal-500 dark:bg-cyan-500 rounded-t transition-all hover:opacity-80"
          style={{ height: `${revenueHeight}%` }}
          title={`Revenue: $${revenue.toLocaleString()}`}
        />
        <div 
          className="w-6 bg-rust-400 rounded-t transition-all hover:opacity-80"
          style={{ height: `${expenseHeight}%` }}
          title={`Expenses: $${expenses.toLocaleString()}`}
        />
      </div>
      <span className="text-xs text-[rgb(var(--text-tertiary))]">{month}</span>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function FinancialAnalyticsPage() {
  const [timePeriod, setTimePeriod] = useState<'month' | 'quarter' | 'year'>('year')

  const revenueColors = [
    'bg-teal-500 dark:bg-cyan-500',
    'bg-aqua-500',
    'bg-golden-500',
    'bg-caramel-500',
    'bg-vanilla-600',
  ]

  const expenseColors = [
    'bg-rust-500',
    'bg-caramel-600',
    'bg-golden-600',
    'bg-vanilla-700',
    'bg-[rgb(var(--text-tertiary))]',
  ]

  const maxTrendValue = Math.max(...MOCK_MONTHLY_TREND.map(t => Math.max(t.revenue, t.expenses)))

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))]">
            Financial Analytics
          </h1>
          <p className="text-[rgb(var(--text-secondary))] mt-1">
            Revenue, expenses, and financial performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-[rgb(var(--surface-tertiary))] rounded-lg border border-[rgb(var(--border-primary))]">
            {(['month', 'quarter', 'year'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  timePeriod === period
                    ? 'bg-[rgb(var(--surface-secondary))] text-[rgb(var(--text-primary))] shadow-sm'
                    : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          label="Total Revenue"
          value={MOCK_STATS.totalRevenue}
          change={MOCK_STATS.revenueChange}
          changeType="positive"
          icon={TrendingUp}
          iconBg="bg-teal-500/15 dark:bg-cyan-500/20"
          iconColor="text-teal-600 dark:text-cyan-400"
        />
        <StatCard
          label="Total Expenses"
          value={MOCK_STATS.totalExpenses}
          change={MOCK_STATS.expenseChange}
          changeType="negative"
          icon={Receipt}
          iconBg="bg-rust-400/20"
          iconColor="text-rust-600 dark:text-rust-400"
        />
        <StatCard
          label="Net Income"
          value={MOCK_STATS.netIncome}
          change={MOCK_STATS.netIncomeChange}
          changeType="positive"
          icon={Wallet}
          iconBg="bg-aqua-400/20"
          iconColor="text-aqua-700 dark:text-aqua-400"
        />
        <StatCard
          label="Outstanding Fees"
          value={MOCK_STATS.outstandingFees}
          change={-3.2}
          changeType="positive"
          icon={CreditCard}
          iconBg="bg-golden-400/20"
          iconColor="text-golden-600 dark:text-golden-400"
        />
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <div className="p-5 border-b border-[rgb(var(--border-secondary))]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-500/15 dark:bg-cyan-500/20">
                  <PieChart className="w-5 h-5 text-teal-600 dark:text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                    Revenue Breakdown
                  </h2>
                  <p className="text-sm text-[rgb(var(--text-tertiary))]">
                    Income sources distribution
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {MOCK_REVENUE_BREAKDOWN.map((item, idx) => (
                <BreakdownItem
                  key={item.category}
                  category={item.category}
                  amount={item.amount}
                  percentage={item.percentage}
                  color={revenueColors[idx % revenueColors.length]}
                />
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Expense Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <div className="p-5 border-b border-[rgb(var(--border-secondary))]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rust-400/20">
                  <Receipt className="w-5 h-5 text-rust-600 dark:text-rust-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                    Expense Breakdown
                  </h2>
                  <p className="text-sm text-[rgb(var(--text-tertiary))]">
                    Operating costs distribution
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {MOCK_EXPENSE_BREAKDOWN.map((item, idx) => (
                <BreakdownItem
                  key={item.category}
                  category={item.category}
                  amount={item.amount}
                  percentage={item.percentage}
                  color={expenseColors[idx % expenseColors.length]}
                />
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Monthly Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <div className="p-5 border-b border-[rgb(var(--border-secondary))]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                  Monthly Trend
                </h2>
                <p className="text-sm text-[rgb(var(--text-tertiary))]">
                  Revenue vs Expenses over time
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-teal-500 dark:bg-cyan-500" />
                  <span className="text-[rgb(var(--text-tertiary))]">Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-rust-400" />
                  <span className="text-[rgb(var(--text-tertiary))]">Expenses</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-end justify-around">
              {MOCK_MONTHLY_TREND.map((item) => (
                <TrendBar
                  key={item.month}
                  month={item.month}
                  revenue={item.revenue}
                  expenses={item.expenses}
                  maxValue={maxTrendValue}
                />
              ))}
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

