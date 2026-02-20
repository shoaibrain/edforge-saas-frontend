/**
 * QuickActionsWidget
 * 
 * Role-aware quick actions grid widget.
 * Redesigned with framer-motion for fluid, Apple-like interactions.
 */

import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  Users,
  Calendar,
  // [MVP-PARKED] Unused icons from parked quick actions
  // Video,
  // BarChart3,
  // MessageSquare,
  // Bell,
  // [/MVP-PARKED]
  ArrowRight,
  GraduationCap,
  ClipboardCheck,
  FileText,
  CreditCard,
  BookOpen,
  Baby,
  CloudLightning,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuthStore, getUserRoleCategory } from '../../../stores/auth.store'
import { useAppStore } from '../../../stores/app.store'
import type { RoleCategory } from '@edforge/types'
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
    text: string
    border: string
  }
}

// ============================================================================
// QUICK ACTIONS CONFIG - Role-Specific
// ============================================================================

// Defined with refined, subtle Apple-like color palettes

const ADMIN_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'add-student',
    label: 'Add Student',
    description: 'Enroll new student',
    icon: Users,
    href: '/academics/students',
    color: {
      bg: 'bg-teal-50 dark:bg-teal-900/10',
      text: 'text-teal-600 dark:text-teal-400',
      border: 'border-teal-200 dark:border-teal-800/30',
    },
  },
  {
    id: 'record-attendance',
    label: 'Attendance',
    description: 'Mark daily attendance',
    icon: Calendar,
    href: '/academics/attendance',
    color: {
      bg: 'bg-orange-50 dark:bg-orange-900/10',
      text: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-200 dark:border-orange-800/30',
    },
  },
  // [MVP-PARKED] Messages & Analytics quick actions
  // {
  //   id: 'schedule-meeting',
  //   label: 'Schedule',
  //   description: 'New meeting',
  //   icon: Video,
  //   href: '/messages/schedule',
  //   color: {
  //     bg: 'bg-indigo-50 dark:bg-indigo-900/10',
  //     text: 'text-indigo-600 dark:text-indigo-400',
  //     border: 'border-indigo-200 dark:border-indigo-800/30',
  //   },
  // },
  // {
  //   id: 'view-reports',
  //   label: 'Analytics',
  //   description: 'View reports',
  //   icon: BarChart3,
  //   href: '/analytics',
  //   color: {
  //     bg: 'bg-blue-50 dark:bg-blue-900/10',
  //     text: 'text-blue-600 dark:text-blue-400',
  //     border: 'border-blue-200 dark:border-blue-800/30',
  //   },
  // },
  // [/MVP-PARKED]
]

const TEACHER_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'my-classes',
    label: 'My Classes',
    description: 'View your classes',
    icon: BookOpen,
    href: '/academics/gradebooks',
    color: {
      bg: 'bg-teal-50 dark:bg-teal-900/10',
      text: 'text-teal-600 dark:text-teal-400',
      border: 'border-teal-200 dark:border-teal-800/30',
    },
  },
  {
    id: 'record-attendance',
    label: 'Attendance',
    description: 'Mark class attendance',
    icon: ClipboardCheck,
    href: '/academics/attendance',
    color: {
      bg: 'bg-orange-50 dark:bg-orange-900/10',
      text: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-200 dark:border-orange-800/30',
    },
  },
  {
    id: 'gradebook',
    label: 'Gradebook',
    description: 'Enter grades',
    icon: GraduationCap,
    href: '/academics/gradebooks',
    color: {
      bg: 'bg-indigo-50 dark:bg-indigo-900/10',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-200 dark:border-indigo-800/30',
    },
  },
  // [MVP-PARKED] Messages quick action
  // {
  //   id: 'messages',
  //   label: 'Messages',
  //   description: 'Parent communication',
  //   icon: MessageSquare,
  //   href: '/messages',
  //   color: {
  //     bg: 'bg-blue-50 dark:bg-blue-900/10',
  //     text: 'text-blue-600 dark:text-blue-400',
  //     border: 'border-blue-200 dark:border-blue-800/30',
  //   },
  // },
  // [/MVP-PARKED]
]

const STUDENT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'my-grades',
    label: 'Grades',
    description: 'View performance',
    icon: GraduationCap,
    href: '/student-portal/grades',
    color: {
      bg: 'bg-teal-50 dark:bg-teal-900/10',
      text: 'text-teal-600 dark:text-teal-400',
      border: 'border-teal-200 dark:border-teal-800/30',
    },
  },
  {
    id: 'my-schedule',
    label: 'Schedule',
    description: 'Upcoming classes',
    icon: Calendar,
    href: '/student-portal/schedule',
    color: {
      bg: 'bg-orange-50 dark:bg-orange-900/10',
      text: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-200 dark:border-orange-800/30',
    },
  },
  {
    id: 'assignments',
    label: 'Assignments',
    description: 'Pending homework',
    icon: FileText,
    href: '/student-portal/assignments',
    color: {
      bg: 'bg-indigo-50 dark:bg-indigo-900/10',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-200 dark:border-indigo-800/30',
    },
  },
  // [MVP-PARKED] Messages quick action
  // {
  //   id: 'announcements',
  //   label: 'News',
  //   description: 'School updates',
  //   icon: Bell,
  //   href: '/messages/announcements',
  //   color: {
  //     bg: 'bg-blue-50 dark:bg-blue-900/10',
  //     text: 'text-blue-600 dark:text-blue-400',
  //     border: 'border-blue-200 dark:border-blue-800/30',
  //   },
  // },
  // [/MVP-PARKED]
]

