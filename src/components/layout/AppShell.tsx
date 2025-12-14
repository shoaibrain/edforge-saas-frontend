import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useSpring, animated, config } from '@react-spring/web'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const setActiveSchoolId = useAppStore((s) => s.setActiveSchoolId)
  const user = useAuthStore((s) => s.user)

  // React-spring for smooth margin animation
  const marginSpring = useSpring({
    marginLeft: collapsed ? 76 : 260,
    config: { tension: 280, friction: 32 },
  })

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
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area - animated with sidebar using react-spring */}
      <animated.div
        style={{ marginLeft: marginSpring.marginLeft }}
        className="flex flex-col min-h-screen"
      >
        {/* Header */}
        <Header />

        {/* Page content */}
        <main className="flex-1 p-6 overflow-x-hidden">
          {children}
        </main>
      </animated.div>
    </div>
  )
}
