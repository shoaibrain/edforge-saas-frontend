/**
 * TokenGallery — developer-facing preview of every landing-v2 design token.
 * Reached at /_landing-preview during build-out.
 */

const PALETTE: Array<{ name: string; cssVar: string; group: string }> = [
  { group: 'Surface', name: 'Background', cssVar: '--lp-bg' },
  { group: 'Surface', name: 'Background warm', cssVar: '--lp-bg-warm' },
  { group: 'Surface', name: 'Elevated', cssVar: '--lp-bg-elevated' },
  { group: 'Ink', name: 'Ink', cssVar: '--lp-ink' },
  { group: 'Ink', name: 'Ink 2', cssVar: '--lp-ink-2' },
  { group: 'Ink', name: 'Ink 3', cssVar: '--lp-ink-3' },
  { group: 'Ink', name: 'Ink muted', cssVar: '--lp-ink-muted' },
  { group: 'Ink', name: 'Ink hint', cssVar: '--lp-ink-hint' },
  { group: 'Border', name: 'Border', cssVar: '--lp-border' },
  { group: 'Border', name: 'Border strong', cssVar: '--lp-border-strong' },
  { group: 'Primary', name: 'Primary', cssVar: '--lp-primary' },
  { group: 'Primary', name: 'Primary hover', cssVar: '--lp-primary-hover' },
  { group: 'Primary', name: 'Primary ink', cssVar: '--lp-primary-ink' },
  { group: 'Primary', name: 'Primary soft', cssVar: '--lp-primary-soft' },
  { group: 'Teal', name: 'Teal', cssVar: '--lp-teal' },
  { group: 'Teal', name: 'Teal ink', cssVar: '--lp-teal-ink' },
  { group: 'Teal', name: 'Teal soft', cssVar: '--lp-teal-soft' },
  { group: 'Green', name: 'Green', cssVar: '--lp-green' },
  { group: 'Green', name: 'Green ink', cssVar: '--lp-green-ink' },
  { group: 'Green', name: 'Green soft', cssVar: '--lp-green-soft' },
  { group: 'Blue', name: 'Blue', cssVar: '--lp-blue' },
  { group: 'Blue', name: 'Blue ink', cssVar: '--lp-blue-ink' },
  { group: 'Blue', name: 'Blue soft', cssVar: '--lp-blue-soft' },
  { group: 'Violet', name: 'Violet', cssVar: '--lp-violet' },
  { group: 'Violet', name: 'Violet soft', cssVar: '--lp-violet-soft' },
  { group: 'State', name: 'Danger', cssVar: '--lp-danger' },
]

const GROUPS = Array.from(new Set(PALETTE.map((p) => p.group)))

const RADII = [
  { name: 'sm', cssVar: '--lp-radius-sm' },
  { name: 'default', cssVar: '--lp-radius' },
  { name: 'lg', cssVar: '--lp-radius-lg' },
  { name: 'xl', cssVar: '--lp-radius-xl' },
  { name: 'pill', cssVar: '--lp-radius-pill' },
]

const SHADOWS = [
  { name: 'sm', cssVar: '--lp-shadow-sm' },
  { name: 'md', cssVar: '--lp-shadow-md' },
  { name: 'lg', cssVar: '--lp-shadow-lg' },
]

