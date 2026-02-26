/**
 * Access Denied Page
 *
 * Displayed when a user navigates to a route they don't have permission to access.
 * Follows the same pattern as NotFound.tsx.
 */

import { ArrowLeft, Home, ShieldX } from 'lucide-react'
import { Button } from '@edforge/ui'
import { useAuthStore } from '../../stores/auth.store'
import { useAppStore } from '../../stores/app.store'

export function AccessDenied() {
  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)

  const role = activeSchoolId ? user?.assignments?.[activeSchoolId] : null
  const isStudent = role === 'Student'
  const isParent = role === 'Parent'

  const portalPath = isStudent
    ? '/student-portal/grades'
    : isParent
      ? '/parent-portal'
      : '/home'

  const portalLabel = isStudent
    ? 'Go to My Portal'
    : isParent
      ? 'Go to Family Portal'
      : 'Dashboard'

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = portalPath
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>

        <h1 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-2">
          Access Denied
        </h1>
        <p className="text-sm text-[rgb(var(--text-secondary))] mb-8">
          You don't have permission to view this page. If you believe this is an error, please contact your school administrator.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          <Button
            onClick={() => window.location.href = portalPath}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            {portalLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
