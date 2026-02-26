/**
 * Student Portal — My Schedule Page
 *
 * Displays the authenticated student's class schedule.
 * Data: GET /academics/students/:id/sections?schoolId=...&academicYearId=...
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../../lib/api'
import { useAppStore } from '../../stores/app.store'
import { useShell } from '../../lib/shell-context'
import { useStudentPortal } from './StudentPortalLayout'
import { Card, CardContent, Skeleton } from '@edforge/ui'
import { Calendar, Clock, MapPin, User, LayoutList, LayoutGrid } from 'lucide-react'
import { Button } from '@edforge/ui'
import type { StudentSectionResponseDto } from '@aibrains/shared-types'

type StudentSection = StudentSectionResponseDto & {
  periodId?: string
  periodName?: string
  dayOfWeek?: string
  startTime?: string
  endTime?: string
  termId?: string
  termName?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function StudentSchedulePage() {
  const { studentId } = useStudentPortal()
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const { activeSchoolYear } = useShell()
  const [view, setView] = useState<'list' | 'grid'>('list')

  const { data, isLoading, error } = useQuery({
    queryKey: ['student-sections', studentId, activeSchoolId, activeSchoolYear?.id],
    queryFn: () =>
      apiGet<StudentSection[]>(
        `/academics/students/${studentId}/sections`,
        {
          schoolId: activeSchoolId,
          ...(activeSchoolYear?.id && { academicYearId: activeSchoolYear.id }),
        }
      ),
    enabled: !!studentId && !!activeSchoolId,
    staleTime: 10 * 60 * 1000,
  })

  // API returns a plain array (not wrapped in {items})
  const sections = Array.isArray(data) ? data : (data as any)?.items ?? []

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="w-12 h-12 text-[rgb(var(--text-tertiary))] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[rgb(var(--text-primary))] mb-2">
              Unable to Load Schedule
            </h3>
            <p className="text-sm text-[rgb(var(--text-secondary))] max-w-sm mx-auto">
              There was an error loading your schedule. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
          My Schedule
          {activeSchoolYear && (
            <span className="text-base font-normal text-[rgb(var(--text-secondary))] ml-2">
              {activeSchoolYear.name}
            </span>
          )}
        </h1>
        <div className="flex items-center gap-1 bg-[rgb(var(--surface-secondary))] rounded-lg p-0.5">
          <Button
            variant={view === 'list' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setView('list')}
          >
            <LayoutList className="w-4 h-4" />
          </Button>
          <Button
            variant={view === 'grid' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setView('grid')}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {sections.length > 0 ? (
        view === 'list' ? (
          <ListView sections={sections} />
        ) : (
          <GridView sections={sections} />
        )
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="w-12 h-12 text-[rgb(var(--text-tertiary))] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[rgb(var(--text-primary))] mb-2">
              No Classes Scheduled
            </h3>
            <p className="text-sm text-[rgb(var(--text-secondary))] max-w-sm mx-auto">
              Your class schedule will appear here once classes are assigned to you.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================================================
// LIST VIEW
// ============================================================================

function ListView({ sections }: { sections: StudentSection[] }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgb(var(--border-primary))]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                  Course
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                  Section
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                  Teacher
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                  Period
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                  Time
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                  Room
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border-primary))]">
              {sections.map((section) => (
                <tr key={section.sectionId} className="hover:bg-[rgb(var(--surface-secondary))]">
                  <td className="px-4 py-3 text-sm font-medium text-[rgb(var(--text-primary))]">
                    {section.courseName ?? 'Course'}
                  </td>
                  <td className="px-4 py-3 text-sm text-[rgb(var(--text-secondary))]">
                    {section.sectionName ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-[rgb(var(--text-secondary))]">
                    {section.teacherName ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-[rgb(var(--text-secondary))]">
                    {section.periodName ?? section.periodId ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-[rgb(var(--text-secondary))]">
                    {section.startTime && section.endTime
                      ? `${section.startTime} - ${section.endTime}`
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-[rgb(var(--text-secondary))]">
                    {section.roomNumber ?? '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// GRID VIEW
// ============================================================================

function GridView({ sections }: { sections: StudentSection[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sections.map((section) => (
        <Card key={section.sectionId}>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))] mb-3">
              {section.courseName ?? 'Course'}
            </h3>
            <p className="text-xs text-[rgb(var(--text-secondary))] mb-3">
              {section.sectionName ?? '-'}
            </p>
            <div className="space-y-2">
              {section.teacherName && (
                <div className="flex items-center gap-2 text-xs text-[rgb(var(--text-secondary))]">
                  <User className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{section.teacherName}</span>
                </div>
              )}
              {(section.periodName || section.startTime) && (
                <div className="flex items-center gap-2 text-xs text-[rgb(var(--text-secondary))]">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    {section.periodName && `${section.periodName}`}
                    {section.startTime && section.endTime &&
                      ` (${section.startTime} - ${section.endTime})`}
                  </span>
                </div>
              )}
              {section.roomNumber && (
                <div className="flex items-center gap-2 text-xs text-[rgb(var(--text-secondary))]">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Room {section.roomNumber}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
