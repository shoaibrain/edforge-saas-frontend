/**
 * Parent Portal — Child's Schedule Page
 *
 * Displays class schedule for the active child.
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../../lib/api'
import { useAppStore } from '../../stores/app.store'
import { useShell } from '../../lib/shell-context'
import { useParentPortal } from './ParentPortalLayout'
import { Card, CardContent, Skeleton } from '@edforge/ui'
import { Calendar, Clock, MapPin, User } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface StudentSection {
  sectionId: string
  sectionName?: string
  courseId: string
  courseName?: string
  teacherName?: string
  roomNumber?: string
  periodId?: string
  periodName?: string
  startTime?: string
  endTime?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ParentSchedulePage() {
  const { activeChild } = useParentPortal()
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const { activeSchoolYear } = useShell()

  const studentId = activeChild?.studentId

  const { data, isLoading } = useQuery({
    queryKey: ['parent-child-sections', studentId, activeSchoolId, activeSchoolYear?.id],
    queryFn: () =>
      apiGet<StudentSection[]>(`/academics/students/${studentId}/sections`, {
        schoolId: activeSchoolId,
        ...(activeSchoolYear?.id && { academicYearId: activeSchoolYear.id }),
      }),
    enabled: !!studentId && !!activeSchoolId,
    staleTime: 10 * 60 * 1000,
  })

  const sections: StudentSection[] = Array.isArray(data) ? data : (data as any)?.items ?? []

  if (!activeChild) {
    return (
      <div className="p-6">
        <p className="text-sm text-[rgb(var(--text-secondary))]">Please select a child to view schedule.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
        {activeChild.firstName}'s Schedule
        {activeSchoolYear && (
          <span className="text-base font-normal text-[rgb(var(--text-secondary))] ml-2">{activeSchoolYear.name}</span>
        )}
      </h1>

      {sections.length > 0 ? (
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
                        {section.startTime && section.endTime && ` (${section.startTime} - ${section.endTime})`}
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
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="w-12 h-12 text-[rgb(var(--text-tertiary))] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[rgb(var(--text-primary))] mb-2">No Classes Scheduled</h3>
            <p className="text-sm text-[rgb(var(--text-secondary))]">Class schedule will appear once classes are assigned.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
