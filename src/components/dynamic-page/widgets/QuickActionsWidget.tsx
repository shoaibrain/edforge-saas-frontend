/**
 * QuickActionsWidget
 * 
 * Role-aware quick actions grid widget.
 * Displays contextual actions based on user's role category.
 */

import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  Users,
  Calendar,
  Video,
  BarChart3,
  ArrowRight,
  GraduationCap,
  ClipboardCheck,
  FileText,
  CreditCard,
  MessageSquare,
  BookOpen,
  Baby,
  Bell,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuthStore, getUserRoleCategory } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import type { RoleCategory } from '@/types/auth'
import { WidgetSection } from '../WidgetSection'

// ============================================================================
// TYPES
// ============================================================================

export interface QuickAction {
  id: string
  label: string
  description: string
  icon: LucideIcon
  href: string
  color: {
    bg: string
    icon: string
    hover: string
  }
}

// ============================================================================
// QUICK ACTIONS CONFIG - Role-Specific
// ============================================================================

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
export function getQuickActionsForRole(roleCategory: RoleCategory | null): QuickAction[] {
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
// QUICK ACTION CARD
// ============================================================================

interface QuickActionCardProps {
  action: QuickAction
  index: number
}

function QuickActionCard({ action, index }: QuickActionCardProps) {
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
// QUICK ACTIONS WIDGET
// ============================================================================

interface QuickActionsWidgetProps {
  /** Override actions (optional) - if not provided, uses role-based defaults */
  actions?: QuickAction[]
  /** Number of columns in grid */
  columns?: 2 | 4
}

export function QuickActionsWidget({ 
  actions,
  columns = 4,
}: QuickActionsWidgetProps) {
  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  
  // Use provided actions or get role-based defaults
  const roleCategory = getUserRoleCategory(user, activeSchoolId)
  const quickActions = actions || getQuickActionsForRole(roleCategory)
  
  const gridCols = columns === 2 
    ? 'grid-cols-1 sm:grid-cols-2' 
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  
  return (
    <WidgetSection
      widgetId="quick-actions"
      label="Quick actions"
      animationDelay={0.4}
    >
      <div className={`grid ${gridCols} gap-3`}>
        {quickActions.map((action, index) => (
          <QuickActionCard key={action.id} action={action} index={index} />
        ))}
      </div>
    </WidgetSection>
  )
}

