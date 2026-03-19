/**
 * Home Page - Role-Aware School Command Center (V2)
 *
 * Renders a data-driven dashboard that adapts to the user's role:
 * - Administrators see alerts, KPIs, charts, and quick actions (V2 layout)
 * - Teachers see their assigned sections and classroom quick actions
 * - Students see academic quick actions
 * - Parents see family-oriented quick actions
 *
 * All data is fetched from existing APIs (academics, finance, identity).
 * Greeting and date info are rendered in the Header topbar for admin V2.
 */

import { useEffect } from 'react'
import { useAuthStore, getUserRoleCategory } from '../stores/auth.store'
import { useAppStore } from '../stores/app.store'
import { useHomeStore } from '../stores/home.store'
import { useTranslation } from '@edforge/i18n'
import { getGreeting } from '../lib/greeting'

// Dynamic Page Components
import {
  DynamicPageLayout,
  GreetingHeader,
  QuickActionsWidget,
} from '../components/dynamic-page'

// Role-based command center layouts
import { AdminCommandCenter } from '../components/home/AdminCommandCenter'
import { TeacherDashboard } from '../components/home/TeacherDashboard'
import { StudentDashboard } from '../components/home/StudentDashboard'

// ============================================================================
// HOME PAGE COMPONENT
// ============================================================================

export default function HomePage() {
  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const setHomeV2Active = useHomeStore((s) => s.setHomeV2Active)
  const { t } = useTranslation('dashboard')

  const roleCategory = getUserRoleCategory(user, activeSchoolId)
  const firstName = user?.displayName || user?.name?.split(' ')[0]
  const greeting = getGreeting(firstName, t)
  const isAdmin = roleCategory === 'administrator'

  // Signal to Header that V2 home page is active
  useEffect(() => {
    if (isAdmin) {
      setHomeV2Active(true)
      return () => setHomeV2Active(false)
    }
  }, [isAdmin, setHomeV2Active])

  // Admin V2 — renders its own layout with data-page="home-v2"
  if (isAdmin) {
    return <AdminCommandCenter schoolId={activeSchoolId} />
  }

  // Non-admin roles keep the existing DynamicPageLayout
  return (
    <DynamicPageLayout
      pageId="home"
      pageType="home"
      header={<GreetingHeader greeting={greeting} />}
      showVisibilityMenu={true}
    >
      {roleCategory === 'educator' && (
        <TeacherDashboard schoolId={activeSchoolId} />
      )}
      {roleCategory === 'student' && (
        <StudentDashboard schoolId={activeSchoolId} />
      )}
      {roleCategory === 'parent' && (
        <QuickActionsWidget />
      )}
      {roleCategory == null && (
        <QuickActionsWidget />
      )}
    </DynamicPageLayout>
  )
}
