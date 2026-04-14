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



