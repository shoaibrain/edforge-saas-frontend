/**
 * Home Page - Main Dashboard
 * 
 * The landing page after authentication with overview stats,
 * recent activity, and quick actions.
 */

import { createFileRoute } from '@tanstack/react-router'
import { useAuthStore, MOCK_SCHOOLS } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { motion } from 'framer-motion'
import {
  Users,
  GraduationCap,
  DollarSign,
  Calendar,
  TrendingUp,
  Building2,
  ArrowUpRight,
  Clock,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'

export const Route = createFileRoute('/_protected/home')({
  component: HomePage,
})

function HomePage() {
  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)

  const activeSchool = activeSchoolId ? MOCK_SCHOOLS[activeSchoolId] : null

  const stats = [
    {
      label: 'Total Students',
      value: '1,247',
      change: '+12%',
      changeType: 'positive',
      icon: Users,
      iconBg: 'bg-teal-500/15 dark:bg-cyan-500/20',
      iconColor: 'text-teal-600 dark:text-cyan-400',
    },
    {
      label: 'Active Classes',
      value: '48',
      change: '+3',
      changeType: 'positive',
      icon: GraduationCap,
      iconBg: 'bg-aqua-400/20',
      iconColor: 'text-aqua-700 dark:text-aqua-400',
    },
    {
      label: 'Revenue (MTD)',
      value: '$45,230',
      change: '+8%',
      changeType: 'positive',
      icon: DollarSign,
      iconBg: 'bg-golden-400/20',
      iconColor: 'text-golden-600 dark:text-golden-400',
    },
    {
      label: 'Attendance Rate',
      value: '94.2%',
      change: '+1.2%',
      changeType: 'positive',
      icon: Calendar,
      iconBg: 'bg-vanilla-400/30 dark:bg-vanilla-400/20',
      iconColor: 'text-vanilla-700 dark:text-vanilla-500',
    },
  ]

  const recentActivity = [
    { text: 'New student enrollment processed', time: '2 hours ago', type: 'success' },
    { text: 'Grade report submitted for Class 10-A', time: '4 hours ago', type: 'info' },
    { text: 'Attendance marked for 12 classes', time: '5 hours ago', type: 'info' },
    { text: 'Fee collection completed', time: 'Yesterday', type: 'success' },
    { text: 'New staff member onboarded', time: 'Yesterday', type: 'info' },
  ]

  const quickActions = [
    { label: 'Add Student', icon: Users, color: 'teal' },
    { label: 'Record Attendance', icon: Calendar, color: 'golden' },
    { label: 'Create Class', icon: GraduationCap, color: 'aqua' },
    { label: 'View Reports', icon: TrendingUp, color: 'caramel' },
  ]

  const colorMap: Record<string, { bg: string; text: string }> = {
    teal: { bg: 'bg-teal-500/15 hover:bg-teal-500/25 dark:bg-cyan-500/20 dark:hover:bg-cyan-500/30', text: 'text-teal-700 dark:text-cyan-400' },
    golden: { bg: 'bg-golden-400/20 hover:bg-golden-400/30', text: 'text-golden-700 dark:text-golden-400' },
    aqua: { bg: 'bg-aqua-400/20 hover:bg-aqua-400/30', text: 'text-aqua-700 dark:text-aqua-400' },
    caramel: { bg: 'bg-caramel-400/20 hover:bg-caramel-400/30', text: 'text-caramel-600 dark:text-caramel-300' },
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))]">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-[rgb(var(--text-secondary))] mt-1 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            {activeSchool?.name || "Here's what's happening today"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-tertiary))]">
          <Clock className="w-4 h-4" />
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <Card className="p-5 sm:p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[rgb(var(--text-tertiary))]">{stat.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))]">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                  <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.iconColor}`} />
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-[rgb(var(--border-secondary))]">
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  stat.changeType === 'positive' 
                    ? 'bg-aqua-400/20 text-aqua-700 dark:text-aqua-400' 
                    : 'bg-rust-100 text-rust-600 dark:bg-rust-900/30 dark:text-rust-400'
                }`}>
                  <TrendingUp className="w-3 h-3" />
                  {stat.change}
                </div>
                <span className="text-xs text-[rgb(var(--text-tertiary))]">vs last month</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Activity */}
        <motion.div
          className="lg:col-span-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full">
            <div className="p-5 sm:p-6 border-b border-[rgb(var(--border-secondary))]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                  Recent Activity
                </h2>
                <button className="text-sm text-teal-600 dark:text-cyan-400 hover:underline font-medium flex items-center gap-1">
                  View all
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="divide-y divide-[rgb(var(--border-secondary))]">
              {recentActivity.map((activity, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-5 sm:px-6 py-4 hover:bg-[rgb(var(--interactive-hover))] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'success' ? 'bg-aqua-500' : 'bg-teal-500 dark:bg-cyan-500'
                    }`} />
                    <span className="text-sm text-[rgb(var(--text-primary))]">{activity.text}</span>
                  </div>
                  <span className="text-xs text-[rgb(var(--text-tertiary))] whitespace-nowrap ml-4">{activity.time}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full">
            <div className="p-5 sm:p-6 border-b border-[rgb(var(--border-secondary))]">
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                Quick Actions
              </h2>
            </div>
            <div className="p-4 sm:p-5 grid grid-cols-2 gap-3">
              {quickActions.map((action) => {
                const colors = colorMap[action.color]
                return (
                  <button
                    key={action.label}
                    className={`flex flex-col items-center gap-3 p-4 sm:p-5 rounded-xl ${colors.bg} transition-all duration-200`}
                  >
                    <div className="p-3 rounded-xl bg-[rgb(var(--surface-secondary))] shadow-sm">
                      <action.icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <span className={`text-sm font-medium ${colors.text}`}>
                      {action.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

