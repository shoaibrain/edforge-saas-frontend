import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { broadcastSchoolChange } from '@edforge/config/school-context-channel'

// ============================================================================
// APP STORE - UI preferences, active school context
// ============================================================================

interface AppStore {

  // School context - which school the user is currently viewing
  activeSchoolId: string | null
  activeSchoolStatus: string | null

  // School transition state
  isSchoolTransitioning: boolean

  // Sidebar state
  sidebarCollapsed: boolean

  // Theme (for future use)
  theme: 'light' | 'dark' | 'system'

  // Actions
  setActiveSchoolId: (schoolId: string | null) => void
  setActiveSchoolStatus: (status: string | null) => void
  setSchoolTransitioning: (transitioning: boolean) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      activeSchoolId: null,
      activeSchoolStatus: null,
      isSchoolTransitioning: false,
      sidebarCollapsed: false,
      theme: 'light',

      setActiveSchoolId: (schoolId) => {
        const prev = get().activeSchoolId
        if (prev === schoolId) return
        // Only show transition overlay on real school switches (prev non-null),
        // not on initial auto-select where components have their own loading states
        set({ activeSchoolId: schoolId, isSchoolTransitioning: prev !== null })
        broadcastSchoolChange(schoolId, get().activeSchoolStatus)
      },

      setActiveSchoolStatus: (status) => {
        set({ activeSchoolStatus: status })
        // Re-broadcast so MFE stores with activeSchoolStatus stay in sync
        broadcastSchoolChange(get().activeSchoolId, status)
      },

      setSchoolTransitioning: (transitioning) => {
        set({ isSchoolTransitioning: transitioning })
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
          const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
          if (match) {
            const cookieVal = decodeURIComponent(match[2]);
            try { return JSON.parse(cookieVal); } catch { return cookieVal; }
          }
          return null
        },
        setItem: (name, value) => {
          document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))}; path=/; max-age=86400; SameSite=Lax`;
        },
        removeItem: (name) => {
          document.cookie = `${name}=; path=/; max-age=0`;
        }
      },
    }
  )
)

// Selector hooks for common patterns
export const useActiveSchoolId = () => useAppStore((s) => s.activeSchoolId)
export const useActiveSchoolStatus = () => useAppStore((s) => s.activeSchoolStatus)
export const useIsSchoolTransitioning = () => useAppStore((s) => s.isSchoolTransitioning)
export const useSidebarCollapsed = () => useAppStore((s) => s.sidebarCollapsed)
