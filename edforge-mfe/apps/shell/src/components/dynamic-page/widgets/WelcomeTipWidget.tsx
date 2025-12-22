/**
 * WelcomeTipWidget
 * 
 * Role-specific onboarding/welcome tip card widget.
 * Provides contextual guidance based on user's role category.
 */

import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  Plus,
  ArrowRight,
  Sparkles,
  GraduationCap,
  BookOpen,
  Baby,
  Lightbulb,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuthStore, getUserRoleCategory } from '../../../stores/auth.store'
import { useAppStore } from '../../../stores/app.store'
import type { RoleCategory } from '@edforge/types'
import { WidgetSection } from '../WidgetSection'

// ============================================================================
// TYPES
// ============================================================================

export interface WelcomeTip {
  title: string
  description: string
  actionLabel: string
  actionHref: string
  icon: LucideIcon
  gradient: string
  iconBg: string
  iconColor: string
  linkColor: string
}

// ============================================================================
// WELCOME TIPS - Role-Specific
// ============================================================================

export const WELCOME_TIPS: Record<RoleCategory, WelcomeTip> = {
  administrator: {
    title: 'Welcome to EdForge',
    description: 'Your all-in-one education management platform. Connect your video conferencing tools, manage students, track attendance, and streamline your school operations.',
    actionLabel: 'Connect your meeting tools',
    actionHref: '/messages',
    icon: Sparkles,
    gradient: 'from-teal-500/5 via-transparent to-golden-400/5 dark:from-cyan-500/10 dark:to-golden-400/10',
    iconBg: 'bg-teal-500/15 dark:bg-cyan-500/20',
    iconColor: 'text-teal-600 dark:text-cyan-400',
    linkColor: 'text-teal-600 dark:text-cyan-400',
  },
  educator: {
    title: 'Ready to Teach',
    description: 'Access your class rosters, enter grades, and track attendance all in one place. Stay connected with parents through our integrated messaging system.',
    actionLabel: 'View your classes',
    actionHref: '/academics/gradebooks',
    icon: BookOpen,
    gradient: 'from-amber-500/5 via-transparent to-orange-400/5 dark:from-amber-500/10 dark:to-orange-400/10',
    iconBg: 'bg-amber-500/15 dark:bg-amber-400/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    linkColor: 'text-amber-600 dark:text-amber-400',
  },
  student: {
    title: 'Welcome to Your Portal',
    description: 'Track your academic progress, view assignments, check your schedule, and stay up to date with school announcements.',
    actionLabel: 'Check your grades',
    actionHref: '/student-portal/grades',
    icon: GraduationCap,
    gradient: 'from-sky-500/5 via-transparent to-blue-400/5 dark:from-sky-500/10 dark:to-blue-400/10',
    iconBg: 'bg-sky-500/15 dark:bg-sky-400/20',
    iconColor: 'text-sky-600 dark:text-sky-400',
    linkColor: 'text-sky-600 dark:text-sky-400',
  },
  parent: {
    title: 'Stay Connected',
    description: "Monitor your children's academic progress, view attendance records, pay school fees, and communicate with teachers all in one place.",
    actionLabel: 'View your children',
    actionHref: '/parent-portal',
    icon: Baby,
    gradient: 'from-rose-500/5 via-transparent to-pink-400/5 dark:from-rose-500/10 dark:to-pink-400/10',
    iconBg: 'bg-rose-500/15 dark:bg-rose-400/20',
    iconColor: 'text-rose-600 dark:text-rose-400',
    linkColor: 'text-rose-600 dark:text-rose-400',
  },
}

// ============================================================================
// WELCOME TIP CARD
// ============================================================================

interface WelcomeTipCardProps {
  tip: WelcomeTip
}

