import { Accordion, type AccordionItem } from '@edforge/ui'
import { Container } from '../../components/layout/Container'
import { FAQ as FAQ_STRINGS } from '../../landing.strings'
import { landingEvents } from '../../../../analytics/landing-events'

/**
 * FAQ — 6 questions from the copy catalog, rendered through the shared
 * Accordion primitive. First item open by default (design behavior);
 * single-open (clicking a new item closes the previous).
 */
export function FAQ() {
  const items: AccordionItem[] = FAQ_STRINGS.items.map((item, i) => ({
    id: `faq-${i}`,
    trigger: item.q,
    panel: item.a,
  }))

  return (
    <section
      id="faqs"
      aria-labelledby="faq-heading"
      className="lp-section"
      style={{ background: 'var(--lp-bg)' }}
    >
      <Container>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--lp-ink-muted)',
              }}
            >
              {FAQ_STRINGS.eyebrow}
            </span>
            <h2
              id="faq-heading"
              className="lp-h-section"
              style={{ marginTop: 12, fontSize: 'clamp(34px, 4vw, 52px)' }}
            >
              {FAQ_STRINGS.headingLead}{' '}
              <span
                className="lp-serif"
                style={{ color: 'var(--lp-primary)', fontSize: '1.05em' }}
              >
                {FAQ_STRINGS.headingSerif}
              </span>
            </h2>
          </div>
          <Accordion
            items={items}
            defaultOpenId="faq-0"
            onChange={(openId) => {
              if (openId === null) return
              const i = Number.parseInt(openId.replace('faq-', ''), 10)
              if (Number.isFinite(i)) landingEvents.faqOpen(i)
            }}
          />
        </div>
      </Container>
    </section>
  )
}
