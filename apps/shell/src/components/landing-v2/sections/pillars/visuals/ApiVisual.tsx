type VisualProps = { accent: string; ink: string }

/**
 * ApiVisual — dark terminal window showing a sample POST /v1/students payload.
 */
export function ApiVisual(_props: VisualProps) {
  return (
    <div
      // allow-presentation-style: decorative dark terminal chrome + editorial 11px mono
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
      <div className="text-[#7BE0B7]">POST</div>
      <div className="text-[#fff]" style={{ opacity: 0.8 }}>/v1/students</div>
      <div className="text-[#F47E3E] mt-1.5">{'{'}</div>
      <div className="text-[#fff] pl-2.5" style={{ opacity: 0.7 }}>
        "grade": <span className="text-[#FFD78A]">"3"</span>,
      </div>
      <div className="text-[#fff] pl-2.5" style={{ opacity: 0.7 }}>
        "active": <span className="text-[#9AE6B4]">true</span>
      </div>
      <div className="text-[#F47E3E]">{'}'}</div>
    </div>
  )
}
