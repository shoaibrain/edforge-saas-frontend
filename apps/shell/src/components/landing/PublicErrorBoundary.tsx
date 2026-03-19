import type { ErrorComponentProps } from '@tanstack/react-router'

export function PublicErrorBoundary({ error, reset }: ErrorComponentProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          We encountered an unexpected error. Please try refreshing the page.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-4 py-2.5 rounded-xl bg-muted text-foreground font-medium text-sm border border-border hover:bg-muted/80 transition-colors"
          >
            Go Home
          </a>
        </div>
        {import.meta.env.DEV && error && (
          <details className="mt-6 text-left p-4 rounded-xl bg-muted border border-border">
            <summary className="text-xs text-muted-foreground cursor-pointer">Developer Info</summary>
            <pre className="mt-2 p-3 rounded-lg bg-background text-xs text-red-500 font-mono overflow-x-auto max-h-40">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
