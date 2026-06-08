/**
 * Academics Module Overview Page
 *
 * Module overview with:
 * - Stats carousel
 * - Action cards grid
 * - Module tip widget
 */

import { motion } from 'framer-motion'
import {
  GraduationCap,
  Users,
  ClipboardList,
  Calendar,
  BookOpen,
  TrendingUp,
  ArrowRight,
  Layers,
  MapPinHouse,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent } from '@edforge/ui'
import { useShell } from '../../../lib/shell-context'

// ============================================================================
// STATS DATA
// ============================================================================

interface StatItem {
  label: string
  value: string
  change: string
  trend: 'up' | 'down' | 'neutral'
  icon: LucideIcon
}

const STATS: StatItem[] = [
  {
    label: 'Total Students',
    value: '1,234',
    change: '+12 this week',
    trend: 'up',
    icon: GraduationCap,
  },
  {
    label: 'Teachers',
    value: '67',
    change: '3 on leave',
    trend: 'neutral',
    icon: Users,
  },
  {
    label: 'Attendance Rate',
    value: '94.5%',
    change: '+1.2% vs last week',
    trend: 'up',
    icon: ClipboardList,
  },
  {
    label: 'Active Classes',
    value: '42',
    change: '6 sections each',
    trend: 'neutral',
    icon: Layers,
  },
]

// ============================================================================
// ACTION CARDS
// ============================================================================

interface ActionCard {
  id: string
  title: string
  description: string
  icon: LucideIcon
  href: string
  color: 'teal' | 'cyan' | 'golden' | 'aqua'
}

const ACTION_CARDS: ActionCard[] = [
  {
    id: 'students',
    title: 'Students',
    description: 'View and manage student records, enrollment, and profiles',
    icon: GraduationCap,
    href: '/academics/students',
    color: 'teal',
  },
  {
    id: 'teachers',
    title: 'Teachers',
    description: 'Manage teacher assignments, schedules, and certifications',
    icon: Users,
    href: '/academics/teachers',
    color: 'cyan',
  },
  {
    id: 'attendance',
    title: 'Attendance',
    description: 'Track daily attendance, absences, and tardiness patterns',
    icon: ClipboardList,
    href: '/academics/classrooms?tab=attendance',
    color: 'golden',
  },
  {
    id: 'gradebook',
    title: 'Gradebook',
    description: 'Manage grades, assignments, and report cards',
    icon: BookOpen,
    href: '/academics/gradebooks',
    color: 'aqua',
  },
  {
    id: 'gradelevels',
    title: 'Grade Levels',
    description: 'Configure grade levels, sections, and class structures',
    icon: Layers,
    href: '/academics/gradelevels',
    color: 'teal',
  },
  {
    id: 'classrooms',
    title: 'Classrooms',
    description: 'Manage physical classrooms and room assignments',
    icon: MapPinHouse,
    href: '/academics/classrooms',
    color: 'cyan',
  },
  {
    id: 'curriculum',
    title: 'Curriculum',
    description: 'Define courses, subjects, and learning objectives',
    icon: BookOpen,
    href: '/academics/curriculum',
    color: 'golden',
  },
  {
    id: 'calendar',
    title: 'School Calendar',
    description: 'Manage academic years, terms, and important dates',
    icon: Calendar,
    href: '/academics/schoolcalendar',
    color: 'aqua',
  },
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
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex-shrink-0 w-64"
    >
      <Card className="h-full">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[rgb(var(--action-primary-bg))]/10 to-[rgb(var(--action-primary-bg-hover))]/10">
              <Icon className="w-5 h-5 text-[rgb(var(--action-secondary-fg))] " />
            </div>
            <div className="flex-1">
              <p className="text-sm text-[rgb(var(--text-tertiary))]">{stat.label}</p>
              <p className="text-2xl font-bold text-[rgb(var(--text-primary))]">{stat.value}</p>
              <p
                className={`text-xs mt-1 ${
                  stat.trend === 'up'
                    ? 'text-[rgb(var(--state-success-fg))] '
                    : stat.trend === 'down'
                      ? 'text-[rgb(var(--state-danger-fg))] '
                      : 'text-[rgb(var(--text-tertiary))]'
                }`}
              >
                {stat.change}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ============================================================================
// ACTION CARD COMPONENT
// ============================================================================

const colorClasses = {
  teal: 'from-[rgb(var(--action-primary-bg))]/10 to-[rgb(var(--state-info-bg)/0.08)] hover:from-[rgb(var(--action-primary-bg))]/20 hover:to-[rgb(var(--state-info-bg)/0.14)]',
  cyan: 'from-[rgb(var(--state-info-bg)/0.14)] to-[rgb(var(--action-primary-bg-hover))]/5 hover:from-[rgb(var(--state-info-bg)/0.18)] hover:to-[rgb(var(--action-primary-bg-hover))]/10',
  golden: 'from-amber-500/10 to-amber-500/5 hover:from-amber-500/20 hover:to-amber-500/10',
  aqua: 'from-[rgb(var(--state-success-bg)/0.14)] to-[rgb(var(--state-success-bg)/0.08)] hover:from-[rgb(var(--state-success-bg)/0.18)] hover:to-[rgb(var(--state-success-bg)/0.14)]',
}

interface ActionCardProps {
  card: ActionCard
  index: number
  onClick: () => void
}

function ActionCardComponent({ card, index, onClick }: ActionCardProps) {
  const Icon = card.icon
  
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.05 }}
      onClick={onClick}
      className={`group p-6 rounded-2xl bg-gradient-to-br ${colorClasses[card.color]} border border-[rgb(var(--border-primary))] hover:border-[rgb(var(--border-focus))] hover:shadow-lg transition-all duration-200 text-left w-full`}
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-[rgb(var(--surface-secondary))]">
          <Icon className="w-6 h-6 text-[rgb(var(--action-secondary-fg))] " />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-[rgb(var(--text-primary))]">
              {card.title}
            </h3>
            <ArrowRight className="w-5 h-5 text-[rgb(var(--text-tertiary))] group-hover:text-[rgb(var(--action-secondary-fg))] group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-sm text-[rgb(var(--text-tertiary))] line-clamp-2">
            {card.description}
          </p>
        </div>
      </div>
    </motion.button>
  )
}

