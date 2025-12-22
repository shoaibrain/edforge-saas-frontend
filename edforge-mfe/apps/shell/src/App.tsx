/**
 * EdForge Shell - Main Application
 *
 * Root component that handles routing and global providers.
 */

import { Suspense, useEffect } from 'react'
import { ShellProvider } from './lib/shell-context'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './components/layout/LoginPage'
import { LoadingScreen } from './components/layout/LoadingScreen'
import { useThemeStore } from './stores/theme.store'
import { useSidebarStore } from './stores/sidebar.store'
import { useAuthStore } from './stores/auth.store'

// Pages
import HomePage from './pages/HomePage'
import SettingsPage from './pages/SettingsPage'
import AcademicsPage from './pages/AcademicsPage'
import FinancePage from './pages/FinancePage'

// ============================================================================
// THEME SYNC
// ============================================================================

function ThemeSync() {
  const { theme, setTheme } = useThemeStore()

  useEffect(() => {
    // Re-apply theme on mount to ensure it's synced
    setTheme(theme)
  }, [])

  return null
}

// ============================================================================
// PAGE ROUTER
// ============================================================================

function PageRouter() {
  const currentModule = useSidebarStore((s) => s.currentModule)
  
  switch (currentModule) {
    case 'home':
      return <HomePage />
    case 'settings':
      return <SettingsPage />
    case 'academics':
      return <AcademicsPage />
    case 'finance':
      return <FinancePage />
    default:
      return <HomePage />
  }
}

// ============================================================================
// AUTH GATE
// ============================================================================

function AuthGate() {
  // Use auth store directly for reactive auth state
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <AppShell>
      <PageRouter />
    </AppShell>
  )
}

// ============================================================================
// MAIN APP
// ============================================================================

export function App() {
  return (
    <ShellProvider>
      <ThemeSync />
      <Suspense fallback={<LoadingScreen />}>
        <AuthGate />
      </Suspense>
    </ShellProvider>
  )
}

