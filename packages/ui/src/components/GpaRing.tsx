import { forwardRef, type SVGAttributes, useMemo } from 'react'
import { cn } from '../utils'

const SIZES = {
  sm: { viewBox: 80, stroke: 6, fontSize: '14px', subSize: '9px' },
  md: { viewBox: 120, stroke: 8, fontSize: '22px', subSize: '11px' },
  lg: { viewBox: 180, stroke: 10, fontSize: '34px', subSize: '13px' },
} as const

export type GpaRingSize = keyof typeof SIZES

export interface GpaRingProps extends Omit<SVGAttributes<SVGSVGElement>, 'children'> {
  /** GPA value (e.g., 3.75). Pass null/undefined for empty state. */
  value?: number | null
  /** Maximum GPA scale (default 4) */
  max?: number
  /** Visual size preset */
  size?: GpaRingSize
  /** Whether data is still loading */
  loading?: boolean
}

export const GpaRing = forwardRef<SVGSVGElement, GpaRingProps>(
  ({ className, value, max = 4, size = 'md', loading = false, ...props }, ref) => {
    const config = SIZES[size]
    const center = config.viewBox / 2
    const radius = (config.viewBox - config.stroke) / 2
    const circumference = 2 * Math.PI * radius

    const hasValue = value != null && !loading
    const fraction = hasValue ? Math.min(Math.max(value / max, 0), 1) : 0
    const dashOffset = circumference * (1 - fraction)

    const displayValue = hasValue ? value.toFixed(2) : '—'
    const ariaLabel = hasValue
      ? `GPA: ${value.toFixed(2)} out of ${max.toFixed(1)}`
      : 'GPA: not yet available'

    const pixelSize = useMemo(() => {
      switch (size) {
        case 'sm': return 80
        case 'md': return 120
        case 'lg': return 180
      }
    }, [size])

    if (loading) {
      return (
        <div
          className={cn('rounded-full v2-skeleton-pulse', className)}
          style={{
            width: pixelSize,
            height: pixelSize,
            background: 'var(--v2-bg-elevated)',
          }}
          role="status"
          aria-label="Loading GPA"
        />
      )
    }

    return (
      <svg
        ref={ref}
        viewBox={`0 0 ${config.viewBox} ${config.viewBox}`}
        width={pixelSize}
        height={pixelSize}
        className={cn('shrink-0', className)}
        role="img"
        aria-label={ariaLabel}
        {...props}
      >
        {/* Background ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={hasValue ? 'var(--v2-border-default)' : 'var(--v2-border-default)'}
          strokeWidth={config.stroke}
          strokeDasharray={hasValue ? 'none' : '4 6'}
          opacity={0.6}
        />

        {/* Progress ring */}
        {hasValue && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--v2-brand-primary)"
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${center} ${center})`}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        )}

        {/* Center value */}
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--v2-text-primary)"
          fontSize={config.fontSize}
          fontWeight="600"
          fontFamily="inherit"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {displayValue}
        </text>

        {/* Scale label below value */}
        {hasValue && (
          <text
            x={center}
            y={center + parseInt(config.fontSize) * 0.7}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--v2-text-muted)"
            fontSize={config.subSize}
            fontFamily="inherit"
          >
            / {max.toFixed(1)}
          </text>
        )}
      </svg>
    )
  }
)

GpaRing.displayName = 'GpaRing'
