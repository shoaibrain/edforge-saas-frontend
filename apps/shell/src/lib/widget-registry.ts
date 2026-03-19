/**
 * Widget Registry
 * 
 * Defines all available widgets for dynamic pages with their metadata,
 * default visibility, and page-specific configurations.
 * 
 * This registry enables:
 * - Type-safe widget definitions
 * - Page-specific widget sets (home vs module overview)
 * - Default visibility settings
 * - ABAC permission requirements per widget
 */

import type { LucideIcon } from 'lucide-react'
import {
  Clock,
  Calendar,
  Sparkles,
  LayoutGrid,
  BarChart3,
  Lightbulb,
  CheckSquare,
  Layers,
  GalleryVerticalEnd,
  Bell,
  CalendarDays,
} from 'lucide-react'
import type { Action, Resource } from '@edforge/abac'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Widget category for grouping in visibility menu
 */
export type WidgetCategory = 
  | 'content'      // Main content widgets (carousel, stats)
  | 'calendar'     // Time-based widgets (events, schedule)
  | 'tasks'        // Task/action widgets
  | 'insights'     // Tips, analytics, learn
  | 'views'        // Custom database views

/**
 * Page type for widget configuration
 */
export type DynamicPageType = 
  | 'home'              // Main home/dashboard page
  | 'module-overview'   // Module landing pages (academics, finance, etc.)

/**
 * Widget definition with all metadata
 */
export interface WidgetDefinition {
  /** Unique widget identifier */
  id: string
  /** Display label for the widget */
  label: string
  /** Icon for the visibility menu */
  icon: LucideIcon
  /** Category for grouping in menu */
  category: WidgetCategory
  /** Default visibility state */
  defaultVisible: boolean
  /** Order priority (lower = earlier) */
  order: number
  /** Optional ABAC permission requirement */
  permission?: {
    action: Action
    resource: Resource
  }
  /** Description shown in visibility menu */
  description?: string
}

/**
 * Page-specific widget configuration
 */
export interface PageWidgetConfig {
  /** Page type for styling/behavior */
  pageType: DynamicPageType
  /** Available widgets for this page */
  widgets: WidgetDefinition[]
  /** Page-specific settings */
  settings?: {
    /** Show greeting header (home only) */
    showGreeting?: boolean
    /** Show page title with icon */
    showTitle?: boolean
  }
}

// ============================================================================
// WIDGET DEFINITIONS
// ============================================================================

/**
 * Recently Visited carousel widget (home page)
 */
export const RECENTLY_VISITED_WIDGET: WidgetDefinition = {
  id: 'recently-visited',
  label: 'Recently visited',
  icon: Clock,
  category: 'content',
  defaultVisible: true,
  order: 10,
  description: 'Pages you visited recently',
}

/**
 * Quick Stats carousel widget (module overview pages)
 */
export const QUICK_STATS_WIDGET: WidgetDefinition = {
  id: 'quick-stats',
  label: 'Quick stats',
  icon: BarChart3,
  category: 'content',
  defaultVisible: true,
  order: 10,
  description: 'Key metrics at a glance',
}

/**
 * Upcoming Events widget
 */
export const UPCOMING_EVENTS_WIDGET: WidgetDefinition = {
  id: 'upcoming-events',
  label: 'Upcoming events',
  icon: Calendar,
  category: 'calendar',
  defaultVisible: true,
  order: 20,
  description: 'Calendar events and deadlines',
}

/**
 * Quick Actions grid widget
 */
export const QUICK_ACTIONS_WIDGET: WidgetDefinition = {
  id: 'quick-actions',
  label: 'Quick actions',
  icon: Sparkles,
  category: 'tasks',
  defaultVisible: true,
  order: 30,
  description: 'Frequently used actions',
}

/**
 * Module Quick Access cards widget (overview pages)
 */
export const QUICK_ACCESS_WIDGET: WidgetDefinition = {
  id: 'quick-access',
  label: 'Quick access',
  icon: LayoutGrid,
  category: 'content',
  defaultVisible: true,
  order: 40,
  description: 'Navigate to sub-sections',
}

/**
 * Welcome Tip / Learn widget
 */
export const WELCOME_TIP_WIDGET: WidgetDefinition = {
  id: 'welcome-tip',
  label: 'Tips & guidance',
  icon: Lightbulb,
  category: 'insights',
  defaultVisible: true,
  order: 50,
  description: 'Helpful tips and onboarding',
}

