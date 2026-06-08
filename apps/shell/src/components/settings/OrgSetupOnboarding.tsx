/**
 * OrgSetupOnboarding
 *
 * Guided onboarding for new tenants when no SEA and no LEAs exist.
 * Inline steps: 1) Set Up State Agency → 2) Create First District → 3) Assign Schools → Done
 * Completion stored in localStorage so it can be dismissed.
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Landmark,
  Building2,
  School,
  CheckCircle2,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react'
import { usePermission } from '@edforge/abac'
import { useStateEducationAgency, useLocalEducationAgencies } from '@/hooks/useEducationOrgs'

// ============================================================================
// TYPES
// ============================================================================

interface OnboardingStep {
  id: string
  label: string
  description: string
  icon: typeof Landmark
  color: string
  isComplete: boolean
}

export interface OrgSetupOnboardingProps {
  onSetupSea: () => void
  onCreateLea: () => void
  onAddSchool: () => void
}

// ============================================================================
// STORAGE KEY
// ============================================================================

const ONBOARDING_DISMISSED_KEY = 'edforge-org-onboarding-dismissed'

function isOnboardingDismissed(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_DISMISSED_KEY) === 'true'
  } catch {
    return false
  }
}

function setOnboardingDismissed() {
  try {
    localStorage.setItem(ONBOARDING_DISMISSED_KEY, 'true')
  } catch {
    // Ignore storage errors
  }
}

// ============================================================================
// STEP CARD
// ============================================================================

function StepCard({
  step,
  stepNumber,
  isActive,
  onClick,
}: {
  step: OnboardingStep
  stepNumber: number
  isActive: boolean
  onClick?: () => void
}) {
  const Icon = step.icon

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={step.isComplete || !onClick}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: stepNumber * 0.1, type: 'spring', stiffness: 300, damping: 25 }}
      className={`relative w-full text-left p-5 rounded-xl border transition-all group ${
        step.isComplete
          ? 'border-[rgb(var(--state-success-border)/0.35)] bg-[rgb(var(--state-success-fg))]/5'
          : isActive
          ? 'border-[rgb(var(--border-focus)/0.40)] bg-[rgb(var(--action-primary-bg))]/5 shadow-lg shadow-teal-500/10 ring-1 ring-[rgb(var(--border-focus))]/20'
          : 'border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] opacity-60'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Step number / check */}
        <div
          className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
            step.isComplete
              ? 'bg-[rgb(var(--state-success-fg))]/15'
              : isActive
              ? step.color
              : 'bg-[rgb(var(--background-tertiary))]'
          }`}
        >
          {step.isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-[rgb(var(--state-success-fg))]" />
          ) : (
            <Icon
              className={`w-5 h-5 ${
                isActive ? 'text-current' : 'text-[rgb(var(--text-tertiary))]'
              }`}
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
              Step {stepNumber + 1}
            </span>
            {step.isComplete && (
              <span className="text-xs font-medium text-[rgb(var(--state-success-fg))] ">
                Complete
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))] mb-0.5">
            {step.label}
          </h3>
          <p className="text-xs text-[rgb(var(--text-tertiary))] leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Arrow */}
        {isActive && !step.isComplete && onClick && (
          <ChevronRight className="w-5 h-5 text-[rgb(var(--action-secondary-fg))] shrink-0 mt-2 group-hover:translate-x-0.5 transition-transform" />
        )}
      </div>
    </motion.button>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OrgSetupOnboarding({
  onSetupSea,
  onCreateLea,
  onAddSchool,
}: OrgSetupOnboardingProps) {
  const canManage = usePermission('manage', 'education-organizations')
  const [dismissed, setDismissed] = useState(isOnboardingDismissed)

  const { data: sea } = useStateEducationAgency()
  const { data: leas } = useLocalEducationAgencies()

  const hasSea = !!sea
  const hasLeas = (leas?.items?.length ?? 0) > 0

  // Build steps with completion status
  const steps: OnboardingStep[] = [
    {
      id: 'sea',
      label: 'Set Up State Education Agency',
      description:
        'Create your SEA — the root of your organization hierarchy. This represents your state education department.',
      icon: Landmark,
      color: 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))] ',
      isComplete: hasSea,
    },
    {
      id: 'lea',
      label: 'Create Your First District',
      description:
        'Add a Local Education Agency (LEA) — your school district. Districts organize schools for administration and reporting.',
      icon: Building2,
      color: 'bg-[rgb(var(--action-primary-bg))]/15 text-[rgb(var(--action-secondary-fg))] ',
      isComplete: hasLeas,
    },
    {
      id: 'schools',
      label: 'Add Schools',
      description:
        'Assign schools to your district. Schools are where students enroll and staff teach.',
      icon: School,
      color: 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))] ',
      isComplete: false, // We don't track this in the onboarding — becomes irrelevant
    },
  ]

  // Determine which step is active (first incomplete)
  const activeIndex = steps.findIndex((s) => !s.isComplete)
  const allComplete = hasSea && hasLeas

  // Auto-dismiss once first two steps are complete
  useEffect(() => {
    if (allComplete && !dismissed) {
      // Give a moment for the user to see completion before hiding
      const timer = setTimeout(() => {
        setOnboardingDismissed()
        setDismissed(true)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [allComplete, dismissed])

  const handleDismiss = () => {
    setOnboardingDismissed()
    setDismissed(true)
  }

  const getStepAction = (index: number) => {
    if (!canManage) return undefined
    if (steps[index].isComplete) return undefined
    if (index !== activeIndex) return undefined
    switch (index) {
      case 0:
        return onSetupSea
      case 1:
        return onCreateLea
      case 2:
        return onAddSchool
      default:
        return undefined
    }
  }

  if (dismissed) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="relative"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden rounded-2xl">
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-[rgb(var(--state-info-bg)/0.12)] rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-[rgb(var(--action-primary-bg))]/5 rounded-full blur-3xl" />
      </div>

      <div className="p-6 rounded-2xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))]">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[rgb(var(--state-info-bg)/0.18)] to-[rgb(var(--state-info-bg)/0.10)]">
              <Sparkles className="w-5 h-5 text-[rgb(var(--state-info-fg))] " />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] tracking-tight">
                Get Started
              </h2>
              <p className="text-sm text-[rgb(var(--text-tertiary))]">
                Set up your organization structure in three easy steps
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-tertiary))] transition-colors"
            aria-label="Dismiss onboarding"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[rgb(var(--text-tertiary))]">
              {steps.filter((s) => s.isComplete).length} of {steps.length} steps complete
            </span>
            {allComplete && (
              <span className="text-xs font-medium text-[rgb(var(--state-success-fg))] ">
                All done!
              </span>
            )}
          </div>
          <div
            className="h-1.5 rounded-full bg-[rgb(var(--background-tertiary))] overflow-hidden"
            role="progressbar"
            aria-valuenow={steps.filter((s) => s.isComplete).length}
            aria-valuemin={0}
            aria-valuemax={steps.length}
            aria-label="Onboarding progress"
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[rgb(var(--state-info-fg))] to-[rgb(var(--action-primary-bg))]"
              initial={{ width: 0 }}
              animate={{
                width: `${(steps.filter((s) => s.isComplete).length / steps.length) * 100}%`,
              }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <StepCard
              key={step.id}
              step={step}
              stepNumber={index}
              isActive={index === activeIndex}
              onClick={getStepAction(index)}
            />
          ))}
        </div>

        {/* Skip button */}
        {!allComplete && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleDismiss}
              className="text-xs text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] transition-colors"
            >
              Skip onboarding — I know what I'm doing
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default OrgSetupOnboarding
