/**
 * Recently Visited Pages Hook
 * 
 * Tracks and persists recently visited pages in localStorage,
 * enabling a Notion-style "Recently visited" carousel on the home page.
 */

import { useEffect, useCallback } from 'react'
import { useLocation } from '@tanstack/react-router'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  Users,
  GraduationCap,
  DollarSign,
  Building2,
  Settings,
  BookOpen,
  ClipboardList,
  Calendar,
  // [MVP-PARKED] Unused icons from parked module metadata
  // BarChart3,
  // Video,
  // MessageSquare,
  // [/MVP-PARKED]
  UserCog,
  type LucideIcon,
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

export interface VisitedPage {
  path: string
  title: string
  icon: string // Icon name as string for serialization
  visitedAt: string // ISO date string
  module: string
}

interface RecentlyVisitedState {
  pages: VisitedPage[]
  addPage: (page: Omit<VisitedPage, 'visitedAt'>) => void
  clearPages: () => void
}

// ============================================================================
// ICON MAPPING
// ============================================================================

const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  GraduationCap,
  DollarSign,
  Building2,
  Settings,
  BookOpen,
  ClipboardList,
  Calendar,
  // [MVP-PARKED] Parked module icons
  // BarChart3,
  // Video,
  // MessageSquare,
  // [/MVP-PARKED]
  UserCog,
}

export function getIconComponent(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || Building2
}

// ============================================================================
// PAGE METADATA
// ============================================================================

interface PageMetadata {
  title: string
  icon: string
  module: string
}

const PAGE_METADATA: Record<string, PageMetadata> = {
  '/home': { title: 'Home', icon: 'Building2', module: 'home' },
  '/academics': { title: 'Academics', icon: 'GraduationCap', module: 'academics' },
  '/academics/students': { title: 'Students', icon: 'Users', module: 'academics' },
  '/academics/teachers': { title: 'Teachers', icon: 'UserCog', module: 'academics' },
  '/academics/classrooms': { title: 'Classrooms', icon: 'BookOpen', module: 'academics' },
  '/academics/attendance': { title: 'Attendance', icon: 'ClipboardList', module: 'academics' },
  '/academics/gradebooks': { title: 'Gradebooks', icon: 'GraduationCap', module: 'academics' },
  '/finance': { title: 'Finance', icon: 'DollarSign', module: 'finance' },
  '/finance/tuition': { title: 'Tuition', icon: 'DollarSign', module: 'finance' },
  '/finance/fees': { title: 'Fees', icon: 'DollarSign', module: 'finance' },
  '/finance/reports': { title: 'Reports', icon: 'BarChart3', module: 'finance' },
  '/people': { title: 'People', icon: 'Users', module: 'people' },
  '/people/staff': { title: 'Staff', icon: 'UserCog', module: 'people' },
  '/people/parents': { title: 'Parents', icon: 'Users', module: 'people' },
  // [MVP-PARKED] Parked module page metadata
  // '/messages': { title: 'Messages', icon: 'Mail', module: 'messages' },
  // '/analytics': { title: 'Analytics', icon: 'BarChart3', module: 'analytics' },
  // [/MVP-PARKED]
  '/settings': { title: 'Settings', icon: 'Settings', module: 'settings' },
}

function getPageMetadata(path: string): PageMetadata | null {
  // Exact match first
  if (PAGE_METADATA[path]) {
    return PAGE_METADATA[path]
  }

  // Try to match dynamic routes by finding the base path
  const basePath = path.split('/').slice(0, 3).join('/')
  if (PAGE_METADATA[basePath]) {
    return PAGE_METADATA[basePath]
  }

  // Try module level
  const modulePath = '/' + path.split('/')[1]
  if (PAGE_METADATA[modulePath]) {
    return PAGE_METADATA[modulePath]
  }

  return null
}

// ============================================================================
// ZUSTAND STORE
// ============================================================================

const MAX_RECENT_PAGES = 10

export const useRecentlyVisitedStore = create<RecentlyVisitedState>()(
  persist(
    (set) => ({
      pages: [],
      addPage: (page) =>
        set((state) => {
          // Remove existing entry for this path if it exists
          const filteredPages = state.pages.filter((p) => p.path !== page.path)

          // Add new entry at the beginning
          const newPage: VisitedPage = {
            ...page,
            visitedAt: new Date().toISOString(),
          }

          // Keep only the most recent pages
          const updatedPages = [newPage, ...filteredPages].slice(0, MAX_RECENT_PAGES)

          return { pages: updatedPages }
        }),
      clearPages: () => set({ pages: [] }),
    }),
    {
      name: 'edforge-recently-visited',
    }
  )
)

// ============================================================================
// HOOK
// ============================================================================

export function useRecentlyVisited() {
  const location = useLocation()
  const { pages, addPage, clearPages } = useRecentlyVisitedStore()

  // Track page visits
  const trackVisit = useCallback((path: string) => {
    // Don't track home page itself
    if (path === '/home' || path === '/') return

    const metadata = getPageMetadata(path)
    if (!metadata) return

    addPage({
      path,
      title: metadata.title,
      icon: metadata.icon,
      module: metadata.module,
    })
  }, [addPage])

  // Auto-track on location change
  useEffect(() => {
    trackVisit(location.pathname)
  }, [location.pathname, trackVisit])

  return {
    recentPages: pages,
    trackVisit,
    clearPages,
    getIconComponent,
  }
}

// ============================================================================
// MOCK DATA FOR DEMO
// ============================================================================

export const MOCK_RECENT_PAGES: VisitedPage[] = [
  {
    path: '/academics/students',
    title: 'Students',
    icon: 'Users',
    module: 'academics',
    visitedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    path: '/academics/classrooms',
    title: 'Classrooms',
    icon: 'BookOpen',
    module: 'academics',
    visitedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
  },
  {
    path: '/finance/tuition',
    title: 'Tuition',
    icon: 'DollarSign',
    module: 'finance',
    visitedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
  },
  {
    path: '/people/staff',
    title: 'Staff',
    icon: 'UserCog',
    module: 'people',
    visitedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    path: '/academics/gradebooks',
    title: 'Gradebooks',
    icon: 'GraduationCap',
    module: 'academics',
    visitedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  },
  // [MVP-PARKED] Analytics mock entry
  // {
  //   path: '/analytics',
  //   title: 'Analytics',
  //   icon: 'BarChart3',
  //   module: 'analytics',
  //   visitedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
  // },
  // [/MVP-PARKED]
]

