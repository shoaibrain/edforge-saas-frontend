/**
 * useTenant — fetches the tenant record (createdAt, workspaceConfirmedAt).
 * Used by the dashboard to pass `provisionedAt` to the adoption-report query
 * so the grace-period flag is computed correctly.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import {
  analyticsTenantService,
  type AnalyticsTenant,
} from '../services/tenant.service'

export const tenantKeys = {
  all: ['analytics-tenant'] as const,
  byId: (tenantId: string) => [...tenantKeys.all, tenantId] as const,
}

export function useTenant(
  tenantId: string,
  options?: { enabled?: boolean },
): UseQueryResult<AnalyticsTenant> {
  return useQuery({
    queryKey: tenantKeys.byId(tenantId),
    queryFn: () => analyticsTenantService.getTenant(tenantId),
    staleTime: 10 * 60_000,
    enabled: options?.enabled ?? Boolean(tenantId),
  })
}
