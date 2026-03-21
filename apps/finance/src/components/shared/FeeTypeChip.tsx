/**
 * FeeTypeChip — Colored chip for fee type display in Fee Structures.
 */

export interface FeeTypeChipProps {
  type: string
}

const FEE_TYPE_COLORS: Record<string, string> = {
  admission: '#378ADD',
  lab: '#7F77DD',
  transport: '#EF9F27',
  tuition: '#1D9E75',
  exam: '#D85A30',
}

const FEE_TYPE_LABELS: Record<string, string> = {
  admission: 'Admission',
  lab: 'Lab',
  transport: 'Transport',
  tuition: 'Tuition',
  exam: 'Exam',
  library: 'Library',
  hostel: 'Hostel',
  uniform: 'Uniform',
  miscellaneous: 'Misc.',
  custom: 'Custom',
}

export function FeeTypeChip({ type }: FeeTypeChipProps) {
  const normalized = type.toLowerCase()
  const color = FEE_TYPE_COLORS[normalized] ?? 'var(--v2-text-hint, #4a5068)'
  const label = FEE_TYPE_LABELS[normalized] ?? type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: '10px',
        fontWeight: 500,
        padding: '2px 8px',
        borderRadius: 5,
        background: `${color}18`,
        color,
        border: `1px solid ${color}28`,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}
