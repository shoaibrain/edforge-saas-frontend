/**
 * TabErrorBoundary
 *
 * Shared error boundary for tab content panels.
 * Catches rendering errors and displays a fallback with "Try Again" button.
 */

import React, { type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

// ============================================================================
// ERROR BOUNDARY CLASS
// ============================================================================

interface TabErrorBoundaryProps {
  fallback?: ReactNode
  tabName?: string
  children: ReactNode
}

interface TabErrorBoundaryState {
  hasError: boolean
}

export class TabErrorBoundary extends React.Component<
  TabErrorBoundaryProps,
  TabErrorBoundaryState
> {
  constructor(props: TabErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('[TabErrorBoundary] Error caught:', error)
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return <TabError tabName={this.props.tabName || 'This'} onRetry={this.handleRetry} />
    }
    return this.props.children
  }
}

// ============================================================================
// DEFAULT ERROR FALLBACK
// ============================================================================

export function TabError({
  tabName,
  onRetry,
}: {
  tabName: string
  onRetry?: () => void
}) {
  return (
    <div className="bg-surface-secondary rounded-xl border border-border-secondary p-12 text-center">
      <AlertTriangle className="w-10 h-10 mx-auto text-amber-500 mb-4" />
      <h4 className="text-lg font-medium text-text-primary mb-2">
        Something went wrong
      </h4>
      <p className="text-text-secondary max-w-md mx-auto mb-4">
        The {tabName} tab encountered an error. Please try again.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  )
}
