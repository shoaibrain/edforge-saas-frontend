import { Rows3, AlignJustify } from 'lucide-react'
import { cn, focusRingInset } from '../../utils'
import { DEFAULT_DATA_TABLE_LABELS } from './labels'
import type { DataTableDensity, DataTableLabels } from './types'

interface DataTableDensityToggleProps {
  density: DataTableDensity
  onChange: (next: DataTableDensity) => void
  labels?: DataTableLabels
}

/**
 * Two-segment density toggle that mirrors the prototype's right-cluster
 * control. The toggle is purely cosmetic — the actual row/header sizing is
 * driven by the `data-density` attribute on the table container so consumers
 * can swap density without re-mounting rows.
 */
export function DataTableDensityToggle({
  density,
  onChange,
  labels,
}: DataTableDensityToggleProps) {
  const resolvedLabels = labels ?? DEFAULT_DATA_TABLE_LABELS
  return (
    <div
      role="group"
      aria-label={resolvedLabels.rowDensity}
      className="inline-flex items-center rounded-lg border border-[rgb(var(--border-primary)/0.35)] overflow-hidden"
    >
      <DensityButton
        active={density === 'comfortable'}
        onClick={() => onChange('comfortable')}
        label={resolvedLabels.comfortableDensity}
        title={resolvedLabels.comfortableDensityTitle}
      >
        <Rows3 className="w-3.5 h-3.5" />
      </DensityButton>
      <DensityButton
        active={density === 'compact'}
        onClick={() => onChange('compact')}
        label={resolvedLabels.compactDensity}
        title={resolvedLabels.compactDensityTitle}
      >
        <AlignJustify className="w-3.5 h-3.5" />
      </DensityButton>
    </div>
  )
}

function DensityButton({
  active,
  onClick,
  label,
  title,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center justify-center w-9 h-9 transition-colors',
        focusRingInset,
        active
          ? 'bg-[var(--mint-soft)] text-[rgb(var(--text-primary))]'
          : 'bg-transparent text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-secondary))]'
      )}
    >
      {children}
    </button>
  )
}
