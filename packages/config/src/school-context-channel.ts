/**
 * School Context Channel
 *
 * Cross-module broadcasting utility for school context changes.
 * Uses `CustomEvent` on `window` so that independent Zustand store
 * instances (Shell + every MFE) stay in sync without polling cookies.
 *
 * No React dependency — pure DOM APIs.
 */

import type { ResolvedSettings } from './resolved-settings'

// ============================================================================
// TYPES
// ============================================================================

export interface SchoolContextPayload {
  schoolId: string | null
  schoolStatus: string | null
  tenantId?: string | null
  resolvedSettings?: ResolvedSettings
  /**
   * Tenant archetype (PABSON | GENERIC | …). Used by region-aware UI
   * components (e.g., AddressFields, PhoneInput in Sprint A) to decide
   * which form variant to render. Optional for backwards-compat: legacy
   * payloads without archetype get treated as GENERIC by consumers.
   */
  archetype?: string | null
  /**
   * Tenant country (ISO-3166 alpha-3, e.g., 'NPL' | 'USA'). Country
   * fallback when archetype isn't authoritative — e.g., a GENERIC
   * archetype tenant operating in Nepal still gets Nepal-shaped forms.
   */
  country?: string | null
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
 *
 * Merge semantics: schoolId/schoolStatus always take the new values, but
 * omitted optional fields (resolvedSettings, tenantId, archetype, country)
 * retain the last-broadcast values instead of being blanked. The shell has
 * two broadcast sources — the store actions (schoolId/status only) and the
 * shell-context effect (full payload with settings) — and a store broadcast
 * landing after the settings-ful one must not clobber the settings an MFE
 * reads synchronously at mount. Settings therefore persist across a school
 * switch until the shell's follow-up settings-ful broadcast lands.
 */
export function broadcastSchoolChange(
  schoolId: string | null,
  schoolStatus: string | null,
  resolvedSettings?: ResolvedSettings,
  tenantId?: string | null,
  archetype?: string | null,
  country?: string | null,
): void {
  _lastPayload = {
    schoolId,
    schoolStatus,
    tenantId: tenantId ?? _lastPayload.tenantId,
    resolvedSettings: resolvedSettings ?? _lastPayload.resolvedSettings,
    archetype: archetype ?? _lastPayload.archetype,
    country: country ?? _lastPayload.country,
  }
  window.dispatchEvent(
    new CustomEvent<SchoolContextPayload>(EVENT_NAME, {
      detail: { ..._lastPayload },
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

/**
 * Blank the retained payload (no event dispatched). Called on logout so a
 * signed-out-without-reload session (Amplify signedOut event) cannot leak
 * the previous tenant's settings into the next user's synchronous reads.
 * Also the test-isolation seam for the merge semantics above.
 */
export function resetSchoolContext(): void {
  _lastPayload = { schoolId: null, schoolStatus: null }
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
