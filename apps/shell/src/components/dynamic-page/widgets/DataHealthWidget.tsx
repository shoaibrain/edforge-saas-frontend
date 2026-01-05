/**
 * DataHealthWidget
 * 
 * Shows Ed-Fi sync status and data health indicators.
 * Features:
 * - Last sync timestamp and status
 * - Error count and quick access to error aggregator
 * - Sync job progress indicator
 * - Role-based visibility (TenantAdmin only)
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from '@tanstack/react-router'
import {
  Database,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  ChevronRight,
  ArrowUpRight,
  MoreHorizontal,
  Activity,
} from 'lucide-react'
import { WidgetSection } from '../WidgetSection'
import { useDynamicPage } from '../DynamicPageContext'
import { usePermission } from '@edforge/abac'

// ============================================================================
// TYPES
// ============================================================================

export interface SyncJob {
  id: string
  type: 'full' | 'incremental' | 'delta'
  status: 'success' | 'failed' | 'in-progress' | 'pending'
  startedAt: Date | string
  completedAt?: Date | string
  recordsProcessed?: number
  recordsFailed?: number
  errorCount?: number
}

export interface DataHealthStatus {
  lastSuccessfulSync: Date | string | null
  lastSyncAttempt: Date | string | null
  syncStatus: 'healthy' | 'warning' | 'error' | 'syncing' | 'never'
  totalErrors: number
  unresolvedErrors: number
  recentJobs: SyncJob[]
  connectionStatus: 'connected' | 'disconnected' | 'unknown'
}

// ============================================================================
// MOCK DATA
// ============================================================================

const now = new Date()

const MOCK_DATA_HEALTH: DataHealthStatus = {
  lastSuccessfulSync: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
  lastSyncAttempt: new Date(now.getTime() - 30 * 60 * 1000), // 30 mins ago
  syncStatus: 'warning',
  totalErrors: 23,
  unresolvedErrors: 5,
  connectionStatus: 'connected',
  recentJobs: [
    {
      id: 'sj1',
      type: 'incremental',
      status: 'failed',
      startedAt: new Date(now.getTime() - 30 * 60 * 1000),
      completedAt: new Date(now.getTime() - 28 * 60 * 1000),
      recordsProcessed: 1250,
      recordsFailed: 5,
      errorCount: 5,
    },
    {
      id: 'sj2',
      type: 'incremental',
      status: 'success',
      startedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000 + 3 * 60 * 1000),
      recordsProcessed: 1245,
      recordsFailed: 0,
    },
    {
      id: 'sj3',
      type: 'full',
      status: 'success',
      startedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000 + 15 * 60 * 1000),
      recordsProcessed: 15420,
      recordsFailed: 0,
    },
  ],
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getStatusColor(status: DataHealthStatus['syncStatus']): string {
  switch (status) {
    case 'healthy':
      return 'text-emerald-500'
    case 'warning':
      return 'text-amber-500'
    case 'error':
      return 'text-rose-500'
    case 'syncing':
      return 'text-blue-500'
    case 'never':
      return 'text-[rgb(var(--text-tertiary))]'
    default:
      return 'text-[rgb(var(--text-tertiary))]'
  }
}

function getStatusIcon(status: DataHealthStatus['syncStatus']) {
  switch (status) {
    case 'healthy':
      return CheckCircle2
    case 'warning':
      return AlertTriangle
    case 'error':
      return XCircle
    case 'syncing':
      return RefreshCw
    case 'never':
      return Clock
    default:
      return Database
  }
}

function getStatusLabel(status: DataHealthStatus['syncStatus']): string {
  switch (status) {
    case 'healthy':
      return 'All systems operational'
    case 'warning':
      return 'Sync completed with errors'
    case 'error':
      return 'Sync failed'
    case 'syncing':
      return 'Sync in progress...'
    case 'never':
      return 'Not configured'
    default:
      return 'Unknown'
  }
}

function formatRelativeTime(date: Date | string | null): string {
  if (!date) return 'Never'
  
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getJobStatusColor(status: SyncJob['status']): string {
  switch (status) {
    case 'success':
      return 'bg-emerald-500'
    case 'failed':
      return 'bg-rose-500'
    case 'in-progress':
      return 'bg-blue-500'
    case 'pending':
      return 'bg-[rgb(var(--border-primary))]'
    default:
      return 'bg-[rgb(var(--border-primary))]'
  }
}

// ============================================================================
// COMPONENTS
// ============================================================================

function StatusIndicator({ status }: { status: DataHealthStatus['syncStatus'] }) {
  const Icon = getStatusIcon(status)
  const color = getStatusColor(status)
  const label = getStatusLabel(status)

  return (
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${status === 'healthy' ? 'bg-emerald-500/10' : status === 'warning' ? 'bg-amber-500/10' : status === 'error' ? 'bg-rose-500/10' : status === 'syncing' ? 'bg-blue-500/10' : 'bg-[rgb(var(--surface-secondary))]'}`}>
        <Icon className={`w-5 h-5 ${color} ${status === 'syncing' ? 'animate-spin' : ''}`} />
      </div>
      <div>
        <div className={`text-sm font-medium ${color}`}>{label}</div>
        <div className="text-xs text-[rgb(var(--text-tertiary))]">Ed-Fi ODS Connection</div>
      </div>
    </div>
  )
}

function SyncStats({ health }: { health: DataHealthStatus }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-4 border-y border-[rgb(var(--border-secondary))]">
      <div>
        <div className="text-xs text-[rgb(var(--text-tertiary))] mb-1">Last Sync</div>
        <div className="text-sm font-medium text-[rgb(var(--text-primary))]">
          {formatRelativeTime(health.lastSuccessfulSync)}
        </div>
      </div>
      <div>
        <div className="text-xs text-[rgb(var(--text-tertiary))] mb-1">Connection</div>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${health.connectionStatus === 'connected' ? 'bg-emerald-500' : health.connectionStatus === 'disconnected' ? 'bg-rose-500' : 'bg-[rgb(var(--text-tertiary))]'}`} />
          <span className="text-sm font-medium text-[rgb(var(--text-primary))] capitalize">
            {health.connectionStatus}
          </span>
        </div>
      </div>
      <div>
        <div className="text-xs text-[rgb(var(--text-tertiary))] mb-1">Errors</div>
        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-medium ${health.unresolvedErrors > 0 ? 'text-rose-500' : 'text-[rgb(var(--text-primary))]'}`}>
            {health.unresolvedErrors}
          </span>
          {health.unresolvedErrors > 0 && (
            <span className="text-xs text-[rgb(var(--text-tertiary))]">unresolved</span>
          )}
        </div>
      </div>
    </div>
  )
}

function RecentJobsList({ jobs }: { jobs: SyncJob[] }) {
  if (jobs.length === 0) return null

  return (
    <div className="pt-4">
      <div className="text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider mb-3">
        Recent Sync Jobs
      </div>
      <div className="space-y-2">
        {jobs.slice(0, 3).map(job => (
          <div key={job.id} className="flex items-center gap-3 py-1.5">
            <div className={`w-2 h-2 rounded-full ${getJobStatusColor(job.status)}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[rgb(var(--text-primary))] capitalize">{job.type}</span>
                <span className="text-xs text-[rgb(var(--text-tertiary))]">
                  {formatRelativeTime(job.startedAt)}
                </span>
              </div>
              {job.recordsProcessed !== undefined && (
                <div className="text-xs text-[rgb(var(--text-tertiary))]">
                  {job.recordsProcessed.toLocaleString()} records
                  {job.recordsFailed ? ` · ${job.recordsFailed} failed` : ''}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HeaderActions({ onHideWidget }: { onHideWidget?: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex items-center gap-1">
      <Link
        to="/edfi/$"
        params={{ _splat: '' }}
        className="p-1.5 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-tertiary))] transition-colors"
        title="Go to State Reporting"
      >
        <ArrowUpRight className="w-4 h-4" />
      </Link>
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`p-1.5 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-tertiary))] transition-colors ${menuOpen ? 'bg-[rgb(var(--surface-tertiary))]' : ''}`}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              className="absolute right-0 top-full mt-2 z-50 w-48 bg-[rgb(var(--surface-primary))] border border-[rgb(var(--border-primary))] rounded-xl shadow-xl overflow-hidden"
            >
              <Link
                to="/edfi/$"
                params={{ _splat: 'errors' }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[rgb(var(--surface-hover))]"
                onClick={() => setMenuOpen(false)}
              >
                <AlertTriangle className="w-4 h-4" />
                View Errors
              </Link>
              <button
                onClick={() => {
                  onHideWidget?.()
                  setMenuOpen(false)
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-[rgb(var(--surface-hover))]"
              >
                Hide from Home
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-3 py-6 px-4 text-[rgb(var(--text-tertiary))]"
    >
      <Database className="w-8 h-8 opacity-20" />
      <div>
        <h4 className="text-sm font-medium text-[rgb(var(--text-secondary))]">Ed-Fi not configured</h4>
        <p className="text-xs">Set up your Ed-Fi connection to enable state reporting.</p>
        <Link
          to="/edfi/$"
          params={{ _splat: 'connections' }}
          className="mt-2 inline-flex items-center gap-1 text-xs text-[rgb(var(--brand-primary))] hover:text-[rgb(var(--brand-primary-hover))]"
        >
          Configure Connection
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </motion.div>
  )
}

// ============================================================================
// MAIN WIDGET
// ============================================================================

export function DataHealthWidget({
  health = MOCK_DATA_HEALTH,
}: {
  health?: DataHealthStatus
}) {
  const { toggleWidget } = useDynamicPage()
  const canViewEdFi = usePermission('view', 'edfi')

  // Only show to users who have Ed-Fi access (typically TenantAdmin)
  if (!canViewEdFi) {
    return null
  }

  const showEmptyState = health.syncStatus === 'never'

  return (
    <WidgetSection
      widgetId="data-health"
      label="Data Health"
      icon={Activity}
      overflowVisible={true}
      headerActions={<HeaderActions onHideWidget={() => toggleWidget('data-health')} />}
    >
      {showEmptyState ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          <StatusIndicator status={health.syncStatus} />
          <SyncStats health={health} />
          <RecentJobsList jobs={health.recentJobs} />
          
          {health.unresolvedErrors > 0 && (
            <Link
              to="/edfi/$"
              params={{ _splat: 'errors' }}
              className="flex items-center justify-between p-3 -mx-1 rounded-lg bg-rose-500/5 border border-rose-500/20 hover:bg-rose-500/10 transition-colors"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span className="text-sm font-medium text-rose-600 dark:text-rose-400">
                  {health.unresolvedErrors} unresolved error{health.unresolvedErrors !== 1 ? 's' : ''}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-500" />
            </Link>
          )}
        </div>
      )}
    </WidgetSection>
  )
}

