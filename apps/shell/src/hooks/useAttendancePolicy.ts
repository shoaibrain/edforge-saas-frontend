/**
 * Attendance policy hooks — Attendance Domain epic (Story 4).
 *
 * Read the resolved per-school attendance mode + write a school override.
 *
 * Cross-MFE note: the academics teacher UI consumes the same policy under
 * `['attendance','policy',schoolId]` and section locks under
 * `['attendance','presence-locks',...]`. Because the academics MFE shares the
 * shell's QueryClient at runtime, invalidating the `['attendance']` prefix
 * wholesale from here reaches the teacher surface and reflects a mode change
 * live (Decision: invalidate wholesale).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AttendancePolicy } from '@aibrains/shared-types'
import { getSchoolAttendancePolicy } from '@/services/attendance-policy.service'
import { tenantService } from '@/services/tenant.service'

export function useSchoolAttendancePolicy(schoolId?: string) {
  return useQuery({
    queryKey: ['attendance', 'policy', schoolId],
    queryFn: () => getSchoolAttendancePolicy(schoolId as string),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateSchoolAttendancePolicy(schoolId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (mode: AttendancePolicy) =>
      // The write reuses the identity school-config PATCH; the column on the
      // backend SchoolConfiguration is `attendancePolicy`. Cast matches the
      // ConfigurationTab convention (frontend SchoolConfiguration type lacks
      // this top-level field).
      tenantService.updateSchoolConfiguration(schoolId, { attendancePolicy: mode } as any),
    onSuccess: () => {
      // Wholesale: covers ['attendance','policy',...] + the academics MFE's
      // ['attendance','presence-locks',...] so a mode flip reflects live.
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      queryClient.invalidateQueries({ queryKey: ['schoolConfiguration', schoolId] })
      queryClient.invalidateQueries({ queryKey: ['school', schoolId] })
    },
  })
}
