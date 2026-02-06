import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { SkipLink } from './SkipLink'
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

  // NOTE: School auto-selection is handled by the SidebarSchoolSelector
  // which fetches real schools from the API. Do NOT auto-select from
  // user.assignments keys here — those are role-mapping keys that may
  // not match actual school UUIDs from the Identity service.

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
    <div className="min-h-screen bg-[rgb(var(--surface-primary))]">
      {/* Skip link for keyboard/screen reader users */}
      <SkipLink targetId="main-content" />

      {/* Sidebar */}
      <Sidebar />

      {/* Main content area - animated with sidebar using framer-motion */}
      <motion.div
        animate={{ marginLeft: collapsed ? 72 : 260 }}
        transition={{ type: 'spring', stiffness: 280, damping: 32 }}
        className="flex flex-col min-h-screen"
      >
        {/* Global Header - includes SidebarTrigger + Breadcrumbs */}
        <Header />

        {/* Page content */}
        <main 
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-6 overflow-x-hidden outline-none"
          aria-label="Main content"
        >
          {children}
        </main>
      </motion.div>
    </div>
  )
}
