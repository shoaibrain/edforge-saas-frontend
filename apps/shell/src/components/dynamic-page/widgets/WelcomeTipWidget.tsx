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
import { useTranslation } from '@edforge/i18n'
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
  /** i18n prefix key under dashboard namespace (e.g. 'welcomeTip.administrator') */
  i18nKey?: string
}

// ============================================================================
// WELCOME TIPS - Role-Specific
// ============================================================================

export const WELCOME_TIPS: Record<RoleCategory, WelcomeTip> = {
  administrator: {
    title: 'Welcome to EdForge',
    description: 'Your all-in-one education management platform. Manage students, track attendance, enter grades, and streamline your school operations.',
    actionLabel: 'Manage your students',
    actionHref: '/academics/students',
    icon: Sparkles,
    gradient: 'from-[rgb(var(--state-info-bg)/0.08)] via-transparent to-golden-400/5 dark:from-[rgb(var(--state-info-bg)/0.14)] dark:to-golden-400/10',
    iconBg: 'bg-[rgb(var(--state-info-bg)/0.18)]0/15 bg-[rgb(var(--state-info-bg)/0.18)]',
    iconColor: 'text-[rgb(var(--state-info-fg))] text-[rgb(var(--state-info-fg))]',
    linkColor: 'text-[rgb(var(--state-info-fg))] text-[rgb(var(--state-info-fg))]',
    i18nKey: 'welcomeTip.administrator',
  },
  educator: {
    title: 'Ready to Teach',
    description: 'Access your class rosters, enter grades, and track attendance all in one place. Stay connected with parents through our integrated messaging system.',
    actionLabel: 'View your classes',
    actionHref: '/academics/gradebooks',
    icon: BookOpen,
    gradient: 'from-amber-500/5 via-transparent to-[rgb(var(--state-warning-bg)/0.08)] dark:from-amber-500/10 dark:to-[rgb(var(--state-warning-bg)/0.14)]',
    iconBg: 'bg-amber-500/15 dark:bg-amber-400/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    linkColor: 'text-amber-600 dark:text-amber-400',
    i18nKey: 'welcomeTip.educator',
  },
  student: {
    title: 'Welcome to Your Portal',
    description: 'Track your academic progress, view assignments, check your schedule, and stay up to date with school announcements.',
    actionLabel: 'Check your grades',
    actionHref: '/student-portal/grades',
    icon: GraduationCap,
    gradient: 'from-sky-500/5 via-transparent to-[rgb(var(--state-info-bg)/0.08)] dark:from-sky-500/10 dark:to-[rgb(var(--state-info-bg)/0.14)]',
    iconBg: 'bg-sky-500/15 dark:bg-sky-400/20',
    iconColor: 'text-sky-600 dark:text-sky-400',
    linkColor: 'text-sky-600 dark:text-sky-400',
    i18nKey: 'welcomeTip.student',
  },
  parent: {
    title: 'Stay Connected',
    description: "Monitor your children's academic progress, view attendance records, pay school fees, and communicate with teachers all in one place.",
    actionLabel: 'View your children',
    actionHref: '/parent-portal',
    icon: Baby,
    gradient: 'from-[rgb(var(--state-danger-bg)/0.08)] via-transparent to-[rgb(var(--state-danger-bg)/0.08)] dark:from-[rgb(var(--state-danger-bg)/0.14)] dark:to-[rgb(var(--state-danger-bg)/0.14)]',
    iconBg: 'bg-[rgb(var(--state-danger-bg)/0.18)] dark:bg-[rgb(var(--state-danger-fg))]/20',
    iconColor: 'text-[rgb(var(--state-danger-fg))]',
    linkColor: 'text-[rgb(var(--state-danger-fg))]',
    i18nKey: 'welcomeTip.parent',
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
  const { t } = useTranslation('dashboard')

  const title = tip.i18nKey ? t(`${tip.i18nKey}.title`, { defaultValue: tip.title }) : tip.title
  const description = tip.i18nKey ? t(`${tip.i18nKey}.description`, { defaultValue: tip.description }) : tip.description
  const actionLabel = tip.i18nKey ? t(`${tip.i18nKey}.action`, { defaultValue: tip.actionLabel }) : tip.actionLabel

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
            {title}
          </h3>
          <p className="text-sm text-[rgb(var(--text-secondary))] mb-3">
            {description}
          </p>
          <Link
            to={tip.actionHref}
            className={`inline-flex items-center gap-2 text-sm font-medium ${tip.linkColor} hover:underline`}
          >
            <Plus className="w-4 h-4" />
            {actionLabel}
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
    gradient: 'from-[rgb(var(--state-info-bg)/0.08)] via-transparent to-[rgb(var(--state-info-bg)/0.08)] dark:from-[rgb(var(--state-info-bg)/0.14)] dark:to-[rgb(var(--state-info-bg)/0.14)]',
    iconBg: 'bg-[rgb(var(--state-info-bg)/0.18)]0/15 bg-[rgb(var(--state-info-bg)/0.18)]',
    iconColor: 'text-[rgb(var(--state-info-fg))] text-[rgb(var(--state-info-fg))]',
    linkColor: 'text-[rgb(var(--state-info-fg))] text-[rgb(var(--state-info-fg))]',
    i18nKey: 'moduleTip.academics',
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
    gradient: 'from-aqua-400/5 via-transparent to-[rgb(var(--state-info-bg)/0.08)] dark:from-aqua-400/10 dark:to-[rgb(var(--state-info-bg)/0.14)]',
    iconBg: 'bg-aqua-400/15 dark:bg-aqua-400/20',
    iconColor: 'text-aqua-700 dark:text-aqua-400',
    linkColor: 'text-aqua-700 dark:text-aqua-400',
    i18nKey: 'moduleTip.people',
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

