/**
 * useOnboardingRequired — determines if the onboarding flow should be shown.
 *
 * Logic:
 * 1. Non-TenantAdmin roles never see onboarding
 * 2. Check localStorage cache first (fast path to avoid redirect flash)
 * 3. Check onboardingCompletedAt from server (source of truth)
 * 4. Backward compat: workspaceConfirmedAt without onboardingCompletedAt → treat as complete
 * 5. Otherwise, onboarding is required
 */

import { useShell } from '../lib/shell-context'

const COMPLETED_KEY_PREFIX = 'edforge-onboarding-completed-'

export function useOnboardingRequired(): {
  onboardingRequired: boolean
  isLoading: boolean
} {
  const { user, isLoading, onboardingCompletedAt, workspaceConfirmedAt, workspaceSettings, workspaceSettingsError } = useShell()

  // Non-admin roles never see onboarding
  if (!user || user.globalRole !== 'TenantAdmin') {
    return { onboardingRequired: false, isLoading: false }
  }

  const localKey = `${COMPLETED_KEY_PREFIX}${user.tenantId}`

  // Fast path: check localStorage cache (before any loading gate so a
  // completed tenant never waits on the settings fetch)
  try {
    if (localStorage.getItem(localKey)) {
      return { onboardingRequired: false, isLoading: false }
    }
  } catch {
    // localStorage not available — fall through to server check
  }

  // Settings fetch failed (retry:false, workspaceSettings stays null) —
  // fail open rather than holding the loader forever; onboarding can be
  // re-entered once the endpoint recovers.
  if (workspaceSettingsError) {
    return { onboardingRequired: false, isLoading: false }
  }

  // Still loading auth or settings
  if (isLoading || workspaceSettings === null) {
    return { onboardingRequired: false, isLoading: true }
  }

  // Server-side: onboarding explicitly completed
  if (onboardingCompletedAt) {
    try {
      localStorage.setItem(localKey, onboardingCompletedAt)
    } catch {
      // ignore
    }
    return { onboardingRequired: false, isLoading: false }
  }

  // Backward compat: pre-existing tenant confirmed workspace before onboarding existed
  if (workspaceConfirmedAt) {
    try {
      localStorage.setItem(localKey, workspaceConfirmedAt)
    } catch {
      // ignore
    }
    return { onboardingRequired: false, isLoading: false }
  }

  return { onboardingRequired: true, isLoading: false }
}
