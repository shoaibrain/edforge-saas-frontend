/**
 * MySectionsCard
 *
 * Teacher-specific card showing their assigned sections.
 * Mirrors the academics MySectionsWidget pattern.
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
import type { TeacherSectionItem } from '../../services/home.service'

interface MySectionsCardProps {
  sections: TeacherSectionItem[]
  isLoading: boolean
}

function SectionsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-16 bg-[rgb(var(--surface-tertiary))] rounded-lg animate-pulse"
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

  return (
    <Card className="p-5 border-[rgb(var(--border-primary))]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
            My Sections
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
          className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:underline"
        >
          View all
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {isLoading ? (
        <SectionsSkeleton />
      ) : sections.length === 0 ? (
        <div className="py-8 text-center">
          <BookOpen className="w-8 h-8 mx-auto text-[rgb(var(--text-tertiary))] mb-2" />
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            No sections assigned
          </p>
          <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
            Contact your administrator to be assigned to class sections.
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

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sections.map((section) => (
              <div
                key={section.sectionId}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[rgb(var(--surface-secondary))] hover:bg-[rgb(var(--surface-tertiary))] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
                    {section.courseName || section.courseCode || 'Section'}{' '}
                    <span className="text-[rgb(var(--text-tertiary))] font-normal">
                      — {section.sectionNumber}
                    </span>
                  </p>
                  <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
                    {section.currentEnrollment}/{section.maxEnrollment} students
                    {section.locationRoomNumber &&
                      ` · Room ${section.locationRoomNumber}`}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
                  <Link
                    to="/academics/$"
                    params={{ _splat: 'classrooms?tab=attendance' }}
                    className="p-1.5 rounded-md text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                    title="Take Attendance"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to="/academics/$"
                    params={{ _splat: 'classrooms?tab=gradebook' }}
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
