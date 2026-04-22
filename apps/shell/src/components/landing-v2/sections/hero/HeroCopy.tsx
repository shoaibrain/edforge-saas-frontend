import { HERO } from '../../landing.strings'
import { Container } from '../../components/layout/Container'
import { landingEvents } from '../../../../analytics/landing-events'

/**
 * HeroCopy — h1 + lede + scroll-down chip link. Centered above the stage.
 * Copy sourced from landing.strings.ts.
 */
export function HeroCopy() {
  const midParts = HERO.headingMid.split('\n')
  return (
    <Container>
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 3, paddingBottom: 20 }}>
        <h1
          id="hero-heading"
          style={{
            margin: '10px auto 16px',
            maxWidth: 980,
            fontSize: 'clamp(42px, 5.6vw, 72px)',
            lineHeight: 1.03,
            letterSpacing: '-0.035em',
            fontWeight: 700,
            color: 'var(--lp-ink)',
            textWrap: 'balance',
          }}
        >
          <span
            className="lp-serif"
            style={{ color: 'var(--lp-primary)', fontSize: '1.02em' }}
          >
            {HERO.headingSerif1}
          </span>
          {midParts.map((part, i) => (
            <span key={i}>
              {part}
              {i < midParts.length - 1 ? <br /> : null}
            </span>
          ))}
          <span
            className="lp-serif"
            style={{ color: 'var(--lp-primary)', fontSize: '1.02em' }}
          >
            {HERO.headingSerif2}
          </span>
          {HERO.headingTail}
        </h1>
        <p
          style={{
            margin: '0 auto 22px',
            fontSize: 18,
            lineHeight: 1.55,
            color: 'var(--lp-ink-3)',
            maxWidth: 600,
            textWrap: 'pretty',
          }}
        >
          {HERO.lede}
        </p>
        <a
          href="#stage"
          onClick={() => landingEvents.heroCtaClick('scroll_hint')}
          style={{
            marginTop: 6,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--lp-primary)',
            textDecoration: 'none',
          }}
        >
          <span aria-hidden style={{ fontSize: 16 }}>
            ↓
          </span>{' '}
          {HERO.scrollHint}
        </a>
      </div>
    </Container>
  )
}
