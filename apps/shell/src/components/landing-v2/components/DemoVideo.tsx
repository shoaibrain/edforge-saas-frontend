import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { clampSeekTime, progressFraction, xToTime } from './videoMath'

export type DemoVideoChapter = {
  start: number
  label?: string
}

export type DemoVideoShowMode = 'video' | 'dashboard'

export type DemoVideoHandle = {
  /** Seek the video to the Nth chapter's start timestamp. */
  seekToChapter: (index: number) => void
}

export type DemoVideoProps = {
  /** CSS color value (hex or var(--lp-*)) driving caption dot + progress fill. */
  accent?: string
  /** Display duration label, e.g. "1:42". */
  length?: string
  /** Small caption badge top-left. */
  caption?: string
  /** Video source URL. */
  src: string
  /** Optional poster image URL shown before metadata loads. */
  posterSrc?: string
  /** Chapter markers rendered on the progress bar. */
  chapters?: readonly DemoVideoChapter[]
  /** Index of the active chapter. When this changes, video seeks. */
  activeChapter?: number
  /** Render mode. `dashboard` renders the children fallback instead of video. */
  showMode?: DemoVideoShowMode
  /** Dashboard fallback rendered in `dashboard` mode. */
  children?: ReactNode
}

/**
 * DemoVideo — marketing-video player with chapter markers + imperative seek.
 *
 * Video mode: autoplay muted loop, always-visible controls, click-to-seek on
 * the progress bar. Chapter markers draw on the bar and update automatically
 * when `activeChapter` changes. Parent can also call the imperative
 * `seekToChapter(i)` via ref.
 *
 * Dashboard mode: renders `children` instead. Used when (a) the user toggled
 * `?mode=dashboard` in the URL, or (b) a section explicitly wants the static
 * dashboard preview instead of the video.
 */
