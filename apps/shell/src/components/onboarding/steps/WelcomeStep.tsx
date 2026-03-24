/**
 * Step 0: Welcome — Greeting + Get Started button
 */

import { useShell } from '../../../lib/shell-context'
import type { OnboardingStepProps } from '../onboarding.types'

export function WelcomeStep({ onNext }: OnboardingStepProps) {
  const { user } = useShell()
  const firstName = user?.displayName || user?.name?.split(' ')[0] || 'there'

  return (
    <div className="flex flex-col items-center text-center py-12">
      {/* Logo */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-400 flex items-center justify-center mb-8 shadow-lg shadow-teal-500/20">
        <span className="text-white font-bold text-2xl">E</span>
      </div>

      <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))] mb-3">
        Welcome to EdForge, {firstName}
      </h1>

      <p className="text-base text-[rgb(var(--text-secondary))] mb-2 max-w-sm">
        Let's get your workspace ready. We'll walk you through a few quick steps to set up your organization.
      </p>

      <p className="text-xs text-[rgb(var(--text-tertiary))] mb-10">
        6 steps &middot; about 5 minutes
      </p>

      <button
        onClick={onNext}
        className="px-8 py-3 rounded-full bg-teal-500 hover:bg-teal-600 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white font-semibold text-base transition-all hover:shadow-lg hover:shadow-teal-500/25 active:scale-[0.98]"
      >
        Get Started
      </button>
    </div>
  )
}
