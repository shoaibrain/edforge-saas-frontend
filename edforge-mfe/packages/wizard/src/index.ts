/**
 * @edforge/wizard
 *
 * Multi-step wizard components for the EdForge EMIS platform.
 * Built with React, Framer Motion, and Zod.
 */

// Types
export type {
  WizardStep,
  WizardStepProps,
  WizardStepStatus,
  WizardContextValue,
  WizardProviderProps,
  WizardContainerProps,
  WizardCardProps,
  WizardModalProps,
} from './types'

// Context
export { WizardProvider, useWizardContext } from './WizardContext'

// Components
export { WizardContainer } from './WizardContainer'
export { WizardCard } from './WizardCard'
export { WizardModal } from './WizardModal'
export {
  WizardProgress,
  WizardProgressCompact,
  type WizardProgressProps,
  type WizardProgressCompactProps,
} from './WizardProgress'
export {
  WizardNavigation,
  WizardFooter,
  type WizardNavigationProps,
  type WizardFooterProps,
} from './WizardNavigation'

// Hooks
export { useWizard } from './hooks/useWizard'
export { useWizardStep, type UseWizardStepReturn } from './hooks/useWizardStep'

// Utilities
export { cn } from './utils'

