import { Container } from '../../components/layout/Container'
import { EdforgeLogo } from '../../components/Brand'
import { FOOTER } from '../../landing.strings'

/**
 * Footer — 5-col grid (brand + 4 link columns) with a legal row underneath.
 * Link targets come from landing.strings.ts per ADR 001 §3 (existing public
 * routes + a new /legal/accessibility stub).
 */
export function Footer() {
  return (
    <footer
      role="contentinfo"
      style={{
        background: 'var(--lp-bg)',
        borderTop: '1px solid var(--lp-border)',
        padding: '56px 0 32px',
      }}
    >
      <Container>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1fr',
            gap: 32,
            marginBottom: 40,
          }}
          className="lp-footer-grid"
        >
          <div>
            <EdforgeLogo />
            <div
              style={{
                fontSize: 13,
                color: 'var(--lp-ink-muted)',
                marginTop: 14,
                maxWidth: 260,
                lineHeight: 1.5,
              }}
            >
              {FOOTER.tagline}
            </div>
            <div style={{ fontSize: 12, color: 'var(--lp-ink-hint)', marginTop: 10 }}>
              {FOOTER.legalEntity}
            </div>
          </div>
          {FOOTER.columns.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--lp-ink-muted)',
                  marginBottom: 14,
                }}
              >
                {col.heading}
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {col.items.map((item) => (
                  <li
                    key={item.label}
                    style={{
                      fontSize: 13.5,
                      color: 'var(--lp-ink-3)',
                      marginBottom: 8,
                    }}
                  >
                    <a
                      href={item.href}
                      style={{
                        color: 'inherit',
                        textDecoration: 'none',
                        display: 'inline-block',
                      }}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 24,
            borderTop: '1px solid var(--lp-border)',
            fontSize: 12.5,
            color: 'var(--lp-ink-muted)',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>{FOOTER.copyright}</div>
          <nav aria-label="Legal" style={{ display: 'flex', gap: 20 }}>
            {FOOTER.legalLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                style={{ color: 'inherit', textDecoration: 'none' }}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </Container>
    </footer>
  )
}
