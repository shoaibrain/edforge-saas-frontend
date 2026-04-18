/**
 * Minimal tenant fetch for the analytics MFE.
 *
 * The shell already calls `GET /tenants/{id}` via its own service and
 * stores the result in shell-context. We don't have access to that
 * context across the Module-Federation boundary, so the MFE issues its
 * own request — the response is small (~1 KB) and React Query dedups
 * across components.
 *
 * Only the fields needed by the dashboard's adoption-report query are
 * captured here. Add more as use cases require.
 */

import { apiGet } from '../lib/api'

export interface AnalyticsTenant {
  tenantId: string
  /** ISO timestamp when the tenant was created. Drives grace-period flag. */
  createdAt: string
  /** ISO timestamp when workspace onboarding completed. Optional. */
  workspaceConfirmedAt?: string
}

export const analyticsTenantService = {
  async getTenant(tenantId: string): Promise<AnalyticsTenant> {
    return apiGet<AnalyticsTenant>(`/tenants/${tenantId}`)
  },
}
