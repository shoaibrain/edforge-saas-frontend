/**
 * Enrollment Store
 *
 * Zustand store for enrollment dashboard UI state.
 */

import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

// ============================================================================
// STATE
// ============================================================================

interface EnrollmentFiltersState {
  searchTerm: string
  gradeLevel: string | null
  status: string | null
}

interface EnrollmentStoreState extends EnrollmentFiltersState {
  selectedYearId: string | null

  // Actions
  setSelectedYearId: (id: string | null) => void
  setSearchTerm: (term: string) => void
  setGradeLevel: (level: string | null) => void
  setStatus: (status: string | null) => void
  resetFilters: () => void

  // Computed
  hasActiveFilters: () => boolean
  activeFilterCount: () => number
}

const defaultFilters: EnrollmentFiltersState = {
  searchTerm: '',
  gradeLevel: null,
  status: null,
}

// ============================================================================
// STORE
// ============================================================================

export const useEnrollmentStore = create<EnrollmentStoreState>((set, get) => ({
  ...defaultFilters,
  selectedYearId: null,

  setSelectedYearId: (id) => set({ selectedYearId: id }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setGradeLevel: (level) => set({ gradeLevel: level }),
  setStatus: (status) => set({ status }),
  resetFilters: () => set(defaultFilters),

  hasActiveFilters: () => {
    const state = get()
    return (
      state.searchTerm.trim() !== '' ||
      state.gradeLevel !== null ||
      state.status !== null
    )
  },

  activeFilterCount: () => {
    const state = get()
    let count = 0
    if (state.searchTerm.trim() !== '') count++
    if (state.gradeLevel !== null) count++
    if (state.status !== null) count++
    return count
  },
}))

// ============================================================================
// SELECTOR HOOKS
// ============================================================================

export const useEnrollmentFilters = () =>
  useEnrollmentStore(
    useShallow((state) => ({
      searchTerm: state.searchTerm,
      gradeLevel: state.gradeLevel,
      status: state.status,
    }))
  )

export const useEnrollmentFilterActions = () =>
  useEnrollmentStore(
    useShallow((state) => ({
      setSearchTerm: state.setSearchTerm,
      setGradeLevel: state.setGradeLevel,
      setStatus: state.setStatus,
      resetFilters: state.resetFilters,
      hasActiveFilters: state.hasActiveFilters,
      activeFilterCount: state.activeFilterCount,
    }))
  )
