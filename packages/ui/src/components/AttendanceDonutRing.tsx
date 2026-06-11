/**
 * AttendanceDonutRing
 *
 * SVG-based donut ring progress indicator for attendance rates.
 * Color thresholds: red (<80%), orange (<90%), green (≥90%).
 *
 * Shared between StudentTable attendance column and QuickDrawer stat tiles.
 */

import type { CSSProperties } from 'react'
import { cn } from '../utils'

// ============================================================================
// TYPES
// ============================================================================

export interface AttendanceDonutRingProps {
  /** Attendance rate (0–100) */
  rate: number
  /** Outer diameter in px — default 24 */
  size?: number
  /** Ring thickness in px — default 3 */
  strokeWidth?: number
  /** Show percentage text in center — default false */
  showLabel?: boolean
  /** Font size for center label in px — default auto-calculated */
  labelSize?: number
  /** Additional className for the wrapper */
  className?: string
  /** Additional inline style */
  style?: CSSProperties
}

// ============================================================================
// COLOR THRESHOLDS
// ============================================================================

function getAttendanceColor(rate: number): string {
  if (rate < 80) return '#E24B4A'
  if (rate < 90) return '#EF9F27'
  return '#1D9E75'
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AttendanceDonutRing({
  rate,
  size = 24,
  strokeWidth = 3,
  showLabel = false,
  labelSize,
  className,
  style,
}: AttendanceDonutRingProps) {
  const color = getAttendanceColor(rate)
  const half = size / 2
  const radius = half - strokeWidth / 2
  const circumference = 2 * Math.PI * radius
  const clampedRate = Math.max(0, Math.min(rate, 100))
  const offset = circumference * (1 - clampedRate / 100)
  const computedLabelSize = labelSize ?? Math.max(6, Math.round(size * 0.25))

  return (
    <div
      className={cn('relative inline-flex items-center justify-center flex-shrink-0', className)}
      style={{ width: size, height: size, ...style }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
      >
        {/* Background track */}
        <circle
          cx={half}
          cy={half}
          r={radius}
          fill="none"
          stroke="rgb(var(--border-primary) / 0.35)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
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
          style={{ transition: 'stroke-dashoffset 0.4s ease-out, stroke 0.3s ease' }}
        />
      </svg>

      {showLabel && (
        <span
          // allow-presentation-style: label size scales with the ring diameter; color is the rate tier
          className="absolute inset-0 flex items-center justify-center font-semibold"
          style={{ fontSize: computedLabelSize, color }}
        >
          {Math.round(clampedRate)}%
        </span>
      )}
    </div>
  )
}
