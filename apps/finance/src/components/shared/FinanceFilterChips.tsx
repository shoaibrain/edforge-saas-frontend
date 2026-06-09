/**
 * FinanceFilterChips — Inline chip-style filter pills for finance pages.
 */

export interface FinanceFilterChipsProps {
  options: Array<{ label: string; value: string }>
  value: string
  onChange: (value: string) => void
  accentColor: string
}

export function FinanceFilterChips({
  options,
  value,
  onChange,
  accentColor,
}: FinanceFilterChipsProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className="transition-colors"
            style={{
              fontSize: '11px',
              fontWeight: 500,
              padding: '4px 12px',
              borderRadius: 6,
              border: '1px solid',
              background: isActive ? `${accentColor}18` : 'transparent',
              borderColor: isActive ? `${accentColor}30` : 'rgb(var(--border-primary) / 0.35)',
              color: isActive ? accentColor : 'rgb(var(--text-secondary))',
              cursor: 'pointer',
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
