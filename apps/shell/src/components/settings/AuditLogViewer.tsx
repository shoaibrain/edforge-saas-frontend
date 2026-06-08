/**
 * AuditLogViewer
 *
 * Displays the audit trail for a school as a timeline with field diffs.
 * Queries GET /schools/:schoolId/audit-log
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Clock, Shield, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { tenantService } from '@/services/tenant.service'
import type { AuditLogEntry } from '@/services/tenant.service'

interface AuditLogViewerProps {
  schoolId: string
}

const ACTION_LABELS: Record<string, string> = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  status_change: 'Status Changed',
  version_change: 'Version Changed',
}

const ACTION_COLORS: Record<string, string> = {
  create: 'text-[rgb(var(--state-success-fg))] bg-[rgb(var(--state-success-bg)/0.18)]  ',
  update: 'text-[rgb(var(--state-info-fg))] bg-[rgb(var(--state-info-bg)/0.18)] dark:text-[rgb(var(--state-info-fg))] ',
  delete: 'text-[rgb(var(--state-danger-fg))] bg-[rgb(var(--state-danger-bg)/0.18)] dark:text-[rgb(var(--state-danger-fg))] ',
  status_change: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20',
  version_change: 'text-[rgb(var(--state-info-fg))] bg-[rgb(var(--state-info-bg)/0.18)]  ',
}

export function AuditLogViewer({ schoolId }: AuditLogViewerProps) {
  const [actionFilter, setActionFilter] = useState<string>('')
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())

  const { data, isLoading } = useQuery({
    queryKey: ['auditLog', schoolId, actionFilter],
    queryFn: () => tenantService.getAuditLog(schoolId, {
      limit: 50,
      action: actionFilter || undefined,
    }),
    enabled: !!schoolId,
    staleTime: 30 * 1000,
  })

  const toggleEntry = (id: string) => {
    setExpandedEntries(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[rgb(var(--border-focus))] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const entries = data?.items || []

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.40)]"
        >
          <option value="">All Actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="status_change">Status Change</option>
          <option value="version_change">Version Change</option>
        </select>
        <span className="text-xs text-[rgb(var(--text-tertiary))]">
          {entries.length} entries
        </span>
      </div>

      {/* Timeline */}
      {entries.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="w-10 h-10 text-[rgb(var(--text-tertiary))] mx-auto mb-2" />
          <p className="text-sm text-[rgb(var(--text-tertiary))]">No audit log entries found</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-[rgb(var(--border-primary))]" />

          <div className="space-y-3">
            {entries.map((entry) => (
              <AuditEntry
                key={entry.auditId}
                entry={entry}
                isExpanded={expandedEntries.has(entry.auditId)}
                onToggle={() => toggleEntry(entry.auditId)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AuditEntry({
  entry,
  isExpanded,
  onToggle,
}: {
  entry: AuditLogEntry
  isExpanded: boolean
  onToggle: () => void
}) {
  const actionColor = ACTION_COLORS[entry.action] || ACTION_COLORS.update
  const hasChanges = entry.changes && entry.changes.length > 0
  const ChevronIcon = isExpanded ? ChevronUp : ChevronDown

  return (
    <div className="relative pl-12">
      {/* Timeline dot */}
      <div className={`absolute left-3.5 top-3 w-3 h-3 rounded-full border-2 border-[rgb(var(--surface-primary))] ${
        entry.severity === 'high' ? 'bg-amber-500' : 'bg-[rgb(var(--action-primary-bg))]'
      }`} />

      <div
        className="p-3 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] cursor-pointer hover:bg-[rgb(var(--surface-tertiary))] transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${actionColor}`}>
                {ACTION_LABELS[entry.action] || entry.action}
              </span>
              <span className="text-xs font-medium text-[rgb(var(--text-primary))]">
                {entry.targetEntity}
              </span>
              {entry.severity === 'high' && (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-[rgb(var(--text-tertiary))]">
              <Clock className="w-3 h-3" />
              <span>{new Date(entry.changedAt).toLocaleString()}</span>
              {entry.changedByName && (
                <>
                  <span>by</span>
                  <span className="font-medium text-[rgb(var(--text-secondary))]">{entry.changedByName}</span>
                </>
              )}
            </div>
            {entry.reason && (
              <p className="mt-1 text-xs text-[rgb(var(--text-secondary))] italic">{entry.reason}</p>
            )}
          </div>
          {hasChanges && (
            <ChevronIcon className="w-4 h-4 text-[rgb(var(--text-tertiary))] flex-shrink-0 mt-1" />
          )}
        </div>

        {/* Expanded field changes */}
        {isExpanded && hasChanges && (
          <div className="mt-3 pt-3 border-t border-[rgb(var(--border-primary))]">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[rgb(var(--text-tertiary))]">
                  <th className="text-left py-1 pr-4 font-medium">Field</th>
                  <th className="text-left py-1 pr-4 font-medium">Old Value</th>
                  <th className="text-left py-1 font-medium">New Value</th>
                </tr>
              </thead>
              <tbody>
                {entry.changes.map((change, i) => (
                  <tr key={i} className="border-t border-[rgb(var(--border-primary))]">
                    <td className="py-1.5 pr-4 font-medium text-[rgb(var(--text-secondary))]">
                      {change.field}
                    </td>
                    <td className="py-1.5 pr-4 text-[rgb(var(--state-danger-fg))] line-through">
                      {formatValue(change.oldValue)}
                    </td>
                    <td className="py-1.5 text-[rgb(var(--state-success-fg))]">
                      {formatValue(change.newValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
