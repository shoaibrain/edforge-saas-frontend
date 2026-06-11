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
      className="lp-section-sm bg-[var(--lp-ink)] text-[#fff]"
      style={{
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
          <div className="mx-auto mb-12" style={{ textAlign: 'center', maxWidth: 720 }}>
            <span
              // allow-presentation-style: editorial 12.5px glass tag pill, rgba over dark
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
                className="bg-[#7BE0B7]"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                }}
              />
              {SECURITY_STRIP.tag}
            </span>
            <h2
              id="security-heading"
              // allow-presentation-style: fluid clamp() display heading, on-dark white text
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
              <span
                className="lp-serif"
                // allow-presentation-style: editorial 1.05em serif accent, peach on dark
                style={{ color: '#F4B08A', fontSize: '1.05em' }}
              >
                {SECURITY_STRIP.headingSerif}
              </span>
              {renderWithBreaks(SECURITY_STRIP.headingTail)}
            </h2>
            <p
              // allow-presentation-style: editorial 16.5px lede, rgba over dark
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
            className="lp-promise-grid mb-7"
            // allow-presentation-style: off-scale 14px grid gap
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 14,
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
            className="lp-frameworks-row bg-[rgba(255,255,255,0.04)] pt-[20px] pb-[20px] pl-[24px] pr-[24px] gap-6"
            style={{
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div
              className="text-xs text-[rgba(255,255,255,0.55)]"
              style={{
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              {SECURITY_STRIP.frameworksLabel}
            </div>
            <div
              className="lp-frameworks-badges"
              // allow-presentation-style: off-scale 18px flex gap
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
                  // allow-presentation-style: editorial 13px badge label, white on dark
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
                    className="bg-[rgba(123,224,183,0.18)] text-[#7BE0B7]"
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
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

          <div className="mt-7" style={{ textAlign: 'center' }}>
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
      className="pt-[22px] pb-[22px] pl-[22px] pr-[22px] bg-[rgba(255,255,255,0.04)]"
      style={{
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div
        // allow-presentation-style: per-promise accent icon color
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
        // allow-presentation-style: editorial 17px card title
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
        // allow-presentation-style: editorial 13.5px description, rgba on dark
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
