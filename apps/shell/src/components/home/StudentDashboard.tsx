/**
 * StudentDashboard — V2
 *
 * Home page layout for students, migrated to V2 design system.
 *
 * Sprint 3 enhancements:
 * - 3.5a: V2 layout wrapper with motion container
 * - 3.5b: Student KPI tiles — DEFERRED (no student-specific API endpoints available)
 *         Backend task required: /academics/students/:id/attendance-summary
 *                                /academics/students/:id/grades-summary
 * - Welcome card with relevant student links
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link } from '@tanstack/react-router'
import {
  GraduationCap,
  ClipboardCheck,
  CalendarDays,
  BookOpen,
  ArrowRight,
} from 'lucide-react'
import { useTranslation } from '@edforge/i18n'
import { SectionErrorBoundary } from './SectionErrorBoundary'

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const sectionVariants = prefersReducedMotion
  ? undefined
  : { hidden: { opacity: 0 }, visible: { opacity: 1 } }

const staggerContainer = prefersReducedMotion
  ? undefined
  : { visible: { transition: { staggerChildren: 0.06 } } }

interface StudentDashboardProps {
  schoolId: string | null
}

const STUDENT_LINKS = [
  {
    icon: GraduationCap,
    href: '/student-portal/grades',
    color: '#7F77DD',
  },
  {
    icon: ClipboardCheck,
    href: '/student-portal/attendance',
    color: '#EF9F27',
  },
  {
    icon: CalendarDays,
    href: '/student-portal/schedule',
    color: '#378ADD',
  },
  {
    icon: BookOpen,
    href: '/student-portal/assignments',
    color: '#1D9E75',
  },
]

export function StudentDashboard({ schoolId }: StudentDashboardProps) {
  const { t } = useTranslation('dashboard')

  const studentLinks = useMemo(
    () =>
      STUDENT_LINKS.map((link, index) => {
        const labels = [
          { label: t('homeV2.student.grades'), description: t('homeV2.student.gradesDesc') },
          { label: t('homeV2.student.attendanceLink'), description: t('homeV2.student.attendanceDesc') },
          { label: t('homeV2.student.schedule'), description: t('homeV2.student.scheduleDesc') },
          { label: t('homeV2.student.assignments'), description: t('homeV2.student.assignmentsDesc') },
        ]
        return { ...link, ...labels[index] }
      }),
    [t],
  )

  if (!schoolId) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm" style={{ color: 'var(--v2-text-hint)' }}>
          {t('homeV2.selectSchoolTeacher')}
        </p>
      </div>
    )
  }

  return (
    <motion.div
      data-page="home-v2"
      className="flex flex-col"
      style={{
        gap: 'var(--v2-section-gap, 16px)',
        padding: 'var(--v2-content-padding-y, 20px) var(--v2-content-padding-x, 28px)',
        background: 'var(--v2-bg-app)',
        minHeight: '100%',
      }}
      variants={staggerContainer}
      initial={prefersReducedMotion ? undefined : 'hidden'}
      animate="visible"
    >
      {/* Welcome Card */}
      <SectionErrorBoundary fallbackMessage={t('homeV2.errors.unableToLoadDashboard')}>
        <motion.div
          variants={sectionVariants}
          transition={{ duration: 0.2 }}
          className="rounded-xl border"
          style={{
            background: 'var(--v2-bg-surface)',
            borderColor: 'var(--v2-border-default)',
            padding: 18,
          }}
        >
          <h2
            className="text-sm font-medium mb-1"
            style={{ color: 'var(--v2-text-secondary)' }}
          >
            {t('homeV2.student.welcomeTitle')}
          </h2>
          <p className="text-xs mb-4" style={{ color: 'var(--v2-text-hint)' }}>
            {t('homeV2.student.welcomeDescription')}
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 'var(--v2-grid-gap, 12px)' }}>
            {studentLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.label}
                  to={link.href as any}
                  className="flex flex-col gap-2 p-3 rounded-lg transition-colors"
                  style={{ background: 'var(--v2-bg-elevated)' }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${link.color}15` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: link.color }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--v2-text-muted)' }}>
                      {link.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--v2-text-hint)' }}>
                      {link.description}
                    </p>
                  </div>
                  <ArrowRight className="w-3 h-3 mt-auto" style={{ color: 'var(--v2-text-faint)' }} />
                </Link>
              )
            })}
          </div>
        </motion.div>
      </SectionErrorBoundary>
    </motion.div>
  )
}
