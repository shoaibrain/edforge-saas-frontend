import { resolveAssetUrl, LANDING_VIDEOS } from '../../config'

type LaptopFrameProps = {
  /** When true, render a static poster instead of an autoplay <video>. */
  staticFallback: boolean
}

/**
 * LaptopFrame — dark chrome, camera notch, 16:10 screen holding the hero
 * video. When staticFallback is true (reduced-motion / reduced-data) the
 * video is replaced with a styled poster so no autoplay fires.
 */
export function LaptopFrame({ staticFallback }: LaptopFrameProps) {
  const videoUrl = resolveAssetUrl(LANDING_VIDEOS.platformOverview)

  return (
    <div
      style={{
        position: 'relative',
        background: '#151515',
        borderRadius: 16,
        padding: '22px 10px 10px',
        boxShadow:
          '0 2px 0 rgba(255,255,255,0.08) inset,' +
          ' 0 40px 80px -20px rgba(29,53,87,0.45),' +
          ' 0 24px 48px -16px rgba(29,53,87,0.30),' +
          ' 0 0 0 1px rgba(0,0,0,0.25)',
      }}
    >
      {/* Camera notch */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 6,
          height: 6,
          borderRadius: 3,
          background: '#3a3a3a',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
        }}
      />
      {/* Screen */}
      <div
        style={{
          background: '#fff',
          borderRadius: 6,
          overflow: 'hidden',
          aspectRatio: '16 / 10',
          position: 'relative',
        }}
      >
        {staticFallback ? <StaticHeroPoster /> : <HeroVideo src={videoUrl} />}
      </div>
    </div>
  )
}

function HeroVideo({ src }: { src: string }) {
  return (
    <video
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-label="Edforge platform overview, short ambient loop"
      style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
    />
  )
}

/**
 * StaticHeroPoster — shown when reduced-motion/data prevents autoplay.
 * A calm, Breeze-palette gradient with a minimal mark stands in for the
 * video so hero still has visual weight. No motion, no network.
 */
function StaticHeroPoster() {
  return (
    <div
      role="img"
      aria-label="Edforge platform overview"
      style={{
        width: '100%',
        height: '100%',
        background:
          'linear-gradient(135deg, var(--lp-bg-warm) 0%, var(--lp-teal-soft) 50%, var(--lp-bg-elevated) 100%)',
        display: 'grid',
        placeItems: 'center',
        color: 'var(--lp-ink)',
      }}
    >
      <div
        className="lp-serif"
        style={{
          fontSize: 'clamp(28px, 3vw, 44px)',
          color: 'var(--lp-primary)',
          textAlign: 'center',
        }}
      >
        Edforge
      </div>
    </div>
  )
}
