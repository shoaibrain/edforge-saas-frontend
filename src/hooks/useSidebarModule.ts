/**
 * Sidebar Module Detection Hook
 * 
 * Detects which sidebar module should be active based on the current route.
 * Returns the module configuration for dynamic sidebar rendering.
 */

import { useMemo } from 'react'
import { useLocation } from '@tanstack/react-router'
import {
  type SidebarModule,
  type ModuleConfig,
  detectModuleFromPath,
  getModuleConfig,
} from '@/config/sidebar-modules'

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
 */
export function useSidebarModule(): UseSidebarModuleReturn {
  const location = useLocation()

  return useMemo(() => {
    const moduleId = detectModuleFromPath(location.pathname)
    const config = getModuleConfig(moduleId)
    const isSubModule = moduleId !== 'home'

    return {
      moduleId,
      config,
      isSubModule,
      backTo: config.backTo,
    }
  }, [location.pathname])
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
  const location = useLocation()
  const { config } = useSidebarModule()

  return useMemo(() => {
    const pathname = location.pathname
    // TanStack Router's search is an object, convert to URLSearchParams string
    const searchObj = location.search as Record<string, unknown>
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
  }, [location.pathname, location.search, config])
}
