/**
 * Coming Soon Page
 *
 * Displayed when users navigate to a parked module path.
 * Provides a friendly message and navigation back to the dashboard.
 */

import { ArrowLeft, Home, Rocket } from 'lucide-react'
import { Button } from '@edforge/ui'

interface ComingSoonProps {
  moduleName?: string
}

export function ComingSoon({ moduleName }: ComingSoonProps) {
  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = '/'
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center mx-auto mb-6">
          <Rocket className="w-8 h-8 text-teal-600 dark:text-teal-400" />
        </div>

        <h1 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-2">
          {moduleName ? `${moduleName} — Coming Soon` : 'Coming Soon'}
        </h1>
        <p className="text-sm text-[rgb(var(--text-secondary))] mb-8">
          This module is under development and will be available in a future release.
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
            onClick={() => window.location.href = '/home'}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
