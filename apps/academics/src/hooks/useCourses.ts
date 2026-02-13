/**
 * useCourses Hooks
 *
 * React Query hooks for course catalog data fetching.
 * Follows the same pattern as useStudents.ts.
 */

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  parseApiError,
  type CourseFilterDto,
  type CourseResponseDto,
  type CourseListResponseDto,
  type CreateCourseDto,
  type UpdateCourseDto,
} from '../services/academics.service'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (filters: Partial<CourseFilterDto>) => [...courseKeys.lists(), filters] as const,
  details: () => [...courseKeys.all, 'detail'] as const,
  detail: (id: string) => [...courseKeys.details(), id] as const,
}

// ============================================================================
// LIST COURSES (INFINITE QUERY)
// ============================================================================

interface UseCoursesOptions {
  schoolId: string
  filters?: Omit<CourseFilterDto, 'schoolId'>
  limit?: number
  enabled?: boolean
}

/**
 * Hook to fetch paginated list of courses
 * Uses infinite query for "Load More" pagination
 */
export function useCourses({
  schoolId,
  filters = {},
  limit = 50,
  enabled = true,
}: UseCoursesOptions) {
  return useInfiniteQuery<CourseListResponseDto, Error>({
    queryKey: courseKeys.list({ schoolId, ...filters }),
    queryFn: async ({ pageParam }) => {
      return getCourses({
        schoolId,
        ...filters,
        limit,
        cursor: pageParam as string | undefined,
      })
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.lastEvaluatedKey : undefined
    },
    enabled: enabled && !!schoolId,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

/**
 * Helper to flatten paginated course data
 */
export function flattenCoursePages(
  data: InfiniteData<CourseListResponseDto> | undefined
): CourseResponseDto[] {
  if (!data) return []
  return data.pages.flatMap((page) => page.items)
}

/**
 * Helper to get total course count from pages
 */
export function getCourseTotalFromPages(
  data: InfiniteData<CourseListResponseDto> | undefined
): number | undefined {
  if (!data || data.pages.length === 0) return undefined
  return data.pages[0].total
}

// ============================================================================
// GET SINGLE COURSE
// ============================================================================

interface UseCourseOptions {
  courseId: string
  schoolId: string
  enabled?: boolean
}

/**
 * Hook to fetch a single course by ID
 */
export function useCourse({ courseId, schoolId, enabled = true }: UseCourseOptions) {
  return useQuery<CourseResponseDto, Error>({
    queryKey: courseKeys.detail(courseId),
    queryFn: () => getCourse(courseId, schoolId),
    enabled: enabled && !!courseId && !!schoolId,
    staleTime: 5 * 60 * 1000,
  })
}

// ============================================================================
// CREATE COURSE
// ============================================================================

/**
 * Hook to create a new course
 */
export function useCreateCourse() {
  const queryClient = useQueryClient()

  return useMutation<CourseResponseDto, Error, CreateCourseDto>({
    mutationFn: (data) => createCourse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
      toast.success('Course created successfully')
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

// ============================================================================
// UPDATE COURSE
// ============================================================================

/**
 * Hook to update a course
 */
export function useUpdateCourse() {
  const queryClient = useQueryClient()

  return useMutation<
    CourseResponseDto,
    Error,
    { courseId: string; schoolId: string; data: UpdateCourseDto }
  >({
    mutationFn: ({ courseId, schoolId, data }) =>
      updateCourse(courseId, schoolId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
      queryClient.setQueryData(courseKeys.detail(variables.courseId), data)
      toast.success('Course updated successfully')
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

// ============================================================================
// DELETE (DEACTIVATE) COURSE
// ============================================================================

/**
 * Hook to delete/deactivate a course
 */
export function useDeleteCourse() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { courseId: string; schoolId: string }>({
    mutationFn: ({ courseId, schoolId }) => deleteCourse(courseId, schoolId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
      queryClient.removeQueries({ queryKey: courseKeys.detail(variables.courseId) })
      toast.success('Course deactivated successfully')
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}
