/**
 * Audit Log Tab — V2
 *
 * Action type filter + export CSV + audit entry list.
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { Select } from '@edforge/ui'
import { tenantService } from '@/services/tenant.service'

// ============================================================================
// TYPES
// ============================================================================

type ActionFilter = 'all' | 'create' | 'update' | 'delete' | 'status_change' | 'version_change'

const ACTION_ICON_COLORS: Record<string, { bg: string; emoji: string }> = {
  create: { bg: 'bg-[rgba(29,158,117,0.1)]', emoji: '✚' },
  update: { bg: 'bg-[rgba(55,138,221,0.1)]', emoji: '✎' },
  delete: { bg: 'bg-[rgba(226,75,74,0.1)]', emoji: '✕' },
  status_change: { bg: 'bg-[rgba(239,159,39,0.1)]', emoji: '↻' },
  version_change: { bg: 'bg-[rgba(127,119,221,0.1)]', emoji: '⇧' },
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface AuditLogTabProps {
  schoolId: string
}

export default function AuditLogTab({ schoolId }: AuditLogTabProps) {
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all')

  const { data: auditData, isLoading } = useQuery({
    queryKey: ['auditLog', schoolId, actionFilter],
    queryFn: () => tenantService.getAuditLog(schoolId, actionFilter !== 'all' ? { action: actionFilter } : {}),
    enabled: !!schoolId,
    staleTime: 2 * 60 * 1000,
  })

  const entries = Array.isArray(auditData) ? auditData : (auditData as any)?.items || (auditData as any)?.data || []

  const handleExportCSV = () => {
    // Generate CSV from entries
    if (entries.length === 0) return
    const headers = ['Action', 'Detail', 'Actor', 'Timestamp']
    const rows = entries.map((e: any) => [
      e.action || '',
      e.detail || e.description || '',
      e.actorName || e.actor || '',
      e.timestamp || e.createdAt || '',
    ])
    const csv = [headers.join(','), ...rows.map((r: string[]) => r.map(c => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${schoolId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h2 className="text-base font-bold text-[rgb(var(--text-primary))]">Audit Log</h2>
          <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">All configuration changes for this school</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            aria-label="Filter by action"
            size="sm"
            className="w-40"
            value={actionFilter}
            onChange={v => { if (v) setActionFilter(v as ActionFilter) }}
            options={[
              { value: 'all', label: 'All Actions' },
              { value: 'create', label: 'Create' },
              { value: 'update', label: 'Update' },
              { value: 'delete', label: 'Delete' },
              { value: 'status_change', label: 'Status Change' },
              { value: 'version_change', label: 'Version Change' },
            ]}
          />
          <button
            onClick={handleExportCSV}
            disabled={entries.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[rgba(255,255,255,0.09)] bg-[rgba(255,255,255,0.05)] text-[rgb(var(--text-tertiary))] hover:bg-[rgba(255,255,255,0.08)] disabled:opacity-40 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Audit entries */}
      <div className="bg-[rgb(var(--background-primary))] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-4 animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-[rgb(var(--background-secondary))]" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-48 bg-[rgb(var(--background-secondary))] rounded" />
                  <div className="h-2.5 w-32 bg-[rgb(var(--background-secondary))] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : entries.length > 0 ? (
          <div>
            {/* Entry count */}
            <div className="px-4 py-2 border-b border-[rgba(255,255,255,0.04)] text-xs text-[rgb(var(--text-tertiary))]">
              {entries.length} entries
            </div>
            {entries.map((entry: any, idx: number) => {
              const actionType = entry.action?.toLowerCase() || 'update'
              const iconCfg = ACTION_ICON_COLORS[actionType] || ACTION_ICON_COLORS.update
              return (
                <div key={entry.id || idx} className="flex items-start gap-3 px-4 py-3 border-b border-[rgba(255,255,255,0.04)] last:border-b-0">
                  <div className={`w-7 h-7 rounded-lg ${iconCfg.bg} flex items-center justify-center text-xs flex-shrink-0`}>
                    {iconCfg.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-[rgb(var(--text-primary))]">
                      {entry.action || 'Update'} — {entry.detail || entry.description || entry.message || 'Configuration changed'}
                    </div>
                    {entry.changes && (
                      <div className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
                        {typeof entry.changes === 'string' ? entry.changes : JSON.stringify(entry.changes).slice(0, 100)}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-end">
                    <div className="text-xs text-[rgb(var(--text-tertiary))]">{entry.actorName || entry.actor || 'System'}</div>
                    <div className="text-xs text-[rgb(var(--text-tertiary))]">
                      {entry.timestamp || entry.createdAt
                        ? new Date(entry.timestamp || entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                        : ''}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-10 text-center">
            <div className="text-3xl opacity-40 mb-3">🛡️</div>
            <h3 className="text-sm font-semibold text-[rgb(var(--text-secondary))] mb-1.5">No audit entries yet</h3>
            <p className="text-xs text-[rgb(var(--text-tertiary))] max-w-72 mx-auto leading-relaxed">
              Changes to this school's configuration will appear here with actor, timestamp, and before/after values.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
