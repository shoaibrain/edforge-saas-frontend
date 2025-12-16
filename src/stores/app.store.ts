import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ============================================================================
// APP STORE - UI preferences, active school context
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
    }
  )
)

// Selector hooks for common patterns
export const useActiveSchoolId = () => useAppStore((s) => s.activeSchoolId)
export const useSidebarCollapsed = () => useAppStore((s) => s.sidebarCollapsed)

