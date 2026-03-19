import { useId } from 'react'

interface SectionTransitionProps {
  height?: string
  variant?: 'wave' | 'curve' | 'dots'
  flip?: boolean
  ambientStat?: { value: string; label: string }
  fromColor?: string
  toColor?: string
}

function GridLineSVG() {
  const id = useId()
  const patternId = `grid-line-${id}`
  return (
    <svg
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="svg-decoration inset-x-0"
      style={{ width: '100%', height: '80px', top: '50%', transform: 'translateY(-50%)' }}
    >
      <defs>
        <pattern id={patternId} x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <line x1="60" y1="0" x2="60" y2="60" stroke="rgba(226,232,240,0.06)" strokeWidth="1" />
          <line x1="0" y1="60" x2="60" y2="60" stroke="rgba(226,232,240,0.06)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  )
}

function BlueprintLineSVG() {
  return (
    <svg
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="svg-decoration inset-x-0"
      style={{ width: '100%', height: '60px', top: '50%', transform: 'translateY(-50%)' }}
    >
      <path
        d="M0,60 L400,60 L400,50 L420,50 L420,60 L900,60 L900,70 L920,70 L920,60 L1440,60"
        fill="none"
        stroke="rgba(249,115,22,0.05)"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CrosshairGridSVG() {
  const id = useId()
  const patternId = `crosshair-trans-${id}`
  return (
    <svg
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="svg-decoration inset-x-0"
      style={{ width: '100%', height: '60px', top: '50%', transform: 'translateY(-50%)' }}
    >
      <defs>
        <pattern id={patternId} x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
          <line x1="24" y1="21" x2="24" y2="27" stroke="rgba(226,232,240,0.15)" strokeWidth="1" />
          <line x1="21" y1="24" x2="27" y2="24" stroke="rgba(226,232,240,0.15)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} opacity="0.05" />
    </svg>
  )
}

const variantMap = {
  wave: GridLineSVG,
  curve: BlueprintLineSVG,
  dots: CrosshairGridSVG,
}

export function SectionTransition({
  height = '10rem',
  variant = 'wave',
  flip = false,
  ambientStat,
  fromColor,
  toColor,
}: SectionTransitionProps) {
  const SVGComponent = variantMap[variant]

  return (
    <div
      className="relative w-full pointer-events-none flex items-center justify-center"
      aria-hidden="true"
      style={{ height, overflow: 'hidden' }}
    >
      {fromColor && toColor && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(to bottom, ${fromColor}, ${toColor})`,
            opacity: 0.05,
          }}
        />
      )}

      <div
        style={{
          transform: flip ? 'scaleY(-1)' : undefined,
          width: '100%',
          height: '100%',
          position: 'absolute',
          inset: 0,
        }}
      >
        <SVGComponent />
      </div>

      {ambientStat && (
        <div className="relative z-10 flex flex-col items-center gap-1">
          <span className="ambient-stat">{ambientStat.value}</span>
          {ambientStat.label && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'rgb(var(--text-tertiary))',
                opacity: 0.4,
              }}
            >
              {ambientStat.label}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
