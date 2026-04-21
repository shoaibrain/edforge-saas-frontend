/**
 * Sprint B.1 — `useFieldLockState(path)`
 *
 * Thin frontend wrapper around the shared governance map. Resolves the
 * lock state for a single workspace-settings field from the current
 * shell context (tenant isLocked flag + lockHolders list).
 *
 * Backend is the authoritative check — this hook only drives UX.
 * Its job: let the component decide whether to render a lock icon,
 * disable an input, and show a tooltip reason without every call site
 * re-deriving the same logic.
 */
import { isWorkspaceFieldLocked, type FieldLockViolation, type WorkspaceLockHolder } from '@edforge/types'
import { useShell } from '../lib/shell-context'

export interface FieldLockState {
  /** Whether the field is currently not editable. */
  locked: boolean
  /** Human-readable lock reason (for tooltip/aria-label). Undefined when unlocked. */
  reason?: string
  /** Classification that produced the lock; for analytics / styling. */
  class?: FieldLockViolation['class']
  /**
   * School+year pairs holding the lock. Empty unless the lock was caused
   * by an active academic year. Surfaces multi-school context to the admin.
   */
  heldBy: WorkspaceLockHolder[]
}

export function useFieldLockState(path: string): FieldLockState {
  const { workspaceIsLocked, workspaceLockHolders } = useShell()
  const result = isWorkspaceFieldLocked(path, workspaceIsLocked)
  return {
    locked: result.locked,
    reason: result.reason,
    class: result.class,
    // Only surface lock holders for locked-during-active-year violations.
    // Immutable fields don't have a "holder" — they're governed at provisioning.
    heldBy: result.class === 'locked_during_active_year' ? workspaceLockHolders : [],
  }
}
