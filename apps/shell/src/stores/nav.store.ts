import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Mobile navigation store.
 *
 * Deliberately its own localStorage-persisted store: app.store persists to the
 * shared `edforge-app` cookie, which all four MFE app stores rewrite with
 * their own partialize shape — an unknown field added there is silently
 * dropped on the next rewrite.
 *
 * `variant` is a dev-only A/B flag for the phone nav chrome ('tabs' is the
 * shipped default; 'drawer' keeps the alternative testable). Toggle it from
 * Settings → Auth Debug (TenantAdmin) or via localStorage `edforge-mobile-nav`.
 */
export type MobileNavVariant = 'tabs' | 'drawer'

interface NavState {
  variant: MobileNavVariant
  drawerOpen: boolean
  setVariant: (variant: MobileNavVariant) => void
  openDrawer: () => void
  closeDrawer: () => void
}

export const useNavStore = create<NavState>()(
  persist(
    (set) => ({
      variant: 'tabs',
      drawerOpen: false,
      setVariant: (variant) => set({ variant }),
      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),
    }),
    {
      name: 'edforge-mobile-nav',
      partialize: (state) => ({ variant: state.variant }) as unknown as NavState,
    }
  )
)
