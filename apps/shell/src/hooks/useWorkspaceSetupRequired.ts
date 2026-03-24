/**
 * @deprecated Replaced by useOnboardingRequired hook (Sprint 1).
 * Kept for rollback safety — do not use in new code.
 *
 * useWorkspaceSetupRequired — determines if the workspace setup gate should be shown.
 *
 * Logic:
 * 1. Check localStorage cache first (fast path to avoid gate flash on reload)
 * 2. Check workspaceConfirmedAt from server-side workspace settings (source of truth)
 * 3. If neither exists, setup is required
 *
 * Only applies to TenantAdmin role.
 */

import { useShell } from '../lib/shell-context'

const CONFIRMED_KEY_PREFIX = 'edforge-workspace-confirmed-'

export function useWorkspaceSetupRequired(): {
  setupRequired: boolean
  isLoading: boolean
} {
  const { user, isLoading, workspaceConfirmedAt, workspaceSettings } = useShell()

  // Non-admin roles never see the gate
  if (!user || user.globalRole !== 'TenantAdmin') {
    return { setupRequired: false, isLoading: false }
  }

  // Still loading auth or settings
  if (isLoading || workspaceSettings === null) {
    return { setupRequired: false, isLoading: true }
  }

  // Fast path: check localStorage cache
  const localKey = `${CONFIRMED_KEY_PREFIX}${user.tenantId}`
  try {
    if (localStorage.getItem(localKey)) {
      return { setupRequired: false, isLoading: false }
    }
  } catch {
    // localStorage not available — fall through to server check
  }

  // Server-side source of truth
  if (workspaceConfirmedAt) {
    // Cache it locally to avoid flash on next reload
    try {
      localStorage.setItem(localKey, workspaceConfirmedAt)
    } catch {
      // ignore
    }
    return { setupRequired: false, isLoading: false }
  }

  return { setupRequired: true, isLoading: false }
}
