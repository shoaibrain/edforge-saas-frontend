/**
 * DynamicPageLayout
 * 
 * Main layout component for customizable pages (Home and Module Overviews).
 * Provides consistent structure with header, widget area, and visibility controls.
 * Three-dot menu positioned in top right corner like Notion.
 */

import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { DynamicPageProvider } from './DynamicPageContext'
import { WidgetVisibilityMenu } from './WidgetVisibilityMenu'
import type { DynamicPageType, WidgetDefinition } from '../../lib/widget-registry'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DynamicPageLayoutProps {
  /** Unique page identifier for storing preferences */
  pageId: string
  /** Type of page (determines available widgets) */
  pageType: DynamicPageType
  /** Optional: Override default widget configuration */
  customWidgets?: WidgetDefinition[]
  /** Header content - can be greeting or title */
  header?: ReactNode
  /** Page title (for module overview pages) */
  title?: string
  /** Page description */
  description?: string
  /** Icon for the page title */
  icon?: LucideIcon
  /** Children components - widgets and custom content */
  children?: ReactNode
  /** Whether to show the widget visibility menu */
  showVisibilityMenu?: boolean
  /** Maximum content width class */
  maxWidth?: string
}

// ============================================================================
// INNER LAYOUT (Within Context)
// ============================================================================

function DynamicPageLayoutInner({
  header,
  children,
  showVisibilityMenu = true,
  maxWidth = 'max-w-5xl',
}: Omit<DynamicPageLayoutProps, 'pageId' | 'pageType' | 'customWidgets' | 'title' | 'description' | 'icon'>) {
  return (
    <div className={`${maxWidth} mx-auto p-6 space-y-10 pb-12 relative`}>
      {/* Three-dot menu in top right corner - Notion style */}
      {showVisibilityMenu && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute top-4 right-0 z-10"
        >
          <WidgetVisibilityMenu />
        </motion.div>
      )}
      
      {/* ================================================================== */}
      {/* PAGE HEADER */}
      {/* ================================================================== */}
      {header && (
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="pt-4 pr-12"
        >
          {header}
        </motion.header>
      )}
      
      {/* ================================================================== */}
      {/* WIDGET AREA */}
      {/* ================================================================== */}
      {children}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT (With Context Provider)
// ============================================================================

export function DynamicPageLayout({
  pageId,
  pageType,
  customWidgets,
  ...rest
}: DynamicPageLayoutProps) {
  return (
    <DynamicPageProvider
      pageId={pageId}
      pageType={pageType}
      customWidgets={customWidgets}
    >
      <DynamicPageLayoutInner {...rest} />
    </DynamicPageProvider>
  )
}

// ============================================================================
// GREETING HEADER COMPONENT
// ============================================================================

interface GreetingHeaderProps {
  greeting: string
}

export function GreetingHeader({ greeting }: GreetingHeaderProps) {
  return (
    <h1 className="text-4xl sm:text-5xl font-bold text-[rgb(var(--text-primary))] tracking-tight">
      {greeting}
    </h1>
  )
}

// ============================================================================
// PAGE HEADER WITH MENU
// ============================================================================

interface PageHeaderWithMenuProps {
  /** Custom header content */
  header: ReactNode
  /** Whether to show the visibility menu */
  showVisibilityMenu?: boolean
}

export function PageHeaderWithMenu({ 
  header, 
  showVisibilityMenu = true 
}: PageHeaderWithMenuProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        {header}
      </div>
      {showVisibilityMenu && <WidgetVisibilityMenu />}
    </div>
  )
}
