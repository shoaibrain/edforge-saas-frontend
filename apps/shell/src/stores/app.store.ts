import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { broadcastSchoolChange, resetSchoolContext } from '@edforge/config/school-context-channel'
import { armSchoolTransitionErrorToast } from '../lib/query-client'

// ============================================================================
// APP STORE - UI preferences, active school context
// ============================================================================

// Per-tab session marker: which user resolved the current school context.
// Lives in sessionStorage (NOT the shared edforge-app cookie — all four app
// stores across shell/academics/finance/people persist to that same cookie
// and the MFE stores rewrite it with their own shape, dropping unknown
// fields). sessionStorage survives same-tab reloads, dies with the tab, and
// is removed on logout — so fresh logins and new tabs re-resolve the school
// (server default first), while mid-session reloads keep the working context.
const SCHOOL_SESSION_KEY = 'edforge-school-session'

export function getSchoolSessionOwner(): string | null {
  try {
    return sessionStorage.getItem(SCHOOL_SESSION_KEY)
  } catch {
    return null
  }
}

export function setSchoolSessionOwner(userId: string): void {
  try {
    sessionStorage.setItem(SCHOOL_SESSION_KEY, userId)
  } catch {
    // sessionStorage unavailable — resolution falls back to fresh each load
  }
}

function clearSchoolSessionOwner(): void {
  try {
    sessionStorage.removeItem(SCHOOL_SESSION_KEY)
  } catch {
    // ignore
  }
}

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
  setActiveSchoolId: (schoolId: string | null, opts?: { silent?: boolean }) => void
  setActiveSchoolStatus: (status: string | null) => void
  setSchoolTransitioning: (transitioning: boolean) => void
  clearSchoolContext: () => void
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

      setActiveSchoolId: (schoolId, opts) => {
        const prev = get().activeSchoolId
        if (prev === schoolId) return
        // silent: bootstrap/initial resolution — set the school without the
        // transition overlay. Otherwise show it only on real switches
        // (prev non-null), not on first selection.
        const transitioning = !opts?.silent && prev !== null
        set({ activeSchoolId: schoolId, isSchoolTransitioning: transitioning })
        if (transitioning && schoolId) {
          armSchoolTransitionErrorToast(schoolId)
        }
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

      // Logout hygiene: reset school context so the next user (or next
      // login) resolves fresh instead of inheriting this session's school.
      // Deliberately no broadcast — callers trigger a full reload. The
      // channel's retained payload is blanked too: the Amplify signedOut
      // path does NOT reload, and the merge semantics would otherwise carry
      // the previous tenant's settings into the next user's sync reads.
      clearSchoolContext: () => {
        clearSchoolSessionOwner()
        resetSchoolContext()
        set({ activeSchoolId: null, activeSchoolStatus: null, isSchoolTransitioning: false })
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
      // Persist exactly the shape the MFE app stores also write to this
      // shared cookie — transient flags must never round-trip.
      partialize: (state) => ({
        activeSchoolId: state.activeSchoolId,
        activeSchoolStatus: state.activeSchoolStatus,
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }) as unknown as AppStore,
      // Pre-partialize cookies may carry a stuck isSchoolTransitioning:true;
      // never rehydrate it.
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<AppStore>),
        isSchoolTransitioning: false,
      }),
    }
  )
)

// Selector hooks for common patterns
export const useActiveSchoolId = () => useAppStore((s) => s.activeSchoolId)
export const useActiveSchoolStatus = () => useAppStore((s) => s.activeSchoolStatus)
export const useIsSchoolTransitioning = () => useAppStore((s) => s.isSchoolTransitioning)
export const useSidebarCollapsed = () => useAppStore((s) => s.sidebarCollapsed)
