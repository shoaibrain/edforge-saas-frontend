import { resolveAssetUrl, LANDING_VIDEOS } from '../../config'
import { HeroDashboard } from './HeroDashboard'

type LaptopFrameProps = {
  /** When true, render the static product dashboard instead of an autoplay <video>. */
  staticFallback: boolean
}

/**
 * LaptopFrame — dark chrome, camera notch, 16:10 screen holding the hero
 * media. When staticFallback is true the autoplay <video> is replaced with a
 * static product-overview dashboard (HeroDashboard) so no autoplay fires. The
 * <video> branch is retained for a later iteration.
 */
export function LaptopFrame({ staticFallback }: LaptopFrameProps) {
  const videoUrl = resolveAssetUrl(LANDING_VIDEOS.platformOverview)

  return (
    <div
      // allow-presentation-style: decorative laptop chrome, dark hex + multi-stop shadow
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
        // allow-presentation-style: decorative camera-notch dot, dark hex + inset shadow
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
        className="bg-[#fff]"
        style={{
          borderRadius: 6,
          overflow: 'hidden',
          aspectRatio: '16 / 10',
          position: 'relative',
        }}
      >
        {staticFallback ? <HeroDashboard /> : <HeroVideo src={videoUrl} />}
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
