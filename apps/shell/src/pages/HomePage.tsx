/**
 * Home Page - Role-Aware School Command Center (V2)
 *
 * Renders a data-driven dashboard that adapts to the user's role:
 * - Administrators see alerts, KPIs, charts, and quick actions (V2 layout)
 * - Teachers see V2-styled section cards with KPI tiles and attendance (Sprint 3)
 * - Students see V2-styled welcome card with relevant links (Sprint 3)
 * - Parents see V2-styled welcome card (Sprint 3.6 — deferred to future sprint)
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
  const isV2Role = roleCategory === 'administrator' || roleCategory === 'educator' || roleCategory === 'student'

  // Signal to Header that V2 home page is active (all V2 roles)
  useEffect(() => {
    if (isV2Role) {
      setHomeV2Active(true)
      return () => setHomeV2Active(false)
    }
  }, [isV2Role, setHomeV2Active])

  // Admin V2 — renders its own layout with data-page="home-v2"
  if (roleCategory === 'administrator') {
    return <AdminCommandCenter schoolId={activeSchoolId} />
  }

  // Teacher V2 — renders V2 layout directly (no DynamicPageLayout wrapper)
  if (roleCategory === 'educator') {
    return <TeacherDashboard schoolId={activeSchoolId} />
  }

  // Student V2 — renders V2 layout directly
  if (roleCategory === 'student') {
    return <StudentDashboard schoolId={activeSchoolId} />
  }

  // Parent + unknown roles — keep DynamicPageLayout for now
  // Ticket 3.6: Parent dashboard V2 — DEFERRED to future sprint.
  // Rationale: No parent-specific APIs exist yet. Parents need child-specific
  // attendance/grades endpoints before a meaningful V2 dashboard can be built.
  return (
    <DynamicPageLayout
      pageId="home"
      pageType="home"
      header={<GreetingHeader greeting={greeting} />}
      showVisibilityMenu={true}
    >
      <QuickActionsWidget />
    </DynamicPageLayout>
  )
}
