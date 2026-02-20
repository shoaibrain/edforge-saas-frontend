/**
 * Overview Widget Preferences Store
 *
 * Persists which widgets are visible on the module overview page.
 * Uses localStorage with per-module namespacing.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ============================================================================
// TYPES
// ============================================================================

interface OverviewWidgetState {
  visibleWidgets: Record<string, boolean>
  setWidgetVisible: (id: string, visible: boolean) => void
  toggleWidget: (id: string) => void
  resetToDefaults: () => void
}

// ============================================================================
// DEFAULTS
// ============================================================================

const DEFAULT_WIDGETS: Record<string, boolean> = {
  'quick-stats': true,
  'insights': true,
  'activity-alerts': true,
}

// ============================================================================
// STORE
// ============================================================================

export const useOverviewWidgetStore = create<OverviewWidgetState>()(
  persist(
    (set) => ({
      visibleWidgets: { ...DEFAULT_WIDGETS },

      setWidgetVisible: (id, visible) =>
        set((state) => ({
          visibleWidgets: { ...state.visibleWidgets, [id]: visible },
        })),

      toggleWidget: (id) =>
        set((state) => ({
          visibleWidgets: {
            ...state.visibleWidgets,
            [id]: !state.visibleWidgets[id],
          },
        })),

      resetToDefaults: () =>
        set({ visibleWidgets: { ...DEFAULT_WIDGETS } }),
    }),
    {
      name: 'edforge-overview-widgets-academics',
    }
  )
)

// ============================================================================
// SELECTOR HOOKS
// ============================================================================

export const useWidgetVisible = (id: string) =>
  useOverviewWidgetStore((s) => s.visibleWidgets[id] ?? true)
