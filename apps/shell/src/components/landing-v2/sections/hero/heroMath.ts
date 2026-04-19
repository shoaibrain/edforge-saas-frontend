/**
 * Hero parallax math — pure functions, no React, fully unit-testable.
 *
 * Mirrors the design bundle's hero_v5.jsx envelope:
 *   scrollStart = stageTop - vh * 0.75
 *   scrollEnd   = stageTop + vh * 0.6
 *   p           = clamp((y - scrollStart) / (scrollEnd - scrollStart), 0, 1)
 *   scale       = lerp(0.9, 1.08, p)
 *   translateY  = lerp(0, -40, p)
 *   gutter      = lerp(20, 0, p)
 *   bandRadius  = lerp(40, 0, p)
 */

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export type HeroTransform = {
  /** Progress 0..1 through the hero envelope. */
  p: number
  /** CSS transform scale value. */
  scale: number
  /** CSS transform translateY value in px. */
  translateY: number
  /** Band inset (left + right gutter) in px. */
  gutter: number
  /** Band border-radius in px. */
  bandRadius: number
}

export function computeHeroTransform(opts: {
  scrollY: number
  stageTop: number
  viewportHeight: number
}): HeroTransform {
  const { scrollY, stageTop, viewportHeight: vh } = opts
  const scrollStart = stageTop - vh * 0.75
  const scrollEnd = stageTop + vh * 0.6
  const denominator = scrollEnd - scrollStart || 1
  const p = clamp((scrollY - scrollStart) / denominator, 0, 1)
  return {
    p,
    scale: lerp(0.9, 1.08, p),
    translateY: lerp(0, -40, p),
    gutter: lerp(20, 0, p),
    bandRadius: lerp(40, 0, p),
  }
}

/** Static transform used when reduced-motion is active. */
export const STATIC_HERO_TRANSFORM: HeroTransform = {
  p: 0,
  scale: 1,
  translateY: 0,
  gutter: 20,
  bandRadius: 40,
}