export const DemoVideo = forwardRef<DemoVideoHandle, DemoVideoProps>(
  function DemoVideo(
    {
      accent = 'var(--lp-primary)',
      length = '',
      caption,
      src,
      posterSrc,
      chapters,
      activeChapter = 0,
      showMode = 'video',
      children,
    },
    ref
  ) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [playing, setPlaying] = useState(true)
    const [progress, setProgress] = useState(0)
    const [duration, setDuration] = useState(0)

    useImperativeHandle(
      ref,
      () => ({
        seekToChapter(index: number) {
          const v = videoRef.current
          if (!v || !chapters || !chapters[index]) return
          try {
            v.currentTime = clampSeekTime(chapters[index].start, v.duration || 0)
            void v.play().then(() => setPlaying(true)).catch(() => {})
          } catch {
            /* ignore seek failures (e.g. before metadata) */
          }
        },
      }),
      [chapters]
    )

    // Auto-seek when activeChapter prop changes (and diff > 0.4s).
    useEffect(() => {
      const v = videoRef.current
      if (!v || !chapters || !chapters[activeChapter]) return
      const target = clampSeekTime(chapters[activeChapter].start, v.duration || 0)
      if (Math.abs(v.currentTime - target) > 0.4) {
        try {
          v.currentTime = target
        } catch {
          /* ignore */
        }
      }
    }, [activeChapter, chapters])

    // Progress + duration tracking.
    useEffect(() => {
      const v = videoRef.current
      if (!v) return
      const onTime = () => setProgress(progressFraction(v.currentTime, v.duration))
      const onMeta = () => setDuration(v.duration || 0)
      v.addEventListener('timeupdate', onTime)
      v.addEventListener('loadedmetadata', onMeta)
      return () => {
        v.removeEventListener('timeupdate', onTime)
        v.removeEventListener('loadedmetadata', onMeta)
      }
    }, [])

    if (showMode === 'dashboard') {
      return (
        <div
          className="bg-[var(--lp-bg-elevated)] shadow-[var(--lp-shadow-lg)]"
          style={{
            border: '1px solid var(--lp-border)',
            borderRadius: 18,
            overflow: 'hidden',
          }}
        >
          {children}
        </div>
      )
    }

    const toggle = () => {
      const v = videoRef.current
      if (!v) return
      if (v.paused) {
        void v.play().then(() => setPlaying(true)).catch(() => {})
      } else {
        v.pause()
        setPlaying(false)
      }
    }

    const onBarClick = (e: MouseEvent<HTMLDivElement>) => {
      const v = videoRef.current
      if (!v) return
      const rect = e.currentTarget.getBoundingClientRect()
      const target = xToTime({
        clickX: e.clientX,
        barLeft: rect.left,
        barWidth: rect.width,
        duration: v.duration || 0,
      })
      try {
        v.currentTime = clampSeekTime(target, v.duration || 0)
      } catch {
        /* ignore */
      }
    }

    return (
      <div
        className="bg-[#0F1A2E] shadow-[var(--lp-shadow-lg)]"
        style={{
          position: 'relative',
          borderRadius: 18,
          overflow: 'hidden',
          aspectRatio: '16 / 10',
          border: '1px solid var(--lp-border)',
        }}
      >
        <video
          ref={videoRef}
          src={src}
          poster={posterSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onClick={toggle}
          aria-label={caption ? `${caption} — demonstration loop` : 'Product demonstration loop'}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            cursor: 'pointer',
          }}
        />

        {caption ? (
          <div
            // allow-presentation-style: glass caption badge, rgba tint + editorial 12.5px
            style={{
              position: 'absolute',
              left: 14,
              top: 14,
              zIndex: 2,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 12px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(8px)',
              fontSize: 12.5,
              fontWeight: 600,
              color: 'var(--lp-ink)',
            }}
          >
            <span
              aria-hidden
              // allow-presentation-style: dynamic accent-driven dot fill + halo
              style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                background: accent,
                boxShadow: `0 0 0 3px ${accent}33`,
              }}
            />
            {caption}
          </div>
        ) : null}

        {/* Controls */}
        <div
          // allow-presentation-style: decorative gradient scrim, no token
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 3,
            padding: '12px 14px',
            background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.55) 100%)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <button
            onClick={toggle}
            aria-label={playing ? 'Pause demonstration' : 'Play demonstration'}
            type="button"
            // allow-presentation-style: glass control button, rgba tint over dark video
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              background: 'rgba(255,255,255,0.95)',
              color: 'var(--lp-ink)',
              border: 'none',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              transition: 'transform 0.15s',
            }}
          >
            {playing ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M7 5v14l12-7z" />
              </svg>
            )}
          </button>

          <div
            onClick={onBarClick}
            role="progressbar"
            aria-label="Video progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            // allow-presentation-style: decorative rgba track over dark video
            style={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.22)',
              position: 'relative',
            }}
          >
            {chapters && duration > 0
              ? chapters.map((ch, i) => (
                  <span
                    key={i}
                    aria-hidden
                    // allow-presentation-style: dynamic chapter position + active-state fill
                    style={{
                      position: 'absolute',
                      left: `${(ch.start / duration) * 100}%`,
                      top: -2,
                      bottom: -2,
                      width: 2,
                      background:
                        i === activeChapter ? '#fff' : 'rgba(255,255,255,0.55)',
                      borderRadius: 1,
                    }}
                  />
                ))
              : null}
            <span
              aria-hidden
              // allow-presentation-style: dynamic progress width + accent fill
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${progress * 100}%`,
                background: accent,
                borderRadius: 3,
                pointerEvents: 'none',
              }}
            />
          </div>

          <div
            className="lp-mono"
            // allow-presentation-style: editorial 11px mono label, rgba over dark video
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.9)',
              letterSpacing: '0.04em',
              flexShrink: 0,
            }}
          >
            {length}
          </div>
        </div>
      </div>
    )
  }
)

DemoVideo.displayName = 'DemoVideo'
