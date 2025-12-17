/**
 * Home Page - Role-Aware Dashboard
 * 
 * A minimal, elegant landing page that adapts to the user's role:
 * - Administrators see management quick actions
 * - Teachers see classroom-focused actions
 * - Students see academic progress and assignments
 * - Parents see children's overview and school communications
 * 
 * All users get:
 * - Time-based personalized greeting
 * - Recently visited pages carousel
 * - Upcoming events calendar
 * - Role-appropriate quick actions
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuthStore, getUserRoleCategory } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { motion } from 'framer-motion'
import {
  Users,
  Calendar,
  Video,
  BarChart3,
  Plus,
  ArrowRight,
  Sparkles,
  GraduationCap,
  ClipboardCheck,
  FileText,
  CreditCard,
  MessageSquare,
  BookOpen,
  Baby,
  Bell,
} from 'lucide-react'
import { getGreeting } from '@/lib/greeting'
import { RecentlyVisitedCarousel, UpcomingEventsSection } from '@/components/home'
import type { RoleCategory } from '@/types/auth'

export const Route = createFileRoute('/_protected/home')({
  component: HomePage,
})

// ============================================================================
// QUICK ACTIONS CONFIG - Role-Specific
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

/**
 * Quick actions for administrators (Principal, Staff, Accountant)
 */
const ADMIN_QUICK_ACTIONS: QuickAction[] = [
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

/**
 * Quick actions for teachers/educators
 */
const TEACHER_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'my-classes',
    label: 'My Classes',
    description: 'View your classes',
    icon: BookOpen,
    href: '/academics/grades',
    color: {
      bg: 'bg-teal-500/10 dark:bg-cyan-500/15',
      icon: 'text-teal-600 dark:text-cyan-400',
      hover: 'hover:bg-teal-500/15 dark:hover:bg-cyan-500/20',
    },
  },
  {
    id: 'record-attendance',
    label: 'Attendance',
    description: 'Mark class attendance',
    icon: ClipboardCheck,
    href: '/academics/attendance',
    color: {
      bg: 'bg-golden-400/15',
      icon: 'text-golden-600 dark:text-golden-400',
      hover: 'hover:bg-golden-400/20',
    },
  },
  {
    id: 'gradebook',
    label: 'Gradebook',
    description: 'Enter grades',
    icon: GraduationCap,
    href: '/academics/grades',
    color: {
      bg: 'bg-violet-500/10 dark:bg-violet-400/15',
      icon: 'text-violet-600 dark:text-violet-400',
      hover: 'hover:bg-violet-500/15 dark:hover:bg-violet-400/20',
    },
  },
  {
    id: 'messages',
    label: 'Messages',
    description: 'Contact parents',
    icon: MessageSquare,
    href: '/communications/messages',
    color: {
      bg: 'bg-aqua-400/15',
      icon: 'text-aqua-700 dark:text-aqua-400',
      hover: 'hover:bg-aqua-400/20',
    },
  },
]

/**
 * Quick actions for students
 */
const STUDENT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'my-grades',
    label: 'My Grades',
    description: 'View your grades',
    icon: GraduationCap,
    href: '/student-portal/grades',
    color: {
      bg: 'bg-teal-500/10 dark:bg-cyan-500/15',
      icon: 'text-teal-600 dark:text-cyan-400',
      hover: 'hover:bg-teal-500/15 dark:hover:bg-cyan-500/20',
    },
  },
  {
    id: 'my-schedule',
    label: 'My Schedule',
    description: 'View class schedule',
    icon: Calendar,
    href: '/student-portal/schedule',
    color: {
      bg: 'bg-golden-400/15',
      icon: 'text-golden-600 dark:text-golden-400',
      hover: 'hover:bg-golden-400/20',
    },
  },
  {
    id: 'assignments',
    label: 'Assignments',
    description: 'View homework',
    icon: FileText,
    href: '/student-portal/assignments',
    color: {
      bg: 'bg-violet-500/10 dark:bg-violet-400/15',
      icon: 'text-violet-600 dark:text-violet-400',
      hover: 'hover:bg-violet-500/15 dark:hover:bg-violet-400/20',
    },
  },
  {
    id: 'announcements',
    label: 'Announcements',
    description: 'School news',
    icon: Bell,
    href: '/communications/announcements',
    color: {
      bg: 'bg-aqua-400/15',
      icon: 'text-aqua-700 dark:text-aqua-400',
      hover: 'hover:bg-aqua-400/20',
    },
  },
]

