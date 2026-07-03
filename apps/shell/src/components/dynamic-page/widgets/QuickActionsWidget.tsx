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
import { useTranslation } from '@edforge/i18n'
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
  /** i18n key for label (under dashboard:quickAction.*) */
  labelKey?: string
  /** i18n key for description (under dashboard:quickAction.*) */
  descriptionKey?: string
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
    labelKey: 'quickAction.addStudent',
    descriptionKey: 'quickAction.enrollNewStudent',
    icon: Users,
    href: '/academics/students',
    color: {
      bg: 'bg-[rgb(var(--state-info-bg)/0.18)]',
      text: 'text-[rgb(var(--state-info-fg))]',
      border: 'border-[rgb(var(--state-info-border)/0.35)]',
    },
  },
  {
    id: 'record-attendance',
    label: 'Attendance',
    description: 'Mark daily attendance',
    labelKey: 'quickAction.attendance',
    descriptionKey: 'quickAction.markDailyAttendance',
    icon: Calendar,
    href: '/academics/classrooms?tab=attendance',
    color: {
      bg: 'bg-[rgb(var(--state-warning-bg)/0.18)]',
      text: 'text-[rgb(var(--state-warning-fg))]',
      border: 'border-[rgb(var(--state-warning-border)/0.35)]',
    },
  },
]

const TEACHER_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'my-classrooms',
    label: 'My Classrooms',
    description: 'View your classrooms',
    labelKey: 'quickAction.myClasses',
    descriptionKey: 'quickAction.viewYourClasses',
    icon: BookOpen,
    href: '/academics/gradebooks',
    color: {
      bg: 'bg-[rgb(var(--state-info-bg)/0.18)]',
      text: 'text-[rgb(var(--state-info-fg))]',
      border: 'border-[rgb(var(--state-info-border)/0.35)]',
    },
  },
  {
    id: 'record-attendance',
    label: 'Attendance',
    description: 'Mark class attendance',
    labelKey: 'quickAction.attendance',
    descriptionKey: 'quickAction.markClassAttendance',
    icon: ClipboardCheck,
    href: '/academics/classrooms?tab=attendance',
    color: {
      bg: 'bg-[rgb(var(--state-warning-bg)/0.18)]',
      text: 'text-[rgb(var(--state-warning-fg))]',
      border: 'border-[rgb(var(--state-warning-border)/0.35)]',
    },
  },
  {
    id: 'gradebook',
    label: 'Gradebook',
    description: 'Enter grades',
    labelKey: 'quickAction.gradebook',
    descriptionKey: 'quickAction.enterGrades',
    icon: GraduationCap,
    href: '/academics/gradebooks',
    color: {
      bg: 'bg-[rgb(var(--state-info-bg)/0.18)]',
      text: 'text-[rgb(var(--state-info-fg))]',
      border: 'border-[rgb(var(--state-info-border)/0.35)]',
    },
  },
]

const STUDENT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'my-grades',
    label: 'Grades',
    description: 'View performance',
    labelKey: 'quickAction.grades',
    descriptionKey: 'quickAction.viewPerformance',
    icon: GraduationCap,
    href: '/student-portal/grades',
    color: {
      bg: 'bg-[rgb(var(--state-info-bg)/0.18)]',
      text: 'text-[rgb(var(--state-info-fg))]',
      border: 'border-[rgb(var(--state-info-border)/0.35)]',
    },
  },
  {
    id: 'my-schedule',
    label: 'Schedule',
    description: 'Upcoming classes',
    labelKey: 'quickAction.schedule',
    descriptionKey: 'quickAction.upcomingClasses',
    icon: Calendar,
    href: '/student-portal/schedule',
    color: {
      bg: 'bg-[rgb(var(--state-warning-bg)/0.18)]',
      text: 'text-[rgb(var(--state-warning-fg))]',
      border: 'border-[rgb(var(--state-warning-border)/0.35)]',
    },
  },
  {
    id: 'assignments',
    label: 'Assignments',
    description: 'Pending homework',
    labelKey: 'quickAction.assignments',
    descriptionKey: 'quickAction.pendingHomework',
    icon: FileText,
    href: '/student-portal/assignments',
    color: {
      bg: 'bg-[rgb(var(--state-info-bg)/0.18)]',
      text: 'text-[rgb(var(--state-info-fg))]',
      border: 'border-[rgb(var(--state-info-border)/0.35)]',
    },
  },
]

