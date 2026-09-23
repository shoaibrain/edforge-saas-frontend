import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { Container } from './layout/Container'
import { DemoVideo, type DemoVideoChapter } from './DemoVideo'
import type { UseCaseFeature } from '../landing.strings'
import { landingEvents } from '../../../analytics/landing-events'

export type UseCasePanelHeading = {
  lead: string
  serif: string
  serifColor?: string
  tail: string
}

export type UseCasePanelProps = {
  sectionId: string
  eyebrow?: string
  heading: UseCasePanelHeading
  lede: string
  /** CSS color (hex or var(--lp-*)) that accents active features + media. */
  accent: string
  /** Background color for the section. */
  background?: string
  features: readonly UseCaseFeature[]
  videoSrc: string
  /** When true, media sits on the left and features on the right. */
  reverse?: boolean
  /** Dashboard fallback shown when showMode is 'dashboard'. */
  dashboardFallback: ReactNode
  /** Override the DemoVideo's showMode; defaults to 'video'. */
  showMode?: 'video' | 'dashboard'
}

/**
 * UseCasePanel — shared split layout used by the three use-case sections
 * (District, Teachers & Parents, Students).
 *
 * Left column (or right when `reverse`) is a tablist-style feature rail. Tab
 * through features; Arrow Up/Down cycles between them; clicking or activating
 * a feature sets it active and seeks the DemoVideo to the feature's chapter.
 *
 * Right column (sticky) holds the DemoVideo or the dashboard fallback.
 */
export function UseCasePanel({
  sectionId,
  eyebrow,
  heading,
  lede,
  accent,
  background = 'var(--lp-bg)',
  features,
  videoSrc,
  reverse = false,
  dashboardFallback,
  showMode = 'video',
}: UseCasePanelProps) {
  const [active, setActive] = useState(0)
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([])

  // Keep the active index in range if the feature list shrinks.
  useEffect(() => {
    if (active >= features.length) setActive(0)
  }, [active, features.length])

  const chapters: DemoVideoChapter[] = features.map((f) => ({
    start: f.start,
    label: f.title,
  }))

  const selectFeature = (i: number) => {
    setActive(i)
    const f = features[i]
    if (!f) return
    // sectionId matches the UseCaseSectionId union in landing-events.ts
    // Only emit for the three production use-case ids so analytics stays typed.
    if (
      sectionId === 'use-cases' ||
      sectionId === 'teachers-parents' ||
      sectionId === 'students'
    ) {
      landingEvents.useCaseFeatureClick(sectionId, i, f.id)
    }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const max = features.length - 1
    let next = i
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = i >= max ? 0 : i + 1
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = i <= 0 ? max : i - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = max
    else return
    e.preventDefault()
    selectFeature(next)
    buttonsRef.current[next]?.focus()
  }

  const rail = (
    <div
      role="tablist"
      aria-label={`${sectionId}-features`}
      aria-orientation="vertical"
      className="lp-usecase-rail"
    >
      {features.map((f, i) => {
        const isActive = i === active
        return (
          <button
            key={f.id}
            ref={(el) => {
              buttonsRef.current[i] = el
            }}
            role="tab"
            type="button"
            id={`${sectionId}-tab-${f.id}`}
            aria-selected={isActive}
            aria-controls={`${sectionId}-panel`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => selectFeature(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className="pt-[20px] pb-[20px] pl-[24px] bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--lp-bg)]"
            style={{
              display: 'block',
              textAlign: 'left',
              width: '100%',
              borderLeft: `3px solid ${isActive ? accent : 'transparent'}`,
              transition: 'border-color 0.2s',
              cursor: 'pointer',
            }}
          >
            <div
              // allow-presentation-style: editorial 19px title + active-state color toggle
              style={{
                fontSize: 19,
                fontWeight: 700,
                letterSpacing: '-0.015em',
                marginBottom: 8,
                color: isActive ? 'var(--lp-ink)' : 'var(--lp-ink-hint)',
                transition: 'color 0.2s',
              }}
            >
              {f.title}
            </div>
            {isActive ? (
              <div
                // allow-presentation-style: editorial 14.5px description copy
                style={{
                  fontSize: 14.5,
                  lineHeight: 1.6,
                  color: 'var(--lp-ink-3)',
                  maxWidth: 440,
                }}
              >
                {f.description}
              </div>
            ) : null}
          </button>
        )
      })}
    </div>
  )

  const media = (
    <div
      id={`${sectionId}-panel`}
      role="tabpanel"
      aria-labelledby={`${sectionId}-tab-${features[active]?.id ?? ''}`}
      className="lp-usecase-media"
      style={{ position: 'sticky', top: 100 }}
    >
      <DemoVideo
        accent={accent}
        src={videoSrc}
        chapters={chapters}
        activeChapter={active}
        showMode={showMode}
      >
        {dashboardFallback}
      </DemoVideo>
    </div>
  )

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: reverse ? '1.35fr 1fr' : '1fr 1.35fr',
    gap: 56,
    alignItems: 'start',
  }

  return (
    <section
      id={sectionId}
      aria-labelledby={`${sectionId}-heading`}
      className="lp-section"
      // allow-presentation-style: section background is a caller-provided prop
      style={{ background, position: 'relative' }}
    >
      <Container>
        <div className="lp-usecase-header mb-14" style={{ textAlign: 'center' }}>
          {eyebrow ? (
            <div
              // allow-presentation-style: editorial 11px uppercase eyebrow
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--lp-ink-muted)',
                marginBottom: 12,
              }}
            >
              {eyebrow}
            </div>
          ) : null}
          <h2
            id={`${sectionId}-heading`}
            className="lp-h-section mx-auto mb-[18px]"
            style={{ maxWidth: 880 }}
          >
            {renderHeading(heading)}
          </h2>
          <p className="lp-lede mx-auto" style={{ textAlign: 'center' }}>
            {lede}
          </p>
        </div>
        <div className="lp-usecase-grid" style={gridStyle}>
          {reverse ? (
            <>
              {media}
              {rail}
            </>
          ) : (
            <>
              {rail}
              {media}
            </>
          )}
        </div>
      </Container>
    </section>
  )
}

/**
 * Renders section heading with optional Instrument Serif italic accent
 * and line breaks embedded in the lead/tail strings.
 */
function renderHeading(h: UseCasePanelHeading) {
  const leadLines = h.lead.split('\n')
  const tailLines = h.tail.split('\n')
  return (
    <>
      {leadLines.map((line, i) => (
        <span key={`lead-${i}`}>
          {line}
          {i < leadLines.length - 1 ? <br /> : null}
        </span>
      ))}{' '}
      <span
        className="lp-serif"
        // allow-presentation-style: dynamic serif accent color + editorial 1.05em
        style={{ color: h.serifColor ?? 'var(--lp-primary)', fontSize: '1.05em' }}
      >
        {h.serif}
      </span>
      {tailLines.map((line, i) => (
        <span key={`tail-${i}`}>
          {i === 0 ? '' : null}
          {line}
          {i < tailLines.length - 1 ? <br /> : null}
        </span>
      ))}
    </>
  )
}
