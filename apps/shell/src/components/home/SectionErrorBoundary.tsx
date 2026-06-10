/**
 * SectionErrorBoundary
 *
 * React Error Boundary that catches rendering crashes per section.
 * Prevents one section's crash from taking down the entire home page.
 *
 * Ticket 4.3 enhancements:
 * - Error telemetry reporting (Vercel Analytics / custom endpoint)
 * - Debug mode shows error stack details in UI
 * - Boundary resets on route change via key prop
 */

import { Component, type ReactNode, type ErrorInfo } from 'react'
import { RotateCcw } from 'lucide-react'

const DEBUG =
  typeof window !== 'undefined' &&
  localStorage.getItem('edforge-debug') === 'true'

interface Props {
  children: ReactNode
  fallbackMessage?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[SectionErrorBoundary]', error)

    // Ticket 4.3: Report to monitoring service
    try {
      // Vercel Analytics custom event (if available)
      if (typeof window !== 'undefined' && (window as any).va) {
        (window as any).va('event', {
          name: 'section_error_boundary',
          data: {
            message: error.message,
            componentStack: errorInfo.componentStack?.slice(0, 500),
            fallbackMessage: this.props.fallbackMessage,
          },
        })
      }
    } catch {
      // Telemetry should never break the app
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-8 px-4 rounded-xl border border-[rgb(var(--border-primary) / 0.35)] bg-[rgb(var(--background-secondary))]">
          <div className="flex items-center gap-3">
            <p className="text-sm text-[rgb(var(--text-tertiary))]">
              {this.props.fallbackMessage || 'Something went wrong'}
            </p>
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-[rgb(var(--state-warning-bg))] text-[rgb(var(--state-warning-fg))] border border-[rgb(var(--state-warning-border))]"
            >
              <RotateCcw className="w-3 h-3" />
              Retry
            </button>
          </div>
          {/* Ticket 4.3: debug mode — show error stack */}
          {DEBUG && this.state.error && (
            <details className="w-full max-w-lg text-left mt-2">
              <summary className="text-xs cursor-pointer text-[rgb(var(--text-disabled))]">
                Error details (debug mode)
              </summary>
              <pre className="mt-1 p-2 rounded text-xs overflow-x-auto max-h-32 font-mono bg-[rgb(var(--background-tertiary))] text-[rgb(var(--state-danger-fg))]">
                {this.state.error.message}
                {'\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
