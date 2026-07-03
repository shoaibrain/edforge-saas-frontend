/**
 * Ring — shared SVG donut-ring progress core.
 *
 * Extracts the circle/dash-offset math shared by `GpaRing` and
 * `AttendanceDonutRing` into one reusable primitive so surfaces like the
 * StatBand readiness donut compose it instead of re-implementing the geometry.
 * Renders a track + a progress arc that sweeps clockwise from 12 o'clock.
 *
 * Respects `prefers-reduced-motion`: the arc animates to its value on mount,
 * and snaps instantly when reduced motion is requested.
 */
import { forwardRef, useEffect, useState, type SVGAttributes } from 'react'
import { cn } from '../utils'

export interface RingProps extends Omit<SVGAttributes<SVGSVGElement>, 'children'> {
  /** Progress percentage (0–100). Clamped. */
  percentage: number
  /** Outer diameter in px. Default 42. */
  size?: number
  /** Ring thickness in px. Default 4. */
  strokeWidth?: number
  /** Progress arc color (CSS color / var). Default the brand green. */
  color?: string
  /** Track color (CSS color / var). Default border-primary at low opacity. */
  trackColor?: string
  /** Accessible label. When omitted the ring is decorative (aria-hidden). */
  label?: string
}

export const Ring = forwardRef<SVGSVGElement, RingProps>(
  (
    {
      percentage,
      size = 42,
      strokeWidth = 4,
      color = 'rgb(var(--border-focus))',
      trackColor = 'rgb(var(--border-primary) / 0.35)',
      label,
      className,
      ...props
    },
    ref,
  ) => {
    const clamped = Math.max(0, Math.min(percentage, 100))
    const half = size / 2
    const radius = half - strokeWidth / 2
    const circumference = 2 * Math.PI * radius

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Animate from empty → value on mount (unless reduced motion).
    const [value, setValue] = useState(prefersReducedMotion ? clamped : 0)
    useEffect(() => {
      if (prefersReducedMotion) {
        setValue(clamped)
        return
      }
      const timer = setTimeout(() => setValue(clamped), 50)
      return () => clearTimeout(timer)
    }, [clamped, prefersReducedMotion])

    const offset = circumference * (1 - value / 100)
    const a11y = label
      ? { role: 'img' as const, 'aria-label': label }
      : { 'aria-hidden': true }

    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={cn('block shrink-0', className)}
        {...a11y}
        {...props}
      >
        <circle
          cx={half}
          cy={half}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={half}
          cy={half}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${half} ${half})`}
          style={{
            transition: prefersReducedMotion
              ? 'none'
              : 'stroke-dashoffset var(--dt-duration, 900ms) var(--dt-easing, ease-out)',
          }}
        />
      </svg>
    )
  },
)

Ring.displayName = 'Ring'
