/**
 * School Context Channel
 *
 * Cross-module broadcasting utility for school context changes.
 * Uses `CustomEvent` on `window` so that independent Zustand store
 * instances (Shell + every MFE) stay in sync without polling cookies.
 *
 * No React dependency — pure DOM APIs.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SchoolContextPayload {
  schoolId: string | null
  schoolStatus: string | null
}

// ============================================================================
// CONSTANTS
// ============================================================================

const EVENT_NAME = 'edforge:school-changed'

// ============================================================================
// BROADCAST
// ============================================================================

/**
 * Dispatch a school-change event that all MFE listeners will receive.
 * Called by the Shell's `setActiveSchoolId` action.
 */
export function broadcastSchoolChange(
  schoolId: string | null,
  schoolStatus: string | null,
): void {
  _lastPayload = { schoolId, schoolStatus }
  window.dispatchEvent(
    new CustomEvent<SchoolContextPayload>(EVENT_NAME, {
      detail: { schoolId, schoolStatus },
    }),
  )
}

// ============================================================================
// SYNCHRONOUS READ
// ============================================================================

/**
 * Last-known payload, updated on every broadcast.
 * Allows MFEs to read the current school context synchronously at bootstrap
 * without waiting for a CustomEvent or parsing the cookie themselves.
 */
let _lastPayload: SchoolContextPayload = { schoolId: null, schoolStatus: null }

/**
 * Read the current school context synchronously.
 * Safe to call at any point — returns the last broadcast value.
 * If no broadcast has occurred yet, returns { schoolId: null, schoolStatus: null }.
 *
 * @example
 * // In MFE bootstrap or layout mount:
 * const { schoolId } = getSchoolContext()
 * if (schoolId) store.setActiveSchoolId(schoolId)
 */
export function getSchoolContext(): Readonly<SchoolContextPayload> {
  return _lastPayload
}

// ============================================================================
// SUBSCRIBE
// ============================================================================

/**
 * Register a listener for school-change events.
 * Returns an unsubscribe function.
 *
 * @example
 * const unsub = onSchoolChange(({ schoolId }) => store.setActiveSchoolId(schoolId))
 * // later…
 * unsub()
 */
export function onSchoolChange(
  callback: (payload: SchoolContextPayload) => void,
): () => void {
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<SchoolContextPayload>).detail
    callback(detail)
  }

  window.addEventListener(EVENT_NAME, handler)
  return () => window.removeEventListener(EVENT_NAME, handler)
}
