/**
 * EmptyOverviewState
 *
 * Onboarding checklist shown when a school has no academic data yet.
 * Links guide the user through initial setup steps.
 */

import { motion } from 'framer-motion'
import { Link } from '@tanstack/react-router'
import {
  Users,
  GraduationCap,
  Calendar,
  BookOpen,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { Card } from '@edforge/ui'

const SETUP_STEPS = [
  {
    icon: Users,
    title: 'Add your first students',
    description: 'Import or create student records to get started',
    href: '/academics/students',
    iconBg: 'bg-[rgb(var(--state-info-bg)/0.18)]0/15',
    iconColor: 'text-[rgb(var(--action-secondary-fg))] ',
  },
  {
    icon: GraduationCap,
    title: 'Create course sections',
    description: 'Set up your classes and assign teachers',
    href: '/academics/classrooms',
    iconBg: 'bg-[rgb(var(--state-info-fg))]/15',
    iconColor: 'text-[rgb(var(--state-info-fg))]',
  },
  {
    icon: Calendar,
    title: 'Set up your academic calendar',
    description: 'Configure academic years, terms, and holidays',
    href: '/academics/schoolcalendar',
    iconBg: 'bg-amber-400/20',
    iconColor: 'text-[rgb(var(--state-warning-fg))]',
  },
  {
    icon: BookOpen,
    title: 'Configure grading policies',
    description: 'Define grading scales, categories, and weights',
    href: '/academics/classrooms?tab=gradebook',
    iconBg: 'bg-[rgb(var(--state-success-fg))]/20',
    iconColor: 'text-[rgb(var(--state-success-fg))]',
  },
]

export function EmptyOverviewState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto"
    >
      <Card className="p-8 border-border-secondary">
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-[rgb(var(--state-info-bg)/0.18)] to-[rgb(var(--state-info-bg)/0.10)] border border-[rgb(var(--border-focus)/0.35)] mb-4"
          >
            <Sparkles className="w-7 h-7 text-[rgb(var(--action-secondary-fg))] " />
          </motion.div>
          <h2 className="text-xl font-bold text-text-primary">
            Welcome to Academics
          </h2>
          <p className="text-sm text-text-secondary mt-1.5 max-w-md mx-auto">
            Get started by setting up your school's academic foundation.
            Complete these steps to unlock your overview dashboard.
          </p>
        </div>

        <div className="space-y-3">
          {SETUP_STEPS.map((step, index) => (
            <motion.div
              key={step.href}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.08 }}
            >
              <Link to={step.href}>
                <div className="group flex items-center gap-4 p-4 rounded-xl hover:bg-interactive-hover transition-colors cursor-pointer">
                  <div className={`p-2.5 rounded-xl ${step.iconBg} flex-shrink-0`}>
                    <step.icon className={`w-5 h-5 ${step.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary group-hover:text-[rgb(var(--action-secondary-fg))] dark:group-hover:text-[rgb(var(--state-info-fg))] transition-colors">
                      {step.title}
                    </p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {step.description}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-tertiary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  )
}
