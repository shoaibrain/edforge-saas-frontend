/**
 * Sections Store
 *
 * Zustand store for section UI state.
 * Server data is handled by React Query, this store manages:
 * - Filter state (course, teacher, academic year, term, active status)
 */

import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

// ============================================================================
// FILTER STATE
// ============================================================================

export interface SectionFiltersState {
  courseId: string | null
  teacherId: string | null
  academicYearId: string | null
  termId: string | null
  isActive: boolean | null
}

// ============================================================================
// STORE STATE
// ============================================================================

interface SectionsStoreState extends SectionFiltersState {
  // View mode
  viewMode: 'grid' | 'list'
  setViewMode: (mode: 'grid' | 'list') => void

  // Filter actions
  setCourseId: (id: string | null) => void
  setTeacherId: (id: string | null) => void
  setAcademicYearId: (id: string | null) => void
  setTermId: (id: string | null) => void
  setIsActive: (active: boolean | null) => void
  resetFilters: () => void

  // Computed
  hasActiveFilters: () => boolean
  activeFilterCount: () => number
}

// ============================================================================
// DEFAULT STATE
// ============================================================================

const defaultFilters: SectionFiltersState = {
  courseId: null,
  teacherId: null,
  academicYearId: null,
  termId: null,
  isActive: null,
}

// ============================================================================
// STORE
// ============================================================================

export const useSectionsStore = create<SectionsStoreState>((set, get) => ({
  ...defaultFilters,

  viewMode: (typeof window !== 'undefined' && localStorage.getItem('edforge.classrooms.viewMode') === 'list' ? 'list' : 'grid') as 'grid' | 'list',
  setViewMode: (mode: 'grid' | 'list') => {
    set({ viewMode: mode })
    try { localStorage.setItem('edforge.classrooms.viewMode', mode) } catch {
      // Ignore persistence failures in restricted browser contexts.
    }
  },

  setCourseId: (id: string | null) => {
    set({ courseId: id })
  },

  setTeacherId: (id: string | null) => {
    set({ teacherId: id })
  },

  setAcademicYearId: (id: string | null) => {
    // Reset term when academic year changes
    set({ academicYearId: id, termId: null })
  },

  setTermId: (id: string | null) => {
    set({ termId: id })
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
      state.courseId !== null ||
      state.teacherId !== null ||
      state.academicYearId !== null ||
      state.termId !== null ||
      state.isActive !== null
    )
  },

  activeFilterCount: () => {
    const state = get()
    let count = 0
    if (state.courseId !== null) count++
    if (state.teacherId !== null) count++
    if (state.academicYearId !== null) count++
    if (state.termId !== null) count++
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
export const useSectionFilters = () =>
  useSectionsStore(
    useShallow((state) => ({
      courseId: state.courseId,
      teacherId: state.teacherId,
      academicYearId: state.academicYearId,
      termId: state.termId,
      isActive: state.isActive,
    }))
  )

/**
 * Get filter actions
 */
export const useSectionFilterActions = () =>
  useSectionsStore(
    useShallow((state) => ({
      setCourseId: state.setCourseId,
      setTeacherId: state.setTeacherId,
      setAcademicYearId: state.setAcademicYearId,
      setTermId: state.setTermId,
      setIsActive: state.setIsActive,
      resetFilters: state.resetFilters,
      hasActiveFilters: state.hasActiveFilters,
      activeFilterCount: state.activeFilterCount,
    }))
  )

/**
 * Get view mode preference
 */
export const useViewMode = () =>
  useSectionsStore(
    useShallow((state) => ({
      viewMode: state.viewMode,
      setViewMode: state.setViewMode,
    }))
  )
