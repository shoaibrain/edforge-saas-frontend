import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { SkipLink } from './SkipLink'
import { SchoolTransitionOverlay } from './SchoolTransitionOverlay'
import { useAppStore } from '../../stores/app.store'
import { useRouteFocus, useRouteAnnouncement } from '../../hooks/useFocusManagement'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)

  // Accessibility: Focus management on route changes
  useRouteFocus()
  useRouteAnnouncement()

  // Keyboard shortcut: Cmd+B / Ctrl+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar])

  return (
    <div
      className="h-screen overflow-hidden"
      style={{
        background: 'var(--shell-page-bg)',
        transition: 'background 0.3s',
      }}
    >
      {/* Skip link for keyboard/screen reader users */}
      <SkipLink targetId="main-content" />

      {/* Sidebar — fixed position, handles its own width */}
      <Sidebar />

      {/* Right column: topbar + content card */}
      <div
        className="flex flex-col h-screen"
        style={{
          marginLeft: collapsed
            ? 'var(--shell-sidebar-w-collapsed)'
            : 'var(--shell-sidebar-w)',
          transition: 'margin-left var(--shell-transition)',
        }}
      >
        {/* Global Header — seamless background, no border */}
        <Header />

        {/* Body wrap — padding creates the 3-sided inset gap */}
        <div
          className="flex-1 min-h-0"
          style={{ padding: '0 var(--shell-cp-gap) var(--shell-cp-gap) 0' }}
        >
          {/* Content card — the ONLY elevated surface */}
          <main
            id="main-content"
            tabIndex={-1}
            className="h-full overflow-y-auto overflow-x-hidden outline-none"
            style={{
              background: 'var(--shell-cp-bg)',
              borderRadius: 'var(--shell-cp-radius)',
              boxShadow: 'var(--shell-cp-shadow)',
              position: 'relative',  // LOAD-BEARING: drawer absolute positioning
              transition: 'background 0.3s, box-shadow 0.3s',
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--shell-scroll-thumb) transparent',
            }}
            aria-label="Main content"
          >
            {children}
            <SchoolTransitionOverlay />
          </main>
        </div>
      </div>
    </div>
  )
}
