/**
 * OnboardingPage — Full-screen onboarding flow for new tenant admins.
 * Mounted at /onboarding (child of rootRoute, NOT protectedRoute).
 * No AppShell wrapper — this is a standalone experience.
 */

import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useShell } from '../lib/shell-context'
import { LoadingScreen } from '../components/layout/LoadingScreen'
import { OnboardingFlow } from '../components/onboarding/OnboardingFlow'

export default function OnboardingPage() {
  const { user, isLoading, onboardingCompletedAt, workspaceConfirmedAt } = useShell()
  const navigate = useNavigate()

  // If onboarding is already complete, redirect to dashboard
  useEffect(() => {
    if (isLoading) return
    if (onboardingCompletedAt || (!user || user.globalRole !== 'TenantAdmin')) {
      navigate({ to: '/home', replace: true })
      return
    }
    // Backward compat: workspaceConfirmedAt without onboardingCompletedAt means pre-existing tenant
    if (workspaceConfirmedAt) {
      navigate({ to: '/home', replace: true })
    }
  }, [isLoading, onboardingCompletedAt, workspaceConfirmedAt, user, navigate])

  if (isLoading) {
    return <LoadingScreen message="Loading..." />
  }

  // Don't render flow if redirecting
  if (onboardingCompletedAt || workspaceConfirmedAt || !user || user.globalRole !== 'TenantAdmin') {
    return <LoadingScreen message="Redirecting..." />
  }

  return <OnboardingFlow />
}
