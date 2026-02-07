/**
 * Grades Store
 *
 * Zustand store for gradebook UI state.
 * Server data is handled by React Query, this store manages:
 * - Selected section and term for gradebook view
 * - Grading policy selection
 */

import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

// ============================================================================
// STATE
// ============================================================================

interface GradesStoreState {
  selectedSectionId: string | null
  selectedTermId: string | null
  selectedPolicyId: string | null
  showPolicies: boolean

  // Actions
  setSelectedSectionId: (id: string | null) => void
  setSelectedTermId: (id: string | null) => void
  setSelectedPolicyId: (id: string | null) => void
  setShowPolicies: (show: boolean) => void
  reset: () => void
}

// ============================================================================
// STORE
// ============================================================================

export const useGradesStore = create<GradesStoreState>((set) => ({
  selectedSectionId: null,
  selectedTermId: null,
  selectedPolicyId: null,
  showPolicies: false,

  setSelectedSectionId: (id) => set({ selectedSectionId: id }),
  setSelectedTermId: (id) => set({ selectedTermId: id }),
  setSelectedPolicyId: (id) => set({ selectedPolicyId: id }),
  setShowPolicies: (show) => set({ showPolicies: show }),
  reset: () =>
    set({
      selectedSectionId: null,
      selectedTermId: null,
      selectedPolicyId: null,
      showPolicies: false,
    }),
}))

// ============================================================================
// SELECTOR HOOKS
// ============================================================================

export const useGradesSelections = () =>
  useGradesStore(
    useShallow((state) => ({
      selectedSectionId: state.selectedSectionId,
      selectedTermId: state.selectedTermId,
      selectedPolicyId: state.selectedPolicyId,
      showPolicies: state.showPolicies,
    }))
  )

export const useGradesActions = () =>
  useGradesStore(
    useShallow((state) => ({
      setSelectedSectionId: state.setSelectedSectionId,
      setSelectedTermId: state.setSelectedTermId,
      setSelectedPolicyId: state.setSelectedPolicyId,
      setShowPolicies: state.setShowPolicies,
      reset: state.reset,
    }))
  )
