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
  updateStudentDescriptors,
  deleteStudent,
  createEnrollment,
  checkDuplicateStudents,
  importStudentsCsv,
  importStudentsIemis,
  previewIemisImport,
  startIemisImport,
  getIemisImportJob,
  createParentAccount,
  createStudentAccount,
  linkGuardianToUser,
  parseApiError,
  type StudentDescriptorPatchInput,
  type StudentFilterDto,
  type StudentResponseDto,
  type StudentListResponseDto,
  type StudentProfileResponseDto,
  type CreateStudentDto,
  type UpdateStudentDto,
  type CreateEnrollmentDto,
  type EnrollmentResponseDto,
  type DuplicateCheckParams,
  type DuplicateCheckResult,
  type CsvImportResult,
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
  schoolId?: string
  enabled?: boolean
}

/**
 * Hook to fetch student profile with extended data
 * (enrollment history, attendance summary, etc.)
 */
export function useStudentProfile({
  studentId,
  schoolId,
  enabled = true,
}: UseStudentProfileOptions) {
  return useQuery<StudentProfileResponseDto, Error>({
    queryKey: studentKeys.profile(studentId),
    queryFn: () => getStudentProfile(studentId, schoolId),
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

/**
 * Mutate Ed-Fi descriptor fields on a student (Sprint 3 S3.7).
 * PATCH /academics/students/:id/descriptors — emits a
 * `student.descriptor.edited` audit event on success.
 *
 * Shares the same cache-update pattern as `useUpdateStudent`:
 * invalidate lists, update detail cache with server response,
 * invalidate profile query so UI re-reads fresh values.
 */
export function useUpdateStudentDescriptors() {
  const queryClient = useQueryClient()

  return useMutation<
    StudentResponseDto,
    Error,
    { studentId: string; data: StudentDescriptorPatchInput }
  >({
    mutationFn: ({ studentId, data }) => updateStudentDescriptors(studentId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() })
      queryClient.setQueryData(studentKeys.detail(variables.studentId), data)
      queryClient.invalidateQueries({
        queryKey: studentKeys.profile(variables.studentId),
      })
      toast.success('Demographics updated')
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

// ============================================================================
// CHECK DUPLICATE (Sprint 4)
// ============================================================================

/**
 * Hook to check for duplicate students before registration.
 * Returns a mutation that can be triggered manually.
 */
export function useCheckDuplicate() {
  return useMutation<DuplicateCheckResult, Error, DuplicateCheckParams>({
    mutationFn: (data) => checkDuplicateStudents(data),
  })
}

// ============================================================================
// CSV IMPORT (Sprint 4)
// ============================================================================

/**
 * Hook to import students from CSV data
 */
export function useImportStudentsCsv() {
  const queryClient = useQueryClient()

  return useMutation<
    CsvImportResult,
    Error,
    { students: Record<string, unknown>[]; schoolId: string }
  >({
    mutationFn: (data) => importStudentsCsv(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() })
      if (result.imported > 0) {
        toast.success(`Imported ${result.imported} student${result.imported !== 1 ? 's' : ''} successfully`)
      }
      if (result.errors.length > 0) {
        toast.warning(`${result.errors.length} row${result.errors.length !== 1 ? 's' : ''} had errors`)
      }
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

// ============================================================================
// IEMIS IMPORT (Phase 3.1 — PABSON Nepal government EMIS)
// Sprint C4: split into a sync dry-run preview + an async commit job.
// ============================================================================

import type {
  IemisImportRequest,
  IemisImportResult,
  IemisImportAsyncAck,
  IemisImportJob,
} from '../components/students/iemis/iemis-import.types'

/**
 * @deprecated Sprint C4 split this into `usePreviewIemisImport` (dry-run) +
 * `useStartIemisImport` + `useIemisImportJob` (async commit). Kept so any
 * out-of-tree callers still compile during the rollout window.
 */
export function useImportStudentsIemis() {
  const queryClient = useQueryClient()

  return useMutation<IemisImportResult, Error, IemisImportRequest>({
    mutationFn: (data) => importStudentsIemis(data),
    onSuccess: (_result, variables) => {
      if (!variables.dryRun) {
        queryClient.invalidateQueries({ queryKey: studentKeys.lists() })
      }
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

/**
 * Mutation hook for the IEMIS dry-run preview. Synchronous; backend
 * short-circuits before Phase 3 so it returns well within the 29s
 * gateway timeout even at the 1000-row cap.
 */
export function usePreviewIemisImport() {
  return useMutation<
    IemisImportResult,
    Error,
    Omit<IemisImportRequest, 'dryRun' | 'enrollInAcademicYearId'>
  >({
    mutationFn: (data) => previewIemisImport(data),
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

/**
 * Mutation hook for the real IEMIS commit. Returns 202 + jobId immediately;
 * caller should switch to `useIemisImportJob(jobId)` for polling. Cache
 * invalidation happens in `useIemisImportJob` once the job reaches
 * terminal-succeeded — kicking it off here would invalidate too early.
 */
export function useStartIemisImport() {
  return useMutation<
    IemisImportAsyncAck,
    Error,
    Omit<IemisImportRequest, 'dryRun'>
  >({
    mutationFn: (data) => startIemisImport(data),
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

/**
 * Polling query for an in-flight or completed IEMIS import job. Polls every
 * 2s while the status is `queued` or `running`; stops on terminal status.
 *
 * Pass `jobId === null/undefined` to disable the query (e.g. before the
 * commit mutation has returned).
 */
export function useIemisImportJob(jobId: string | null | undefined) {
  const queryClient = useQueryClient()
  return useQuery<IemisImportJob, Error>({
    queryKey: ['iemis-import-job', jobId],
    queryFn: () => getIemisImportJob(jobId as string),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'succeeded' || status === 'failed' ? false : 2000
    },
    refetchIntervalInBackground: false,
    staleTime: 0,
    gcTime: 60_000,
    // Invalidate the student list once the job ends successfully — this is
    // the right moment because that's when DDB rows become visible.
    select: (data) => {
      if (data.status === 'succeeded') {
        queryClient.invalidateQueries({ queryKey: studentKeys.lists() })
      }
      return data
    },
  })
}

// ============================================================================
// GRANT PORTAL ACCESS (Parent Account)
// ============================================================================

interface GrantPortalAccessParams {
  email: string
  firstName: string
  lastName: string
  phone?: string
  schoolId: string
  studentId: string
  guardianId?: string
}

/**
 * Hook to create a parent portal account and link to guardian.
 * Two-step: (1) create parent account in Identity, (2) link guardian in Academics.
 */
export function useGrantPortalAccess() {
  const queryClient = useQueryClient()

  return useMutation<
    { userId: string; email: string },
    Error,
    GrantPortalAccessParams
  >({
    mutationFn: async (params) => {
      // Step 1: Create parent account
      const result = await createParentAccount(params)

      // Step 2: Link guardian to the new user
      await linkGuardianToUser(
        params.studentId,
        {
          userId: result.userId,
          guardianId: params.guardianId,
          guardianEmail: params.email,
        },
        params.schoolId,
      )

      return { userId: result.userId, email: result.email }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: studentKeys.profile(variables.studentId),
      })
      toast.success('Parent portal account created successfully')
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

// ============================================================================
// CREATE STUDENT PORTAL ACCOUNT
// ============================================================================

interface CreateStudentAccountParams {
  email: string
  firstName: string
  lastName: string
  schoolId: string
  studentId: string
}

/**
 * Hook to create a student portal account.
 */
export function useCreateStudentAccount() {
  const queryClient = useQueryClient()

  return useMutation<
    { userId: string; email: string },
    Error,
    CreateStudentAccountParams
  >({
    mutationFn: async (params) => {
      const result = await createStudentAccount(params)
      return { userId: result.userId, email: result.email }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: studentKeys.profile(variables.studentId),
      })
      toast.success('Student portal account created successfully')
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}
