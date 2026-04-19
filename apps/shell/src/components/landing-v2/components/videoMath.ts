/**
 * DemoVideo math — pure functions, no React, no DOM.
 * Used by the video player primitive for progress / seek calculations.
 */

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

/** Convert a click x-coordinate within a progress bar to a media time. */
export function xToTime(opts: {
  clickX: number
  barLeft: number
  barWidth: number
  duration: number
}): number {
  const { clickX, barLeft, barWidth, duration } = opts
  if (!duration || barWidth <= 0) return 0
  const ratio = clamp01((clickX - barLeft) / barWidth)
  return ratio * duration
}

/** Clamp a target seek time to the valid [0, duration] range. */
export function clampSeekTime(target: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return Math.max(0, target)
  return Math.max(0, Math.min(target, duration))
}

/** Compute progress fraction, guarding against zero/NaN durations. */
export function progressFraction(currentTime: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0
  return clamp01(currentTime / duration)
}
