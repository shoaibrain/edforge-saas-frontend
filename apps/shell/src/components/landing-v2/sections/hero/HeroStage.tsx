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
  const staticFallback = reducedMotion || reducedData

  const { scale, translateY, gutter, bandRadius } = useHeroProgress(
    stageRef,
    reducedMotion
  )

  return (
    <div
      id="stage"
      ref={stageRef}
      style={{
        position: 'relative',
        width: '100%',
        height: 700,
        marginTop: 8,
      }}
    >
      {/* Solid accent band */}
      <div
        aria-hidden
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
      {/* Device — scaled by scroll progress */}
      <div
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
