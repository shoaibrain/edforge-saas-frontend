import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  /** Name used in console logs + dev fallback. */
  sectionName: string
  children: ReactNode
}

type State = { hasError: boolean; error: Error | null }

/**
 * SectionErrorBoundary — isolates landing-v2 sections so a single section
 * crash does not white-screen the rest of the marketing page.
 *
 * On error:
 *   - In dev, renders a minimal inline error card with the section name
 *     + message + stack.
 *   - In prod, renders NOTHING (empty section). The rest of the page
 *     continues rendering. The error is still logged to console for
 *     observability tools to pick up.
 */
export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error(
      `[landing-v2] section "${this.props.sectionName}" crashed:`,
      error,
      errorInfo
    )
  }

  render() {
    if (!this.state.hasError) return this.props.children

    // Dev fallback — visible so engineers notice during build.
    if (import.meta.env.DEV) {
      return (
        <div
          role="alert"
          style={{
            margin: '24px auto',
            maxWidth: 720,
            padding: 20,
            borderRadius: 12,
            background: 'rgba(220, 38, 38, 0.06)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            color: '#7A1C26',
            fontSize: 13,
            lineHeight: 1.55,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            Landing section failed: {this.props.sectionName}
          </div>
          <pre
            className="lp-mono"
            style={{
              whiteSpace: 'pre-wrap',
              fontSize: 11,
              opacity: 0.85,
              margin: 0,
            }}
          >
            {this.state.error?.message}
          </pre>
        </div>
      )
    }

    // Prod fallback — silently skip the section.
    return null
  }
}
