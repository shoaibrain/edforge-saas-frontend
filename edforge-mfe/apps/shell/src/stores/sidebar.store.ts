/**
 * Sidebar Store
 * 
 * Manages sidebar-specific state including module transitions,
 * animation state, and navigation history.
 */

import { create } from 'zustand'
import type { SidebarModule } from '../config/sidebar-modules'

interface SidebarStore {
  // Current and previous module for animations
  currentModule: SidebarModule
  previousModule: SidebarModule | null
  
  // Animation state
  isTransitioning: boolean
  transitionDirection: 'forward' | 'backward'
  
  // Actions
  setModule: (module: SidebarModule) => void
  startTransition: (to: SidebarModule) => void
  endTransition: () => void
}

export const useSidebarStore = create<SidebarStore>()((set, get) => ({
  currentModule: 'home',
  previousModule: null,
  isTransitioning: false,
  transitionDirection: 'forward',
  
  setModule: (module) => {
    const current = get().currentModule
    if (current === module) return
    
    // Determine transition direction
    const isGoingHome = module === 'home'
    
    set({
      previousModule: current,
      currentModule: module,
      transitionDirection: isGoingHome ? 'backward' : 'forward',
    })
  },
  
  startTransition: (to) => {
    const isGoingHome = to === 'home'
    
    set({
      isTransitioning: true,
      transitionDirection: isGoingHome ? 'backward' : 'forward',
    })
  },
  
  endTransition: () => {
    set({ isTransitioning: false })
  },
}))

// Selectors
export const useCurrentSidebarModule = () => useSidebarStore((s) => s.currentModule)
export const useIsTransitioning = () => useSidebarStore((s) => s.isTransitioning)
export const useTransitionDirection = () => useSidebarStore((s) => s.transitionDirection)

