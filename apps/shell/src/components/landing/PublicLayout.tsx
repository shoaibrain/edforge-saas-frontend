import { Outlet, useLocation } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import './landing.css'

export function PublicLayout() {
  const location = useLocation()

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="landing-page relative min-h-screen bg-background text-foreground">
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg"
      >
        Skip to content
      </a>

      <Navbar />

      {/* Main content */}
      <main id="main-content">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
