/**
 * Home Page - Role-Aware Dynamic Dashboard
 * 
 * A Notion-inspired customizable landing page that adapts to the user's role:
 * - Administrators see management quick actions
 * - Teachers see classroom-focused actions
 * - Students see academic progress and assignments
 * - Parents see children's overview and school communications
 * 
 * All users get:
 * - Time-based personalized greeting
 * - Recently visited pages carousel
 * - Upcoming events calendar (with customization menu)
 * - Role-appropriate quick actions
 * - Contextual welcome tips
 * 
 * Widget visibility is customizable and persisted per user.
 * Three-dot menu in top right corner (handled by DynamicPageLayout).
 */

import { useAuthStore } from '../stores/auth.store'
import { getGreeting } from '../lib/greeting'

// Dynamic Page Components
import {
  DynamicPageLayout,
  GreetingHeader,
  RecentlyVisitedWidget,
  UpcomingEventsWidget,
  QuickActionsWidget,
  WelcomeTipWidget,
} from '../components/dynamic-page'

// ============================================================================
// HOME PAGE COMPONENT
// ============================================================================

export default function HomePage() {
  const user = useAuthStore((s) => s.user)
  
  const firstName = user?.name?.split(' ')[0]
  const greeting = getGreeting(firstName)
  
  return (
    <DynamicPageLayout
      pageId="home"
      pageType="home"
      header={<GreetingHeader greeting={greeting} />}
      showVisibilityMenu={true}
    >
      {/* ================================================================== */}
      {/* RECENTLY VISITED CAROUSEL */}
      {/* ================================================================== */}
      <RecentlyVisitedWidget />

      {/* ================================================================== */}
      {/* UPCOMING EVENTS */}
      {/* ================================================================== */}
      <UpcomingEventsWidget />

      {/* ================================================================== */}
      {/* QUICK ACTIONS - Role-Specific */}
      {/* ================================================================== */}
      <QuickActionsWidget />

      {/* ================================================================== */}
      {/* WELCOME TIP - Role-Specific */}
      {/* ================================================================== */}
      <WelcomeTipWidget />
    </DynamicPageLayout>
  )
}