// ============================================================================
// ACADEMICS PAGE COMPONENT
// ============================================================================

export default function AcademicsPlaceholder() {
  const { activeSchool, navigate } = useShell()

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[rgb(var(--action-primary-bg))] to-[rgb(var(--action-primary-bg-hover))]">
            <GraduationCap className="w-8 h-8 text-[rgb(var(--action-primary-fg))]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
              Academics
            </h1>
            <p className="text-[rgb(var(--text-secondary))]">
              {activeSchool?.name || 'Your school'} academic management
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Carousel */}
      <div className="overflow-x-auto pb-2 -mx-6 px-6 scrollbar-thin">
        <div className="flex gap-4">
          {STATS.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} index={index} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-4">
          Manage
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ACTION_CARDS.map((card, index) => (
            <ActionCardComponent
              key={card.id}
              card={card}
              index={index}
              onClick={() => navigate(card.href)}
            />
          ))}
        </div>
      </div>

      {/* Module Tip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-[rgb(var(--action-primary-bg))]/5 via-[rgb(var(--state-info-bg)/0.08)] to-[rgb(var(--state-info-bg)/0.08)] border border-[rgb(var(--border-focus))]/20"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-[rgb(var(--action-primary-bg))]/10">
            <TrendingUp className="w-6 h-6 text-[rgb(var(--action-secondary-fg))] " />
          </div>
          <div>
            <h3 className="font-semibold text-[rgb(var(--text-primary))] mb-1">
              Academics Module
            </h3>
            <p className="text-sm text-[rgb(var(--text-secondary))]">
              This is the Academics module overview. From here you can manage all aspects of your
              school's academic operations including students, teachers, attendance, grades, and curriculum.
              Use the sidebar navigation for quick access to specific features.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
