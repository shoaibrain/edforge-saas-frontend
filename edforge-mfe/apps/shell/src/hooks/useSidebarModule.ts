/**
 * Sidebar Module Detection Hook
 * 
 * Detects which sidebar module should be active based on the current route
 * AND the user's role in their active school context.
 * 
 * Role-Based Home Module Selection:
 * - Students see student portal navigation
 * - Parents see family portal navigation  
 * - Admins/Teachers see standard admin navigation
 * 
 * This enables a unified login experience where different user types
 * land on /home but see navigation appropriate to their role.
 */

import { useMemo, useSyncExternalStore } from 'react'
import { useRouterState } from '@tanstack/react-router'
import {
  type SidebarModule,
  type ModuleConfig,
  detectModuleFromPath,
  getModuleConfig,
  getHomeModuleForSchoolRole,
  isHomeModule,
} from '../config/sidebar-modules'
import { useAuthStore } from '../stores/auth.store'
import { useAppStore } from '../stores/app.store'

// Custom hook to subscribe to browser location changes
// This ensures the sidebar re-renders when the URL changes
function usePathname(): string {
  return useSyncExternalStore(
    (callback) => {
      // Subscribe to popstate events (back/forward navigation)
      window.addEventListener('popstate', callback)
      // Also listen for custom navigation events from TanStack Router
      window.addEventListener('hashchange', callback)
      return () => {
        window.removeEventListener('popstate', callback)
        window.removeEventListener('hashchange', callback)
      }
    },
    () => window.location.pathname, // Get snapshot
    () => window.location.pathname  // Get server snapshot
  )
}

export interface UseSidebarModuleReturn {
  /** Current active module ID */
  moduleId: SidebarModule
  
  /** Full module configuration */
  config: ModuleConfig
  
  /** Whether we're in a sub-module (not home) */
  isSubModule: boolean
  
  /** Back navigation info if in sub-module */
  backTo?: { path: string; label: string }
}

/**
 * Hook to detect and provide the current sidebar module based on route
 * and user role context.
 * 
 * When on home routes (/home, /), the module is determined by the user's
 * role in their active school:
 * - Student role → student home module
 * - Parent role → parent home module
 * - Other roles → standard admin home module
 */
export function useSidebarModule(): UseSidebarModuleReturn {
  // Use both router state and browser pathname for reliable location tracking
  const routerPathname = useRouterState({ select: (s) => s.location.pathname })
  const browserPathname = usePathname()
  // Prefer router pathname but fall back to browser pathname
  const pathname = routerPathname || browserPathname
  
  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)

  return useMemo(() => {
    // First, detect base module from path
    const baseModuleId = detectModuleFromPath(pathname)
    
    // If we're on a home route, determine the role-specific home module
    let moduleId: SidebarModule = baseModuleId
    
    if (baseModuleId === 'home' && user && activeSchoolId) {
      // Get the user's role in the active school
      const schoolRole = user.assignments[activeSchoolId]
      if (schoolRole) {
        moduleId = getHomeModuleForSchoolRole(schoolRole)
      }
    }
    
    const config = getModuleConfig(moduleId)
    
    // Consider all home module variants as "not a sub-module"
    const isSubModule = !isHomeModule(moduleId)

    return {
      moduleId,
      config,
      isSubModule,
      backTo: config.backTo,
    }
  }, [routerPathname, browserPathname, pathname, user, activeSchoolId])
}

/**
 * Hook to check if we're currently in a specific module
 */
export function useIsInModule(targetModule: SidebarModule): boolean {
  const { moduleId } = useSidebarModule()
  return moduleId === targetModule
}

/**
 * Hook to get the active nav item ID based on current path
 * 
 * Matching priority:
 * 1. Exact path + query param match (e.g., /settings?tab=account)
 * 2. Exact path match (e.g., /academics/teachers)
 * 3. Prefix match for nested routes (e.g., /academics for /academics/teachers/123)
 */
export function useActiveNavItem(): string | null {
  // Use useRouterState for more reliable location tracking
  const routerState = useRouterState({ select: (s) => s.location })
  const { config } = useSidebarModule()

  return useMemo(() => {
    const pathname = routerState.pathname
    // TanStack Router's search is an object, convert to URLSearchParams string
    const searchObj = routerState.search as Record<string, unknown>
    const searchString = new URLSearchParams(
      Object.entries(searchObj).map(([k, v]) => [k, String(v)])
    ).toString()

    // Collect all items from all groups for multi-pass matching
    const allItems: { id: string; href: string }[] = []
    for (const group of config.groups) {
      for (const item of group.items) {
        if (item.href) {
          allItems.push({ id: item.id, href: item.href })
        }
      }
    }

    // PASS 1: Check for exact query param matches (e.g., /settings?tab=account)
    for (const item of allItems) {
      if (item.href.includes('?')) {
        const [itemPath, itemQuery] = item.href.split('?')
        if (pathname === itemPath && searchString.includes(itemQuery)) {
          return item.id
        }
      }
    }

    // PASS 2: Check for exact path matches (most specific first)
    // Sort by href length descending to match most specific paths first
    const sortedItems = [...allItems]
      .filter(item => !item.href.includes('?'))
      .sort((a, b) => b.href.length - a.href.length)

    for (const item of sortedItems) {
      if (pathname === item.href) {
        return item.id
      }
    }

    // PASS 3: Check for prefix matches (for deeply nested routes)
    // Already sorted by length descending, so most specific prefix wins
    for (const item of sortedItems) {
      if (item.href !== '/home' && pathname.startsWith(item.href + '/')) {
        return item.id
      }
    }

    // Return null when no match found - this is expected when at /home
    // since "Home" is now handled by the unified HomeNavButton component
    return null
  }, [routerState.pathname, routerState.search, config])
}
