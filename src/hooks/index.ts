/**
 * Hooks Index
 * 
 * Export all custom hooks
 */

export { useScrollSpy, ScrollSpyNav } from './useScrollSpy'
export type { 
  ScrollSpySection, 
  UseScrollSpyOptions, 
  UseScrollSpyReturn,
  ScrollSpyNavProps 
} from './useScrollSpy'

// Sidebar hooks
export { useSecureNavItems, useSecureNavGroups, useCanSeeNavItem } from './useSecureNavItems'
export { useSidebarModule, useIsInModule, useActiveNavItem } from './useSidebarModule'
export type { UseSidebarModuleReturn } from './useSidebarModule'

