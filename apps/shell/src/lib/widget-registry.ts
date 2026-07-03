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
  Calendar,
  Sparkles,
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
export type DynamicPageType = 'home'

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

// ============================================================================
// REGISTRY FUNCTIONS
// ============================================================================

/**
 * Get widget configuration for a page
 */
export function getPageConfig(pageType: DynamicPageType): PageWidgetConfig {
  switch (pageType) {
    case 'home':
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

