/**
 * Widget Components Index
 * 
 * Exports all widget components for dynamic pages.
 */

// Carousel Widgets
export { 
  CarouselWidget, 
  RecentlyVisitedWidget,
  type CarouselCard,
} from './CarouselWidget'

// Events Widget
export { 
  UpcomingEventsWidget,
  MOCK_UPCOMING_EVENTS,
  type UpcomingEvent,
} from './UpcomingEventsWidget'

// Quick Actions Widget
export { 
  QuickActionsWidget,
  getQuickActionsForRole,
  type QuickAction,
} from './QuickActionsWidget'

// Welcome Tip Widget
export { 
  WelcomeTipWidget,
  ModuleTipWidget,
  WELCOME_TIPS,
  MODULE_TIPS,
  type WelcomeTip,
} from './WelcomeTipWidget'

// Compliance Alerts Widget (Special Programs)
export {
  ComplianceAlertsWidget,
  type ComplianceAlert,
} from './ComplianceAlertsWidget'

// Data Health Widget (Ed-Fi)
export {
  DataHealthWidget,
  type DataHealthStatus,
  type SyncJob,
} from './DataHealthWidget'

