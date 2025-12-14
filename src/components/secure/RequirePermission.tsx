import type { ReactNode } from 'react'
import { usePermission, type Action, type Resource } from '@/lib/abac'

interface RequirePermissionProps {
  action: Action
  resource: Resource
  schoolId?: string
  /** Content to render when permission is granted */
  children: ReactNode
  /** Optional fallback when permission denied (defaults to null) */
  fallback?: ReactNode
}

/**
 * Conditionally renders children based on ABAC permission check.
 * Uses the current active school context unless schoolId is overridden.
 *
 * @example
 * <RequirePermission action="edit" resource="grades">
 *   <GradeEditor />
 * </RequirePermission>
 */
export function RequirePermission({
  action,
  resource,
  schoolId,
  children,
  fallback = null,
}: RequirePermissionProps) {
  const hasPermission = usePermission(action, resource, schoolId)

  if (!hasPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Higher-order component version for wrapping entire components
 */
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  action: Action,
  resource: Resource,
  FallbackComponent?: React.ComponentType
) {
  return function PermissionGuardedComponent(props: P) {
    const hasPermission = usePermission(action, resource)

    if (!hasPermission) {
      return FallbackComponent ? <FallbackComponent /> : null
    }

    return <WrappedComponent {...props} />
  }
}

