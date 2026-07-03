/**
 * StatBand — unified KPI stat band (handoff surface ②).
 *
 * One calm-by-default strip of metric segments. `state` drives the single
 * accent color a segment shows; a segment stays neutral unless its data needs
 * attention. Each metric carries at most one micro-viz — a delta chip, a status
 * pill, a SABER target meter, or a readiness donut — enforced at the type level
 * (discriminated union) and re-checked at runtime.
 *
 * Composes existing primitives rather than re-implementing them:
 *   - status pill  → <StatusPill>
 *   - SABER meter  → <AnimatedProgressBar> + a target notch
 *   - donut        → <Ring>
 *
 * Token resolution (state → color) is documented in
 * docs/design-system/handoff-token-map.md. All color/spacing come from semantic
 * tokens + the Tailwind scale; motion respects prefers-reduced-motion.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn, focusRing } from '../utils'
import { StatusPill, type StatusPillVariant } from './StatusPill'
import { AnimatedProgressBar } from './AnimatedProgressBar'
import { Ring } from './Ring'
import { AnimatedIcon, type IconName } from './motion'

export type { IconName }

export type StatBandState =
  | 'normal'
  | 'good'
  | 'warn'
  | 'critical'
  | 'info'
  | 'live'
  | 'muted'

export type StatBandPillTone = 'good' | 'warn' | 'critical' | 'info' | 'neutral'

interface StatMetricBase {
  /** Uppercase metric label (e.g. "Total Enrolled"). */
  label: string
  /** Big metric value (formatted string, e.g. "255", "0%"). */
  value: string
  /** Optional leading icon (a sized lucide element, e.g. <Users className="w-4 h-4" />). */
  icon?: ReactNode
  /**
   * Curated animated-icon signature (preferred). When set, the chip renders the
   * platform AnimatedIcon (hover-replays via the segment's `.ef-motion`),
   * overriding `icon`.
   */
  iconSignature?: IconName
  /** Drives the single accent color. Default "normal" (neutral). */
  state?: StatBandState
  /**
   * Opt-in: color the big value itself for `good` (success green).
   * `warn`/`critical` values are always colored; `good` stays neutral by
   * default so routine positive metrics don't shout.
   */
  emphasizeValue?: boolean
  /** Widen + enlarge this segment as the band's lead metric. */
  primary?: boolean
  /** Sub line shown at rest (hidden on hover when `detail` is present). */
  sub?: ReactNode
  /** Detail line revealed on hover (falls back to `sub` when absent). */
  detail?: ReactNode
  /** Makes the segment a toggle button (e.g. a KPI that filters a table). */
  onClick?: () => void
  /** Pressed state for a clickable segment. */
  active?: boolean
}

interface DeltaCfg {
  dir: 'up' | 'down'
  val: string
}
interface PillCfg {
  tone: StatBandPillTone
  text: string
}
interface MeterCfg {
  pct: number
  /** Target notch position (0–100). */
  target?: number
}
interface DonutCfg {
  pct: number
}

/** At most one micro-viz per metric (enforced via the `never` members). */
type StatMetricViz =
  | { delta: DeltaCfg; pill?: never; meter?: never; donut?: never }
  | { pill: PillCfg; delta?: never; meter?: never; donut?: never }
  | { meter: MeterCfg; delta?: never; pill?: never; donut?: never }
  | { donut: DonutCfg; delta?: never; pill?: never; meter?: never }
  | { delta?: never; pill?: never; meter?: never; donut?: never }

export type StatMetric = StatMetricBase & StatMetricViz

export interface StatBandProps extends HTMLAttributes<HTMLDivElement> {
  metrics: StatMetric[]
  /** Accessible name for the band region. Default "Key metrics". */
  ariaLabel?: string
}

// ---- state → token className maps (docs/design-system/handoff-token-map.md) ----

const CHIP: Record<StatBandState, string> = {
  normal: 'bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))]',
  muted: 'bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))]',
  good: 'bg-[rgb(var(--state-success-bg))] text-[rgb(var(--state-success-fg))]',
  info: 'bg-[rgb(var(--state-info-bg))] text-[rgb(var(--state-info-fg))]',
  warn: 'bg-[rgb(var(--state-warning-bg))] text-[rgb(var(--state-warning-fg))]',
  critical: 'bg-[rgb(var(--state-danger-bg))] text-[rgb(var(--state-danger-fg))]',
  live: 'bg-[rgb(var(--mint-soft))] text-[rgb(var(--border-focus))]',
}