function WelcomeTipCard({ tip }: WelcomeTipCardProps) {
  const WelcomeIcon = tip.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className={`p-6 rounded-2xl bg-gradient-to-br ${tip.gradient} border border-[rgb(var(--border-primary))]`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl ${tip.iconBg} flex items-center justify-center flex-shrink-0`}>
          <WelcomeIcon className={`w-6 h-6 ${tip.iconColor}`} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-[rgb(var(--text-primary))] mb-1">
            {tip.title}
          </h3>
          <p className="text-sm text-[rgb(var(--text-secondary))] mb-3">
            {tip.description}
          </p>
          <Link
            to={tip.actionHref}
            className={`inline-flex items-center gap-2 text-sm font-medium ${tip.linkColor} hover:underline`}
          >
            <Plus className="w-4 h-4" />
            {tip.actionLabel}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// WELCOME TIP WIDGET
// ============================================================================

interface WelcomeTipWidgetProps {
  /** Override tip (optional) - if not provided, uses role-based defaults */
  tip?: WelcomeTip
}

export function WelcomeTipWidget({ tip }: WelcomeTipWidgetProps) {
  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)

  // Use provided tip or get role-based default
  const roleCategory = getUserRoleCategory(user, activeSchoolId)
  const welcomeTip = tip || WELCOME_TIPS[roleCategory ?? 'administrator']

  return (
    <WidgetSection
      widgetId="welcome-tip"
      showHeader={false}
      animationDelay={0.5}
      icon={Lightbulb}
    >
      <WelcomeTipCard tip={welcomeTip} />
    </WidgetSection>
  )
}

// ============================================================================
// MODULE-SPECIFIC TIPS
// ============================================================================

export const MODULE_TIPS: Record<string, WelcomeTip> = {
  academics: {
    title: 'Academic Management',
    description: 'Manage students, teachers, classes, and curriculum all in one place. Track grades, attendance, and academic performance.',
    actionLabel: 'Explore academics',
    actionHref: '/academics/students',
    icon: GraduationCap,
    gradient: 'from-teal-500/5 via-transparent to-cyan-400/5 dark:from-teal-500/10 dark:to-cyan-400/10',
    iconBg: 'bg-teal-500/15 dark:bg-cyan-500/20',
    iconColor: 'text-teal-600 dark:text-cyan-400',
    linkColor: 'text-teal-600 dark:text-cyan-400',
  },
  finance: {
    title: 'Financial Overview',
    description: 'Track tuition, manage payments, handle payroll, and monitor expenses. Get comprehensive financial insights for your institution.',
    actionLabel: 'View finances',
    actionHref: '/finance/billing',
    icon: Sparkles,
    gradient: 'from-golden-400/5 via-transparent to-amber-400/5 dark:from-golden-400/10 dark:to-amber-400/10',
    iconBg: 'bg-golden-400/15 dark:bg-golden-400/20',
    iconColor: 'text-golden-600 dark:text-golden-400',
    linkColor: 'text-golden-600 dark:text-golden-400',
  },
  people: {
    title: 'People Management',
    description: 'Manage staff, teachers, parents, and guardians. Track assignments, permissions, and communication preferences.',
    actionLabel: 'Manage people',
    actionHref: '/people/staff',
    icon: Sparkles,
    gradient: 'from-aqua-400/5 via-transparent to-blue-400/5 dark:from-aqua-400/10 dark:to-blue-400/10',
    iconBg: 'bg-aqua-400/15 dark:bg-aqua-400/20',
    iconColor: 'text-aqua-700 dark:text-aqua-400',
    linkColor: 'text-aqua-700 dark:text-aqua-400',
  },
  analytics: {
    title: 'Insights & Analytics',
    description: 'Get actionable insights into academic performance, financial health, and attendance patterns. Make data-driven decisions.',
    actionLabel: 'Explore analytics',
    actionHref: '/analytics/academic',
    icon: Sparkles,
    gradient: 'from-caramel-400/5 via-transparent to-orange-400/5 dark:from-caramel-400/10 dark:to-orange-400/10',
    iconBg: 'bg-caramel-400/15 dark:bg-caramel-400/20',
    iconColor: 'text-caramel-600 dark:text-caramel-400',
    linkColor: 'text-caramel-600 dark:text-caramel-400',
  },
  messages: {
    title: 'Stay Connected',
    description: 'Schedule meetings, send messages, and share announcements. Keep everyone informed with our integrated communication tools.',
    actionLabel: 'Start communicating',
    actionHref: '/messages',
    icon: Sparkles,
    gradient: 'from-violet-500/5 via-transparent to-purple-400/5 dark:from-violet-500/10 dark:to-purple-400/10',
    iconBg: 'bg-violet-500/15 dark:bg-violet-400/20',
    iconColor: 'text-violet-600 dark:text-violet-400',
    linkColor: 'text-violet-600 dark:text-violet-400',
  },
}

/**
 * Module-specific tip widget
 */
interface ModuleTipWidgetProps {
  moduleId: string
}

export function ModuleTipWidget({ moduleId }: ModuleTipWidgetProps) {
  const tip = MODULE_TIPS[moduleId]

  if (!tip) {
    return null
  }

  return <WelcomeTipWidget tip={tip} />
}

