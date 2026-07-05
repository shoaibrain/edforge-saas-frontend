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
  /** Render only the summary + section list (no card chrome / title / link) for WidgetCard framing. */
  bare?: boolean
}

function SectionsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-16 rounded-lg v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
      ))}
    </div>
  )
}

export function MySectionsCard({ sections, isLoading, bare }: MySectionsCardProps) {
  const totalStudents = useMemo(
    () => sections.reduce((sum, s) => sum + s.currentEnrollment, 0),
    [sections],
  )
  const { t } = useTranslation('dashboard')

  const content = (
    <>
      {isLoading ? (
        <SectionsSkeleton />
      ) : sections.length === 0 ? (
        <div className="py-8 text-center">
          <BookOpen className="w-8 h-8 mx-auto mb-2 text-[rgb(var(--text-disabled))]" />
          <p className="text-sm text-[rgb(var(--text-tertiary))]">
            {t('homeV2.teacher.noSectionsAssigned')}
          </p>
          <p className="text-xs mt-1 text-[rgb(var(--text-tertiary))]">
            {t('homeV2.teacher.contactAdmin')}
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-3 text-xs text-[rgb(var(--text-tertiary))]">
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
                className="flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors bg-[rgb(var(--background-tertiary))]"
                aria-label={`${section.courseName || section.courseCode || 'Section'} ${section.sectionNumber}, ${section.currentEnrollment} students`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate text-[rgb(var(--text-tertiary))]">
                    {section.courseName || section.courseCode || 'Section'}{' '}
                    <span className="font-normal text-[rgb(var(--text-tertiary))]">
                      — {section.sectionNumber}
                    </span>
                  </p>
                  <p className="text-xs mt-0.5 text-[rgb(var(--text-tertiary))]">
                    {section.currentEnrollment}/{section.maxEnrollment} students
                    {section.locationRoomNumber &&
                      ` · Room ${section.locationRoomNumber}`}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 ms-3 flex-shrink-0">
                  <Link
                    to="/academics/$"
                    params={{ _splat: `classrooms/${section.sectionId}?tab=attendance` }}
                    className="p-1.5 rounded-md transition-opacity hover:opacity-70 text-[rgb(var(--state-warning-fg))]"
                    title={t('homeV2.teacher.takeAttendance')}
                    aria-label={`Take attendance for ${section.courseName || section.sectionNumber}`}
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to="/academics/$"
                    params={{ _splat: `classrooms/${section.sectionId}?tab=gradebook` }}
                    className="p-1.5 rounded-md transition-opacity hover:opacity-70 text-[#7F77DD]"
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
    </>
  )

  if (bare) return content

  return (
    <div
      // allow-presentation-style: card padding (18px) is off the 4px scale
      className="rounded-xl border bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary)/0.35)]"
      style={{ padding: 18 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-[rgb(var(--accent-academics-text))]" />
          <h3 className="text-sm font-medium text-[rgb(var(--text-secondary))]">
            {t('homeV2.teacher.mySections')}
          </h3>
          {!isLoading && (
            <span className="text-xs text-[rgb(var(--text-tertiary))]">
              ({sections.length})
            </span>
          )}
        </div>
        <Link
          to="/academics/$"
          params={{ _splat: 'classrooms' }}
          className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-80 text-[#1D9E75]"
        >
          {t('homeV2.teacher.viewAll')}
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {content}
    </div>
  )
}
