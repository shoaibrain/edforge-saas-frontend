/**
 * Home Page
 *
 * Dashboard with:
 * - Time-based greeting
 * - Recently visited carousel
 * - Quick action cards
 * - Upcoming events widget
 * - Activity feed
 */

import { motion } from 'framer-motion'
import {
  Users,
  GraduationCap,
  DollarSign,
  Clock,
  Calendar,
  TrendingUp,
  ChevronRight,
  ArrowRight,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@edforge/ui'
import { useShell } from '../../../lib/shell-context'
import { getGreeting, formatCurrentDate } from '../../../lib/greeting'

// ============================================================================
// STATS DATA
// ============================================================================

interface StatItem {
  label: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: LucideIcon
}

const STATS: StatItem[] = [
  {
    label: 'Total Students',
    value: '1,234',
    change: '+5.2%',
    trend: 'up',
    icon: GraduationCap,
  },
  {
    label: 'Active Staff',
    value: '89',
    change: '+2 this month',
    trend: 'up',
    icon: Users,
  },
  {
    label: 'Revenue (MTD)',
    value: '$45,678',
    change: '+12.3%',
    trend: 'up',
    icon: DollarSign,
  },
  {
    label: 'Attendance Rate',
    value: '94.5%',
    change: '-0.5%',
    trend: 'down',
    icon: Clock,
  },
]

// ============================================================================
// QUICK ACTIONS
// ============================================================================

interface QuickAction {
  label: string
  description: string
  icon: LucideIcon
  href: string
}

const QUICK_ACTIONS: QuickAction[] = [
  { 
    label: 'Add Student', 
    description: 'Enroll a new student',
    icon: GraduationCap, 
    href: '/academics/students/new' 
  },
  { 
    label: 'Take Attendance', 
    description: 'Mark class attendance',
    icon: Clock, 
    href: '/academics/classrooms?tab=attendance'
  },
  {
    label: 'Create Invoice',
    description: 'Generate a new invoice',
    icon: DollarSign,
    href: '/finance/billing/new'
  },
]

// ============================================================================
// UPCOMING EVENTS
// ============================================================================

const UPCOMING_EVENTS = [
  { id: 1, title: 'Parent-Teacher Conference', date: 'Dec 22, 2024', time: '2:00 PM' },
  { id: 2, title: 'Winter Break Begins', date: 'Dec 23, 2024', time: 'All Day' },
  { id: 3, title: 'Staff Meeting', date: 'Jan 6, 2025', time: '9:00 AM' },
]

// ============================================================================
// RECENT ACTIVITY
// ============================================================================

const RECENT_ACTIVITY = [
  { id: 1, action: 'New student enrolled', detail: 'Sarah Johnson', time: '2 hours ago' },
  { id: 2, action: 'Attendance marked', detail: 'Class 5A - 28 students', time: '4 hours ago' },
  { id: 3, action: 'Invoice generated', detail: 'Invoice #1234 - $450.00', time: '1 day ago' },
]

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
  stat: StatItem
  index: number
}

function StatCard({ stat, index }: StatCardProps) {
  const Icon = stat.icon
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-[rgb(var(--text-tertiary))]">{stat.label}</p>
              <p className="text-2xl font-bold text-[rgb(var(--text-primary))]">{stat.value}</p>
              <p
                className={`text-sm font-medium ${
                  stat.trend === 'up' 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-[rgb(var(--state-danger-fg))] '
                }`}
              >
                {stat.change}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-[rgb(var(--action-primary-bg))]/10 to-[rgb(var(--action-primary-bg-hover))]/10">
              <Icon className="w-6 h-6 text-[rgb(var(--action-secondary-fg))] dark:text-cyan-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ============================================================================
// QUICK ACTION CARD
// ============================================================================

interface QuickActionCardProps {
  action: QuickAction
  index: number
  onClick: () => void
}

function QuickActionCard({ action, index, onClick }: QuickActionCardProps) {
  const Icon = action.icon
  
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.05 }}
      onClick={onClick}
      className="group p-4 rounded-xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] hover:border-teal-500 hover:shadow-md transition-all duration-200 text-left w-full"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-[rgb(var(--action-primary-bg))]/10 to-[rgb(var(--action-primary-bg-hover))]/10 group-hover:from-[rgb(var(--action-primary-bg))]/20 group-hover:to-[rgb(var(--action-primary-bg-hover))]/20 transition-colors">
          <Icon className="w-5 h-5 text-[rgb(var(--action-secondary-fg))] dark:text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[rgb(var(--text-primary))]">{action.label}</p>
          <p className="text-sm text-[rgb(var(--text-tertiary))] truncate">{action.description}</p>
        </div>
        <ArrowRight className="w-5 h-5 text-[rgb(var(--text-tertiary))] group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
      </div>
    </motion.button>
  )
}

