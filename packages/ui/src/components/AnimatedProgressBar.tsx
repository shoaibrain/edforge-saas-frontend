/**
 * AnimatedProgressBar — V2 Progress Bar
 *
 * Animated horizontal progress bar with V2 token-based styling.
 * Respects prefers-reduced-motion. Extracted from shell's FinanceSummaryCard.
 */

import { useEffect, useState } from 'react'

export interface AnimatedProgressBarProps {
  /** Progress percentage (0–100) */
  percentage: number
  /** Bar fill color (hex or CSS variable) */
  color: string
  /** Accessible label for the progress bar */
  label: string
  /** Bar height in px (default: 3) */
  height?: number
  /** Track background color (default: v2-border-default) */
  trackColor?: string
}

export function AnimatedProgressBar({
  percentage,
  color,
  label,
  height = 3,
  trackColor,
}: AnimatedProgressBarProps) {
  const [width, setWidth] = useState(0)
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (prefersReducedMotion) {
      setWidth(percentage)
      return
    }
    const timer = setTimeout(() => setWidth(percentage), 50)
    return () => clearTimeout(timer)
  }, [percentage, prefersReducedMotion])

  return (
    <div
      className="rounded-sm overflow-hidden"
      style={{
        height,
        background: trackColor || 'var(--v2-border-default)',
      }}
      role="progressbar"
      aria-valuenow={Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className="h-full rounded-sm"
        style={{
          width: `${width}%`,
          background: color,
          transition: prefersReducedMotion ? 'none' : 'width 600ms ease-out',
        }}
      />
    </div>
  )
}
