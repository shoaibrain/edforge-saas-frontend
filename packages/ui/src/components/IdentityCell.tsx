/**
 * IdentityCell — avatar + name + optional secondary line.
 *
 * Shared atom for the avatar+name stack repeated across every list view
 * (finance Accounts/Payments, people Staff, academics Students, plus
 * future consumers). Composes the existing `<Avatar>` primitive so it
 * inherits initials fallback, ring, and size variants for free.
 *
 * **Two ways to source the avatar:**
 * 1. Pass `avatarSrc` — the caller controls the URL. Use this when
 *    you've already generated a DiceBear `data:` URI locally (e.g.
 *    academics' offline-resilient `getStudentAvatar` from
 *    `apps/academics/src/lib/avatar.ts`). The URI flows through
 *    `<Avatar src={avatarSrc}>` so the existing image-error → initials
 *    fallback still applies.
 * 2. Omit `avatarSrc` — `<Avatar>` derives a DiceBear URL from `name`
 *    using `@edforge/ui`'s built-in `getUserAvatar` helper. Network-
 *    dependent (api.dicebear.com), which is fine for surfaces that
 *    aren't bound by the offline-school constraint.
 *
 * **Why not just `<Avatar>` + ad-hoc layout?**
 * The cell layout — name on top, optional secondary (email / ID /
 * grade / balance) below, optional trailing badge for inline status —
 * had drifted into 4 hand-rolled variants by sweep time. Centralising
 * it here gives every table identical typography + spacing without
 * touching the chrome.
 */

import type { ReactNode } from 'react'
import { Avatar, type AvatarProps } from './Avatar'
import { cn } from '../utils'

export interface IdentityCellProps {
  /** Primary name. Required (display copy + accessibility). */
  name: string
  /**
   * Optional custom avatar URL. When omitted, `<Avatar>` derives a
   * DiceBear URL from `name`. See file-level docstring for the trade-off.
   */
  avatarSrc?: string
  /** Avatar size — defaults to 'sm' (32px) for table rows. */
  size?: AvatarProps['size']
  /**
   * Secondary line under the name. Accepts any ReactNode so callers
   * can render an email string, a `<UuidBadge>`, a `font-mono` student
   * number, or a balance amount. Hidden when undefined.
   */
  secondary?: ReactNode
  /**
   * Rendered in place of `name` when `name` is empty / whitespace.
   * Default is an em-dash. Pass a `<UuidBadge>` for ID-fallback cells
   * (used by finance Accounts when `studentName` is null).
   */
  fallback?: ReactNode
  /**
   * Inline trailing slot next to the name — typically a `<StatusBadge>`
   * (e.g. people Staff renders employment status inline).
   */
  trailing?: ReactNode
  /** Recede the entire cluster — for inactive / dimmed rows. */
  dimmed?: boolean
  /** Extra Tailwind class on the outer cluster. */
  className?: string
}

export function IdentityCell({
  name,
  avatarSrc,
  size = 'sm',
  secondary,
  fallback,
  trailing,
  dimmed = false,
  className,
}: IdentityCellProps) {
  const trimmedName = name?.trim() ?? ''
  const hasName = trimmedName.length > 0

  return (
    <div className={cn('flex items-center gap-2.5 min-w-0', dimmed && 'opacity-60', className)}>
      <Avatar
        name={hasName ? trimmedName : undefined}
        src={avatarSrc}
        size={size}
        alt={hasName ? trimmedName : 'User'}
        className="flex-shrink-0"
      />
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="truncate text-sm font-medium text-[rgb(var(--text-primary))]">
            {hasName ? trimmedName : (fallback ?? '—')}
          </span>
          {trailing}
        </div>
        {secondary && (
          <span className="truncate text-xs text-[rgb(var(--text-tertiary))]">
            {secondary}
          </span>
        )}
      </div>
    </div>
  )
}
