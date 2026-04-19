import { useEffect, useRef, useState, type RefObject } from 'react'
import { useScrollY } from '../../hooks/useScrollY'
import {
  STATIC_HERO_TRANSFORM,
  computeHeroTransform,
  type HeroTransform,
} from './heroMath'

/**
 * useHeroProgress — reads the stage bounding rect + viewport + scroll and
 * returns the live HeroTransform. Supplies the static transform when
 * reduced-motion is active.
 */
export function useHeroProgress(
  stageRef: RefObject<HTMLElement | null>,
  reducedMotion: boolean
): HeroTransform {
  const scrollY = useScrollY()
  const [stageTop, setStageTop] = useState(0)
  const [vh, setVh] = useState(() =>
    typeof window === 'undefined' ? 800 : window.innerHeight
  )
  const rafRef = useRef(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const measure = () => {
      if (stageRef.current) {
        const rect = stageRef.current.getBoundingClientRect()
        setStageTop(window.scrollY + rect.top)
      }
      setVh(window.innerHeight)
    }
    measure()
    const onResize = () => {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        measure()
        rafRef.current = 0
      })
    }
    window.addEventListener('resize', onResize)
    const deferred = window.setTimeout(measure, 150)
    return () => {
      window.removeEventListener('resize', onResize)
      window.clearTimeout(deferred)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [stageRef])

  if (reducedMotion) return STATIC_HERO_TRANSFORM
  return computeHeroTransform({ scrollY, stageTop, viewportHeight: vh })
}
