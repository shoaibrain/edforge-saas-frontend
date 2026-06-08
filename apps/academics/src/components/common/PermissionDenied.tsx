/**
 * PermissionDenied Component
 *
 * Displayed when a user doesn't have permission to access a resource.
 * Provides clear messaging and navigation options.
 */

import { ArrowLeft, Home, ShieldOff } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@edforge/ui'

export interface PermissionDeniedProps {
  resource?: string
  action?: string
  message?: string
  showBackButton?: boolean
}

export function PermissionDenied({
  resource,
  action,
  message,
  showBackButton = true,
}: PermissionDeniedProps) {
  const displayMessage =
    message ||
    (resource && action
      ? `You don't have permission to ${action} ${resource}.`
      : "You don't have permission to access this resource.")

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-100 to-[rgb(var(--state-warning-bg)/0.22)] dark:from-amber-900/30 dark:to-[rgb(var(--state-warning-bg)/0.22)] flex items-center justify-center">
          <ShieldOff className="w-10 h-10 text-[rgb(var(--state-warning-fg))]" />
        </div>

        <h1 className="text-2xl font-bold text-text-primary mb-3">
          Access Restricted
        </h1>

        <p className="text-text-secondary mb-8 leading-relaxed">
          {displayMessage}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {showBackButton && (
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          )}

          <Link to="/">
            <Button className="w-full sm:w-auto">
              <Home className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
          </Link>
        </div>

        <p className="mt-8 text-sm text-text-tertiary">
          Error 403 • Insufficient permissions
        </p>
      </div>
    </div>
  )
}