const PARENT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'children-overview',
    label: 'Children',
    description: 'View progress',
    icon: Baby,
    href: '/parent-portal',
    color: {
      bg: 'bg-rose-50 dark:bg-rose-900/10',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-200 dark:border-rose-800/30',
    },
  },
  {
    id: 'children-grades',
    label: 'Grades',
    description: 'Academic reports',
    icon: GraduationCap,
    href: '/parent-portal/grades',
    color: {
      bg: 'bg-teal-50 dark:bg-teal-900/10',
      text: 'text-teal-600 dark:text-teal-400',
      border: 'border-teal-200 dark:border-teal-800/30',
    },
  },
  {
    id: 'fee-payments',
    label: 'Fees',
    description: 'Payments',
    icon: CreditCard,
    href: '/parent-portal/fees',
    color: {
      bg: 'bg-orange-50 dark:bg-orange-900/10',
      text: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-200 dark:border-orange-800/30',
    },
  },
  // [MVP-PARKED] Messages quick action
  // {
  //   id: 'messages',
  //   label: 'Messages',
  //   description: 'Contact teachers',
  //   icon: MessageSquare,
  //   href: '/messages',
  //   color: {
  //     bg: 'bg-blue-50 dark:bg-blue-900/10',
  //     text: 'text-blue-600 dark:text-blue-400',
  //     border: 'border-blue-200 dark:border-blue-800/30',
  //   },
  // },
  // [/MVP-PARKED]
]

export function getQuickActionsForRole(roleCategory: RoleCategory | null): QuickAction[] {
  switch (roleCategory) {
    case 'student': return STUDENT_QUICK_ACTIONS
    case 'parent': return PARENT_QUICK_ACTIONS
    case 'educator': return TEACHER_QUICK_ACTIONS
    case 'administrator':
    default: return ADMIN_QUICK_ACTIONS
  }
}

// ============================================================================
// QUICK ACTION CARD (React Spring)
// ============================================================================

interface QuickActionCardProps {
  action: QuickAction
  index: number
}

function QuickActionCard({ action }: QuickActionCardProps) {
  const Icon = action.icon

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      className="h-full"
    >
      <Link
        to={action.href}
        className={`
          relative flex flex-col h-full overflow-hidden
          rounded-2xl transition-all duration-200
          bg-[rgb(var(--surface-primary))]
          border border-[rgb(var(--border-primary))]
          hover:border-[rgb(var(--border-secondary))]
          hover:shadow-lg
          group
        `}
      >
        {/* Subtle Background Gradient Overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-transparent to-[rgb(var(--surface-secondary))]" />

        <div className="p-5 flex flex-col h-full relative z-10">
          {/* Header: Icon & Arrow */}
          <div className="flex justify-between items-start mb-4">
            <div className={`
              w-12 h-12 rounded-2xl flex items-center justify-center
              ${action.color.bg} ${action.color.text} border ${action.color.border}
            `}>
              <Icon className="w-6 h-6" />
            </div>

            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[rgb(var(--text-tertiary))] bg-[rgb(var(--surface-tertiary))] opacity-0 group-hover:opacity-100 transition-all duration-300">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Content */}
          <div className="mt-auto">
            <h3 className="font-semibold text-base text-[rgb(var(--text-primary))] mb-1">
              {action.label}
            </h3>
            <p className="text-xs text-[rgb(var(--text-tertiary))] font-medium">
              {action.description}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// ============================================================================
// QUICK ACTIONS WIDGET
// ============================================================================

interface QuickActionsWidgetProps {
  actions?: QuickAction[]
  columns?: 2 | 4
}

export function QuickActionsWidget({
  actions,
  columns = 4,
}: QuickActionsWidgetProps) {
  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)

  const roleCategory = getUserRoleCategory(user, activeSchoolId)
  const quickActions = actions || getQuickActionsForRole(roleCategory)

  const gridCols = columns === 2
    ? 'grid-cols-1 sm:grid-cols-2'
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'

  return (
    <WidgetSection
      widgetId="quick-actions"
      label="Quick actions"
      icon={CloudLightning}
    >
      <div className={`grid ${gridCols} gap-4`}>
        {quickActions.map((action, index) => (
          <QuickActionCard key={action.id} action={action} index={index} />
        ))}
      </div>
    </WidgetSection>
  )
}
