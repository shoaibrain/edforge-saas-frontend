import { useId } from 'react'

interface DecorationProps {
  className?: string
  opacity?: number
  style?: React.CSSProperties
}

export function DotGrid({ className = '', opacity = 0.04, style }: DecorationProps) {
  const id = useId()
  const patternId = `crosshair-grid-${id}`
  return (
    <svg
      aria-hidden="true"
      className={`svg-decoration ${className}`}
      style={{ inset: 0, width: '100%', height: '100%', ...style }}
    >
      <defs>
        <pattern
          id={patternId}
          x="0"
          y="0"
          width="32"
          height="32"
          patternUnits="userSpaceOnUse"
        >
          <line x1="16" y1="13" x2="16" y2="19" stroke="rgba(226,232,240,0.5)" strokeWidth="1" />
          <line x1="13" y1="16" x2="19" y2="16" stroke="rgba(226,232,240,0.5)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} opacity={opacity} />
    </svg>
  )
}

export function FlowLine({ className = '', opacity = 0.08, style }: DecorationProps) {
  return (
    <svg
      viewBox="0 0 800 20"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`svg-decoration ${className}`}
      style={{ width: '100%', height: '12px', ...style }}
    >
      <line x1="0" y1="10" x2="800" y2="10" stroke="rgba(226,232,240,0.08)" strokeWidth="1" opacity={opacity} />
      {[100, 200, 300, 400, 500, 600, 700].map((x) => (
        <line key={x} x1={x} y1="7" x2={x} y2="13" stroke="rgba(226,232,240,0.08)" strokeWidth="1" opacity={opacity} />
      ))}
    </svg>
  )
}

interface GeometricAccentProps extends DecorationProps {
  shape?: 'crosshair' | 'bracket' | 'register'
  size?: number
  color?: string
}

export function GeometricAccent({
  shape = 'crosshair',
  size = 24,
  color = 'rgba(226,232,240,0.15)',
  className = '',
  style,
}: GeometricAccentProps) {
  const shapes: Record<string, React.ReactNode> = {
    crosshair: (
      <>
        <line x1={size / 2} y1={0} x2={size / 2} y2={size} stroke={color} strokeWidth="1" />
        <line x1={0} y1={size / 2} x2={size} y2={size / 2} stroke={color} strokeWidth="1" />
      </>
    ),
    bracket: (
      <path
        d={`M${size * 0.3},${size * 0.1} L${size * 0.1},${size * 0.1} L${size * 0.1},${size * 0.3}`}
        fill="none"
        stroke={color}
        strokeWidth="1"
      />
    ),
    register: (
      <>
        <path d={`M0,${size * 0.25} L0,0 L${size * 0.25},0`} fill="none" stroke={color} strokeWidth="1" />
        <path d={`M${size * 0.75},0 L${size},0 L${size},${size * 0.25}`} fill="none" stroke={color} strokeWidth="1" />
        <path d={`M${size},${size * 0.75} L${size},${size} L${size * 0.75},${size}`} fill="none" stroke={color} strokeWidth="1" />
        <path d={`M${size * 0.25},${size} L0,${size} L0,${size * 0.75}`} fill="none" stroke={color} strokeWidth="1" />
      </>
    ),
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className={`svg-decoration ${className}`}
      style={style}
    >
      {shapes[shape]}
    </svg>
  )
}

export function ConcentricArcs({
  className = '',
  opacity = 0.04,
  style,
}: DecorationProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      aria-hidden="true"
      className={`svg-decoration ${className}`}
      style={{ width: '200px', height: '200px', ...style }}
    >
      {[40, 60, 80].map((s, i) => (
        <rect
          key={i}
          x={100 - s}
          y={100 - s}
          width={s * 2}
          height={s * 2}
          rx="4"
          fill="none"
          stroke="rgba(226,232,240,0.15)"
          strokeWidth="1"
          opacity={opacity + i * 0.01}
        />
      ))}
    </svg>
  )
}
