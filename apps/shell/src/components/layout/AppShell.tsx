import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { SkipLink } from './SkipLink'
import { SchoolTransitionOverlay } from './SchoolTransitionOverlay'
import { MobileL2Row } from './MobileL2Row'
import { MobileTabBar } from './MobileTabBar'
import { MobileNavDrawer } from './MobileNavDrawer'
import { useAppStore } from '../../stores/app.store'
import { useNavStore } from '../../stores/nav.store'
import { useBreakpoint } from '@edforge/ui'
import { useRouteFocus, useRouteAnnouncement } from '../../hooks/useFocusManagement'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const isSchoolTransitioning = useAppStore((s) => s.isSchoolTransitioning)
  const navVariant = useNavStore((s) => s.variant)
  const bp = useBreakpoint()

  // Accessibility: Focus management on route changes
  useRouteFocus()
  useRouteAnnouncement()

  // Keyboard shortcut: Cmd+B / Ctrl+B to toggle sidebar — desktop only (the
  // sidebar doesn't exist below 1024px; don't mutate hidden-sidebar state)
  useEffect(() => {
    if (bp !== 'desktop') return
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar, bp])

  // Phone tabs variant: the content column ends above the fixed tab bar
  const hasTabBar = bp === 'phone' && navVariant === 'tabs'

  return (
    <div
      className="h-dvh overflow-hidden bg-[var(--shell-page-bg)]"
      style={{ transition: 'background 0.3s' }}
    >
      {/* Skip link for keyboard/screen reader users */}
      <SkipLink targetId="main-content" />

      {/* Global Header — fixed full-width, z-45 above sidebar.
          Phone renders the app bar; tablet the drawer-hamburger header. */}
      <Header />

      {/* Sidebar — desktop only (returns null below 1024px) */}
      <Sidebar />

      {/* Right column: content card (below fixed header / app bar).
          lg: values reproduce today's desktop layout exactly; base values
          carry the phone layout; tablet sits between (no sidebar margin). */}
      <div
        className={`flex flex-col h-dvh pt-[calc(var(--shell-appbar-h)+var(--shell-safe-top))] sm:pt-[var(--shell-topbar-h)] ml-0 ${
          collapsed ? 'lg:ml-[var(--shell-sidebar-w-collapsed)]' : 'lg:ml-[var(--shell-sidebar-w)]'
        } ${hasTabBar ? 'pb-[calc(var(--shell-tabbar-h)+var(--shell-safe-bottom))]' : ''}`}
        style={{ transition: 'margin-left var(--shell-transition)' }}
      >
        {/* L2 page-pill row — phone + tablet only (null on desktop) */}
        <MobileL2Row />

        {/* Body wrap — padding creates the inset gap (full-bleed on phone) */}
        <div className="flex-1 min-h-0 pt-0 px-0 pb-0 sm:px-[var(--shell-cp-gap)] sm:pb-[var(--shell-cp-gap)]">
          {/* Content card — the ONLY elevated surface */}
          <main
            id="main-content"
            tabIndex={-1}
            aria-busy={isSchoolTransitioning || undefined}
            className="h-full overflow-y-auto overflow-x-hidden overscroll-contain outline-none bg-[var(--shell-cp-bg)] rounded-none shadow-none sm:rounded-[var(--shell-cp-radius)] sm:shadow-[var(--shell-cp-shadow)]"
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

      {/* Mobile chrome — each returns null outside its breakpoint/variant */}
      <MobileTabBar />
      <MobileNavDrawer />
    </div>
  )
}
