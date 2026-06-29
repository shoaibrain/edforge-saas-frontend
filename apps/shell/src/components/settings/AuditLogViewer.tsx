/**
 * AuditLogViewer
 *
 * Displays the audit trail for a school as a sortable, filterable,
 * exportable table backed by the shared `TanstackDataTable`. Per-row
 * expansion reveals the field-by-field diff. Read-only — no row
 * selection or bulk actions.
 *
 * Queries GET /schools/:schoolId/audit-log via tenantService.
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Shield } from 'lucide-react'
import {
  TanstackDataTable,
  type ColumnDef,
  type FacetedFilterConfig,
} from '@edforge/ui'
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

const ACTION_TONE: Record<string, string> = {
  create: 'text-[rgb(var(--state-success-fg))] bg-[rgb(var(--state-success-bg)/0.18)]',
  update: 'text-[rgb(var(--state-info-fg))] bg-[rgb(var(--state-info-bg)/0.18)]',
  delete: 'text-[rgb(var(--state-danger-fg))] bg-[rgb(var(--state-danger-bg)/0.18)]',
  status_change: 'text-[rgb(var(--state-warning-fg))] bg-[rgb(var(--state-warning-bg)/0.18)]',
  version_change: 'text-[rgb(var(--state-info-fg))] bg-[rgb(var(--state-info-bg)/0.18)]',
}

export function AuditLogViewer({ schoolId }: AuditLogViewerProps) {
  // Server filter on action removed — the table's built-in faceted
  // filter handles the same job client-side over the loaded window
  // (limit 50), which matches the prior server-side selectivity and
  // avoids a round-trip per filter toggle.
  const { data, isLoading } = useQuery({
    queryKey: ['auditLog', schoolId],
    queryFn: () => tenantService.getAuditLog(schoolId, { limit: 50 }),
    enabled: !!schoolId,
    staleTime: 30 * 1000,
  })

  const entries: AuditLogEntry[] = data?.items ?? []

  const actionOptions = useMemo(() => {
    const seen = new Set<string>()
    for (const e of entries) seen.add(e.action)
    return Array.from(seen)
      .sort()
      .map((a) => ({ value: a, label: ACTION_LABELS[a] ?? a }))
  }, [entries])

  const entityOptions = useMemo(() => {
    const seen = new Set<string>()
    for (const e of entries) seen.add(e.targetEntity)
    return Array.from(seen)
      .sort()
      .map((t) => ({ value: t, label: t }))
  }, [entries])

  const facets = useMemo<FacetedFilterConfig[]>(
    () => [
      ...(actionOptions.length > 0
        ? [{ columnId: 'action', title: 'Action', options: actionOptions }]
        : []),
      ...(entityOptions.length > 0
        ? [{ columnId: 'targetEntity', title: 'Entity', options: entityOptions }]
        : []),
    ],
    [actionOptions, entityOptions],
  )

  const columns: ColumnDef<AuditLogEntry, unknown>[] = useMemo(
    () => [
      {
        id: 'changedAt',
        accessorKey: 'changedAt',
        header: 'When',
        cell: ({ row }) => (
          <span className="text-xs text-[rgb(var(--text-secondary))] tabular-nums">
            {new Date(row.original.changedAt).toLocaleString()}
          </span>
        ),
        sortingFn: (a, b) =>
          new Date(a.original.changedAt).getTime() - new Date(b.original.changedAt).getTime(),
      },
      {
        id: 'action',
        accessorKey: 'action',
        header: 'Action',
        cell: ({ row }) => {
          const a = row.original.action
          const tone = ACTION_TONE[a] ?? ACTION_TONE.update
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tone}`}
            >
              {ACTION_LABELS[a] ?? a}
            </span>
          )
        },
        filterFn: (row, _id, value) => {
          if (!Array.isArray(value) || value.length === 0) return true
          return value.includes(row.original.action)
        },
      },
      {
        id: 'targetEntity',
        accessorKey: 'targetEntity',
        header: 'Entity',
        cell: ({ row }) => (
          <span className="text-xs font-medium text-[rgb(var(--text-primary))]">
            {row.original.targetEntity}
          </span>
        ),
        filterFn: (row, _id, value) => {
          if (!Array.isArray(value) || value.length === 0) return true
          return value.includes(row.original.targetEntity)
        },
      },
      {
        id: 'targetEntityId',
        accessorKey: 'targetEntityId',
        header: 'Entity ID',
        cell: ({ row }) => (
          <span className="text-xs font-mono text-[rgb(var(--text-tertiary))] truncate inline-block max-w-[14ch]">
            {row.original.targetEntityId}
          </span>
        ),
      },
      {
        id: 'changedByName',
        accessorFn: (e) => e.changedByName ?? e.changedBy,
        header: 'By',
        cell: ({ row }) => (
          <span className="text-xs text-[rgb(var(--text-secondary))]">
            {row.original.changedByName ?? row.original.changedBy}
          </span>
        ),
      },
      {
        id: 'changeCount',
        accessorFn: (e) => e.changes?.length ?? 0,
        header: 'Changes',
        cell: ({ row }) => {
          const n = row.original.changes?.length ?? 0
          return (
            <span className="text-xs text-[rgb(var(--text-tertiary))] tabular-nums">
              {n}
              {row.original.severity === 'high' && (
                <AlertTriangle className="inline-block w-3.5 h-3.5 text-[rgb(var(--state-warning-fg))] ml-1 align-text-bottom" />
              )}
            </span>
          )
        },
      },
    ],
    [],
  )

  return (
    <TanstackDataTable<AuditLogEntry>
      columns={columns}
      data={entries}
      getRowId={(row) => row.auditId}
      isLoading={isLoading}
      tableId="settings.audit-log"
      enableSorting
      enableExpanding
      enableColumnVisibility
      pagination={{ pageSize: 20 }}
      pageSizes={[10, 20, 50]}
      defaultSort={[{ id: 'changedAt', desc: true }]}
      searchPlaceholder="Search by entity, ID, or actor…"
      facets={facets}
      exportOptions={{ filename: 'audit-log', formats: ['csv'] }}
      renderSubComponent={({ row }) => <AuditDiffPanel entry={row.original} />}
      emptyState={{
        icon: <Shield className="w-10 h-10" />,
        title: 'No audit log entries found',
        description: 'Audit entries appear here as users make changes to the school.',
      }}
      maxHeight="calc(100vh - 22rem)"
      className="min-h-96"
    />
  )
}

function AuditDiffPanel({ entry }: { entry: AuditLogEntry }) {
  const changes = entry.changes ?? []
  return (
    <div className="px-4 py-3 bg-[rgb(var(--background-tertiary)/0.4)] border-t border-[rgb(var(--border-primary))]">
      {entry.reason && (
        <p className="mb-2 text-xs text-[rgb(var(--text-secondary))] italic">{entry.reason}</p>
      )}
      {changes.length === 0 ? (
        <p className="text-xs text-[rgb(var(--text-tertiary))]">No field-level changes recorded.</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[rgb(var(--text-tertiary))]">
              <th className="text-left py-1 pr-4 font-medium">Field</th>
              <th className="text-left py-1 pr-4 font-medium">Old value</th>
              <th className="text-left py-1 font-medium">New value</th>
            </tr>
          </thead>
          <tbody>
            {changes.map((c, i) => (
              <tr key={`${entry.auditId}-${i}`} className="border-t border-[rgb(var(--border-primary))]">
                <td className="py-1.5 pr-4 font-medium text-[rgb(var(--text-secondary))]">{c.field}</td>
                <td className="py-1.5 pr-4 text-[rgb(var(--state-danger-fg))] line-through">
                  {formatValue(c.oldValue)}
                </td>
                <td className="py-1.5 text-[rgb(var(--state-success-fg))]">
                  {formatValue(c.newValue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
