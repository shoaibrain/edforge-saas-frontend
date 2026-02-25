/**
 * MySectionsWidget
 *
 * Teacher-specific overview widget showing their assigned sections.
 * Replaces the Enrollment Distribution chart for Teacher role.
 * Self-contained: fetches sections via useSections hook (backend scopes to teacher's sections).
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
import { Card } from '@edforge/ui'
import { useSections, flattenSectionPages } from '../../hooks/useSections'
import { useCurrentAcademicYear } from '../../hooks/useSchool'

// ============================================================================
// TYPES
// ============================================================================

interface MySectionsWidgetProps {
  schoolId: string
}

// ============================================================================
// SKELETON
// ============================================================================

function SectionsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-16 bg-surface-hover rounded-lg animate-pulse"
        />
      ))}
    </div>
  )
}

// ============================================================================
// WIDGET
// ============================================================================

export function MySectionsWidget({ schoolId }: MySectionsWidgetProps) {
  const { data: currentYear } = useCurrentAcademicYear(schoolId)

  const { data: sectionsData, isLoading } = useSections({
    schoolId,
    filters: { isActive: true, academicYearId: currentYear?.yearId },
    enabled: !!schoolId,
  })

  const sections = useMemo(() => flattenSectionPages(sectionsData), [sectionsData])

  const totalStudents = useMemo(
    () => sections.reduce((sum, s) => sum + s.currentEnrollment, 0),
    [sections],
  )

  return (
    <Card className="p-5 border-border-secondary">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-text-primary">
            My Sections
          </h3>
          {!isLoading && (
            <span className="text-xs text-text-tertiary">
              ({sections.length})
            </span>
          )}
        </div>
        <Link
          to="/scheduling"
          className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:underline"
        >
          View all
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Content */}
      {isLoading ? (
        <SectionsSkeleton />
      ) : sections.length === 0 ? (
        <div className="py-8 text-center">
          <BookOpen className="w-8 h-8 mx-auto text-text-tertiary mb-2" />
          <p className="text-sm text-text-secondary">
            No sections assigned
          </p>
          <p className="text-xs text-text-tertiary mt-1">
            Contact your administrator to be assigned to class sections.
          </p>
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div className="flex items-center gap-4 mb-3 text-xs text-text-tertiary">
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />
              {sections.length} section{sections.length !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {totalStudents} student{totalStudents !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Section list */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sections.map((section) => (
              <div
                key={section.sectionId}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-surface-secondary hover:bg-surface-hover transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {section.courseName || section.courseCode || 'Section'}{' '}
                    <span className="text-text-tertiary font-normal">
                      — {section.sectionNumber}
                    </span>
                  </p>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {section.currentEnrollment}/{section.maxEnrollment} students
                    {section.locationRoomNumber && ` · Room ${section.locationRoomNumber}`}
                  </p>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
                  <Link
                    to="/attendance"
                    className="p-1.5 rounded-md text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                    title="Take Attendance"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to="/grades"
                    className="p-1.5 rounded-md text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors"
                    title="Enter Grades"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}
