import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { SkipLink } from './SkipLink'
import { useAppStore } from '../../stores/app.store'
import { useAuthStore } from '../../stores/auth.store'
import { useRouteFocus, useRouteAnnouncement } from '../../hooks/useFocusManagement'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const setActiveSchoolId = useAppStore((s) => s.setActiveSchoolId)
  const user = useAuthStore((s) => s.user)

  // Accessibility: Focus management on route changes
  useRouteFocus()
  useRouteAnnouncement()

  // Auto-select first school if none selected
  useEffect(() => {
    if (!activeSchoolId && user) {
      const schools = Object.keys(user.assignments)
      if (schools.length > 0) {
        setActiveSchoolId(schools[0])
      }
    }
  }, [activeSchoolId, user, setActiveSchoolId])

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
