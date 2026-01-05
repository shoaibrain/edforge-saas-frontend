/**
 * @edforge/abac
 *
 * Attribute-Based Access Control (ABAC) library for the EdForge EMIS platform.
 * Provides permission checking, role-based access, and React hooks.
 */

// Permission definitions
export { ROLE_PERMISSIONS, type Action, type Resource } from './permissions'

// Core engine
export {
  can,
  canAccess,
  getPermissions,
  getSchoolsWithPermission,
  canAccessEntity,
  canCommunicateWith,
  type PermissionContext,
  type EntityContext,
} from './engine'

// React hooks and context
export {
  ABACContext,
  type ABACContextValue,
  usePermission,
  useCanAccess,
  useResourcePermissions,
  useCanAccessEntity,
  useCanCommunicateWith,
  useSchoolsWithPermission,
  useAllPermissions,
} from './hooks'