// ============================================================================
// HOME PAGE COMPONENT
// ============================================================================

export default function HomePage() {
  const { user, activeSchool, navigate } = useShell()
  const firstName = user?.displayName || user?.name?.split(' ')[0]

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <Sparkles className="w-8 h-8 text-golden-400" />
          </motion.div>
          <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))]">
            {getGreeting(firstName)}
          </h1>
        </div>
        <p className="text-lg text-[rgb(var(--text-secondary))]">
          Here's what's happening at <span className="font-medium">{activeSchool?.name || 'your school'}</span> today.
        </p>
        <p className="text-sm text-[rgb(var(--text-tertiary))]">
          {formatCurrentDate()}
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, index) => (
          <StatCard key={stat.label} stat={stat} index={index} />
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((action, index) => (
            <QuickActionCard 
              key={action.label} 
              action={action} 
              index={index}
              onClick={() => navigate(action.href)}
            />
          ))}
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[rgb(var(--text-primary))]">Upcoming Events</h3>
              <button 
                onClick={() => navigate('/academics/schoolcalendar')}
                className="text-sm text-[rgb(var(--action-secondary-fg))] dark:text-cyan-400 hover:underline flex items-center gap-1"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[rgb(var(--border-secondary))]">
              {UPCOMING_EVENTS.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="flex items-center gap-4 p-4 hover:bg-[rgb(var(--interactive-hover))] transition-colors cursor-pointer"
                >
                  <div className="p-2.5 rounded-xl bg-golden-500/10">
                    <Calendar className="w-5 h-5 text-golden-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[rgb(var(--text-primary))] truncate">{event.title}</p>
                    <p className="text-sm text-[rgb(var(--text-tertiary))]">
                      {event.date} • {event.time}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[rgb(var(--text-tertiary))] flex-shrink-0" />
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[rgb(var(--text-primary))]">Recent Activity</h3>
              <button className="text-sm text-[rgb(var(--action-secondary-fg))] dark:text-cyan-400 hover:underline flex items-center gap-1">
                View All
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[rgb(var(--border-secondary))]">
              {RECENT_ACTIVITY.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + index * 0.05 }}
                  className="flex items-center gap-4 p-4 hover:bg-[rgb(var(--interactive-hover))] transition-colors cursor-pointer"
                >
                  <div className="p-2.5 rounded-xl bg-cyan-500/10">
                    <TrendingUp className="w-5 h-5 text-cyan-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[rgb(var(--text-primary))] truncate">{activity.action}</p>
                    <p className="text-sm text-[rgb(var(--text-tertiary))] truncate">{activity.detail}</p>
                  </div>
                  <span className="text-xs text-[rgb(var(--text-tertiary))] whitespace-nowrap">{activity.time}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Welcome Tip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-[rgb(var(--action-primary-bg))]/5 via-cyan-500/5 to-teal-500/5 border border-teal-500/20"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-[rgb(var(--action-primary-bg))]/10">
            <Sparkles className="w-6 h-6 text-[rgb(var(--action-secondary-fg))] dark:text-cyan-400" />
          </div>
          <div>
            <h3 className="font-semibold text-[rgb(var(--text-primary))] mb-1">
              Welcome to EdForge!
            </h3>
            <p className="text-sm text-[rgb(var(--text-secondary))]">
              This is your central hub for managing {activeSchool?.name || 'your school'}. 
              Use the sidebar to navigate between modules, or use the quick actions above to get started.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
