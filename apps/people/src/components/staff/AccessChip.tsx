/**
 * AccessChip — V2 System Access Chip
 *
 * Displays system access status with V2 styling.
 * Active: green tint with green dot.
 * No Access: gray tint with gray dot.
 */

export function AccessChip({ hasAccess }: { hasAccess: boolean }) {
  return hasAccess ? (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 10,
        fontWeight: 500,
        padding: '2px 7px',
        borderRadius: 6,
        whiteSpace: 'nowrap',
        background: 'rgba(29,158,117,0.08)',
        border: '1px solid rgba(29,158,117,0.15)',
        color: '#1D9E75',
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: '#1D9E75',
          flexShrink: 0,
        }}
      />
      Active
    </span>
  ) : (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 10,
        fontWeight: 500,
        padding: '2px 7px',
        borderRadius: 6,
        whiteSpace: 'nowrap',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: 'var(--v2-text-hint, #7a8099)',
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: 'var(--v2-text-hint, #7a8099)',
          flexShrink: 0,
        }}
      />
      No Access
    </span>
  )
}
