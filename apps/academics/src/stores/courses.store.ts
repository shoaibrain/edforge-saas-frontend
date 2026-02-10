/**
 * Courses Store
 *
 * Zustand store for course catalog UI state.
 * Server data is handled by React Query, this store manages:
 * - Filter state (search, subject area, course type, credit type, active status)
 */

import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { CourseSubjectArea, CourseType, CreditType } from '@aibrains/shared-types'

// ============================================================================
// FILTER STATE
// ============================================================================

export interface CourseFiltersState {
  searchTerm: string
  subjectArea: CourseSubjectArea | null
  courseType: CourseType | null
  creditType: CreditType | null
  isActive: boolean | null
}

// ============================================================================
// STORE STATE
// ============================================================================

interface CoursesStoreState extends CourseFiltersState {
  // Filter actions
  setSearchTerm: (term: string) => void
  setSubjectArea: (area: CourseSubjectArea | null) => void
  setCourseType: (type: CourseType | null) => void
  setCreditType: (type: CreditType | null) => void
  setIsActive: (active: boolean | null) => void
  resetFilters: () => void

  // Computed
  hasActiveFilters: () => boolean
  activeFilterCount: () => number
}

// ============================================================================
// DEFAULT STATE
// ============================================================================

const defaultFilters: CourseFiltersState = {
  searchTerm: '',
  subjectArea: null,
  courseType: null,
  creditType: null,
  isActive: null,
}

// ============================================================================
// STORE
// ============================================================================

export const useCoursesStore = create<CoursesStoreState>((set, get) => ({
  ...defaultFilters,

  setSearchTerm: (term: string) => {
    set({ searchTerm: term })
  },

  setSubjectArea: (area: CourseSubjectArea | null) => {
    set({ subjectArea: area })
  },

  setCourseType: (type: CourseType | null) => {
    set({ courseType: type })
  },

  setCreditType: (type: CreditType | null) => {
    set({ creditType: type })
  },

  setIsActive: (active: boolean | null) => {
    set({ isActive: active })
  },

  resetFilters: () => {
    set(defaultFilters)
  },

  hasActiveFilters: () => {
    const state = get()
    return (
      state.searchTerm.trim() !== '' ||
      state.subjectArea !== null ||
      state.courseType !== null ||
      state.creditType !== null ||
      state.isActive !== null
    )
  },

  activeFilterCount: () => {
    const state = get()
    let count = 0
    if (state.searchTerm.trim() !== '') count++
    if (state.subjectArea !== null) count++
    if (state.courseType !== null) count++
    if (state.creditType !== null) count++
    if (state.isActive !== null) count++
    return count
  },
}))

// ============================================================================
// SELECTOR HOOKS
// ============================================================================

/**
 * Get current filter state
 */
export const useCourseFilters = () =>
  useCoursesStore(
    useShallow((state) => ({
      searchTerm: state.searchTerm,
      subjectArea: state.subjectArea,
      courseType: state.courseType,
      creditType: state.creditType,
      isActive: state.isActive,
    }))
  )

/**
 * Get filter actions
 */
export const useCourseFilterActions = () =>
  useCoursesStore(
    useShallow((state) => ({
      setSearchTerm: state.setSearchTerm,
      setSubjectArea: state.setSubjectArea,
      setCourseType: state.setCourseType,
      setCreditType: state.setCreditType,
      setIsActive: state.setIsActive,
      resetFilters: state.resetFilters,
      hasActiveFilters: state.hasActiveFilters,
      activeFilterCount: state.activeFilterCount,
    }))
  )
