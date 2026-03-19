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

// Focus management hooks for accessibility
export { 
  useRouteFocus, 
  useScreenReaderAnnounce, 
  useRouteAnnouncement,
  useFocusTrap,
  useReturnFocus,
} from './useFocusManagement'

// Pagination hooks
export { usePaginatedQuery } from './usePaginatedQuery'
export type {
  PaginatedResponse,
  UsePaginatedQueryOptions,
  UsePaginatedQueryResult
} from './usePaginatedQuery'

// User management hooks
export { useUsers, useChangeGlobalRole, useUpdateUserStatus, useDeleteUser, userKeys } from './useUsers'

// Portal identity hooks
export { useStudentIdentity } from './useStudentIdentity'
export { useParentChildren } from './useParentChildren'
export type { ChildProfile } from './useParentChildren'
