import { describe, it, expect } from 'vitest'
import {
  clamp01,
  xToTime,
  clampSeekTime,
  progressFraction,
} from '../components/videoMath'

describe('videoMath', () => {
  describe('clamp01', () => {
    it.each([
      [-1, 0],
      [0, 0],
      [0.5, 0.5],
      [1, 1],
      [1.5, 1],
    ])('clamp01(%f) === %f', (v, expected) => {
      expect(clamp01(v)).toBe(expected)
    })
  })

  describe('xToTime', () => {
    it('maps a mid-bar click to half the duration', () => {
      const t = xToTime({ clickX: 50, barLeft: 0, barWidth: 100, duration: 60 })
      expect(t).toBe(30)
    })

    it('clamps clicks past the bar right edge to the duration', () => {
      const t = xToTime({ clickX: 500, barLeft: 0, barWidth: 100, duration: 60 })
      expect(t).toBe(60)
    })

    it('clamps clicks left of the bar to 0', () => {
      const t = xToTime({ clickX: -50, barLeft: 0, barWidth: 100, duration: 60 })
      expect(t).toBe(0)
    })

    it('returns 0 when duration is 0 (metadata not yet loaded)', () => {
      const t = xToTime({ clickX: 50, barLeft: 0, barWidth: 100, duration: 0 })
      expect(t).toBe(0)
    })

    it('returns 0 when bar has zero width', () => {
      const t = xToTime({ clickX: 50, barLeft: 0, barWidth: 0, duration: 60 })
      expect(t).toBe(0)
    })
  })

  describe('clampSeekTime', () => {
    it('clamps past the duration', () => {
      expect(clampSeekTime(120, 60)).toBe(60)
    })

    it('clamps negative times to 0', () => {
      expect(clampSeekTime(-5, 60)).toBe(0)
    })

    it('returns target when duration is unknown (0 / NaN / Infinity)', () => {
      expect(clampSeekTime(12, 0)).toBe(12)
      expect(clampSeekTime(12, Number.NaN)).toBe(12)
      expect(clampSeekTime(-12, 0)).toBe(0) // negatives still clamp
    })
  })

  describe('progressFraction', () => {
    it('returns 0 when duration is invalid', () => {
      expect(progressFraction(5, 0)).toBe(0)
      expect(progressFraction(5, Number.NaN)).toBe(0)
    })

    it('returns a clamped fraction of current/duration', () => {
      expect(progressFraction(30, 60)).toBe(0.5)
      expect(progressFraction(120, 60)).toBe(1) // clamped
      expect(progressFraction(-5, 60)).toBe(0) // clamped
    })
  })
})
