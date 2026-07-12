/**
 * Active-school context for chrome surfaces (phone app bar subtitle, school
 * sheet, nav drawer header).
 *
 * Shares SchoolSwitcher's exact query key + role rules, so the two dedupe via
 * the React Query cache and can never disagree about who may switch schools.
 */

import { useQuery } from '@tanstack/react-query'
import { getRoleCategory } from '@edforge/types'
import type { School } from '@edforge/types'
import { useAuthStore } from '../stores/auth.store'
import { useAppStore } from '../stores/app.store'
import { tenantService } from '../services/tenant.service'

export interface UseActiveSchoolReturn {
  activeSchool: School | undefined
  /** Schools this user may switch between (all for TenantAdmin, assigned otherwise). */
  visibleSchools: School[]
  isLoading: boolean
  isTenantAdmin: boolean
  isStudentOrParent: boolean
  /** Whether the school subtitle should be a switcher trigger. */
  canSwitch: boolean
}

export function useActiveSchool(): UseActiveSchoolReturn {
  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)

  const { data: allSchools = [], isLoading } = useQuery({
    queryKey: ['schools', user?.tenantId],
    queryFn: () => tenantService.getSchools(user?.tenantId || ''),
    enabled: !!user?.tenantId,
    staleTime: 5 * 60 * 1000,
  })

  const schoolsArray: School[] = Array.isArray(allSchools) ? allSchools : []

  const userAssignedSchoolIds = Object.keys(user?.assignments || {})
  const firstAssignedSchoolId = userAssignedSchoolIds[0]
  const firstAssignedRole =
    user && firstAssignedSchoolId ? user.assignments[firstAssignedSchoolId] : null
  const roleCategory = firstAssignedRole ? getRoleCategory(firstAssignedRole) : null
  const isStudentOrParent = roleCategory === 'student' || roleCategory === 'parent'
  const isTenantAdmin = user?.globalRole === 'TenantAdmin'

  const visibleSchools = isTenantAdmin
    ? schoolsArray
    : schoolsArray.filter((s) => userAssignedSchoolIds.includes(s.id))

  const activeSchool = schoolsArray.find((s) => s.id === activeSchoolId)

  return {
    activeSchool,
    visibleSchools,
    isLoading,
    isTenantAdmin,
    isStudentOrParent,
    canSwitch: !isStudentOrParent && visibleSchools.length > 0,
  }
}
