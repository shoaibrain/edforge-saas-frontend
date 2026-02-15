import { ArrowLeft, Home } from 'lucide-react'
import { Button } from '@edforge/ui'

export function NotFound() {
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
        <p className="text-6xl font-bold text-[rgb(var(--text-tertiary))] mb-4">
          404
        </p>

        <h1 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-2">
          Page not found
        </h1>
        <p className="text-sm text-[rgb(var(--text-secondary))] mb-8">
          The page you're looking for doesn't exist or has been moved.
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
            onClick={() => window.location.href = '/'}
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
