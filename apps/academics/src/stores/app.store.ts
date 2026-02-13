/**
 * App Store - UI preferences, active school context
 *
 * This store syncs with the shell's app store through cookie storage.
 * The shell sets the active school, and MFEs read from the same cookie.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ============================================================================
// APP STORE
// ============================================================================

interface AppStore {
  // School context - which school the user is currently viewing
  activeSchoolId: string | null

  // Sidebar state
  sidebarCollapsed: boolean

  // Theme (for future use)
  theme: 'light' | 'dark' | 'system'

  // Actions
  setActiveSchoolId: (schoolId: string | null) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      activeSchoolId: null,
      sidebarCollapsed: false,
      theme: 'light',

      setActiveSchoolId: (schoolId) => {
        set({ activeSchoolId: schoolId })
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
      },

      setSidebarCollapsed: (collapsed) => {
        set({ sidebarCollapsed: collapsed })
      },

      setTheme: (theme) => {
        set({ theme })
      },
    }),
    {
      name: 'edforge-app',
      storage: {
        getItem: (name) => {
          const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
          if (match) {
            const cookieVal = decodeURIComponent(match[2])
            try {
              return JSON.parse(cookieVal)
            } catch {
              return cookieVal
            }
          }
          return null
        },
        setItem: (name, value) => {
          document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))}; path=/; max-age=86400; SameSite=Lax`
        },
        removeItem: (name) => {
          document.cookie = `${name}=; path=/; max-age=0`
        },
      },
    }
  )
)

// ============================================================================
// SELECTOR HOOKS
// ============================================================================

export const useActiveSchoolId = () => useAppStore((s) => s.activeSchoolId)
export const useSidebarCollapsed = () => useAppStore((s) => s.sidebarCollapsed)
