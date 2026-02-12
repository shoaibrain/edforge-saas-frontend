/**
 * useFormDirtyGuard Hook
 *
 * Prevents accidental data loss by:
 * 1. Adding a beforeunload warning when form has dirty state
 * 2. Providing a guarded close function that confirms before closing modals
 */

import { useEffect, useCallback } from 'react'

interface UseFormDirtyGuardOptions {
  isDirty: boolean
  onClose: () => void
}

export function useFormDirtyGuard({ isDirty, onClose }: UseFormDirtyGuardOptions) {
  // Warn before browser navigation / refresh
  useEffect(() => {
    if (!isDirty) return

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }

    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  // Guarded close: confirm if dirty, otherwise close immediately
  const guardedClose = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      )
      if (!confirmed) return
    }
    onClose()
  }, [isDirty, onClose])

  return { guardedClose }
}
