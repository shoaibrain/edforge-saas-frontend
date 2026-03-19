/**
 * useCountUp — Animated number counter hook
 *
 * Animates from 0 to target value over a duration using ease-out easing.
 * Respects prefers-reduced-motion by returning the final value immediately.
 */

import { useState, useEffect, useRef } from 'react'

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function useCountUp(
  target: number,
  duration = 800,
  options?: { enabled?: boolean },
): number {
  const enabled = options?.enabled ?? true
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  // Check reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (!enabled || target === 0) {
      setValue(target)
      return
    }

    if (prefersReducedMotion) {
      setValue(target)
      return
    }

    startTimeRef.current = 0

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutCubic(progress)

      setValue(eased * target)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setValue(target)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration, enabled, prefersReducedMotion])

  return value
}

/**
 * Parse a formatted value string into parts for animated display.
 * e.g., "NPR 3.5 lakh" → { prefix: "NPR ", number: 3.5, suffix: " lakh" }
 */
export function parseFormattedValue(str: string): {
  prefix: string
  number: number
  suffix: string
} {
  const match = str.match(/^([^\d]*?)([\d,.]+)(.*)$/)
  if (!match) {
    return { prefix: str, number: 0, suffix: '' }
  }
  const num = parseFloat(match[2].replace(/,/g, ''))
  return {
    prefix: match[1],
    number: isNaN(num) ? 0 : num,
    suffix: match[3],
  }
}

/**
 * Format an animated number back to display format.
 * Preserves the decimal precision of the original target.
 */
export function formatAnimatedValue(
  currentValue: number,
  targetValue: number,
  prefix: string,
  suffix: string,
): string {
  // Determine decimal places from target
  const targetStr = targetValue.toString()
  const decimalIndex = targetStr.indexOf('.')
  const decimals = decimalIndex >= 0 ? targetStr.length - decimalIndex - 1 : 0

  let formatted: string
  if (decimals > 0) {
    formatted = currentValue.toFixed(decimals)
  } else {
    formatted = Math.round(currentValue).toLocaleString()
  }

  return `${prefix}${formatted}${suffix}`
}
