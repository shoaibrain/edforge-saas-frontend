import type { CSSProperties } from 'react'
import { ICON_PATHS, type IconName } from './icons/paths'

type IconProps = {
  name: IconName
  size?: number
  strokeWidth?: number
  color?: string
  className?: string
  style?: CSSProperties
  /**
   * When provided, renders an accessible `<title>` inside the SVG and removes
   * aria-hidden. Default: icon is decorative (aria-hidden="true").
   */
  title?: string
}

export function Icon({
  name,
  size = 20,
  strokeWidth = 1.8,
  color,
  className,
  style,
  title,
}: IconProps) {
  const path = ICON_PATHS[name]
  const ariaProps = title
    ? { 'aria-label': title, role: 'img' as const }
    : { 'aria-hidden': true as const, focusable: false as const }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      {...ariaProps}
    >
      {title ? <title>{title}</title> : null}
      {path}
    </svg>
  )
}

export type { IconName }
