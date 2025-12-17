/**
 * Home Page - Notion-Inspired Dashboard
 * 
 * A minimal, elegant landing page with:
 * - Time-based personalized greeting
 * - Recently visited pages carousel
 * - Upcoming events calendar
 * - Subtle quick actions
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth.store'
import { motion } from 'framer-motion'
import {
  Users,
  Calendar,
  Video,
  BarChart3,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { getGreeting } from '@/lib/greeting'
import { RecentlyVisitedCarousel, UpcomingEventsSection } from '@/components/home'

export const Route = createFileRoute('/_protected/home')({
  component: HomePage,
})

// ============================================================================
// QUICK ACTIONS CONFIG
// ============================================================================

interface QuickAction {
  id: string
  label: string
  description: string
  icon: React.ElementType
  href: string
  color: {
    bg: string
    icon: string
    hover: string
  }
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'add-student',
    label: 'Add Student',
    description: 'Enroll new student',
    icon: Users,
    href: '/academics/students',
    color: {
      bg: 'bg-teal-500/10 dark:bg-cyan-500/15',
      icon: 'text-teal-600 dark:text-cyan-400',
      hover: 'hover:bg-teal-500/15 dark:hover:bg-cyan-500/20',
    },
  },
  {
    id: 'record-attendance',
    label: 'Attendance',
    description: 'Mark daily attendance',
    icon: Calendar,
    href: '/academics/attendance',
    color: {
      bg: 'bg-golden-400/15',
      icon: 'text-golden-600 dark:text-golden-400',
      hover: 'hover:bg-golden-400/20',
    },
  },
  {
    id: 'schedule-meeting',
    label: 'New Meeting',
    description: 'Schedule a meeting',
    icon: Video,
    href: '/communications',
    color: {
      bg: 'bg-violet-500/10 dark:bg-violet-400/15',
      icon: 'text-violet-600 dark:text-violet-400',
      hover: 'hover:bg-violet-500/15 dark:hover:bg-violet-400/20',
    },
  },
  {
    id: 'view-reports',
    label: 'Analytics',
    description: 'View reports',
    icon: BarChart3,
    href: '/analytics',
    color: {
      bg: 'bg-aqua-400/15',
      icon: 'text-aqua-700 dark:text-aqua-400',
      hover: 'hover:bg-aqua-400/20',
    },
  },
]

// ============================================================================
// QUICK ACTION CARD
// ============================================================================

function QuickActionCard({ action, index }: { action: QuickAction; index: number }) {
  const Icon = action.icon
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 + index * 0.05 }}
    >
      <Link
        to={action.href}
        className={`
          group flex items-center gap-3 p-3 rounded-xl
          bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))]
          transition-all duration-200 cursor-pointer
          hover:shadow-md hover:border-[rgb(var(--border-tertiary))]
          hover:-translate-y-0.5
        `}
      >
        {/* Icon */}
        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
          ${action.color.bg} ${action.color.hover} transition-colors
        `}>
          <Icon className={`w-5 h-5 ${action.color.icon}`} />
        </div>
        
        {/* Text */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-[rgb(var(--text-primary))] truncate">
            {action.label}
          </h3>
          <p className="text-xs text-[rgb(var(--text-tertiary))] truncate">
            {action.description}
          </p>
        </div>
        
        {/* Arrow */}
        <ArrowRight className="w-4 h-4 text-[rgb(var(--text-tertiary))] opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>
    </motion.div>
  )
}

// ============================================================================
// HOME PAGE COMPONENT
// ============================================================================

function HomePage() {
  const user = useAuthStore((s) => s.user)
  
  const firstName = user?.name?.split(' ')[0]
  const greeting = getGreeting(firstName)
  
  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-12">
      {/* ================================================================== */}
      {/* HERO GREETING SECTION */}
      {/* ================================================================== */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="pt-4"
      >
        <h1 className="text-4xl sm:text-5xl font-bold text-[rgb(var(--text-primary))] tracking-tight">
          {greeting}
        </h1>
      </motion.header>

      {/* ================================================================== */}
      {/* RECENTLY VISITED CAROUSEL */}
      {/* ================================================================== */}
      <section>
        <RecentlyVisitedCarousel />
      </section>

      {/* ================================================================== */}
      {/* UPCOMING EVENTS */}
      {/* ================================================================== */}
      <section>
        <UpcomingEventsSection />
      </section>

      {/* ================================================================== */}
      {/* QUICK ACTIONS */}
      {/* ================================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          <h2 className="text-sm font-medium text-[rgb(var(--text-secondary))]">
            Quick actions
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((action, index) => (
            <QuickActionCard key={action.id} action={action} index={index} />
          ))}
        </div>
      </motion.section>

      {/* ================================================================== */}
      {/* WELCOME TIP (For new users or empty state) */}
      {/* ================================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-12"
      >
        <div className="p-6 rounded-2xl bg-gradient-to-br from-teal-500/5 via-transparent to-golden-400/5 dark:from-cyan-500/10 dark:to-golden-400/10 border border-[rgb(var(--border-primary))]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-500/15 dark:bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-teal-600 dark:text-cyan-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[rgb(var(--text-primary))] mb-1">
                Welcome to EdForge
              </h3>
              <p className="text-sm text-[rgb(var(--text-secondary))] mb-3">
                Your all-in-one education management platform. Connect your video conferencing tools, 
                manage students, track attendance, and streamline your school operations.
              </p>
              <Link
                to="/communications"
                className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 dark:text-cyan-400 hover:underline"
              >
                <Plus className="w-4 h-4" />
                Connect your meeting tools
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  )
}
