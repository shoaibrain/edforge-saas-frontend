/**
 * Students Store
 *
 * Zustand store for student directory UI state.
 * Server data is handled by React Query, this store manages:
 * - Filter state (search, grade level, status)
 * - Row selection state
 */

import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { StudentStatus } from '@aibrains/shared-types'

// ============================================================================
// FILTER STATE
// ============================================================================

export interface StudentFiltersState {
  searchTerm: string
  gradeLevel: string | null
  status: StudentStatus | null
}

// ============================================================================
// SELECTION STATE
// ============================================================================

export interface StudentSelectionState {
  selectedStudentIds: Set<string>
}

// ============================================================================
// STORE STATE
// ============================================================================

interface StudentsStoreState extends StudentFiltersState, StudentSelectionState {
  // Filter actions
  setSearchTerm: (term: string) => void
  setGradeLevel: (level: string | null) => void
  setStatus: (status: StudentStatus | null) => void
  resetFilters: () => void

  // Selection actions
  toggleStudentSelection: (id: string) => void
  selectStudents: (ids: string[]) => void
  clearSelection: () => void

  // Computed
  hasActiveFilters: () => boolean
  activeFilterCount: () => number
}

// ============================================================================
// DEFAULT STATE
// ============================================================================

const defaultFilters: StudentFiltersState = {
  searchTerm: '',
  gradeLevel: null,
  status: null,
}

const defaultSelection: StudentSelectionState = {
  selectedStudentIds: new Set(),
}

// ============================================================================
// STORE
// ============================================================================

export const useStudentsStore = create<StudentsStoreState>((set, get) => ({
  // Initial state
  ...defaultFilters,
  ...defaultSelection,

  // =========================================================================
  // FILTER ACTIONS
  // =========================================================================

  setSearchTerm: (term: string) => {
    set({ searchTerm: term })
  },

  setGradeLevel: (level: string | null) => {
    set({ gradeLevel: level })
  },

  setStatus: (status: StudentStatus | null) => {
    set({ status })
  },

  resetFilters: () => {
    set(defaultFilters)
  },

  // =========================================================================
  // SELECTION ACTIONS
  // =========================================================================

  toggleStudentSelection: (id: string) => {
    set((state) => {
      const newSelection = new Set(state.selectedStudentIds)
      if (newSelection.has(id)) {
        newSelection.delete(id)
      } else {
        newSelection.add(id)
      }
      return { selectedStudentIds: newSelection }
    })
  },

  selectStudents: (ids: string[]) => {
    set({ selectedStudentIds: new Set(ids) })
  },

  clearSelection: () => {
    set({ selectedStudentIds: new Set() })
  },

  // =========================================================================
  // COMPUTED
  // =========================================================================

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

/**
 * Get current filter state (uses shallow comparison to prevent infinite loops)
 */
export const useStudentFilters = () =>
  useStudentsStore(
    useShallow((state) => ({
      searchTerm: state.searchTerm,
      gradeLevel: state.gradeLevel,
      status: state.status,
    }))
  )

/**
 * Get filter actions (uses shallow comparison to prevent infinite loops)
 */
export const useStudentFilterActions = () =>
  useStudentsStore(
    useShallow((state) => ({
      setSearchTerm: state.setSearchTerm,
      setGradeLevel: state.setGradeLevel,
      setStatus: state.setStatus,
      resetFilters: state.resetFilters,
      hasActiveFilters: state.hasActiveFilters,
      activeFilterCount: state.activeFilterCount,
    }))
  )

/**
 * Get selected student IDs
 */
export const useSelectedStudents = () =>
  useStudentsStore((state) => state.selectedStudentIds)

/**
 * Get selection actions (uses shallow comparison to prevent infinite loops)
 */
export const useStudentSelectionActions = () =>
  useStudentsStore(
    useShallow((state) => ({
      toggleStudentSelection: state.toggleStudentSelection,
      selectStudents: state.selectStudents,
      clearSelection: state.clearSelection,
    }))
  )
