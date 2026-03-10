/**
 * Wizard Types
 * 
 * Type definitions for multi-step wizard components.
 */

import type { ComponentType, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { ZodSchema } from 'zod'

// ============================================================================
// WIZARD STEP
// ============================================================================

/**
 * Configuration for a single wizard step
 */
export interface WizardStep {
  /** Unique step identifier */
  id: string
  /** Display title */
  title: string
  /** Optional description */
  description?: string
  /** Step icon */
  icon: LucideIcon
  /** Zod validation schema for this step */
  schema?: ZodSchema
  /** Whether step is optional */
  isOptional?: boolean
  /** Step component to render */
  component: ComponentType<WizardStepProps>
  /** Conditional rendering - step is shown only if condition returns true */
  condition?: (data: Record<string, unknown>) => boolean
}

/**
 * Props passed to step components
 */
export interface WizardStepProps {
  /** Current form data */
  data: Record<string, unknown>
  /** Update form data */
  updateData: (data: Record<string, unknown>) => void
  /** Navigate to next step */
  onNext: () => Promise<boolean>
  /** Navigate to previous step */
  onBack: () => void
  /** Whether this is the first step */
  isFirst: boolean
  /** Whether this is the last step */
  isLast: boolean
  /** Validation errors for current step */
  errors: Record<string, string>
  /** Clear specific error */
  clearError: (field: string) => void
}

// ============================================================================
// WIZARD STEP STATUS
// ============================================================================

export type WizardStepStatus = 'pending' | 'current' | 'completed' | 'error'

// ============================================================================
// WIZARD CONTEXT
// ============================================================================

/**
 * Wizard context value with state and actions
 */
export interface WizardContextValue {
  /** All wizard steps */
  steps: WizardStep[]
  /** Visible steps (after condition filtering) */
  visibleSteps: WizardStep[]
  /** Current step index (in visible steps) */
  currentStep: number
  /** Current step data */
  currentStepData: WizardStep
  /** All collected form data */
  formData: Record<string, unknown>
  /** Step validation errors */
  errors: Record<string, string>
  /** Whether wizard is submitting */
  isSubmitting: boolean
  /** Steps completion status */
  completedSteps: Set<number>
  
  // Actions
  /** Go to next step */
  goToNext: () => Promise<boolean>
  /** Go to previous step */
  goToBack: () => void
  /** Go to specific step */
  goToStep: (index: number) => void
  /** Update form data */
  updateData: (data: Record<string, unknown>) => void
  /** Submit the wizard */
  submit: () => Promise<void>
  /** Set validation errors */
  setErrors: (errors: Record<string, string>) => void
  /** Clear specific error */
  clearError: (field: string) => void
  /** Reset wizard to initial state */
  reset: () => void
  /** Get step status */
  getStepStatus: (index: number) => WizardStepStatus
  /** Check if can go to step */
  canGoToStep: (index: number) => boolean
}

// ============================================================================
// WIZARD PROVIDER PROPS
// ============================================================================

export interface WizardProviderProps {
  /** Wizard step configurations */
  steps: WizardStep[]
  /** Initial form data */
  initialData?: Record<string, unknown>
  /** Called when wizard is submitted */
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  /** Called when wizard is cancelled */
  onCancel?: () => void
  /** localStorage key for auto-save. If set, wizard state is saved/restored automatically. */
  autoSaveKey?: string
  /** Called when step validation fails. Use to show toast/alert. */
  onValidationError?: (errors: Record<string, string>) => void
  /** Children */
  children: ReactNode
}

// ============================================================================
// WIZARD COMPONENT PROPS
// ============================================================================

export interface WizardContainerProps extends Omit<WizardProviderProps, 'children'> {
  /** Header component to render above wizard */
  header?: ReactNode
  /** Footer variant */
  footerVariant?: 'inline' | 'fixed'
  /** Custom class name for content area */
  contentClassName?: string
  /** Submit button text */
  submitText?: string
  /** Show mobile progress variant */
  showMobileProgress?: boolean
}

export interface WizardCardProps extends Omit<WizardProviderProps, 'children'> {
  /** Card title */
  title?: string
  /** Card description */
  description?: string
  /** Submit button text */
  submitText?: string
  /** Additional class name */
  className?: string
}

export interface WizardModalProps extends Omit<WizardProviderProps, 'children'> {
  /** Whether modal is open */
  open: boolean
  /** Close modal callback */
  onClose: () => void
  /** Modal title */
  title?: string
  /** Modal description */
  description?: string
  /** Submit button text */
  submitText?: string
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

