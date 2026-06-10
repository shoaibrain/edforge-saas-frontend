/**
 * OnboardingTopbar — Fixed topbar with logo and step indicator.
 */

interface OnboardingTopbarProps {
  currentStep: number
  totalSteps: number
}

export function OnboardingTopbar({ currentStep, totalSteps }: OnboardingTopbarProps) {
  const showStepIndicator = currentStep > 0 && currentStep < totalSteps - 1

  return (
    <div
      className="fixed top-0.5 left-0 right-0 z-40 h-14 flex items-center justify-between px-6 backdrop-blur bg-[rgba(var(--bg-primary),0.85)]"
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[rgb(var(--action-primary-bg))] to-[rgb(var(--action-primary-bg-hover))] flex items-center justify-center">
          <span className="text-[rgb(var(--action-primary-fg))] font-bold text-xs">E</span>
        </div>
        <span className="text-sm font-semibold text-[rgb(var(--text-primary))]">EdForge</span>
      </div>

      {/* Step indicator */}
      {showStepIndicator && (
        <span className="text-xs text-[rgb(var(--text-tertiary))]">
          Step {currentStep} of {totalSteps - 2}
        </span>
      )}
    </div>
  )
}
