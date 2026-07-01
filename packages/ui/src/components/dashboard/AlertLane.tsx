/**
 * ④ AlertLane — the dashboard's severity-ranked alert lane.
 *
 * Sits directly below PageHeader and above the StatBand (its own slot — never
 * inside the widget grid). Behaviour is locked by the design handoff:
 *
 * - Order is always critical → warning → info (stable within a severity).
 * - critical alerts must be **acknowledged** (filled Acknowledge affordance,
 *   no dismiss ×); warning/info alerts are **dismissable** (× + optional CTA).
 * - Acknowledged / dismissed state is **session-only** (in-memory) — a fresh
 *   mount (new login/session) re-renders every alert. `resetKey` lets a
 *   consumer force a fresh context (e.g. Home passes the active role).
 * - Empty → a single quiet "all caught up" success strip (never removed).
 * - ≥2 live alerts → a Minimize control collapses the lane to a summary chip.
 * - Enter/leave motion is gated on `prefers-reduced-motion`.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { AlertTriangle, Check, ChevronUp, Info, X } from 'lucide-react'
import { AnimatedIcon, type IconName } from '../motion'
import { cn, focusRing } from '../../utils'

export type AlertSeverity = 'critical' | 'warning' | 'info'

export interface DashboardAlert {
  /** Stable per source condition (e.g. 'fin.overdue'). */
  id: string
  severity: AlertSeverity
  /** Optional animated-icon signature; defaults per severity. */
  iconSignature?: IconName
  /** One line, specific + quantified. */
  title: string
  /** One line of context. */
  description: string
  /** Optional call to action (e.g. "Review billing"). */
  cta?: { label: string; onAction: () => void }
}

export interface AlertLaneProps {
  alerts: DashboardAlert[]
  /**
   * Changing this resets the session ack/dismiss + collapse state — use it to
   * simulate a fresh context (e.g. Home passes the active role id).
   */
  resetKey?: string | number
  /** Accessible name for the lane region (default "Alerts"). */
  ariaLabel?: string
  className?: string
}

const SEVERITY_ORDER: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 }

const SEV: Record<
  AlertSeverity,
  { chip: string; title: string; rail: string; dot: string; cta: string; icon: typeof AlertTriangle }
> = {
  critical: {
    chip: 'bg-[rgb(var(--state-danger-bg))] text-[rgb(var(--state-danger-fg))]',
    title: 'text-[rgb(var(--state-danger-fg))]',
    rail: 'border-[rgb(var(--state-danger-border)/0.55)]',
    dot: 'bg-[rgb(var(--state-danger-fg))]',
    cta: 'border-[rgb(var(--state-danger-border))] text-[rgb(var(--state-danger-fg))] hover:bg-[rgb(var(--state-danger-bg))]',
    icon: AlertTriangle,
  },
  warning: {
    chip: 'bg-[rgb(var(--state-warning-bg))] text-[rgb(var(--state-warning-fg))]',
    title: 'text-[rgb(var(--state-warning-fg))]',
    rail: 'border-[rgb(var(--state-warning-border)/0.55)]',
    dot: 'bg-[rgb(var(--state-warning-fg))]',
    cta: 'border-[rgb(var(--state-warning-border))] text-[rgb(var(--state-warning-fg))] hover:bg-[rgb(var(--state-warning-bg))]',
    icon: AlertTriangle,
  },
  info: {
    chip: 'bg-[rgb(var(--state-info-bg))] text-[rgb(var(--state-info-fg))]',
    title: 'text-[rgb(var(--state-info-fg))]',
    rail: 'border-[rgb(var(--state-info-border)/0.55)]',
    dot: 'bg-[rgb(var(--state-info-fg))]',
    cta: 'border-[rgb(var(--state-info-border))] text-[rgb(var(--state-info-fg))] hover:bg-[rgb(var(--state-info-bg))]',
    icon: Info,
  },
}

