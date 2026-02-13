/**
 * useCourseOfferings Hooks (Sprint 3 - Task 3.11)
 *
 * React Query hooks for CourseOffering CRUD operations.
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
  getCourseOfferings,
  getCourseOffering,
  createCourseOffering,
  updateCourseOffering,
  deleteCourseOffering,
  parseApiError,
  type CourseOfferingFilterDto,
  type CourseOfferingResponseDto,
  type CourseOfferingListResponseDto,
  type CreateCourseOfferingDto,
  type UpdateCourseOfferingDto,
} from '../services/academics.service'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const courseOfferingKeys = {
  all: ['course-offerings'] as const,
  lists: () => [...courseOfferingKeys.all, 'list'] as const,
  list: (filters: Partial<CourseOfferingFilterDto>) =>
    [...courseOfferingKeys.lists(), filters] as const,
  details: () => [...courseOfferingKeys.all, 'detail'] as const,
  detail: (id: string) => [...courseOfferingKeys.details(), id] as const,
}

// ============================================================================
// LIST COURSE OFFERINGS (INFINITE QUERY)
// ============================================================================

interface UseCourseOfferingsOptions {
  schoolId: string
  courseId?: string
  academicSessionId?: string
  limit?: number
  enabled?: boolean
}

export function useCourseOfferings({
  schoolId,
  courseId,
  academicSessionId,
  limit = 50,
  enabled = true,
}: UseCourseOfferingsOptions) {
  const filters: Partial<CourseOfferingFilterDto> = {
    schoolId,
    ...(courseId && { courseId }),
    ...(academicSessionId && { academicSessionId }),
  }

  return useInfiniteQuery<CourseOfferingListResponseDto, Error>({
    queryKey: courseOfferingKeys.list(filters),
    queryFn: async ({ pageParam }) => {
      return getCourseOfferings({
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
 * Helper to flatten paginated course offering data
 */
export function flattenOfferingPages(
  data: InfiniteData<CourseOfferingListResponseDto> | undefined
): CourseOfferingResponseDto[] {
  if (!data) return []
  return data.pages.flatMap((page) => page.items)
}

// ============================================================================
// GET SINGLE COURSE OFFERING
// ============================================================================

export function useCourseOffering({
  courseOfferingId,
  schoolId,
  enabled = true,
}: {
  courseOfferingId: string
  schoolId: string
  enabled?: boolean
}) {
  return useQuery<CourseOfferingResponseDto, Error>({
    queryKey: courseOfferingKeys.detail(courseOfferingId),
    queryFn: () => getCourseOffering(courseOfferingId, schoolId),
    enabled: enabled && !!courseOfferingId && !!schoolId,
    staleTime: 5 * 60 * 1000,
  })
}

// ============================================================================
// CREATE COURSE OFFERING
// ============================================================================

export function useCreateCourseOffering() {
  const queryClient = useQueryClient()

  return useMutation<CourseOfferingResponseDto, Error, CreateCourseOfferingDto>({
    mutationFn: (data) => createCourseOffering(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseOfferingKeys.lists() })
      toast.success('Course offering created')
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

// ============================================================================
// UPDATE COURSE OFFERING
// ============================================================================

export function useUpdateCourseOffering() {
  const queryClient = useQueryClient()

  return useMutation<
    CourseOfferingResponseDto,
    Error,
    { courseOfferingId: string; schoolId: string; data: UpdateCourseOfferingDto }
  >({
    mutationFn: ({ courseOfferingId, schoolId, data }) =>
      updateCourseOffering(courseOfferingId, schoolId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: courseOfferingKeys.lists() })
      queryClient.setQueryData(
        courseOfferingKeys.detail(variables.courseOfferingId),
        data
      )
      toast.success('Course offering updated')
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

// ============================================================================
// DELETE COURSE OFFERING
// ============================================================================

export function useDeleteCourseOffering() {
  const queryClient = useQueryClient()

  return useMutation<
    void,
    Error,
    { courseOfferingId: string; schoolId: string }
  >({
    mutationFn: ({ courseOfferingId, schoolId }) =>
      deleteCourseOffering(courseOfferingId, schoolId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: courseOfferingKeys.lists() })
      queryClient.removeQueries({
        queryKey: courseOfferingKeys.detail(variables.courseOfferingId),
      })
      toast.success('Course offering deleted')
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}
