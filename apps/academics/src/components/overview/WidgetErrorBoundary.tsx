/**
 * WidgetErrorBoundary
 *
 * Isolates widget rendering failures so one broken widget
 * does not crash the entire overview page.
 */

import { Component, type ReactNode } from 'react'
import { RotateCcw, AlertTriangle } from 'lucide-react'
import { Card } from '@edforge/ui'

interface Props {
  name: string
  children: ReactNode
}

interface State {
  hasError: boolean
  retryKey: number
}

export class WidgetErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, retryKey: 0 }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error(`[WidgetErrorBoundary] ${this.props.name} failed:`, error)
  }

  handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      retryKey: prev.retryKey + 1,
    }))
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-6 border-border-secondary">
          <div className="flex items-center gap-3 text-text-secondary">
            <div className="p-2 rounded-lg bg-[rgb(var(--state-warning-fg))]/10">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">
                Unable to load {this.props.name}
              </p>
              <p className="text-xs text-text-tertiary mt-0.5">
                Something went wrong rendering this widget.
              </p>
            </div>
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-tertiary hover:bg-interactive-hover text-text-secondary transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        </Card>
      )
    }

    return (
      <div key={this.state.retryKey}>
        {this.props.children}
      </div>
    )
  }
}
