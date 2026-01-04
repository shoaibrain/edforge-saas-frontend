/**
 * DynamicPageContext
 * 
 * React context provider for dynamic page widget management.
 * Supplies widget visibility state, toggle functions, and ABAC filtering.
 */

import { createContext, useContext, useMemo, useCallback, type ReactNode } from 'react'
import { usePagePreferencesStore } from '../../stores/page-preferences.store'
import { useAuthStore } from '../../stores/auth.store'
import { useAppStore } from '../../stores/app.store'
import { can, type Action, type Resource } from '@edforge/abac'
import type { WidgetDefinition, DynamicPageType, PageWidgetConfig } from '../../lib/widget-registry'
import { getPageConfig, getDefaultWidgetVisibility, getSortedWidgets } from '../../lib/widget-registry'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface DynamicPageContextValue {
  /** Unique page identifier */
  pageId: string
  /** Page type (home, module-overview) */
  pageType: DynamicPageType
  /** Page configuration */
  config: PageWidgetConfig
  /** All available widgets (sorted by order) */
  allWidgets: WidgetDefinition[]
  /** Visible widgets (filtered by visibility and permissions) */
  visibleWidgets: WidgetDefinition[]
  /** Check if a widget is visible */
  isWidgetVisible: (widgetId: string) => boolean
  /** Toggle widget visibility */
  toggleWidget: (widgetId: string) => void
  /** Set widget visibility explicitly */
  setWidgetVisible: (widgetId: string, visible: boolean) => void
  /** Reset all widgets to defaults */
  resetToDefaults: () => void
}

const DynamicPageContext = createContext<DynamicPageContextValue | null>(null)

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface DynamicPageProviderProps {
  /** Unique page identifier for storing preferences */
  pageId: string
  /** Type of page (determines available widgets) */
  pageType: DynamicPageType
  /** Optional: Override default widget configuration */
  customWidgets?: WidgetDefinition[]
  children: ReactNode
}

export function DynamicPageProvider({
  pageId,
  pageType,
  customWidgets,
  children,
}: DynamicPageProviderProps) {
  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  
  // Permission check helper
  const checkPermission = useCallback((action: Action, resource: Resource) => {
    return can(user, { action, resource, schoolId: activeSchoolId ?? undefined })
  }, [user, activeSchoolId])
  
  // Get store actions
  const setWidgetVisibility = usePagePreferencesStore((s) => s.setWidgetVisibility)
  const toggleWidgetVisibility = usePagePreferencesStore((s) => s.toggleWidgetVisibility)
  const storedPreferences = usePagePreferencesStore((s) => s.preferences[pageId])
  const resetPagePreferences = usePagePreferencesStore((s) => s.resetPagePreferences)
  
  // Get page configuration
  const config = useMemo(() => getPageConfig(pageType), [pageType])
  
  // Use custom widgets or default from config
  const allWidgets = useMemo(() => {
    const widgets = customWidgets || config.widgets
    return getSortedWidgets(widgets)
  }, [customWidgets, config.widgets])
  
  // Default visibility map
  const defaultVisibility = useMemo(
    () => getDefaultWidgetVisibility(pageType),
    [pageType]
  )
  
  // Check widget visibility (merges stored prefs with defaults)
  const isWidgetVisible = useMemo(() => {
    return (widgetId: string): boolean => {
      // First check stored preference
      if (storedPreferences?.widgetVisibility[widgetId] !== undefined) {
        return storedPreferences.widgetVisibility[widgetId]
      }
      // Fall back to default
      return defaultVisibility[widgetId] ?? true
    }
  }, [storedPreferences, defaultVisibility])
  
  // Filter visible widgets (by visibility setting and ABAC permissions)
  const visibleWidgets = useMemo(() => {
    return allWidgets.filter((widget) => {
      // Check visibility preference
      if (!isWidgetVisible(widget.id)) {
        return false
      }
      
      // Check ABAC permission if defined
      if (widget.permission) {
        const hasPermission = checkPermission(widget.permission.action, widget.permission.resource)
        if (!hasPermission) {
          return false
        }
      }
      
      return true
    })
  }, [allWidgets, isWidgetVisible, checkPermission])
  
  // Context value
  const value = useMemo<DynamicPageContextValue>(() => ({
    pageId,
    pageType,
    config,
    allWidgets,
    visibleWidgets,
    isWidgetVisible,
    toggleWidget: (widgetId: string) => toggleWidgetVisibility(pageId, widgetId),
    setWidgetVisible: (widgetId: string, visible: boolean) => 
      setWidgetVisibility(pageId, widgetId, visible),
    resetToDefaults: () => resetPagePreferences(pageId),
  }), [
    pageId,
    pageType,
    config,
    allWidgets,
    visibleWidgets,
    isWidgetVisible,
    toggleWidgetVisibility,
    setWidgetVisibility,
    resetPagePreferences,
  ])
  
  return (
    <DynamicPageContext.Provider value={value}>
      {children}
    </DynamicPageContext.Provider>
  )
}

// ============================================================================
// CONSUMER HOOK
// ============================================================================

/**
 * Hook to access dynamic page context
 * Must be used within a DynamicPageProvider
 */
export function useDynamicPage(): DynamicPageContextValue {
  const context = useContext(DynamicPageContext)
  
  if (!context) {
    throw new Error('useDynamicPage must be used within a DynamicPageProvider')
  }
  
  return context
}

/**
 * Hook to check if a specific widget is visible
 */
export function useWidgetIsVisible(widgetId: string): boolean {
  const { isWidgetVisible } = useDynamicPage()
  return isWidgetVisible(widgetId)
}

