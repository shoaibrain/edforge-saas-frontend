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
      className="bg-[var(--lp-bg)] pt-[56px] pb-[32px]"
      style={{
        borderTop: '1px solid var(--lp-border)',
      }}
    >
      <Container>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1fr',
          }}
          className="lp-footer-grid gap-8 mb-10"
        >
          <div>
            <EdforgeLogo />
            <div
              // allow-presentation-style: editorial 13px tagline copy
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
            <div className="text-xs text-[var(--lp-ink-hint)] mt-2.5">
              {FOOTER.legalEntity}
            </div>
          </div>
          {FOOTER.columns.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <div
                className="text-xs text-[var(--lp-ink-muted)] mb-3.5"
                style={{
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                {col.heading}
              </div>
              <ul className="m-0 p-0" style={{ listStyle: 'none' }}>
                {col.items.map((item) => (
                  <li
                    key={item.label}
                    // allow-presentation-style: editorial 13.5px link copy
                    style={{
                      fontSize: 13.5,
                      color: 'var(--lp-ink-3)',
                      marginBottom: 8,
                    }}
                  >
                    <a
                      href={item.href}
                      className="text-inherit"
                      style={{
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
          // allow-presentation-style: editorial 12.5px legal row
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
          <nav aria-label="Legal" className="gap-5" style={{ display: 'flex' }}>
            {FOOTER.legalLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-inherit"
                style={{ textDecoration: 'none' }}
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
