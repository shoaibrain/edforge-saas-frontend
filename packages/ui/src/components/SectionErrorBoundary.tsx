/**
 * WidgetErrorBoundaryV2
 *
 * React Error Boundary that catches rendering crashes per section.
 * Prevents one section's crash from taking down the entire page.
 * Uses V2 token-based styling.
 */

import { Component, type ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallbackMessage?: string
}

interface State {
  hasError: boolean
}

export class WidgetErrorBoundaryV2 extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('[WidgetErrorBoundaryV2]', error)
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center gap-3 py-8 px-4 rounded-xl border border-[var(--v2-border-default)] bg-[var(--v2-bg-surface)]">
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
      )
    }

    return this.props.children
  }
}