const VALUE: Record<StatBandState, string> = {
  normal: 'text-[rgb(var(--text-primary))]',
  good: 'text-[rgb(var(--text-primary))]',
  info: 'text-[rgb(var(--text-primary))]',
  live: 'text-[rgb(var(--text-primary))]',
  muted: 'text-[rgb(var(--text-tertiary))]',
  warn: 'text-[rgb(var(--state-warning-fg))]',
  critical: 'text-[rgb(var(--state-danger-fg))]',
}

/** Top accent tick — only non-normal, attention-worthy states show one. */
const TICK: Partial<Record<StatBandState, string>> = {
  good: 'bg-[rgb(var(--state-success-border))]',
  info: 'bg-[rgb(var(--state-info-border))]',
  warn: 'bg-[rgb(var(--state-warning-border))]',
  critical: 'bg-[rgb(var(--state-danger-border))]',
  live: 'bg-[rgb(var(--border-focus))]',
}

const PILL_TONE_TO_VARIANT: Record<StatBandPillTone, StatusPillVariant> = {
  good: 'success',
  warn: 'warning',
  critical: 'danger',
  info: 'info',
  neutral: 'neutral',
}

/** CSS color the meter fill / donut arc use for a given state. */
function accentColor(state: StatBandState): string {
  switch (state) {
    case 'warn':
      return 'rgb(var(--state-warning-fg))'
    case 'critical':
      return 'rgb(var(--state-danger-fg))'
    case 'good':
    case 'live':
      return 'rgb(var(--border-focus))'
    case 'info':
      return 'rgb(var(--state-info-fg))'
    default:
      return 'rgb(var(--action-primary-bg))'
  }
}

function Delta({ dir, val }: DeltaCfg) {
  const up = dir === 'up'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-2xs font-semibold tabular-nums',
        up
          ? 'bg-[rgb(var(--state-success-bg))] text-[rgb(var(--state-success-fg))]'
          : 'bg-[rgb(var(--state-danger-bg))] text-[rgb(var(--state-danger-fg))]',
      )}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={up ? '' : 'rotate-180'}
      >
        <path d="M6 15l6-6 6 6" />
      </svg>
      {val}
    </span>
  )
}

/** SABER meter — AnimatedProgressBar + an optional target notch. */
function Meter({ pct, target, state }: MeterCfg & { state: StatBandState }) {
  return (
    <div className="relative mt-3.5">
      <AnimatedProgressBar
        percentage={pct}
        color={accentColor(state)}
        label={`${pct}%`}
        height={6}
      />
      {target != null ? (
        // allow-presentation-style: notch position is the data-driven target %
        <span
          className="absolute -top-0.5 -bottom-0.5 w-0.5 rounded-sm bg-[rgb(var(--border-strong))]"
          style={{ insetInlineStart: `${Math.max(0, Math.min(target, 100))}%` }}
          aria-hidden="true"
        />
      ) : null}
    </div>
  )
}