export function TokenGallery() {
  return (
    <div className="pt-[48px] pb-[48px] pl-[32px] pr-[32px]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <h1
        // allow-presentation-style: editorial 48px display heading
        style={{
          fontSize: 48,
          letterSpacing: '-0.035em',
          marginBottom: 8,
          color: 'var(--lp-ink)',
        }}
      >
        Landing V2 <span className="lp-serif text-[var(--lp-primary)]">token gallery</span>
      </h1>
      <p className="text-[var(--lp-ink-3)] mb-10">
        Every design token from <code className="lp-mono">packages/theme/src/landing-tokens.css</code>, rendered against the live surface.
      </p>

      {/* Palette */}
      {GROUPS.map((group) => (
        <section key={group} className="mb-8">
          <h2 className="text-lg mb-3 text-[var(--lp-ink)]">{group}</h2>
          <div
            className="gap-3"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            }}
          >
            {PALETTE.filter((p) => p.group === group).map((p) => (
              <div
                key={p.cssVar}
                className="bg-[var(--lp-bg-elevated)]"
                style={{
                  border: '1px solid var(--lp-border)',
                  borderRadius: 'var(--lp-radius)',
                  overflow: 'hidden',
                }}
              >
                <div
                  // allow-presentation-style: dynamic token-value swatch fill
                  style={{
                    height: 72,
                    background: `var(${p.cssVar})`,
                    borderBottom: '1px solid var(--lp-border)',
                  }}
                />
                <div className="p-2.5">
                  <div
                    // allow-presentation-style: editorial 13px token label
                    style={{ fontSize: 13, fontWeight: 600, color: 'var(--lp-ink)' }}
                  >
                    {p.name}
                  </div>
                  <code
                    className="lp-mono"
                    // allow-presentation-style: editorial 11px mono token name
                    style={{ fontSize: 11, color: 'var(--lp-ink-muted)' }}
                  >
                    {p.cssVar}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Typography */}
      <section className="mb-8">
        <h2 className="text-lg mb-3 text-[var(--lp-ink)]">Typography</h2>
        <div className="gap-4" style={{ display: 'flex', flexDirection: 'column' }}>
          <div>
            <span
              // allow-presentation-style: editorial 11px caption label
              style={{ fontSize: 11, color: 'var(--lp-ink-muted)' }}
            >
              Display · Inter 700 + Instrument Serif italic
            </span>
            <div
              // allow-presentation-style: editorial 64px display specimen
              style={{ fontSize: 64, lineHeight: 1.02, letterSpacing: '-0.035em', color: 'var(--lp-ink)' }}
            >
              One platform to power <span className="lp-serif text-[var(--lp-primary)]">every school</span>.
            </div>
          </div>
          <div>
            <span
              // allow-presentation-style: editorial 11px caption label
              style={{ fontSize: 11, color: 'var(--lp-ink-muted)' }}
            >
              Section · Inter 700
            </span>
            <div
              // allow-presentation-style: editorial 48px section specimen
              style={{ fontSize: 48, lineHeight: 1.05, letterSpacing: '-0.03em', color: 'var(--lp-ink)' }}
            >
              Section heading
            </div>
          </div>
          <div>
            <span
              // allow-presentation-style: editorial 11px caption label
              style={{ fontSize: 11, color: 'var(--lp-ink-muted)' }}
            >
              Lede · Inter 400
            </span>
            <div className="text-lg text-[var(--lp-ink-3)]" style={{ lineHeight: 1.55, maxWidth: 640 }}>
              The quick brown fox jumps over the lazy dog. Unify student data, school operations, and district analytics.
            </div>
          </div>
          <div>
            <span
              // allow-presentation-style: editorial 11px caption label
              style={{ fontSize: 11, color: 'var(--lp-ink-muted)' }}
            >
              Mono · JetBrains Mono
            </span>
            <div className="lp-mono text-sm text-[var(--lp-ink-2)]">
              app.edforge.com/district
            </div>
          </div>
          <div>
            <span
              // allow-presentation-style: editorial 11px uppercase eyebrow
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--lp-ink-muted)',
              }}
            >
              Eyebrow · uppercase tracked
            </span>
          </div>
        </div>
      </section>

      {/* Radii */}
      <section className="mb-8">
        <h2 className="text-lg mb-3 text-[var(--lp-ink)]">Radii</h2>
        <div className="gap-3" style={{ display: 'flex', flexWrap: 'wrap' }}>
          {RADII.map((r) => (
            <div
              key={r.name}
              className="bg-[var(--lp-primary-soft)] text-xs text-[var(--lp-primary-ink)]"
              style={{
                width: 96,
                height: 96,
                border: '1px solid var(--lp-border)',
                borderRadius: `var(${r.cssVar})`,
                display: 'grid',
                placeItems: 'center',
                fontWeight: 600,
              }}
            >
              {r.name}
            </div>
          ))}
        </div>
      </section>

      {/* Shadows */}
      <section className="mb-8">
        <h2 className="text-lg mb-3 text-[var(--lp-ink)]">Shadows</h2>
        <div className="gap-6" style={{ display: 'flex', flexWrap: 'wrap' }}>
          {SHADOWS.map((s) => (
            <div
              key={s.name}
              className="bg-[var(--lp-bg-elevated)]"
              // allow-presentation-style: dynamic token-value box-shadow swatch + editorial 13px label
              style={{
                width: 160,
                height: 96,
                border: '1px solid var(--lp-border)',
                borderRadius: 'var(--lp-radius-lg)',
                boxShadow: `var(${s.cssVar})`,
                display: 'grid',
                placeItems: 'center',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--lp-ink)',
              }}
            >
              shadow-{s.name}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
