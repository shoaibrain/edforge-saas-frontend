/**
 * Student Identity Resolution Hook
 *
 * Resolves the current student's identity by calling the students API.
 * DataScopeService on the backend returns only the student record
 * matching the authenticated user's email, so we just take the first result.
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'
import { useAuthStore } from '../stores/auth.store'
import { useAppStore } from '../stores/app.store'

interface StudentProfile {
  studentId: string
  firstName: string
  lastName: string
  email: string
  gradeLevel?: string
  enrollmentStatus?: string
  schoolId: string
  [key: string]: unknown
}

interface StudentsResponse {
  items: StudentProfile[]
}

export function useStudentIdentity() {
  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const isStudent = !!activeSchoolId && user?.assignments?.[activeSchoolId] === 'Student'

  const { data, isLoading, error } = useQuery({
    queryKey: ['student-identity', activeSchoolId],
    queryFn: async () => {
      const response = await apiGet<StudentsResponse>('/academics/students', {
        schoolId: activeSchoolId,
        limit: 1,
      })
      return response.items?.[0] ?? null
    },
    enabled: !!activeSchoolId && isStudent,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })

  return {
    studentId: data?.studentId ?? null,
    studentProfile: data ?? null,
    isStudent,
    isLoading,
    error,
  }
}
