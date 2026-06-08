/**
 * OnboardingProgressBar — 2px fixed top bar showing onboarding progress.
 */

interface OnboardingProgressBarProps {
  progress: number
}

export function OnboardingProgressBar({ progress }: OnboardingProgressBarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-[rgb(var(--border-primary))]">
      <div
        className="h-full bg-[rgb(var(--action-primary-bg))] "
        style={{
          width: `${progress}%`,
          transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </div>
  )
}
