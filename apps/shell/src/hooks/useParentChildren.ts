/**
 * Parent Children Resolution Hook
 *
 * Resolves the children linked to the current parent user.
 * DataScopeService on the backend returns only students linked
 * to the authenticated parent's guardianship records.
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'
import { useAuthStore } from '../stores/auth.store'
import { useAppStore } from '../stores/app.store'

export interface ChildProfile {
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
  items: ChildProfile[]
}

export function useParentChildren() {
  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const isParent = !!activeSchoolId && user?.assignments?.[activeSchoolId] === 'Parent'

  const { data, isLoading, error } = useQuery({
    queryKey: ['parent-children', activeSchoolId],
    queryFn: async () => {
      const response = await apiGet<StudentsResponse>('/academics/students', {
        schoolId: activeSchoolId,
        limit: 50,
      })
      return response.items ?? []
    },
    enabled: !!activeSchoolId && isParent,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })

  return {
    children: data ?? [],
    isParent,
    isLoading,
    error,
  }
}
