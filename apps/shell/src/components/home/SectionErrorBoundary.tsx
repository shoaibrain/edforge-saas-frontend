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
        <div className="flex flex-col items-center justify-center gap-3 py-8 px-4 rounded-xl border border-[var(--v2-border-default)] bg-[var(--v2-bg-surface)]">
          <div className="flex items-center gap-3">
            <p className="text-sm" style={{ color: 'var(--v2-text-hint)' }}>
              {this.props.fallbackMessage || 'Something went wrong'}
            </p>
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
              style={{
                background: 'var(--v2-warning-bg)',
                color: 'var(--v2-warning)',
                border: '1px solid var(--v2-warning-border)',
              }}
            >
              <RotateCcw className="w-3 h-3" />
              Retry
            </button>
          </div>
          {/* Ticket 4.3: debug mode — show error stack */}
          {DEBUG && this.state.error && (
            <details className="w-full max-w-lg text-left mt-2">
              <summary
                className="text-[10px] cursor-pointer"
                style={{ color: 'var(--v2-text-faint)' }}
              >
                Error details (debug mode)
              </summary>
              <pre
                className="mt-1 p-2 rounded text-[10px] overflow-x-auto max-h-32"
                style={{
                  background: 'var(--v2-bg-elevated)',
                  color: 'var(--v2-danger)',
                  fontFamily: 'monospace',
                }}
              >
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
