/**
 * Attendance Store
 *
 * Zustand store for attendance UI state.
 * Server data is handled by React Query, this store manages:
 * - Selected date for attendance entry
 * - Selected section for class attendance
 */

import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

// ============================================================================
// DEBUG INSTRUMENTATION
// ============================================================================

const DEBUG = typeof localStorage !== 'undefined' && localStorage.getItem('edforge-debug') === 'true';

// ============================================================================
// STATE
// ============================================================================

interface AttendanceStoreState {
  selectedDate: string
  selectedSectionId: string | null

  // Actions
  setSelectedDate: (date: string) => void
  setSelectedSectionId: (id: string | null) => void
  goToPreviousDay: () => void
  goToNextDay: () => void
  goToToday: () => void
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00')
  date.setDate(date.getDate() + days)
  return formatDate(date)
}

// ============================================================================
// STORE
// ============================================================================

export const useAttendanceStore = create<AttendanceStoreState>((set, get) => ({
  selectedDate: formatDate(new Date()),
  selectedSectionId: null,

  setSelectedDate: (date: string) => {
    // Don't allow future dates
    const today = formatDate(new Date())
    if (date > today) return
    if (DEBUG) console.debug('[Attendance Store] selectedDate change', { to: date })
    set({ selectedDate: date })
  },

  setSelectedSectionId: (id: string | null) => {
    if (DEBUG) console.debug('[Attendance Store] selectedSectionId change', { to: id })
    set({ selectedSectionId: id })
  },

  goToPreviousDay: () => {
    const { selectedDate } = get()
    set({ selectedDate: addDays(selectedDate, -1) })
  },

  goToNextDay: () => {
    const { selectedDate } = get()
    const nextDay = addDays(selectedDate, 1)
    const today = formatDate(new Date())
    if (nextDay <= today) {
      set({ selectedDate: nextDay })
    }
  },

  goToToday: () => {
    set({ selectedDate: formatDate(new Date()) })
  },
}))

// ============================================================================
// SELECTOR HOOKS
// ============================================================================

export const useAttendanceDate = () =>
  useAttendanceStore((state) => state.selectedDate)

export const useAttendanceSectionId = () =>
  useAttendanceStore((state) => state.selectedSectionId)

export const useAttendanceDateActions = () =>
  useAttendanceStore(
    useShallow((state) => ({
      setSelectedDate: state.setSelectedDate,
      goToPreviousDay: state.goToPreviousDay,
      goToNextDay: state.goToNextDay,
      goToToday: state.goToToday,
    }))
  )
