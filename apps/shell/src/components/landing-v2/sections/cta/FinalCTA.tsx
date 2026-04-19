import { Container } from '../../components/layout/Container'
import { LandingButton } from '../../components/LandingButton'
import { Icon } from '../../components/Icon'
import { FINAL_CTA } from '../../landing.strings'
import { landingEvents } from '../../../../analytics/landing-events'

/**
 * FinalCTA — crimson-gradient closing section driving email capture via a
 * mailto: href (see ADR 001 §2). Swap `ctaHref` in landing.strings.ts when a
 * form backend exists.
 */
export function FinalCTA() {
  return (
    <section
      id="demo"
      aria-labelledby="final-cta-heading"
      className="lp-section"
      style={{
        background:
          'linear-gradient(135deg, var(--lp-primary) 0%, var(--lp-primary-hover) 100%)',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.13) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          maskImage:
            'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          pointerEvents: 'none',
        }}
      />
      <Container>
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <h2
            id="final-cta-heading"
            style={{
              fontSize: 'clamp(36px, 4.5vw, 62px)',
              fontWeight: 700,
              letterSpacing: '-0.035em',
              lineHeight: 1.05,
              marginBottom: 18,
              textWrap: 'balance',
              color: '#fff',
            }}
          >
            {FINAL_CTA.headingLead}{' '}
            <span
              className="lp-serif"
              style={{ color: '#FFE7D3', fontSize: '1.05em' }}
            >
              {FINAL_CTA.headingSerif}
            </span>
            {renderWithBreaks(FINAL_CTA.headingTail)}
          </h2>
          <p
            style={{
              fontSize: 18,
              color: 'rgba(255,255,255,0.9)',
              maxWidth: 640,
              margin: '0 auto 32px',
              lineHeight: 1.5,
            }}
          >
            {FINAL_CTA.lede}
          </p>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <LandingButton
              as="a"
              href={FINAL_CTA.ctaHref}
              variant="light"
              size="lg"
              onClick={() => landingEvents.finalCtaClick('talk_to_team')}
            >
              {FINAL_CTA.cta} <Icon name="arrow" size={16} />
            </LandingButton>
          </div>
        </div>
      </Container>
    </section>
  )
}

function renderWithBreaks(text: string) {
  const lines = text.split('\n')
  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>
          {line}
          {i < lines.length - 1 ? <br /> : null}
        </span>
      ))}
    </>
  )
}
