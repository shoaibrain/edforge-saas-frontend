import { HeroCopy } from './HeroCopy'
import { HeroStage } from './HeroStage'

/**
 * Hero — top-of-page section. Copy block + scroll-driven laptop stage with
 * embedded autoplay video. Reduced-motion/reduced-data users get a static
 * poster + locked transform (no autoplay, no scroll transforms).
 */
export function Hero() {
  return (
    <section
      id="top"
      aria-labelledby="hero-heading"
      className="lp-hero bg-[var(--lp-bg)] pt-14 pb-0"
      style={{
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <HeroCopy />
      <HeroStage />
    </section>
  )
}
