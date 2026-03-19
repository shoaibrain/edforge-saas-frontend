/**
 * Home Dashboard Store
 *
 * Shared state for the home page that needs to be accessible
 * across components (e.g., Header needs alert count from AdminCommandCenter).
 */

import { create } from 'zustand'
import type { AcademicYearResponse } from '../services/home.service'

interface HomeStore {
  /** Number of active alerts — drives notification badge in Header */
  alertCount: number
  /** Current academic year — used for topbar date display */
  activeAcademicYear: AcademicYearResponse | null
  /** Whether V2 home page is active (for Header conditional rendering) */
  isHomeV2Active: boolean

  setAlertCount: (count: number) => void
  setActiveAcademicYear: (year: AcademicYearResponse | null) => void
  setHomeV2Active: (active: boolean) => void
}

export const useHomeStore = create<HomeStore>()((set) => ({
  alertCount: 0,
  activeAcademicYear: null,
  isHomeV2Active: false,

  setAlertCount: (count) => set({ alertCount: count }),
  setActiveAcademicYear: (year) => set({ activeAcademicYear: year }),
  setHomeV2Active: (active) => set({ isHomeV2Active: active }),
}))