function Segment({ metric }: { metric: StatMetric }) {
  const state = metric.state ?? 'normal'
  const hasDetail = metric.detail != null

  // Runtime backstop for the type-level "at most one micro-viz" guarantee.
  const vizCount =
    Number('delta' in metric && !!metric.delta) +
    Number('pill' in metric && !!metric.pill) +
    Number('meter' in metric && !!metric.meter) +
    Number('donut' in metric && !!metric.donut)
  if (vizCount > 1 && process.env.NODE_ENV !== 'production') {
    console.warn(`StatBand: metric "${metric.label}" has ${vizCount} micro-viz; only one is allowed.`)
  }

  const inlineViz =
    'delta' in metric && metric.delta ? (
      <Delta {...metric.delta} />
    ) : 'pill' in metric && metric.pill ? (
      <StatusPill
        variant={PILL_TONE_TO_VARIANT[metric.pill.tone]}
        label={metric.pill.text}
      />
    ) : 'donut' in metric && metric.donut ? (
      <span className="ml-auto">
        <Ring percentage={metric.donut.pct} size={42} strokeWidth={4} color={accentColor(state)} />
      </span>
    ) : null

  const clickable = typeof metric.onClick === 'function'

  const outerClass = cn(
    // `ef-motion` lets the AnimatedIcon signature hover-replay (CSS-driven, reduced-motion safe).
    'ef-motion group relative flex min-w-0 flex-col px-5 py-4 text-left',
    metric.primary ? 'flex-[1.28]' : 'flex-1',
    'border-l border-[rgb(var(--border-primary)/0.15)] first:border-l-0',
    'transition-colors hover:bg-[rgb(var(--background-tertiary)/0.4)]',
    clickable && focusRing,
    clickable && metric.active && 'bg-[rgb(var(--mint-soft))] hover:bg-[rgb(var(--mint-soft))]',
  )

  const body = (
    <>
      {/* state accent tick */}
      {TICK[state] ? (
        <span className={cn('absolute inset-x-4 top-0 h-0.5 rounded-b-sm', TICK[state])} aria-hidden="true" />
      ) : null}

      {/* head: icon chip + label */}
      <div className="flex items-center gap-2.5">
        {metric.icon || metric.iconSignature ? (
          <span className={cn('relative grid h-7 w-7 shrink-0 place-items-center rounded-lg', CHIP[state])}>
            {metric.iconSignature ? (
              <AnimatedIcon name={metric.iconSignature} size={16} applyAccent={false} />
            ) : (
              metric.icon
            )}
            {state === 'live' ? (
              <span
                className="absolute inset-0 rounded-lg ring-2 ring-[rgb(var(--border-focus))] motion-safe:animate-ping motion-reduce:hidden"
                aria-hidden="true"
              />
            ) : null}
          </span>
        ) : null}
        <span className="truncate text-2xs font-semibold uppercase tracking-wider text-[rgb(var(--text-tertiary))]">
          {metric.label}
        </span>
      </div>

      {/* value row + inline micro-viz */}
      <div className="mt-3 flex items-baseline gap-2.5">
        <span
          className={cn(
            'font-semibold leading-none tabular-nums tracking-tight',
            metric.primary ? 'text-4xl' : 'text-3xl',
            metric.emphasizeValue && state === 'good'
              ? 'text-[rgb(var(--state-success-fg))]'
              : VALUE[state],
          )}
        >
          {metric.value}
        </span>
        {inlineViz}
      </div>

      {/* SABER meter (full-width, below value) */}
      {'meter' in metric && metric.meter ? <Meter {...metric.meter} state={state} /> : null}

      {/* sub / detail */}
      {metric.sub != null || hasDetail ? (
        <div className="relative mt-3 min-h-4 text-xs text-[rgb(var(--text-tertiary))]">
          <span className={cn('block', hasDetail && 'transition-opacity group-hover:opacity-0')}>
            {metric.sub}
          </span>
          {hasDetail ? (
            <span className="absolute inset-x-0 top-0 text-[rgb(var(--text-secondary))] opacity-0 transition-opacity group-hover:opacity-100">
              {metric.detail}
            </span>
          ) : null}
        </div>
      ) : null}
    </>
  )

  if (clickable) {
    return (
      <button
        type="button"
        onClick={metric.onClick}
        aria-pressed={metric.active ?? false}
        aria-label={`${metric.label}: ${metric.value}`}
        data-state={state}
        className={outerClass}
      >
        {body}
      </button>
    )
  }

  return (
    <div role="status" aria-label={`${metric.label}: ${metric.value}`} data-state={state} className={outerClass}>
      {body}
    </div>
  )
}

export const StatBand = forwardRef<HTMLDivElement, StatBandProps>(
  ({ metrics, ariaLabel = 'Key metrics', className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="group"
        aria-label={ariaLabel}
        className={cn(
          'flex items-stretch overflow-hidden rounded-xl border',
          'border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-secondary))]',
          'max-[980px]:overflow-x-auto',
          className,
        )}
        {...props}
      >
        {metrics.map((metric, i) => (
          <Segment key={`${metric.label}-${i}`} metric={metric} />
        ))}
      </div>
    )
  },
)

StatBand.displayName = 'StatBand'
