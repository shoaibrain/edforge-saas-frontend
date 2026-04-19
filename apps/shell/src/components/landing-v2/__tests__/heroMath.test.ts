import { describe, it, expect } from 'vitest'
import {
  clamp,
  lerp,
  computeHeroTransform,
  STATIC_HERO_TRANSFORM,
} from '../sections/hero/heroMath'

describe('hero math', () => {
  describe('clamp', () => {
    it.each([
      [0.5, 0, 1, 0.5],
      [-0.3, 0, 1, 0],
      [1.7, 0, 1, 1],
      [0, 0, 1, 0],
      [1, 0, 1, 1],
    ])('clamp(%f, %f, %f) === %f', (v, min, max, expected) => {
      expect(clamp(v, min, max)).toBe(expected)
    })
  })

  describe('lerp', () => {
    it.each([
      [0, 100, 0, 0],
      [0, 100, 0.5, 50],
      [0, 100, 1, 100],
      [0.9, 1.08, 0.5, 0.99],
      [20, 0, 0.5, 10],
    ])('lerp(%f, %f, %f) ≈ %f', (a, b, t, expected) => {
      expect(lerp(a, b, t)).toBeCloseTo(expected, 5)
    })
  })

  describe('computeHeroTransform', () => {
    const vh = 800
    const stageTop = 600
    // scrollStart = 600 - 600 = 0
    // scrollEnd   = 600 + 480 = 1080

    it('returns p=0 (static state) before the envelope starts', () => {
      const t = computeHeroTransform({ scrollY: -200, stageTop, viewportHeight: vh })
      expect(t.p).toBe(0)
      expect(t.scale).toBeCloseTo(0.9)
      expect(t.translateY).toBe(0)
      expect(t.gutter).toBe(20)
      expect(t.bandRadius).toBe(40)
    })

    it('returns p=1 (final state) after the envelope ends', () => {
      const t = computeHeroTransform({ scrollY: 2000, stageTop, viewportHeight: vh })
      expect(t.p).toBe(1)
      expect(t.scale).toBeCloseTo(1.08)
      expect(t.translateY).toBe(-40)
      expect(t.gutter).toBe(0)
      expect(t.bandRadius).toBe(0)
    })

    it('returns p=0.5 at the envelope midpoint', () => {
      const midScroll = (0 + 1080) / 2 // 540
      const t = computeHeroTransform({
        scrollY: midScroll,
        stageTop,
        viewportHeight: vh,
      })
      expect(t.p).toBeCloseTo(0.5, 3)
      expect(t.scale).toBeCloseTo(0.99, 3)
      expect(t.translateY).toBeCloseTo(-20, 3)
      expect(t.gutter).toBeCloseTo(10, 3)
      expect(t.bandRadius).toBeCloseTo(20, 3)
    })

    it('never divides by zero when start === end', () => {
      const t = computeHeroTransform({
        scrollY: 500,
        stageTop: 0,
        viewportHeight: 0,
      })
      // With vh=0, start=end=0 — we expect p to be clamped, not NaN
      expect(Number.isFinite(t.p)).toBe(true)
      expect(Number.isFinite(t.scale)).toBe(true)
    })
  })

  describe('STATIC_HERO_TRANSFORM', () => {
    it('locks scale=1 and translateY=0', () => {
      expect(STATIC_HERO_TRANSFORM.scale).toBe(1)
      expect(STATIC_HERO_TRANSFORM.translateY).toBe(0)
    })
  })
})