/**
 * My Tasks widget (future feature)
 */
export const MY_TASKS_WIDGET: WidgetDefinition = {
  id: 'my-tasks',
  label: 'My tasks',
  icon: CheckSquare,
  category: 'tasks',
  defaultVisible: false, // Disabled by default until implemented
  order: 25,
  description: 'Your pending tasks',
}

/**
 * Home Alerts widget (admin command center)
 */
export const HOME_ALERTS_WIDGET: WidgetDefinition = {
  id: 'home-alerts',
  label: 'Alerts',
  icon: Bell,
  category: 'content',
  defaultVisible: true,
  order: 5,
  description: 'Critical attendance and finance alerts',
}

/**
 * Teacher Sections widget (teacher dashboard)
 */
export const HOME_TEACHER_SECTIONS_WIDGET: WidgetDefinition = {
  id: 'home-teacher-sections',
  label: 'My Sections',
  icon: CalendarDays,
  category: 'content',
  defaultVisible: true,
  order: 10,
  description: 'Your assigned class sections',
}

/**
 * Database Views widget (future feature)
 */
export const DATABASE_VIEWS_WIDGET: WidgetDefinition = {
  id: 'database-views',
  label: 'Database views',
  icon: Layers,
  category: 'views',
  defaultVisible: false, // Disabled by default until implemented
  order: 60,
  description: 'Custom data views',
}

// ============================================================================
// PAGE CONFIGURATIONS
// ============================================================================

/**
 * Home page widget configuration
 */
export const HOME_PAGE_CONFIG: PageWidgetConfig = {
  pageType: 'home',
  widgets: [
    HOME_ALERTS_WIDGET,
    HOME_TEACHER_SECTIONS_WIDGET,
    QUICK_ACTIONS_WIDGET,
  ],
  settings: {
    showGreeting: true,
    showTitle: false,
  },
}

/**
 * Module Overview page widget configuration
 * Used by Academics, Finance, People, Analytics, Communications
 */
export const MODULE_OVERVIEW_CONFIG: PageWidgetConfig = {
  pageType: 'module-overview',
  widgets: [
    QUICK_STATS_WIDGET,
    UPCOMING_EVENTS_WIDGET,
    QUICK_ACCESS_WIDGET,
    WELCOME_TIP_WIDGET,
  ],
  settings: {
    showGreeting: false,
    showTitle: true,
  },
}

// ============================================================================
// REGISTRY FUNCTIONS
// ============================================================================

/**
 * Get widget configuration for a page
 */
export function getPageConfig(pageType: DynamicPageType): PageWidgetConfig {
  switch (pageType) {
    case 'home':
      return HOME_PAGE_CONFIG
    case 'module-overview':
      return MODULE_OVERVIEW_CONFIG
    default:
      return HOME_PAGE_CONFIG
  }
}

/**
 * Get default widget visibility map for a page
 */
export function getDefaultWidgetVisibility(pageType: DynamicPageType): Record<string, boolean> {
  const config = getPageConfig(pageType)
  return config.widgets.reduce((acc, widget) => {
    acc[widget.id] = widget.defaultVisible
    return acc
  }, {} as Record<string, boolean>)
}

/**
 * Get widgets sorted by order
 */
export function getSortedWidgets(widgets: WidgetDefinition[]): WidgetDefinition[] {
  return [...widgets].sort((a, b) => a.order - b.order)
}

/**
 * Get widgets grouped by category
 */
export function getWidgetsByCategory(
  widgets: WidgetDefinition[]
): Map<WidgetCategory, WidgetDefinition[]> {
  const grouped = new Map<WidgetCategory, WidgetDefinition[]>()
  
  for (const widget of widgets) {
    const existing = grouped.get(widget.category) || []
    grouped.set(widget.category, [...existing, widget])
  }
  
  return grouped
}

/**
 * Category display names for UI
 */
export const CATEGORY_LABELS: Record<WidgetCategory, string> = {
  content: 'Content',
  calendar: 'Calendar',
  tasks: 'Tasks',
  insights: 'Insights',
  views: 'Views',
}

/**
 * Category icons
 */
export const CATEGORY_ICONS: Record<WidgetCategory, LucideIcon> = {
  content: GalleryVerticalEnd,
  calendar: Calendar,
  tasks: CheckSquare,
  insights: Lightbulb,
  views: Layers,
}

