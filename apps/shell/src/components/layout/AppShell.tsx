import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { getLanguageDirection, useTranslation } from '@edforge/i18n'
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
  const isSchoolTransitioning = useAppStore((s) => s.isSchoolTransitioning)
  const { i18n } = useTranslation()
  const contentDirection = getLanguageDirection(i18n.language)

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
      className="h-screen overflow-hidden bg-[var(--shell-page-bg)]"
      dir="ltr"
      style={{ transition: 'background 0.3s' }}
    >
      {/* Skip link for keyboard/screen reader users */}
      <SkipLink targetId="main-content" />

      {/* Global Header — fixed full-width, z-45 above sidebar */}
      <Header />

      {/* Sidebar — fixed position, handles its own width */}
      <Sidebar />

      {/* Right column: content card (below fixed header) */}
      <div
        className={`flex flex-col h-screen pt-[var(--shell-topbar-h)] ${collapsed ? 'ml-[var(--shell-sidebar-w-collapsed)]' : 'ml-[var(--shell-sidebar-w)]'}`}
        style={{ transition: 'margin-left var(--shell-transition)' }}
      >
        {/* Body wrap — padding creates the inset gap */}
        <div className="flex-1 min-h-0 pt-0 px-[var(--shell-cp-gap)] pb-[var(--shell-cp-gap)]">
          {/* Content card — the ONLY elevated surface */}
          <main
            id="main-content"
            tabIndex={-1}
            dir={contentDirection}
            aria-busy={isSchoolTransitioning || undefined}
            className="h-full overflow-y-auto overflow-x-hidden outline-none bg-[var(--shell-cp-bg)] rounded-[var(--shell-cp-radius)] shadow-[var(--shell-cp-shadow)]"
            style={{
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
