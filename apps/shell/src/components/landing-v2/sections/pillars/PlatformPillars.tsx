import { Container } from '../../components/layout/Container'
import { PLATFORM_PILLARS } from '../../landing.strings'
import { PillarCard } from './PillarCard'
import { PILLAR_VISUALS, type PillarVisualId } from './visuals'
import { landingEvents } from '../../../../analytics/landing-events'

/**
 * PlatformPillars — "Everything your district runs on" bento grid.
 *
 * 12-col grid at ≥720px with the colSpan pattern [7, 5, 5, 7, 6, 6] (pulled
 * from landing.strings.ts). Stacks to a single column below 720px.
 */
export function PlatformPillars() {
  return (
    <section
      id="platform"
      aria-labelledby="platform-heading"
      className="lp-section bg-[var(--lp-bg)]"
    >
      <Container>
        <div
          className="mb-[52px] mx-auto"
          style={{
            textAlign: 'center',
            maxWidth: 860,
          }}
        >
          <span
            // allow-presentation-style: editorial 11px uppercase eyebrow
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--lp-ink-muted)',
            }}
          >
            {PLATFORM_PILLARS.eyebrow}
          </span>
          <h2
            id="platform-heading"
            className="lp-h-section"
            // allow-presentation-style: fluid clamp() section heading size
            style={{
              marginTop: 12,
              fontSize: 'clamp(36px, 4.2vw, 56px)',
              lineHeight: 1.04,
              letterSpacing: '-0.03em',
            }}
          >
            {PLATFORM_PILLARS.headingLead}{' '}
            <span
              className="lp-serif"
              // allow-presentation-style: editorial 1.05em serif accent
              style={{ color: 'var(--lp-primary)', fontSize: '1.05em' }}
            >
              {PLATFORM_PILLARS.headingSerif}
            </span>
            {PLATFORM_PILLARS.headingTail}
          </h2>
          <p
            className="lp-lede mt-4 mx-auto text-lg"
            style={{
              maxWidth: 640,
            }}
          >
            {PLATFORM_PILLARS.lede}
          </p>
        </div>

        <div className="lp-pillar-grid">
          {PLATFORM_PILLARS.cards.map((c) => {
            const meta = PILLAR_VISUALS[c.visual as PillarVisualId]
            return (
              <PillarCard
                key={c.id}
                title={c.title}
                description={c.description}
                colSpan={c.colSpan}
                palette={meta.palette}
                visual={meta.render(meta.palette)}
                onClick={() => landingEvents.pillarCardClick(c.visual as PillarVisualId)}
              />
            )
          })}
        </div>
      </Container>
    </section>
  )
}
