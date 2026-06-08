/**
 * AccessChip — system access chip
 *
 * Active: success tone with a dot. No access: neutral tone with a dot.
 * Built on the shared StatusBadge primitive (theme-aware, no inline styles).
 */

import { StatusBadge } from '@edforge/ui'

export function AccessChip({ hasAccess }: { hasAccess: boolean }) {
  return hasAccess ? (
    <StatusBadge tone="success" dot>
      Active
    </StatusBadge>
  ) : (
    <StatusBadge tone="neutral" dot>
      No Access
    </StatusBadge>
  )
}
