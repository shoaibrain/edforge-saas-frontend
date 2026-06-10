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
      className="inline-flex items-center gap-1.5 transition-colors hover:opacity-80 disabled:opacity-50 text-2xs font-medium px-2.5 py-1 rounded-md border border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-secondary))] bg-transparent"
      style={{ cursor: isExporting ? 'not-allowed' : 'pointer' }}
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
