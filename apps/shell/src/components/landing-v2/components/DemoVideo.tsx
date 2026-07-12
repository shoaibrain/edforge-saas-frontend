import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { clampSeekTime, progressFraction, xToTime } from './videoMath'

/** play() defensively: jsdom returns undefined, browsers a promise. */
function safePlay(v: HTMLVideoElement, onPlaying: () => void) {
  try {
    const p = v.play()
    if (p && typeof p.then === 'function') {
      p.then(onPlaying).catch(() => {})
    } else {
      onPlaying()
    }
  } catch {
    /* autoplay rejection — leave paused */
  }
}

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

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
  /** CSS color value (hex or var(--lp-*)) driving the progress fill. */
  accent?: string
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
 * Video mode: muted loop that plays only while in the viewport (an
 * IntersectionObserver starts/pauses it, so below-the-fold videos don't all
 * decode on page load; environments without IO fall back to playing
 * immediately). Always-visible controls; the progress bar is click- AND
 * keyboard-seekable (arrows ±5s, Home/End). Chapter markers draw on the bar
 * and update when `activeChapter` changes; parents can call the imperative
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
    const containerRef = useRef<HTMLDivElement>(null)
    const lastProgressAtRef = useRef(0)
    const [playing, setPlaying] = useState(false)
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
            safePlay(v, () => setPlaying(true))
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

    // Progress + duration tracking. timeupdate fires ~4-60x/sec per video;
    // throttle the setState to 4Hz so four mounted players don't re-render
    // the tree every frame.
    useEffect(() => {
      const v = videoRef.current
      if (!v) return
      const onTime = () => {
        const now = Date.now()
        if (now - lastProgressAtRef.current < 250) return
        lastProgressAtRef.current = now
        setProgress(progressFraction(v.currentTime, v.duration))
      }
      const onMeta = () => setDuration(v.duration || 0)
      v.addEventListener('timeupdate', onTime)
      v.addEventListener('loadedmetadata', onMeta)
      return () => {
        v.removeEventListener('timeupdate', onTime)
        v.removeEventListener('loadedmetadata', onMeta)
      }
    }, [])

    // Play only while visible — spares decode/bandwidth for below-the-fold
    // sections. No IntersectionObserver (jsdom, old browsers) → play at once.
    useEffect(() => {
      const v = videoRef.current
      const el = containerRef.current
      if (!v || !el || showMode !== 'video') return
      if (typeof IntersectionObserver === 'undefined') {
        safePlay(v, () => setPlaying(true))
        return
      }
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            safePlay(v, () => setPlaying(true))
          } else if (!v.paused) {
            v.pause()
            setPlaying(false)
          }
        },
        { threshold: 0.25 }
      )
      io.observe(el)
      return () => io.disconnect()
    }, [showMode])

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
        safePlay(v, () => setPlaying(true))
      } else {
        v.pause()
        setPlaying(false)
      }
    }

    const seekTo = (target: number) => {
      const v = videoRef.current
      if (!v) return
      try {
        v.currentTime = clampSeekTime(target, v.duration || 0)
        setProgress(progressFraction(v.currentTime, v.duration))
      } catch {
        /* ignore */
      }
    }

    const onBarClick = (e: MouseEvent<HTMLDivElement>) => {
      const v = videoRef.current
      if (!v) return
      const rect = e.currentTarget.getBoundingClientRect()
      seekTo(
        xToTime({
          clickX: e.clientX,
          barLeft: rect.left,
          barWidth: rect.width,
          duration: v.duration || 0,
        })
      )
    }

    const onBarKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      const v = videoRef.current
      if (!v) return
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          e.preventDefault()
          seekTo(v.currentTime + 5)
          break
        case 'ArrowLeft':
        case 'ArrowDown':
          e.preventDefault()
          seekTo(v.currentTime - 5)
          break
        case 'Home':
          e.preventDefault()
          seekTo(0)
          break
        case 'End':
          e.preventDefault()
          seekTo(v.duration || 0)
          break
        case ' ':
        case 'Enter':
          e.preventDefault()
          toggle()
          break
        default:
          break
      }
    }

    return (
      <div
        ref={containerRef}
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
          muted
          loop
          playsInline
          preload="metadata"
          onClick={toggle}
          aria-label="Product demonstration loop"
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            cursor: 'pointer',
          }}
        />

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
            onKeyDown={onBarKeyDown}
            role="slider"
            tabIndex={0}
            aria-label="Seek video"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            aria-valuetext={`${formatTime(progress * duration)} of ${formatTime(duration)}`}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--border-focus))]"
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
        </div>
      </div>
    )
  }
)

DemoVideo.displayName = 'DemoVideo'
