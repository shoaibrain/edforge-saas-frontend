/**
 * ⑤ WidgetCard + WidgetGrid — the dashboard section-card recipe.
 *
 * One config-driven card that every dashboard block composes, so there are no
 * bespoke per-widget cards. `WidgetGrid` lays out a 12-column grid; each
 * `WidgetCard` spans `span` columns (collapsing to full width below `md`).
 *
 * Rules (from the handoff):
 * - Header: title (+ optional animated icon) and subtitle on the left; exactly
 *   ONE of `metric` (a quiet stat) or `link` (a "View all →") on the right.
 * - States are first-class: `loading` → shimmer skeleton; `empty` → centered
 *   icon + title (+ optional subtitle). No blank cards.
 * - `children` is the one required body slot; `footer` is optional.
 */
import type { ReactNode } from 'react'
import { ArrowRight, Inbox } from 'lucide-react'
import { AnimatedIcon, type IconName } from '../motion'
import { cn } from '../../utils'

export type WidgetSpan = 3 | 4 | 5 | 6 | 7 | 8 | 12
export type WidgetState = 'ready' | 'loading' | 'empty'

interface WidgetCardBase {
  title: string
  iconSignature?: IconName
  subtitle?: string
  /** Columns on the 12-col grid (default 12). */
  span?: WidgetSpan
  state?: WidgetState
  empty?: { iconSignature?: IconName; title: string; subtitle?: string }
  /** The one required body slot. */
  children: ReactNode
  footer?: ReactNode
  className?: string
}

// Exactly one header-right affordance: a quiet metric OR a link (never both).
type WidgetRight =
  | { metric?: string; link?: never }
  | { link?: { label: string; href: string }; metric?: never }

export type WidgetCardProps = WidgetCardBase & WidgetRight

// Static so Tailwind's JIT sees the literal classes. Base is full-width on
// mobile; the md: override applies the configured span.
const SPAN_CLASS: Record<WidgetSpan, string> = {
  3: 'md:col-span-3',
  4: 'md:col-span-4',
  5: 'md:col-span-5',
  6: 'md:col-span-6',
  7: 'md:col-span-7',
  8: 'md:col-span-8',
  12: 'md:col-span-12',
}

export function WidgetGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-12 gap-4', className)}>{children}</div>
}

export function WidgetCard({
  title,
  iconSignature,
  subtitle,
  span = 12,
  state = 'ready',
  empty,
  children,
  footer,
  className,
  ...right
}: WidgetCardProps) {
  const { metric, link } = right as { metric?: string; link?: { label: string; href: string } }

  let body: ReactNode
  if (state === 'loading') {
    body = <div className="h-32 w-full animate-pulse rounded-lg bg-[rgb(var(--background-tertiary))]" />
  } else if (state === 'empty') {
    body = (
      <div className="flex min-h-32 flex-col items-center justify-center gap-2 py-6 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))]">
          <AnimatedIcon name={empty?.iconSignature} icon={Inbox} size={20} applyAccent={false} />
        </span>
        <div className="text-sm font-medium text-[rgb(var(--text-secondary))]">
          {empty?.title ?? 'Nothing here yet'}
        </div>
        {empty?.subtitle ? (
          <div className="text-xs text-[rgb(var(--text-tertiary))]">{empty.subtitle}</div>
        ) : null}
      </div>
    )
  } else {
    body = children
  }

  return (
    <section
      className={cn(
        'col-span-12 flex flex-col rounded-xl border border-[rgb(var(--border-primary)/0.35)]',
        'bg-[rgb(var(--background-secondary))] shadow-[0_1px_3px_0_rgb(0_0_0/0.06)]',
        SPAN_CLASS[span],
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-[rgb(var(--text-primary))]">
            {iconSignature ? (
              <span className="text-[rgb(var(--text-secondary))]">
                <AnimatedIcon name={iconSignature} size={17} applyAccent={false} />
              </span>
            ) : null}
            <span className="truncate">{title}</span>
          </div>
          {subtitle ? (
            <div className="mt-0.5 truncate text-xs text-[rgb(var(--text-tertiary))]">{subtitle}</div>
          ) : null}
        </div>
        <div className="shrink-0">
          {link ? (
            <a
              href={link.href}
              className="inline-flex items-center gap-1 text-xs font-medium text-[rgb(var(--text-secondary))] transition-colors hover:text-[rgb(var(--text-primary))]"
            >
              {link.label}
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            </a>
          ) : metric ? (
            <span className="whitespace-nowrap text-xs font-semibold tabular-nums text-[rgb(var(--text-secondary))]">
              {metric}
            </span>
          ) : null}
        </div>
      </header>

      <div className="px-4 py-4">{body}</div>

      {footer ? (
        <div className="mt-auto border-t border-[rgb(var(--border-primary)/0.25)] px-4 py-2.5 text-sm">
          {footer}
        </div>
      ) : null}
    </section>
  )
}
