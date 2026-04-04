/**
 * ExportCsvButton — CSV export button for filter strips.
 */

import { Download, Loader2 } from 'lucide-react'

export interface ExportCsvButtonProps {
  onClick: () => void
  isExporting: boolean
}

export function ExportCsvButton({ onClick, isExporting }: ExportCsvButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isExporting}
      className="inline-flex items-center gap-1.5 transition-colors hover:opacity-80 disabled:opacity-50"
      style={{
        fontSize: '11px',
        fontWeight: 500,
        padding: '4px 10px',
        borderRadius: 6,
        border: '1px solid var(--v2-border-default, rgba(255,255,255,0.06))',
        color: 'var(--v2-text-secondary, #c8ccd8)',
        background: 'transparent',
        cursor: isExporting ? 'not-allowed' : 'pointer',
      }}
    >
      {isExporting ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Download className="w-3 h-3" />
      )}
      Export CSV
    </button>
  )
}
