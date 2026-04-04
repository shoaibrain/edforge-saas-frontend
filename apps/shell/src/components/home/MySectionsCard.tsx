/**
 * MySectionsCard — V2
 *
 * Teacher-specific card showing their assigned sections.
 * Migrated to V2 design tokens (Ticket 3.2).
 *
 * - V2 CSS custom properties replace hardcoded colors
 * - rounded-xl border pattern matching other V2 cards
 * - ARIA labels on section list items
 */

import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import {
  CalendarDays,
  Users,
  ClipboardCheck,
  GraduationCap,
  ArrowRight,
  BookOpen,
} from 'lucide-react'
import type { TeacherSectionItem } from '../../services/home.service'
import { useTranslation } from '@edforge/i18n'

interface MySectionsCardProps {
  sections: TeacherSectionItem[]
  isLoading: boolean
}

function SectionsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-16 rounded-lg v2-skeleton-pulse"
          style={{ background: 'var(--v2-bg-elevated)' }}
        />
      ))}
    </div>
  )
}

export function MySectionsCard({ sections, isLoading }: MySectionsCardProps) {
  const totalStudents = useMemo(
    () => sections.reduce((sum, s) => sum + s.currentEnrollment, 0),
    [sections],
  )
  const { t } = useTranslation('dashboard')

  return (
    <div
      className="rounded-xl border"
      style={{
        background: 'var(--v2-bg-surface)',
        borderColor: 'var(--v2-border-default)',
        padding: 18,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4" style={{ color: '#378ADD' }} />
          <h3
            className="text-[13px] font-medium"
            style={{ color: 'var(--v2-text-secondary)' }}
          >
            {t('homeV2.teacher.mySections')}
          </h3>
          {!isLoading && (
            <span className="text-[11px]" style={{ color: 'var(--v2-text-hint)' }}>
              ({sections.length})
            </span>
          )}
        </div>
        <Link
          to="/academics/$"
          params={{ _splat: 'classrooms' }}
          className="flex items-center gap-1 text-[11px] font-medium transition-opacity hover:opacity-80"
          style={{ color: 'var(--v2-brand-primary)' }}
        >
          {t('homeV2.teacher.viewAll')}
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {isLoading ? (
        <SectionsSkeleton />
      ) : sections.length === 0 ? (
        <div className="py-8 text-center">
          <BookOpen className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--v2-text-faint)' }} />
          <p className="text-sm" style={{ color: 'var(--v2-text-muted)' }}>
            {t('homeV2.teacher.noSectionsAssigned')}
          </p>
          <p className="text-[11px] mt-1" style={{ color: 'var(--v2-text-hint)' }}>
            {t('homeV2.teacher.contactAdmin')}
          </p>
        </div>
      ) : (
        <>
          <div
            className="flex items-center gap-4 mb-3 text-[11px]"
            style={{ color: 'var(--v2-text-hint)' }}
          >
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />
              {sections.length} section{sections.length !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {totalStudents} student{totalStudents !== 1 ? 's' : ''}
            </span>
          </div>

          <ul
            className="space-y-2 max-h-64 overflow-y-auto"
            role="list"
            aria-label="Assigned sections"
          >
            {sections.map((section) => (
              <li
                key={section.sectionId}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors"
                style={{ background: 'var(--v2-bg-elevated)' }}
                aria-label={`${section.courseName || section.courseCode || 'Section'} ${section.sectionNumber}, ${section.currentEnrollment} students`}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className="text-xs font-medium truncate"
                    style={{ color: 'var(--v2-text-muted)' }}
                  >
                    {section.courseName || section.courseCode || 'Section'}{' '}
                    <span style={{ color: 'var(--v2-text-hint)', fontWeight: 400 }}>
                      — {section.sectionNumber}
                    </span>
                  </p>
                  <p
                    className="text-[11px] mt-0.5"
                    style={{ color: 'var(--v2-text-hint)' }}
                  >
                    {section.currentEnrollment}/{section.maxEnrollment} students
                    {section.locationRoomNumber &&
                      ` · Room ${section.locationRoomNumber}`}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
                  <Link
                    to="/academics/$"
                    params={{ _splat: `classrooms/${section.sectionId}?tab=attendance` }}
                    className="p-1.5 rounded-md transition-opacity hover:opacity-70"
                    style={{ color: 'var(--v2-warning)' }}
                    title={t('homeV2.teacher.takeAttendance')}
                    aria-label={`Take attendance for ${section.courseName || section.sectionNumber}`}
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to="/academics/$"
                    params={{ _splat: `classrooms/${section.sectionId}?tab=gradebook` }}
                    className="p-1.5 rounded-md transition-opacity hover:opacity-70"
                    style={{ color: '#7F77DD' }}
                    title={t('homeV2.teacher.enterGrades')}
                    aria-label={`Enter grades for ${section.courseName || section.sectionNumber}`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
