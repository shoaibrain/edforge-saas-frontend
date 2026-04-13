/**
 * useStudentSections — Shell-local hook for student enrolled sections
 *
 * Follows the portal hook pattern from usePortalStudentGrades.ts.
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'

export const portalSectionKeys = {
  all: ['portal-sections'] as const,
  lists: () => [...portalSectionKeys.all, 'list'] as const,
  list: (studentId: string) =>
    [...portalSectionKeys.lists(), studentId] as const,
}

export interface StudentSection {
  sectionId: string
  sectionName: string
  courseId: string
  courseName: string
  courseCode?: string
  teacherId?: string
  teacherName?: string
  room?: string
  periodId?: string
  gradeLevel?: string
  enrollmentStatus?: string
}

export function useStudentSections(
  studentId: string,
  schoolId: string,
  options?: { academicYearId?: string }
) {
  return useQuery({
    queryKey: portalSectionKeys.list(studentId),
    queryFn: () =>
      apiGet<StudentSection[]>(
        `/academics/students/${studentId}/sections`,
        {
          schoolId,
          ...(options?.academicYearId && { academicYearId: options.academicYearId }),
        }
      ),
    enabled: !!studentId && !!schoolId,
    staleTime: 10 * 60 * 1000, // 10 minutes — sections rarely change
  })
}
