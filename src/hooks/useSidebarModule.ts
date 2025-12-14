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

    // Check all items in all groups for a match
    for (const group of config.groups) {
      for (const item of group.items) {
        if (!item.href) continue

        // Handle query param matching (e.g., /settings?tab=account)
        if (item.href.includes('?')) {
          const [itemPath, itemQuery] = item.href.split('?')
          if (pathname === itemPath && searchString.includes(itemQuery)) {
            return item.id
          }
        } else {
          // Exact match or starts with (for nested routes)
          if (pathname === item.href) {
            return item.id
          }
          // For nested routes like /academics/students
          if (item.href !== '/home' && pathname.startsWith(item.href + '/')) {
            return item.id
          }
        }
      }
    }

    // Default to first item in first group if no match
    return config.groups[0]?.items[0]?.id ?? null
  }, [location.pathname, location.search, config])
}

