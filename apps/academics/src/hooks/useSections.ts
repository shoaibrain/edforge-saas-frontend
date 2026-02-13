/**
 * useSections Hooks
 *
 * React Query hooks for section CRUD and roster management.
 * Follows the same pattern as useCourses.ts.
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
  getSections,
  getSection,
  createSection,
  updateSection,
  deleteSection,
  getSectionRoster,
  enrollStudentInSection,
  removeStudentFromSection,
  parseApiError,
  type SectionFilterDto,
  type SectionResponseDto,
  type SectionListResponseDto,
  type SectionRosterResponseDto,
  type CreateSectionDto,
  type UpdateSectionDto,
} from '../services/academics.service'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const sectionKeys = {
  all: ['sections'] as const,
  lists: () => [...sectionKeys.all, 'list'] as const,
  list: (filters: Partial<SectionFilterDto>) => [...sectionKeys.lists(), filters] as const,
  details: () => [...sectionKeys.all, 'detail'] as const,
  detail: (id: string) => [...sectionKeys.details(), id] as const,
  rosters: () => [...sectionKeys.all, 'roster'] as const,
  roster: (id: string) => [...sectionKeys.rosters(), id] as const,
}

// ============================================================================
// LIST SECTIONS (INFINITE QUERY)
// ============================================================================

interface UseSectionsOptions {
  schoolId: string
  filters?: Omit<SectionFilterDto, 'schoolId'>
  limit?: number
  enabled?: boolean
}

/**
 * Hook to fetch paginated list of sections
 */
export function useSections({
  schoolId,
  filters = {},
  limit = 50,
  enabled = true,
}: UseSectionsOptions) {
  return useInfiniteQuery<SectionListResponseDto, Error>({
    queryKey: sectionKeys.list({ schoolId, ...filters }),
    queryFn: async ({ pageParam }) => {
      return getSections({
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
 * Helper to flatten paginated section data
 */
export function flattenSectionPages(
  data: InfiniteData<SectionListResponseDto> | undefined
): SectionResponseDto[] {
  if (!data) return []
  return data.pages.flatMap((page) => page.items)
}

/**
 * Helper to get total section count from pages
 */
export function getSectionTotalFromPages(
  data: InfiniteData<SectionListResponseDto> | undefined
): number | undefined {
  if (!data || data.pages.length === 0) return undefined
  return data.pages[0].total
}

// ============================================================================
// GET SINGLE SECTION
// ============================================================================

interface UseSectionOptions {
  sectionId: string
  schoolId: string
  enabled?: boolean
}

/**
 * Hook to fetch a single section by ID
 */
export function useSection({ sectionId, schoolId, enabled = true }: UseSectionOptions) {
  return useQuery<SectionResponseDto, Error>({
    queryKey: sectionKeys.detail(sectionId),
    queryFn: () => getSection(sectionId, schoolId),
    enabled: enabled && !!sectionId && !!schoolId,
    staleTime: 5 * 60 * 1000,
  })
}

// ============================================================================
// SECTION ROSTER
// ============================================================================

interface UseSectionRosterOptions {
  sectionId: string
  schoolId: string
  enabled?: boolean
}

/**
 * Hook to fetch section roster (enrolled students)
 */
export function useSectionRoster({
  sectionId,
  schoolId,
  enabled = true,
}: UseSectionRosterOptions) {
  return useQuery<SectionRosterResponseDto, Error>({
    queryKey: sectionKeys.roster(sectionId),
    queryFn: () => getSectionRoster(sectionId, schoolId),
    enabled: enabled && !!sectionId && !!schoolId,
    staleTime: 2 * 60 * 1000,
  })
}

// ============================================================================
// CREATE SECTION
// ============================================================================

export function useCreateSection() {
  const queryClient = useQueryClient()

  return useMutation<SectionResponseDto, Error, CreateSectionDto>({
    mutationFn: (data) => createSection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sectionKeys.lists() })
      toast.success('Section created successfully')
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

// ============================================================================
// UPDATE SECTION
// ============================================================================

export function useUpdateSection() {
  const queryClient = useQueryClient()

  return useMutation<
    SectionResponseDto,
    Error,
    { sectionId: string; schoolId: string; data: UpdateSectionDto }
  >({
    mutationFn: ({ sectionId, schoolId, data }) =>
      updateSection(sectionId, schoolId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: sectionKeys.lists() })
      queryClient.setQueryData(sectionKeys.detail(variables.sectionId), data)
      toast.success('Section updated successfully')
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

// ============================================================================
// DELETE (DEACTIVATE) SECTION
// ============================================================================

export function useDeleteSection() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { sectionId: string; schoolId: string }>({
    mutationFn: ({ sectionId, schoolId }) => deleteSection(sectionId, schoolId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: sectionKeys.lists() })
      queryClient.removeQueries({ queryKey: sectionKeys.detail(variables.sectionId) })
      toast.success('Section deactivated successfully')
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

// ============================================================================
// ENROLL STUDENT IN SECTION
// ============================================================================

export function useEnrollStudent() {
  const queryClient = useQueryClient()

  return useMutation<
    void,
    Error,
    { sectionId: string; schoolId: string; studentId: string }
  >({
    mutationFn: ({ sectionId, schoolId, studentId }) =>
      enrollStudentInSection(sectionId, schoolId, studentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: sectionKeys.roster(variables.sectionId),
      })
      queryClient.invalidateQueries({
        queryKey: sectionKeys.detail(variables.sectionId),
      })
      queryClient.invalidateQueries({ queryKey: sectionKeys.lists() })
      toast.success('Student enrolled successfully')
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

// ============================================================================
// REMOVE STUDENT FROM SECTION
// ============================================================================

export function useRemoveStudent() {
  const queryClient = useQueryClient()

  return useMutation<
    void,
    Error,
    { sectionId: string; schoolId: string; studentId: string }
  >({
    mutationFn: ({ sectionId, schoolId, studentId }) =>
      removeStudentFromSection(sectionId, schoolId, studentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: sectionKeys.roster(variables.sectionId),
      })
      queryClient.invalidateQueries({
        queryKey: sectionKeys.detail(variables.sectionId),
      })
      queryClient.invalidateQueries({ queryKey: sectionKeys.lists() })
      toast.success('Student removed from section')
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}
