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
    <div className="pt-[48px] pl-[32px] pr-[32px] pb-[96px] bg-[var(--lp-bg)]">
      <Container>
        <h1
          // allow-presentation-style: editorial 40px display heading
          style={{
            fontSize: 40,
            letterSpacing: '-0.03em',
            color: 'var(--lp-ink)',
            margin: '0 0 8px',
          }}
        >
          Primitive <span className="lp-serif text-[var(--lp-primary)]">gallery</span>
        </h1>
        <p className="text-[var(--lp-ink-3)] mb-8">
          Every Sprint 1 primitive, rendered against the live token surface.
        </p>

        <Hairline />

        {/* Brand */}
        <Section title="Brand">
          <div className="gap-8" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <EdforgeLogo size={34} />
            <EdforgeLogo size={48} />
            <EdforgeLogo size={64} />
          </div>
        </Section>

        {/* Icons */}
        <Section title={`Icons (${ALL_ICON_NAMES.length})`}>
          <div
            className="gap-2"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            }}
          >
            {ALL_ICON_NAMES.map((name) => (
              <div
                key={name}
                className="gap-2.5 p-3 bg-[var(--lp-bg-elevated)] text-[var(--lp-ink-2)]"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid var(--lp-border)',
                  borderRadius: 'var(--lp-radius)',
                }}
              >
                <Icon name={name} size={20} />
                <code
                  className="lp-mono"
                  // allow-presentation-style: editorial 11px mono icon name
                  style={{ fontSize: 11 }}
                >
                  {name}
                </code>
              </div>
            ))}
          </div>
        </Section>

        {/* Tags */}
        <Section title="Tags">
          <div className="gap-2.5" style={{ display: 'flex', flexWrap: 'wrap' }}>
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
          <div className="gap-2.5" style={{ display: 'flex', flexWrap: 'wrap' }}>
            <LandingButton variant="primary">
              Primary CTA <Icon name="arrow" size={16} />
            </LandingButton>
            <LandingButton variant="ghost">Ghost</LandingButton>
            <LandingButton variant="dark">Dark</LandingButton>
            <div
              className="p-4 bg-[var(--lp-ink)]"
              style={{
                borderRadius: 'var(--lp-radius)',
              }}
            >
              <LandingButton variant="light">Light on dark</LandingButton>
            </div>
          </div>
          <div className="gap-2.5 mt-3" style={{ display: 'flex', flexWrap: 'wrap' }}>
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
          <div className="mt-2">
            <Eyebrow color="var(--lp-primary-ink)">The edforge switch</Eyebrow>
          </div>
        </Section>

        {/* Hairline */}
        <Section title="Hairline">
          <Hairline />
        </Section>

        {/* Container reference */}
        <Section title="Container">
          <p className="text-[var(--lp-ink-3)] mb-2">
            Default container is 1240px wide with 32/20 px horizontal padding.
            <code className="lp-mono ml-2 text-xs">
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
    <section className="pt-[32px] pb-[32px]" style={{ borderBottom: '1px solid var(--lp-border)' }}>
      <h2 className="text-xl text-[var(--lp-ink)] mb-4">{title}</h2>
      {children}
    </section>
  )
}
