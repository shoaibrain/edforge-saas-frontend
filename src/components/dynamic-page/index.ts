/**
 * Dynamic Page Components
 * 
 * A Notion-inspired customizable page system for EdForge.
 * Provides unified architecture for Home and Module Overview pages.
 */

// Context and Provider
export { DynamicPageProvider, useDynamicPage, useWidgetIsVisible } from './DynamicPageContext'

// Layout Components
export { DynamicPageLayout, GreetingHeader, PageHeaderWithMenu } from './DynamicPageLayout'
export type { DynamicPageLayoutProps } from './DynamicPageLayout'

// Widget Components
export { WidgetSection, SimpleWidget, HeaderActionButton } from './WidgetSection'

// Menu Components
export { WidgetVisibilityMenu } from './WidgetVisibilityMenu'

// Widget Implementations
export * from './widgets'

