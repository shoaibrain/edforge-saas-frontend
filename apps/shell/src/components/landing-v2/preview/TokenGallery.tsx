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
    <div style={{ padding: '48px 32px', fontFamily: 'Inter, sans-serif' }}>
      <h1
        style={{
          fontSize: 48,
          letterSpacing: '-0.035em',
          marginBottom: 8,
          color: 'var(--lp-ink)',
        }}
      >
        Landing V2 <span className="lp-serif" style={{ color: 'var(--lp-primary)' }}>token gallery</span>
      </h1>
      <p style={{ color: 'var(--lp-ink-3)', marginBottom: 40 }}>
        Every design token from <code className="lp-mono">packages/theme/src/landing-tokens.css</code>, rendered against the live surface.
      </p>

      {/* Palette */}
      {GROUPS.map((group) => (
        <section key={group} style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12, color: 'var(--lp-ink)' }}>{group}</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            {PALETTE.filter((p) => p.group === group).map((p) => (
              <div
                key={p.cssVar}
                style={{
                  border: '1px solid var(--lp-border)',
                  borderRadius: 'var(--lp-radius)',
                  overflow: 'hidden',
                  background: 'var(--lp-bg-elevated)',
                }}
              >
                <div
                  style={{
                    height: 72,
                    background: `var(${p.cssVar})`,
                    borderBottom: '1px solid var(--lp-border)',
                  }}
                />
                <div style={{ padding: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--lp-ink)' }}>{p.name}</div>
                  <code
                    className="lp-mono"
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
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12, color: 'var(--lp-ink)' }}>Typography</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <span style={{ fontSize: 11, color: 'var(--lp-ink-muted)' }}>Display · Inter 700 + Instrument Serif italic</span>
            <div style={{ fontSize: 64, lineHeight: 1.02, letterSpacing: '-0.035em', color: 'var(--lp-ink)' }}>
              One platform to power <span className="lp-serif" style={{ color: 'var(--lp-primary)' }}>every school</span>.
            </div>
          </div>
          <div>
            <span style={{ fontSize: 11, color: 'var(--lp-ink-muted)' }}>Section · Inter 700</span>
            <div style={{ fontSize: 48, lineHeight: 1.05, letterSpacing: '-0.03em', color: 'var(--lp-ink)' }}>
              Section heading
            </div>
          </div>
          <div>
            <span style={{ fontSize: 11, color: 'var(--lp-ink-muted)' }}>Lede · Inter 400</span>
            <div style={{ fontSize: 18, lineHeight: 1.55, color: 'var(--lp-ink-3)', maxWidth: 640 }}>
              The quick brown fox jumps over the lazy dog. Unify student data, school operations, and district analytics.
            </div>
          </div>
          <div>
            <span style={{ fontSize: 11, color: 'var(--lp-ink-muted)' }}>Mono · JetBrains Mono</span>
            <div className="lp-mono" style={{ fontSize: 14, color: 'var(--lp-ink-2)' }}>
              app.edforge.com/district
            </div>
          </div>
          <div>
            <span
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
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12, color: 'var(--lp-ink)' }}>Radii</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {RADII.map((r) => (
            <div
              key={r.name}
              style={{
                width: 96,
                height: 96,
                background: 'var(--lp-primary-soft)',
                border: '1px solid var(--lp-border)',
                borderRadius: `var(${r.cssVar})`,
                display: 'grid',
                placeItems: 'center',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--lp-primary-ink)',
              }}
            >
              {r.name}
            </div>
          ))}
        </div>
      </section>

      {/* Shadows */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12, color: 'var(--lp-ink)' }}>Shadows</h2>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {SHADOWS.map((s) => (
            <div
              key={s.name}
              style={{
                width: 160,
                height: 96,
                background: 'var(--lp-bg-elevated)',
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
