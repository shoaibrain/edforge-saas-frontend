import { Container } from '../../components/layout/Container'
import { Icon, type IconName } from '../../components/Icon'
import { LandingButton } from '../../components/LandingButton'
import { SECURITY_STRIP } from '../../landing.strings'
import { landingEvents } from '../../../../analytics/landing-events'

/**
 * SecurityStrip — dark, trust-building section between Platform Pillars and
 * the FAQ. Three plain-language privacy promises + a row of compliance
 * framework names Edforge aligns to.
 */
export function SecurityStrip() {
  return (
    <section
      id="security"
      aria-labelledby="security-heading"
      className="lp-section-sm"
      style={{
        background: 'var(--lp-ink)',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle dotted mask — visual texture, no content */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          maskImage:
            'radial-gradient(ellipse at center, black 20%, transparent 75%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at center, black 20%, transparent 75%)',
          pointerEvents: 'none',
        }}
      />
      <Container>
        <div style={{ position: 'relative' }}>
          <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 48px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                fontSize: 12.5,
                fontWeight: 600,
                marginBottom: 18,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  background: '#7BE0B7',
                }}
              />
              {SECURITY_STRIP.tag}
            </span>
            <h2
              id="security-heading"
              style={{
                fontSize: 'clamp(34px, 3.8vw, 52px)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
                marginTop: 14,
                marginBottom: 16,
                textWrap: 'balance',
                color: '#fff',
              }}
            >
              {SECURITY_STRIP.headingLead}{' '}
              <span className="lp-serif" style={{ color: '#F4B08A', fontSize: '1.05em' }}>
                {SECURITY_STRIP.headingSerif}
              </span>
              {renderWithBreaks(SECURITY_STRIP.headingTail)}
            </h2>
            <p
              style={{
                fontSize: 16.5,
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.6,
                textWrap: 'pretty',
              }}
            >
              {SECURITY_STRIP.lede}
            </p>
          </div>

          {/* Promise cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 14,
              marginBottom: 28,
            }}
          >
            {SECURITY_STRIP.promises.map((p, i) => (
              <PromiseCard
                key={p.title}
                icon={p.icon as IconName}
                title={p.title}
                description={p.description}
                accent={PROMISE_ACCENTS[i] ?? '#7BE0B7'}
              />
            ))}
          </div>

          {/* Frameworks row */}
          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              {SECURITY_STRIP.frameworksLabel}
            </div>
            <div
              style={{
                flex: 1,
                display: 'flex',
                gap: 18,
                flexWrap: 'wrap',
                justifyContent: 'flex-end',
              }}
            >
              {SECURITY_STRIP.frameworks.map((name) => (
                <div
                  key={name}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#fff',
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      background: 'rgba(123,224,183,0.18)',
                      color: '#7BE0B7',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <Icon name="check" size={11} strokeWidth={3} />
                  </span>
                  {name}
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <LandingButton
              as="a"
              href={SECURITY_STRIP.ctaHref}
              variant="light"
              onClick={() => landingEvents.securityCtaClick('privacy_promise')}
            >
              {SECURITY_STRIP.cta} <Icon name="arrow" size={16} />
            </LandingButton>
          </div>
        </div>
      </Container>
    </section>
  )
}

const PROMISE_ACCENTS = ['#7BE0B7', '#93B9F0', '#F4B08A']

function PromiseCard({
  icon,
  title,
  description,
  accent,
}: {
  icon: IconName
  title: string
  description: string
  accent: string
}) {
  return (
    <div
      style={{
        padding: 22,
        borderRadius: 16,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: 'rgba(255,255,255,0.06)',
          color: accent,
          display: 'grid',
          placeItems: 'center',
          marginBottom: 14,
        }}
      >
        <Icon name={icon} size={20} />
      </div>
      <div
        style={{
          fontSize: 17,
          fontWeight: 700,
          marginBottom: 8,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 13.5,
          color: 'rgba(255,255,255,0.68)',
          lineHeight: 1.55,
        }}
      >
        {description}
      </div>
    </div>
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
