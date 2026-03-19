/**
 * Home Page - Role-Aware School Command Center
 *
 * Renders a data-driven dashboard that adapts to the user's role:
 * - Administrators see alerts, KPIs, charts, and 6 quick actions
 * - Teachers see their assigned sections and classroom quick actions
 * - Students see academic quick actions
 * - Parents see family-oriented quick actions
 *
 * All data is fetched from existing APIs (academics, finance, identity).
 * No mock data, no "Coming Soon" badges, no placeholder content.
 */

import { useAuthStore, getUserRoleCategory } from '../stores/auth.store'
import { useAppStore } from '../stores/app.store'
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
  const { t } = useTranslation('dashboard')

  const roleCategory = getUserRoleCategory(user, activeSchoolId)
  const firstName = user?.displayName || user?.name?.split(' ')[0]
  const greeting = getGreeting(firstName, t)

  return (
    <DynamicPageLayout
      pageId="home"
      pageType="home"
      header={<GreetingHeader greeting={greeting} />}
      showVisibilityMenu={true}
    >
      {/* ================================================================== */}
      {/* ROLE-BASED COMMAND CENTER */}
      {/* ================================================================== */}
      {roleCategory === 'administrator' && (
        <AdminCommandCenter schoolId={activeSchoolId} />
      )}
      {roleCategory === 'educator' && (
        <TeacherDashboard schoolId={activeSchoolId} />
      )}
      {roleCategory === 'student' && (
        <StudentDashboard schoolId={activeSchoolId} />
      )}
      {roleCategory === 'parent' && (
        <QuickActionsWidget />
      )}
      {/* Fallback for no role (e.g., TenantAdmin without school assignment) */}
      {roleCategory == null && (
        <QuickActionsWidget />
      )}
    </DynamicPageLayout>
  )
}
