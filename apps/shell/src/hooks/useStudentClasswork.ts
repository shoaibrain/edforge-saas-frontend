/**
 * useStudentClasswork — Shell-local hook for aggregated classwork
 *
 * Fetches classwork across multiple sections and merges by due date.
 * Uses useQueries for parallel fetching.
 * Follows the portal hook pattern from usePortalStudentGrades.ts.
 */

import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'
import { apiGet } from '../lib/api'

export const portalClassworkKeys = {
  all: ['portal-classwork'] as const,
  section: (sectionId: string) =>
    [...portalClassworkKeys.all, 'section', sectionId] as const,
}

export interface ClassworkItem {
  id: string
  sectionId: string
  sectionName?: string
  courseId?: string
  courseName?: string
  title: string
  description?: string
  type: string
  dueDate?: string
  status?: string
  pointsPossible?: number
  createdAt: string
}

export function useStudentClasswork(sectionIds: string[]) {
  const queries = useQueries({
    queries: sectionIds.map((sectionId) => ({
      queryKey: portalClassworkKeys.section(sectionId),
      queryFn: () =>
        apiGet<ClassworkItem[]>(
          `/academics/sections/${sectionId}/classwork`
        ),
      staleTime: 5 * 60 * 1000,
      enabled: !!sectionId,
    })),
  })

  const isLoading = queries.some((q) => q.isLoading)
  const isError = queries.some((q) => q.isError)

  const items = useMemo(() => {
    const all: ClassworkItem[] = []
    for (const q of queries) {
      if (q.data) {
        all.push(...q.data)
      }
    }
    return all.sort((a, b) => {
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })
  }, [queries])

  return { data: items, isLoading, isError, queries }
}
