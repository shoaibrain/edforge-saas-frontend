/**
 * useStudents Hook
 *
 * React Query hooks for student data fetching.
 * Uses infinite query for cursor-based pagination.
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
  getStudents,
  getStudent,
  getStudentProfile,
  createStudent,
  updateStudent,
  deleteStudent,
  createEnrollment,
  parseApiError,
  type StudentFilterDto,
  type StudentResponseDto,
  type StudentListResponseDto,
  type StudentProfileResponseDto,
  type CreateStudentDto,
  type UpdateStudentDto,
  type CreateEnrollmentDto,
  type EnrollmentResponseDto,
} from '../services/academics.service'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const studentKeys = {
  all: ['students'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  list: (filters: StudentFilterDto) => [...studentKeys.lists(), filters] as const,
  details: () => [...studentKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
  profiles: () => [...studentKeys.all, 'profile'] as const,
  profile: (id: string) => [...studentKeys.profiles(), id] as const,
}

// ============================================================================
// LIST STUDENTS (INFINITE QUERY)
// ============================================================================

interface UseStudentsOptions {
  schoolId: string
  filters?: Omit<StudentFilterDto, 'schoolId'>
  limit?: number
  enabled?: boolean
}

/**
 * Hook to fetch paginated list of students
 * Uses infinite query for "Load More" pagination
 */
export function useStudents({
  schoolId,
  filters = {},
  limit = 20,
  enabled = true,
}: UseStudentsOptions) {
  return useInfiniteQuery<StudentListResponseDto, Error>({
    queryKey: studentKeys.list({ schoolId, ...filters }),
    queryFn: async ({ pageParam }) => {
      return getStudents({
        schoolId,
        ...filters,
        limit,
        cursor: pageParam as string | undefined,
      })
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      // Return the cursor for next page, or undefined if no more pages
      return lastPage.hasMore ? lastPage.lastEvaluatedKey : undefined
    },
    enabled: enabled && !!schoolId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  })
}

/**
 * Helper to get flattened student list from infinite query data
 */
export function flattenStudentPages(
  data: InfiniteData<StudentListResponseDto> | undefined
): StudentResponseDto[] {
  if (!data) return []
  return data.pages.flatMap((page) => page.items)
}

/**
 * Helper to get total count from infinite query data
 */
export function getTotalFromPages(
  data: InfiniteData<StudentListResponseDto> | undefined
): number | undefined {
  if (!data || data.pages.length === 0) return undefined
  return data.pages[0].total
}

// ============================================================================
// GET SINGLE STUDENT
// ============================================================================

interface UseStudentOptions {
  studentId: string
  enabled?: boolean
}

/**
 * Hook to fetch a single student by ID
 */
export function useStudent({ studentId, enabled = true }: UseStudentOptions) {
  return useQuery<StudentResponseDto, Error>({
    queryKey: studentKeys.detail(studentId),
    queryFn: () => getStudent(studentId),
    enabled: enabled && !!studentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// ============================================================================
// GET STUDENT PROFILE (EXTENDED)
// ============================================================================

interface UseStudentProfileOptions {
  studentId: string
  enabled?: boolean
}

/**
 * Hook to fetch student profile with extended data
 * (enrollment history, attendance summary, etc.)
 */
export function useStudentProfile({
  studentId,
  enabled = true,
}: UseStudentProfileOptions) {
  return useQuery<StudentProfileResponseDto, Error>({
    queryKey: studentKeys.profile(studentId),
    queryFn: () => getStudentProfile(studentId),
    enabled: enabled && !!studentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// ============================================================================
// UPDATE STUDENT
// ============================================================================

/**
 * Hook to update a student
 */
export function useUpdateStudent() {
  const queryClient = useQueryClient()

  return useMutation<
    StudentResponseDto,
    Error,
    { studentId: string; data: UpdateStudentDto }
  >({
    mutationFn: ({ studentId, data }) => updateStudent(studentId, data),
    onSuccess: (data, variables) => {
      // Invalidate student lists
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() })

      // Update the specific student in cache
      queryClient.setQueryData(studentKeys.detail(variables.studentId), data)

      // Invalidate profile if it exists
      queryClient.invalidateQueries({
        queryKey: studentKeys.profile(variables.studentId),
      })

      toast.success('Student updated successfully')
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

// ============================================================================
// CREATE STUDENT
// ============================================================================

/**
 * Hook to create a new student
 * Invalidates the students list on success
 */
export function useCreateStudent() {
  const queryClient = useQueryClient()

  return useMutation<StudentResponseDto, Error, CreateStudentDto>({
    mutationFn: (data) => createStudent(data),
    onSuccess: () => {
      // Invalidate student lists so they refetch with the new student
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() })
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

// ============================================================================
// CREATE ENROLLMENT
// ============================================================================

/**
 * Hook to create an enrollment for a student
 */
export function useCreateEnrollment() {
  const queryClient = useQueryClient()

  return useMutation<EnrollmentResponseDto, Error, CreateEnrollmentDto>({
    mutationFn: (data) => createEnrollment(data),
    onSuccess: (_, variables) => {
      // Invalidate the student's profile so enrollment shows up
      queryClient.invalidateQueries({
        queryKey: studentKeys.profile(variables.studentId),
      })
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() })
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

// ============================================================================
// DELETE STUDENT
// ============================================================================

/**
 * Hook to delete a student
 */
export function useDeleteStudent() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (studentId) => deleteStudent(studentId),
    onSuccess: (_, studentId) => {
      // Invalidate student lists
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() })

      // Remove from detail cache
      queryClient.removeQueries({ queryKey: studentKeys.detail(studentId) })

      // Remove from profile cache
      queryClient.removeQueries({ queryKey: studentKeys.profile(studentId) })

      toast.success('Student removed successfully')
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}
