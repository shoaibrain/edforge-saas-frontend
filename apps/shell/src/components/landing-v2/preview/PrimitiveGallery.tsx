import { Tag } from '@edforge/ui'
import { EdforgeLogo } from '../components/Brand'
import { Icon, type IconName } from '../components/Icon'
import { LandingButton } from '../components/LandingButton'
import { Container } from '../components/layout/Container'
import { Eyebrow } from '../components/layout/Eyebrow'
import { Hairline } from '../components/layout/Hairline'
import { ICON_PATHS } from '../components/icons/paths'

const ALL_ICON_NAMES = Object.keys(ICON_PATHS) as IconName[]

/**
 * Developer-facing gallery of every Sprint 1 primitive. Rendered under the
 * TokenGallery on /_landing-preview. Not linked from product UI.
 */
export function PrimitiveGallery() {
  return (
    <div style={{ padding: '48px 32px 96px', background: 'var(--lp-bg)' }}>
      <Container>
        <h1
          style={{
            fontSize: 40,
            letterSpacing: '-0.03em',
            color: 'var(--lp-ink)',
            margin: '0 0 8px',
          }}
        >
          Primitive <span className="lp-serif" style={{ color: 'var(--lp-primary)' }}>gallery</span>
        </h1>
        <p style={{ color: 'var(--lp-ink-3)', marginBottom: 32 }}>
          Every Sprint 1 primitive, rendered against the live token surface.
        </p>

        <Hairline />

        {/* Brand */}
        <Section title="Brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
            <EdforgeLogo size={34} />
            <EdforgeLogo size={48} />
            <EdforgeLogo size={64} />
          </div>
        </Section>

        {/* Icons */}
        <Section title={`Icons (${ALL_ICON_NAMES.length})`}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: 8,
            }}
          >
            {ALL_ICON_NAMES.map((name) => (
              <div
                key={name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: 12,
                  border: '1px solid var(--lp-border)',
                  borderRadius: 'var(--lp-radius)',
                  background: 'var(--lp-bg-elevated)',
                  color: 'var(--lp-ink-2)',
                }}
              >
                <Icon name={name} size={20} />
                <code className="lp-mono" style={{ fontSize: 11 }}>
                  {name}
                </code>
              </div>
            ))}
          </div>
        </Section>

        {/* Tags */}
        <Section title="Tags">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Tag variant="primary">Primary</Tag>
            <Tag variant="primary" dot>
              Primary with dot
            </Tag>
            <Tag variant="teal">Teal</Tag>
            <Tag variant="green" dot>
              Green
            </Tag>
            <Tag variant="blue">Blue</Tag>
            <Tag variant="ink">Ink</Tag>
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Buttons">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <LandingButton variant="primary">
              Primary CTA <Icon name="arrow" size={16} />
            </LandingButton>
            <LandingButton variant="ghost">Ghost</LandingButton>
            <LandingButton variant="dark">Dark</LandingButton>
            <div
              style={{
                padding: 16,
                background: 'var(--lp-ink)',
                borderRadius: 'var(--lp-radius)',
              }}
            >
              <LandingButton variant="light">Light on dark</LandingButton>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            <LandingButton variant="primary" size="sm">
              Small
            </LandingButton>
            <LandingButton variant="primary" size="md">
              Medium
            </LandingButton>
            <LandingButton variant="primary" size="lg">
              Large
            </LandingButton>
            <LandingButton as="a" href="#" variant="primary">
              Anchor variant
            </LandingButton>
          </div>
        </Section>

        {/* Eyebrow */}
        <Section title="Eyebrow">
          <Eyebrow>For district leaders</Eyebrow>
          <div style={{ marginTop: 8 }}>
            <Eyebrow color="var(--lp-primary-ink)">The edforge switch</Eyebrow>
          </div>
        </Section>

        {/* Hairline */}
        <Section title="Hairline">
          <Hairline />
        </Section>

        {/* Container reference */}
        <Section title="Container">
          <p style={{ color: 'var(--lp-ink-3)', marginBottom: 8 }}>
            Default container is 1240px wide with 32/20 px horizontal padding.
            <code className="lp-mono" style={{ marginLeft: 8, fontSize: 12 }}>
              {'<Container wide>'}
            </code>{' '}
            bumps to 1360px.
          </p>
        </Section>
      </Container>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section style={{ padding: '32px 0', borderBottom: '1px solid var(--lp-border)' }}>
      <h2 style={{ fontSize: 20, color: 'var(--lp-ink)', margin: '0 0 16px' }}>{title}</h2>
      {children}
    </section>
  )
}
