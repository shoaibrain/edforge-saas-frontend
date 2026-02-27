import { lazy, Suspense, useEffect, Component, type ReactNode } from 'react'
import { Navbar } from '../Navbar'
import { HeroSection } from '../sections/HeroSection'
import { SocialProofSection } from '../sections/SocialProofSection'
import { Footer } from '../Footer'
import { useInView } from '../hooks/useInView'
import '../landing.css'

const BelowFoldSections = lazy(() => import('../sections/BelowFoldSections'))

function BelowFoldFallback() {
  return (
    <div className="min-h-[200vh]">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border-t border-border px-6 py-24 text-center">
          <div className="mx-auto h-6 w-48 rounded-full landing-skeleton bg-muted/30" />
          <div className="mx-auto mt-4 h-10 w-96 max-w-full rounded-lg landing-skeleton bg-muted/20" />
        </div>
      ))}
    </div>
  )
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) {
      return (
        <div className="py-24 text-center">
          <p className="text-muted-foreground">Something went wrong loading this section.</p>
          <button
            className="mt-4 rounded-full border border-border px-6 py-2 text-sm font-medium text-foreground hover:bg-muted/20"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function LandingPage() {
  useEffect(() => {
    document.title = 'EdForge — Next-Generation Education Management'
  }, [])

  const [sentinelRef, belowFoldVisible] = useInView('200px')

  return (
    <div className="landing-page relative min-h-screen bg-background text-foreground">
      {/* Skip to content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg"
      >
        Skip to content
      </a>

      <Navbar />

      <main id="main-content">
        <HeroSection />
        <SocialProofSection />

        {/* Sentinel triggers lazy load 200px before scrolling into view */}
        <div ref={sentinelRef} />

        <ErrorBoundary>
          {belowFoldVisible ? (
            <Suspense fallback={<BelowFoldFallback />}>
              <BelowFoldSections />
            </Suspense>
          ) : (
            <BelowFoldFallback />
          )}
        </ErrorBoundary>
      </main>

      <Footer />
    </div>
  )
}
