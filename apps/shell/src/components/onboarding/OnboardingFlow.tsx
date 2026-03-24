/**
 * OnboardingFlow — Main orchestrator for the 7-step onboarding experience.
 * Manages step state, data, session persistence, and step transitions.
 */

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useShell } from '../../lib/shell-context'
import { OnboardingProgressBar } from './OnboardingProgressBar'
import { OnboardingTopbar } from './OnboardingTopbar'
import { WelcomeStep } from './steps/WelcomeStep'
import { IdentityStep } from './steps/IdentityStep'
import { WorkspaceConfirmStep } from './steps/WorkspaceConfirmStep'
import { CreateSchoolStep } from './steps/CreateSchoolStep'
import { AcademicYearStep } from './steps/AcademicYearStep'
import { InviteTeamStep } from './steps/InviteTeamStep'
import { CompleteStep } from './steps/CompleteStep'
import {
  ONBOARDING_STEPS,
  PROGRESS_VALUES,
  type OnboardingData,
  type OnboardingStepProps,
} from './onboarding.types'

const SESSION_KEY_PREFIX = 'edforge-onboarding-'
const SESSION_MAX_AGE_MS = 30 * 60 * 1000 // 30 minutes

interface SessionState {
  step: number
  data: OnboardingData
  timestamp: number
}

export function OnboardingFlow() {
  const { user } = useShell()
  const tenantId = user?.tenantId ?? ''
  const sessionKey = `${SESSION_KEY_PREFIX}${tenantId}`

  // Restore session or start fresh
  const [currentStep, setCurrentStep] = useState<number>(() => {
    try {
      const raw = sessionStorage.getItem(sessionKey)
      if (raw) {
        const session: SessionState = JSON.parse(raw)
        if (Date.now() - session.timestamp < SESSION_MAX_AGE_MS) {
          return session.step
        }
      }
    } catch { /* ignore */ }
    return 0
  })

  const [data, setData] = useState<OnboardingData>(() => {
    try {
      const raw = sessionStorage.getItem(sessionKey)
      if (raw) {
        const session: SessionState = JSON.parse(raw)
        if (Date.now() - session.timestamp < SESSION_MAX_AGE_MS) {
          return session.data
        }
      }
    } catch { /* ignore */ }
    return {}
  })

  const [direction, setDirection] = useState<1 | -1>(1)

  // Persist to sessionStorage on step/data change
  useEffect(() => {
    try {
      const session: SessionState = { step: currentStep, data, timestamp: Date.now() }
      sessionStorage.setItem(sessionKey, JSON.stringify(session))
    } catch { /* ignore */ }
  }, [currentStep, data, sessionKey])

  const goNext = useCallback(() => {
    setDirection(1)
    setCurrentStep((s) => {
      let next = s + 1
      // Auto-skip academic year if school was skipped
      if (next === 4 && !data.schoolId) {
        next = 5
      }
      return Math.min(next, ONBOARDING_STEPS.length - 1)
    })
  }, [data.schoolId])

  const goBack = useCallback(() => {
    setDirection(-1)
    setCurrentStep((s) => {
      let prev = s - 1
      // Auto-skip academic year going back if school was skipped
      if (prev === 4 && !data.schoolId) {
        prev = 3
      }
      return Math.max(prev, 0)
    })
  }, [data.schoolId])

  const clearSession = useCallback(() => {
    try {
      sessionStorage.removeItem(sessionKey)
    } catch { /* ignore */ }
  }, [sessionKey])

  const stepProps: OnboardingStepProps = {
    data,
    setData,
    onNext: goNext,
    onBack: goBack,
    onSkip: ONBOARDING_STEPS[currentStep]?.skippable ? goNext : undefined,
  }

  const progress = PROGRESS_VALUES[currentStep] ?? 0

  const variants = {
    enter: (dir: number) => ({
      y: dir > 0 ? 20 : -10,
      opacity: 0,
    }),
    center: {
      y: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      y: dir > 0 ? -10 : 20,
      opacity: 0,
    }),
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <WelcomeStep {...stepProps} />
      case 1: return <IdentityStep {...stepProps} />
      case 2: return <WorkspaceConfirmStep {...stepProps} />
      case 3: return <CreateSchoolStep {...stepProps} />
      case 4: return <AcademicYearStep {...stepProps} />
      case 5: return <InviteTeamStep {...stepProps} />
      case 6: return <CompleteStep {...stepProps} clearSession={clearSession} />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))] relative overflow-hidden">
      <OnboardingProgressBar progress={progress} />
      <OnboardingTopbar currentStep={currentStep} totalSteps={ONBOARDING_STEPS.length} />

      <div className="pt-[54px] min-h-screen flex items-center justify-center px-4">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full max-w-[560px]"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
