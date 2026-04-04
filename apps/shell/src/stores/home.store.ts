/**
 * Home Dashboard Store
 *
 * Shared state for the home page that needs to be accessible
 * across components (e.g., Header needs alert count from AdminCommandCenter).
 */

import { create } from 'zustand'
import type { AcademicYearResponse } from '../services/home.service'

interface HomeStore {
  /** Current academic year — used for topbar date display */
  activeAcademicYear: AcademicYearResponse | null
  /** Whether V2 home page is active (for Header conditional rendering) */
  isHomeV2Active: boolean

  setActiveAcademicYear: (year: AcademicYearResponse | null) => void
  setHomeV2Active: (active: boolean) => void
}

export const useHomeStore = create<HomeStore>()((set) => ({
  activeAcademicYear: null,
  isHomeV2Active: false,

  setActiveAcademicYear: (year) => set({ activeAcademicYear: year }),
  setHomeV2Active: (active) => set({ isHomeV2Active: active }),
}))
