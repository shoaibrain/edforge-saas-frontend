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
      // allow-presentation-style: decorative crimson gradient backdrop + on-gradient white text
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
            // allow-presentation-style: fluid clamp() display size + on-gradient white text
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
              // allow-presentation-style: editorial 1.05em serif accent, on-gradient peach
              style={{ color: '#FFE7D3', fontSize: '1.05em' }}
            >
              {FINAL_CTA.headingSerif}
            </span>
            {renderWithBreaks(FINAL_CTA.headingTail)}
          </h2>
          <p
            className="text-lg text-[rgba(255,255,255,0.9)] mx-auto mb-8"
            style={{
              maxWidth: 640,
              lineHeight: 1.5,
            }}
          >
            {FINAL_CTA.lede}
          </p>
          <div
            className="gap-3"
            style={{
              display: 'flex',
              justifyContent: 'center',
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
          {'ctaMicro' in FINAL_CTA && (
            <p
              // allow-presentation-style: editorial 13px micro-copy, on-gradient white
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.7)',
                marginTop: 12,
              }}
            >
              {FINAL_CTA.ctaMicro}
            </p>
          )}
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