export function AlertLane({ alerts, resetKey, ariaLabel = 'Alerts', className }: AlertLaneProps) {
  const reduce = useReducedMotion()
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set())
  const [collapsed, setCollapsed] = useState(false)
  const regionRef = useRef<HTMLDivElement>(null)

  // Session-only reset when the consumer's context changes (e.g. role switch).
  useEffect(() => {
    setDismissed(new Set())
    setCollapsed(false)
  }, [resetKey])

  const live = useMemo(
    () =>
      alerts
        .filter((a) => !dismissed.has(a.id))
        .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]),
    [alerts, dismissed],
  )

  const clear = (id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
    // Return focus to the lane so keyboard users aren't stranded on a removed row.
    requestAnimationFrame(() => regionRef.current?.focus())
  }

  const enter = (i: number) =>
    reduce
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: -6 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, height: 0, marginTop: 0 },
          transition: { duration: 0.3, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] as const },
        }

  // --- all-clear -----------------------------------------------------------
  if (live.length === 0) {
    return (
      <div
        ref={regionRef}
        role="region"
        aria-label={ariaLabel}
        tabIndex={-1}
        className={cn(
          'flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm',
          'border-[rgb(var(--state-success-border)/0.4)] bg-[rgb(var(--state-success-bg)/0.5)] text-[rgb(var(--state-success-fg))]',
          'outline-none',
          className,
        )}
      >
        <Check className="h-4 w-4 shrink-0" strokeWidth={2.2} aria-hidden="true" />
        You&rsquo;re all caught up &mdash; nothing needs your attention right now.
      </div>
    )
  }

  // --- collapsed summary chip ---------------------------------------------
  if (collapsed) {
    return (
      <div ref={regionRef} role="region" aria-label={ariaLabel} tabIndex={-1} className={cn('outline-none', className)}>
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium',
            'border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-secondary))]',
            'transition-colors hover:bg-[rgb(var(--background-tertiary))]',
            focusRing,
          )}
        >
          <span className="flex items-center gap-1" aria-hidden="true">
            {live.slice(0, 4).map((a, i) => (
              <span key={i} className={cn('h-1.5 w-1.5 rounded-full', SEV[a.severity].dot)} />
            ))}
          </span>
          {live.length} item{live.length > 1 ? 's' : ''} need{live.length > 1 ? '' : 's'} attention
          <ChevronUp className="h-4 w-4 rotate-180" strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    )
  }

  // --- expanded lane -------------------------------------------------------
  return (
    <div
      ref={regionRef}
      role="region"
      aria-label={ariaLabel}
      tabIndex={-1}
      className={cn('flex flex-col gap-2 outline-none', className)}
    >
      <AnimatePresence initial={!reduce}>
        {live.map((a, i) => {
          const s = SEV[a.severity]
          return (
            <motion.div
              key={a.id}
              layout={!reduce}
              {...enter(i)}
              role={a.severity === 'critical' ? 'alert' : 'status'}
              className={cn(
                'flex items-center gap-3 overflow-hidden rounded-xl border border-l-4 px-3.5 py-3',
                'border-[rgb(var(--border-primary)/0.3)] bg-[rgb(var(--background-secondary))]',
                s.rail,
              )}
            >
              <span
                className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', s.chip)}
                aria-hidden="true"
              >
                <AnimatedIcon name={a.iconSignature} icon={s.icon} size={17} applyAccent={false} />
              </span>
              <div className="min-w-0 flex-1">
                <div className={cn('truncate text-sm font-medium', s.title)}>{a.title}</div>
                <div className="truncate text-xs text-[rgb(var(--text-tertiary))]">{a.description}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {a.cta ? (
                  <button
                    type="button"
                    onClick={a.cta.onAction}
                    className={cn(
                      'whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                      s.cta,
                      focusRing,
                    )}
                  >
                    {a.cta.label}
                  </button>
                ) : null}
                {a.severity === 'critical' ? (
                  <button
                    type="button"
                    onClick={() => clear(a.id)}
                    className={cn(
                      'inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors',
                      'border-[rgb(var(--state-danger-border))] bg-[rgb(var(--state-danger-bg))] text-[rgb(var(--state-danger-fg))]',
                      'hover:bg-[rgb(var(--state-danger-bg)/0.7)]',
                      focusRing,
                    )}
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden="true" />
                    Acknowledge
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => clear(a.id)}
                    aria-label="Dismiss"
                    title="Dismiss"
                    className={cn(
                      'rounded-md p-1 text-[rgb(var(--text-tertiary))] transition-colors',
                      'hover:bg-[rgb(var(--background-tertiary))] hover:text-[rgb(var(--text-primary))]',
                      focusRing,
                    )}
                  >
                    <X className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                  </button>
                )}
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {live.length > 1 ? (
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className={cn(
            'inline-flex w-fit items-center gap-1 rounded-md px-2 py-1 text-xs font-medium',
            'text-[rgb(var(--text-tertiary))] transition-colors hover:text-[rgb(var(--text-secondary))]',
            focusRing,
          )}
        >
          <ChevronUp className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          Minimize
        </button>
      ) : null}
    </div>
  )
}