/**
 * Quick actions for parents
 */
const PARENT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'children-overview',
    label: 'My Children',
    description: 'View progress',
    icon: Baby,
    href: '/parent-portal',
    color: {
      bg: 'bg-rose-500/10 dark:bg-rose-400/15',
      icon: 'text-rose-600 dark:text-rose-400',
      hover: 'hover:bg-rose-500/15 dark:hover:bg-rose-400/20',
    },
  },
  {
    id: 'children-grades',
    label: 'Grades',
    description: "View children's grades",
    icon: GraduationCap,
    href: '/parent-portal/grades',
    color: {
      bg: 'bg-teal-500/10 dark:bg-cyan-500/15',
      icon: 'text-teal-600 dark:text-cyan-400',
      hover: 'hover:bg-teal-500/15 dark:hover:bg-cyan-500/20',
    },
  },
  {
    id: 'fee-payments',
    label: 'Fee Payments',
    description: 'View & pay fees',
    icon: CreditCard,
    href: '/parent-portal/fees',
    color: {
      bg: 'bg-golden-400/15',
      icon: 'text-golden-600 dark:text-golden-400',
      hover: 'hover:bg-golden-400/20',
    },
  },
  {
    id: 'messages',
    label: 'Messages',
    description: 'Contact teachers',
    icon: MessageSquare,
    href: '/communications/messages',
    color: {
      bg: 'bg-aqua-400/15',
      icon: 'text-aqua-700 dark:text-aqua-400',
      hover: 'hover:bg-aqua-400/20',
    },
  },
]

/**
 * Get quick actions based on user's role category
 */
function getQuickActionsForRole(roleCategory: RoleCategory | null): QuickAction[] {
  switch (roleCategory) {
    case 'student':
      return STUDENT_QUICK_ACTIONS
    case 'parent':
      return PARENT_QUICK_ACTIONS
    case 'educator':
      return TEACHER_QUICK_ACTIONS
    case 'administrator':
    default:
      return ADMIN_QUICK_ACTIONS
  }
}

// ============================================================================
// WELCOME TIPS - Role-Specific
// ============================================================================

interface WelcomeTip {
  title: string
  description: string
  actionLabel: string
  actionHref: string
  icon: React.ElementType
  gradient: string
  iconBg: string
  iconColor: string
  linkColor: string
}

const WELCOME_TIPS: Record<RoleCategory, WelcomeTip> = {
  administrator: {
    title: 'Welcome to EdForge',
    description: 'Your all-in-one education management platform. Connect your video conferencing tools, manage students, track attendance, and streamline your school operations.',
    actionLabel: 'Connect your meeting tools',
    actionHref: '/communications',
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
    actionHref: '/academics/grades',
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
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  
  // Determine user's role category for personalization
  const roleCategory = getUserRoleCategory(user, activeSchoolId)
  
  // Get role-specific quick actions and welcome tip
  const quickActions = getQuickActionsForRole(roleCategory)
  const welcomeTip = WELCOME_TIPS[roleCategory ?? 'administrator']
  
  const firstName = user?.name?.split(' ')[0]
  const greeting = getGreeting(firstName)
  
  const WelcomeIcon = welcomeTip.icon
  
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
      {/* QUICK ACTIONS - Role-Specific */}
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
          {quickActions.map((action, index) => (
            <QuickActionCard key={action.id} action={action} index={index} />
          ))}
        </div>
      </motion.section>

      {/* ================================================================== */}
      {/* WELCOME TIP - Role-Specific */}
      {/* ================================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-12"
      >
        <div className={`p-6 rounded-2xl bg-gradient-to-br ${welcomeTip.gradient} border border-[rgb(var(--border-primary))]`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl ${welcomeTip.iconBg} flex items-center justify-center flex-shrink-0`}>
              <WelcomeIcon className={`w-6 h-6 ${welcomeTip.iconColor}`} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[rgb(var(--text-primary))] mb-1">
                {welcomeTip.title}
              </h3>
              <p className="text-sm text-[rgb(var(--text-secondary))] mb-3">
                {welcomeTip.description}
              </p>
              <Link
                to={welcomeTip.actionHref}
                className={`inline-flex items-center gap-2 text-sm font-medium ${welcomeTip.linkColor} hover:underline`}
              >
                <Plus className="w-4 h-4" />
                {welcomeTip.actionLabel}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  )
}
