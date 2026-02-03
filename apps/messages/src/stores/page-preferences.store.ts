/**
 * Page Preferences Store
 * 
 * Manages user preferences for dynamic page widgets.
 * Stores widget visibility settings per page, persisted to localStorage.
 * 
 * Architecture:
 * - Each page has a unique pageId (e.g., 'home', 'academics-overview')
 * - Each page can have multiple widgets with show/hide toggles
 * - Preferences are persisted per-user (keyed by user ID when available)
 * 
 * Future Integration:
 * - Store interface supports async operations for backend sync
 * - Preferences can be synced across devices via API
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Preferences for a single page's widgets
 */
export interface PageWidgetPreferences {
  /** Map of widgetId → visibility boolean */
  widgetVisibility: Record<string, boolean>
  /** Optional: custom widget ordering */
  widgetOrder?: string[]
  /** Last updated timestamp for sync purposes */
  lastUpdated?: string
}

/**
 * Store state and actions
 */
interface PagePreferencesStore {
  /** Map of pageId → preferences */
  preferences: Record<string, PageWidgetPreferences>
  
  // ========== Actions ==========
  
  /**
   * Set visibility for a specific widget on a page
   */
  setWidgetVisibility: (pageId: string, widgetId: string, visible: boolean) => void
  
  /**
   * Toggle visibility for a specific widget
   */
  toggleWidgetVisibility: (pageId: string, widgetId: string) => void
  
  /**
   * Get preferences for a specific page (with defaults)
   */
  getPagePreferences: (pageId: string, defaultWidgets?: Record<string, boolean>) => PageWidgetPreferences
  
  /**
   * Check if a specific widget is visible
   */
  isWidgetVisible: (pageId: string, widgetId: string, defaultVisible?: boolean) => boolean
  
  /**
   * Set custom widget order for a page
   */
  setWidgetOrder: (pageId: string, order: string[]) => void
  
  /**
   * Reset preferences for a page to defaults
   */
  resetPagePreferences: (pageId: string) => void
  
  /**
   * Reset all preferences
   */
  resetAllPreferences: () => void
  
  // ========== Future API Integration ==========
  
  /**
   * Placeholder for future backend sync
   * Will be implemented when API is available
   */
  syncWithBackend?: () => Promise<void>
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const usePagePreferencesStore = create<PagePreferencesStore>()(
  persist(
    (set, get) => ({
      preferences: {},
      
      setWidgetVisibility: (pageId, widgetId, visible) => {
        set((state) => {
          const pagePrefs = state.preferences[pageId] || { widgetVisibility: {} }
          
          return {
            preferences: {
              ...state.preferences,
              [pageId]: {
                ...pagePrefs,
                widgetVisibility: {
                  ...pagePrefs.widgetVisibility,
                  [widgetId]: visible,
                },
                lastUpdated: new Date().toISOString(),
              },
            },
          }
        })
      },
      
      toggleWidgetVisibility: (pageId, widgetId) => {
        const currentVisible = get().isWidgetVisible(pageId, widgetId, true)
        get().setWidgetVisibility(pageId, widgetId, !currentVisible)
      },
      
      getPagePreferences: (pageId, defaultWidgets = {}) => {
        const stored = get().preferences[pageId]
        
        if (!stored) {
          return {
            widgetVisibility: defaultWidgets,
          }
        }
        
        // Merge stored preferences with defaults (defaults fill in missing keys)
        return {
          ...stored,
          widgetVisibility: {
            ...defaultWidgets,
            ...stored.widgetVisibility,
          },
        }
      },
      
      isWidgetVisible: (pageId, widgetId, defaultVisible = true) => {
        const pagePrefs = get().preferences[pageId]
        
        if (!pagePrefs || pagePrefs.widgetVisibility[widgetId] === undefined) {
          return defaultVisible
        }
        
        return pagePrefs.widgetVisibility[widgetId]
      },
      
      setWidgetOrder: (pageId, order) => {
        set((state) => {
          const pagePrefs = state.preferences[pageId] || { widgetVisibility: {} }
          
          return {
            preferences: {
              ...state.preferences,
              [pageId]: {
                ...pagePrefs,
                widgetOrder: order,
                lastUpdated: new Date().toISOString(),
              },
            },
          }
        })
      },
      
      resetPagePreferences: (pageId) => {
        set((state) => {
          const { [pageId]: _, ...rest } = state.preferences
          return { preferences: rest }
        })
      },
      
      resetAllPreferences: () => {
        set({ preferences: {} })
      },
    }),
    {
      name: 'edforge-page-preferences',
      // Version for future migrations
      version: 1,
    }
  )
)

// ============================================================================
// SELECTOR HOOKS
// ============================================================================

/**
 * Hook to get widget visibility for a specific page
 */
export function useWidgetVisibility(
  pageId: string,
  widgetId: string,
  defaultVisible = true
): boolean {
  return usePagePreferencesStore((s) => 
    s.isWidgetVisible(pageId, widgetId, defaultVisible)
  )
}

/**
 * Hook to get all widget visibility states for a page
 */
export function usePageWidgets(
  pageId: string,
  defaultWidgets: Record<string, boolean> = {}
): PageWidgetPreferences {
  return usePagePreferencesStore((s) => 
    s.getPagePreferences(pageId, defaultWidgets)
  )
}

/**
 * Hook to get toggle function for a widget
 */
export function useToggleWidget(pageId: string) {
  const toggle = usePagePreferencesStore((s) => s.toggleWidgetVisibility)
  return (widgetId: string) => toggle(pageId, widgetId)
}

