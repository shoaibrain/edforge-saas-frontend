import { useRef } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useHeroProgress } from './useHeroProgress'
import { LaptopFrame } from './LaptopFrame'
import { useReducedData } from '../../hooks/useReducedData'

/**
 * HeroStage — solid primary-color band with a centered laptop device that
 * scales, lifts, and shrinks its gutters as the viewer scrolls through the
 * envelope. When reduced-motion is active the transform is locked at the
 * static state (scale 1, full gutter).
 */
export function HeroStage() {
  const stageRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const reducedData = useReducedData()
  // Autoplay the real product-overview loop; reduced-motion/reduced-data users
  // get the static HeroDashboard instead (no autoplay, no video fetch).
  const staticFallback = reducedMotion || reducedData

  const { scale, translateY, gutter, bandRadius } = useHeroProgress(
    stageRef,
    reducedMotion
  )

  return (
    <div
      id="stage"
      ref={stageRef}
      className="lp-hero-stage mt-2"
      style={{
        position: 'relative',
        width: '100%',
        height: 700,
      }}
    >
      {/* Solid accent band — hidden on mobile via .lp-hero-band */}
      <div
        aria-hidden
        className="lp-hero-band"
        // allow-presentation-style: scroll-driven gutter/radius + decorative accent glow shadow
        style={{
          position: 'absolute',
          left: gutter,
          right: gutter,
          top: 100,
          bottom: -240,
          background: 'var(--lp-primary)',
          borderRadius: bandRadius,
          boxShadow: '0 20px 60px -20px rgba(230,57,70,0.30)',
          willChange: 'left, right, border-radius',
          transition: 'box-shadow 0.2s linear',
        }}
      />
      {/* Device — scaled by scroll progress; static on mobile via .lp-hero-device */}
      <div
        className="lp-hero-device"
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          width: 'min(1320px, calc(100vw - 48px))',
          transform: `translate(-50%, ${translateY}px) scale(${scale})`,
          transformOrigin: 'top center',
          zIndex: 2,
          willChange: 'transform',
        }}
      >
        <LaptopFrame staticFallback={staticFallback} />
      </div>
    </div>
  )
}
