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
    <div style={{ padding: '48px 32px 96px', background: 'var(--lp-bg-warm)' }}>
      <Container>
        <h1
          style={{
            fontSize: 40,
            letterSpacing: '-0.03em',
            color: 'var(--lp-ink)',
            margin: '0 0 8px',
          }}
        >
          Copy <span className="lp-serif" style={{ color: 'var(--lp-primary)' }}>catalog</span>
        </h1>
        <p style={{ color: 'var(--lp-ink-3)', marginBottom: 32 }}>
          Every string sourced from{' '}
          <code className="lp-mono">apps/shell/src/components/landing-v2/landing.strings.ts</code>.
        </p>

        {entries.map(([key, value]) => (
          <section
            key={key}
            style={{
              padding: 20,
              background: 'var(--lp-bg-elevated)',
              border: '1px solid var(--lp-border)',
              borderRadius: 'var(--lp-radius)',
              marginBottom: 16,
            }}
          >
            <div
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
              className="lp-mono"
              style={{
                whiteSpace: 'pre-wrap',
                fontSize: 12,
                color: 'var(--lp-ink-2)',
                margin: 0,
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