const PARENT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'children-overview',
    label: 'Children',
    description: 'View progress',
    labelKey: 'quickAction.children',
    descriptionKey: 'quickAction.viewProgress',
    icon: Baby,
    href: '/parent-portal',
    color: {
      bg: 'bg-[rgb(var(--state-danger-bg)/0.18)]',
      text: 'text-[rgb(var(--state-danger-fg))]',
      border: 'border-[rgb(var(--state-danger-border)/0.35)]',
    },
  },
  {
    id: 'children-grades',
    label: 'Grades',
    description: 'Academic reports',
    labelKey: 'quickAction.grades',
    descriptionKey: 'quickAction.academicReports',
    icon: GraduationCap,
    href: '/parent-portal/grades',
    color: {
      bg: 'bg-[rgb(var(--state-info-bg)/0.18)]',
      text: 'text-[rgb(var(--state-info-fg))]',
      border: 'border-[rgb(var(--state-info-border)/0.35)]',
    },
  },
  {
    id: 'fee-payments',
    label: 'Fees',
    description: 'Payments',
    labelKey: 'quickAction.fees',
    descriptionKey: 'quickAction.payments',
    icon: CreditCard,
    href: '/parent-portal/fees',
    color: {
      bg: 'bg-[rgb(var(--state-warning-bg)/0.18)]',
      text: 'text-[rgb(var(--state-warning-fg))]',
      border: 'border-[rgb(var(--state-warning-border)/0.35)]',
    },
  },
]

export function getQuickActionsForRole(roleCategory: RoleCategory | null): QuickAction[] {
  switch (roleCategory) {
    case 'student': return STUDENT_QUICK_ACTIONS
    case 'parent': return PARENT_QUICK_ACTIONS
    case 'educator': return TEACHER_QUICK_ACTIONS
    case 'administrator': return ADMIN_QUICK_ACTIONS
    // Fail closed: an unresolved role must never see privileged actions
    default: return []
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
  const { t } = useTranslation('dashboard')
  const label = action.labelKey ? t(action.labelKey, { defaultValue: action.label }) : action.label
  const description = action.descriptionKey ? t(action.descriptionKey, { defaultValue: action.description }) : action.description

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
          bg-[rgb(var(--background-primary))]
          border border-[rgb(var(--border-primary))]
          hover:border-[rgb(var(--border-secondary))]
          hover:shadow-lg
          group
        `}
      >
        {/* Subtle Background Gradient Overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-transparent to-[rgb(var(--background-secondary))]" />

        <div className="p-5 flex flex-col h-full relative z-10">
          {/* Header: Icon & Arrow */}
          <div className="flex justify-between items-start mb-4">
            <div className={`
              w-12 h-12 rounded-2xl flex items-center justify-center
              ${action.color.bg} ${action.color.text} border ${action.color.border}
            `}>
              <Icon className="w-6 h-6" />
            </div>

            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[rgb(var(--text-tertiary))] bg-[rgb(var(--background-tertiary))] opacity-0 group-hover:opacity-100 transition-all duration-300">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Content */}
          <div className="mt-auto">
            <h3 className="font-semibold text-base text-[rgb(var(--text-primary))] mb-1">
              {label}
            </h3>
            <p className="text-xs text-[rgb(var(--text-tertiary))] font-medium">
              {description}
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
  const { t } = useTranslation('dashboard')

  const roleCategory = getUserRoleCategory(user, activeSchoolId)
  const quickActions = actions || getQuickActionsForRole(roleCategory)

  const gridCols = columns === 2
    ? 'grid-cols-1 sm:grid-cols-2'
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'

  return (
    <WidgetSection
      widgetId="quick-actions"
      label={t('quickActions')}
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
