/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 * 
 * Features:
 * - Route-level error isolation
 * - User-friendly error display
 * - Error recovery actions
 * - Development mode error details
 */

import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { cn } from '../../lib/utils'

// ============================================================================
// TYPES
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode
  /** Optional fallback component to render on error */
  fallback?: ReactNode
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  /** Show detailed error info (default: only in development) */
  showDetails?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

// ============================================================================
// ERROR FALLBACK UI
// ============================================================================

interface ErrorFallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  resetError: () => void
  showDetails?: boolean
}

function ErrorFallback({ error, errorInfo, resetError, showDetails }: ErrorFallbackProps) {
  const isDev = import.meta.env.DEV
  const shouldShowDetails = showDetails ?? isDev

  const isDeploymentError = error && (
    error.name === 'ChunkLoadError' ||
    error.message.toLowerCase().includes('loading chunk') ||
    error.message.includes("Unexpected token '<'")
  )

  return (
    <div className="min-h-96 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-rust-500/15 dark:bg-rust-500/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-rust-500" />
          </div>
        </div>

        {/* Error Message */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-2">
            {isDeploymentError ? 'New version available' : 'Something went wrong'}
          </h2>
          <p className="text-[rgb(var(--text-secondary))] text-sm">
            {isDeploymentError
              ? 'A new version of EdForge has been deployed. Please reload the page to get the latest version.'
              : 'We encountered an unexpected error. This has been logged and we\'re working on a fix.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            onClick={isDeploymentError ? () => window.location.reload() : resetError}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl',
              'bg-[rgb(var(--action-primary-bg))] hover:bg-[rgb(var(--action-primary-bg))]  dark:hover:bg-[rgb(var(--action-primary-bg-hover))]',
              'text-[rgb(var(--action-primary-fg))] font-medium text-sm',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.50)] focus:ring-offset-2'
            )}
          >
            <RefreshCw className="w-4 h-4" />
            {isDeploymentError ? 'Reload Page' : 'Try Again'}
          </button>
          <a
            href="/home"
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl',
              'bg-[rgb(var(--surface-tertiary))] hover:bg-[rgb(var(--interactive-hover))]',
              'text-[rgb(var(--text-primary))] font-medium text-sm',
              'border border-[rgb(var(--border-primary))]',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.50)] focus:ring-offset-2'
            )}
          >
            <Home className="w-4 h-4" />
            Go Home
          </a>
        </div>

        {/* Error Details (Dev Mode) */}
        {shouldShowDetails && error && (
          <div className="mt-6 p-4 rounded-xl bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))]">
            <div className="flex items-center gap-2 mb-3">
              <Bug className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
              <span className="text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
                Developer Info
              </span>
            </div>
            
            <div className="space-y-3">
              {/* Error Name & Message */}
              <div>
                <p className="text-xs font-medium text-rust-500 mb-1">
                  {error.name}
                </p>
                <p className="text-sm text-[rgb(var(--text-primary))] font-mono">
                  {error.message}
                </p>
              </div>

              {/* Stack Trace */}
              {error.stack && (
                <details className="group">
                  <summary className="text-xs text-[rgb(var(--text-tertiary))] cursor-pointer hover:text-[rgb(var(--text-secondary))]">
                    Show stack trace
                  </summary>
                  <pre className="mt-2 p-3 rounded-lg bg-[rgb(var(--surface-secondary))] text-xs text-[rgb(var(--text-secondary))] font-mono overflow-x-auto max-h-40 scrollbar-thin">
                    {error.stack}
                  </pre>
                </details>
              )}

              {/* Component Stack */}
              {errorInfo?.componentStack && (
                <details className="group">
                  <summary className="text-xs text-[rgb(var(--text-tertiary))] cursor-pointer hover:text-[rgb(var(--text-secondary))]">
                    Show component stack
                  </summary>
                  <pre className="mt-2 p-3 rounded-lg bg-[rgb(var(--surface-secondary))] text-xs text-[rgb(var(--text-secondary))] font-mono overflow-x-auto max-h-40 scrollbar-thin">
                    {errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// ERROR BOUNDARY CLASS COMPONENT
// ============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo })

    // Check for chunk load error (stale deployment) — reload before showing UI
    if (
      error.name === 'ChunkLoadError' ||
      error.message.toLowerCase().includes('loading chunk') ||
      error.message.includes("Unexpected token '<'")
    ) {
      import('../../lib/chunk-error-handler').then(({ handleChunkLoadError }) => {
        handleChunkLoadError(error)
      })
      return
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo)
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state
    const { children, fallback, showDetails } = this.props

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback
      }

      // Default error UI
      return (
        <ErrorFallback
          error={error}
          errorInfo={errorInfo}
          resetError={this.resetError}
          showDetails={showDetails}
        />
      )
    }

    return children
  }
}

// ============================================================================
// ROUTE ERROR BOUNDARY
// ============================================================================

/**
 * Specialized error boundary for route-level errors.
 * Provides navigation-aware error recovery.
 */
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log route-level errors with additional context
        console.error('[Route Error]', {
          path: window.location.pathname,
          error: error.message,
          componentStack: errorInfo.componentStack,
        })
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

