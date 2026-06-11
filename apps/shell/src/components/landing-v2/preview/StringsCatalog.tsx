import * as STR from '../landing.strings'
import { Container } from '../components/layout/Container'

/**
 * Developer-facing catalog of every exported copy block from
 * landing.strings.ts. Renders on /_landing-preview so reviewers can scan
 * copy in one pane without opening files.
 */
export function StringsCatalog() {
  const entries = Object.entries(STR)
  return (
    <div className="pt-[48px] pl-[32px] pr-[32px] pb-[96px] bg-[var(--lp-bg-warm)]">
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
          Copy <span className="lp-serif text-[var(--lp-primary)]">catalog</span>
        </h1>
        <p className="text-[var(--lp-ink-3)] mb-8">
          Every string sourced from{' '}
          <code className="lp-mono">apps/shell/src/components/landing-v2/landing.strings.ts</code>.
        </p>

        {entries.map(([key, value]) => (
          <section
            key={key}
            className="p-5 bg-[var(--lp-bg-elevated)] mb-4"
            style={{
              border: '1px solid var(--lp-border)',
              borderRadius: 'var(--lp-radius)',
            }}
          >
            <div
              // allow-presentation-style: editorial 11px uppercase key label
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--lp-ink-muted)',
                marginBottom: 8,
              }}
            >
              {key}
            </div>
            <pre
              className="lp-mono text-xs text-[var(--lp-ink-2)] m-0"
              style={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.55,
              }}
            >
              {JSON.stringify(value, null, 2)}
            </pre>
          </section>
        ))}
      </Container>
    </div>
  )
}
