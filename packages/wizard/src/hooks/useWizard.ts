/**
 * useWizard Hook
 * 
 * Convenience hook for accessing wizard context with better DX.
 */

import { useWizardContext } from '../WizardContext'

/**
 * Hook to access wizard state and actions
 * This is a convenience wrapper around useWizardContext
 */
export function useWizard() {
  return useWizardContext()
}

