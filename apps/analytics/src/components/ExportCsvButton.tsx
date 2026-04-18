/**
 * ExportCsvButton — generates a presigned CSV URL and opens it.
 *
 * Calls GET /analytics/tenants/{id}/export-csv-url which returns
 *   { url, expiresIn }
 * The URL is short-lived (~10 min); we open it immediately so the
 * browser begins the download. We never cache the URL.
 */

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Granularity } from '@edforge/types/analytics'
import { useExportCsvUrl } from '../hooks/useAnalytics'

export interface ExportCsvButtonProps {
  tenantId: string
  from: string
  to: string
  granularity: Granularity
  disabled?: boolean
}

export function ExportCsvButton({
  tenantId,
  from,
  to,
  granularity,
  disabled,
}: ExportCsvButtonProps) {
  const [isOpening, setIsOpening] = useState(false)
  const mutation = useExportCsvUrl()

  const handleClick = async () => {
    if (disabled || mutation.isPending || isOpening) return
    try {
      setIsOpening(true)
      const result = await mutation.mutateAsync({ tenantId, from, to, granularity })
      // Open in same tab works for download responses; the presigned URL has
      // Content-Disposition: attachment server-side. Fallback to new tab if
      // window.location is blocked (rare in same-origin contexts).
      window.open(result.url, '_blank', 'noopener,noreferrer')
      toast.success('CSV ready', { description: `Link valid for ${Math.round(result.expiresIn / 60)} minutes.` })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed'
      toast.error('Export failed', { description: message })
    } finally {
      setIsOpening(false)
    }
  }

  const isBusy = mutation.isPending || isOpening

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isBusy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md ring-1 ring-gray-200 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isBusy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      Export CSV
    </button>
  )
}
