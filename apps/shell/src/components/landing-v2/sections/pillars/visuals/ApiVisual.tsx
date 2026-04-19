type VisualProps = { accent: string; ink: string }

/**
 * ApiVisual — dark terminal window showing a sample POST /v1/students payload.
 */
export function ApiVisual(_props: VisualProps) {
  return (
    <div
      style={{
        background: '#1A1A1A',
        borderRadius: 12,
        padding: 14,
        boxShadow: '0 8px 24px -8px rgba(29,53,87,0.25)',
        fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 11,
        lineHeight: 1.5,
      }}
    >
      <div style={{ color: '#7BE0B7' }}>POST</div>
      <div style={{ color: '#fff', opacity: 0.8 }}>/v1/students</div>
      <div style={{ color: '#F47E3E', marginTop: 6 }}>{'{'}</div>
      <div style={{ color: '#fff', opacity: 0.7, paddingLeft: 10 }}>
        "grade": <span style={{ color: '#FFD78A' }}>"3"</span>,
      </div>
      <div style={{ color: '#fff', opacity: 0.7, paddingLeft: 10 }}>
        "active": <span style={{ color: '#9AE6B4' }}>true</span>
      </div>
      <div style={{ color: '#F47E3E' }}>{'}'}</div>
    </div>
  )
}
