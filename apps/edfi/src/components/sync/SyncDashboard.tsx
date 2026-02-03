/**
 * Sync Dashboard
 *
 * Visual status center showing data transmission with real-time progress bars.
 * Uses SSE/WebSocket for live updates during synchronization.
 *
 * Features:
 * - Real-time progress indicators
 * - Resource-level sync status
 * - Error count per resource
 * - On-demand resync controls
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Pause,
  Play,
  RotateCcw,
  Activity,
  Database,
  Users,
  BookOpen,
  Calendar,
  DollarSign,
} from 'lucide-react'
import { Button, Card, CardContent, CardHeader } from '@edforge/ui'

// ============================================================================
// TYPES
// ============================================================================

type SyncStatus = 'idle' | 'syncing' | 'completed' | 'error' | 'paused'

interface SyncResource {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  status: SyncStatus
  progress: number
  totalRecords: number
  syncedRecords: number
  errorCount: number
  lastSyncAt?: Date
  estimatedTimeLeft?: number
}

interface SyncStats {
  totalResources: number
  completedResources: number
  totalRecords: number
  syncedRecords: number
  errorCount: number
}

// ============================================================================
// MOCK DATA
// ============================================================================

const INITIAL_RESOURCES: SyncResource[] = [
  { id: 'students', name: 'Students', icon: Users, status: 'completed', progress: 100, totalRecords: 1234, syncedRecords: 1234, errorCount: 3, lastSyncAt: new Date(Date.now() - 3600000) },
  { id: 'staff', name: 'Staff', icon: Users, status: 'completed', progress: 100, totalRecords: 89, syncedRecords: 89, errorCount: 0, lastSyncAt: new Date(Date.now() - 3600000) },
  { id: 'sections', name: 'Sections', icon: BookOpen, status: 'syncing', progress: 67, totalRecords: 456, syncedRecords: 305, errorCount: 2, estimatedTimeLeft: 45 },
  { id: 'attendance', name: 'Attendance', icon: Calendar, status: 'idle', progress: 0, totalRecords: 45000, syncedRecords: 0, errorCount: 0 },
  { id: 'grades', name: 'Grades', icon: Database, status: 'idle', progress: 0, totalRecords: 12340, syncedRecords: 0, errorCount: 0 },
  { id: 'finance', name: 'Student Fees', icon: DollarSign, status: 'error', progress: 45, totalRecords: 890, syncedRecords: 400, errorCount: 12, lastSyncAt: new Date(Date.now() - 7200000) },
]

// ============================================================================
// SYNC DASHBOARD COMPONENT
// ============================================================================

export function SyncDashboard() {
  const [resources, setResources] = useState<SyncResource[]>(INITIAL_RESOURCES)
  const [isGlobalSyncing, setIsGlobalSyncing] = useState(false)

  // Simulate real-time sync progress
  useEffect(() => {
    if (!isGlobalSyncing) return

    const interval = setInterval(() => {
      setResources((prev) =>
        prev.map((resource) => {
          if (resource.status === 'syncing' && resource.progress < 100) {
            const newProgress = Math.min(resource.progress + Math.random() * 5, 100)
            const newSynced = Math.floor((newProgress / 100) * resource.totalRecords)
            return {
              ...resource,
              progress: newProgress,
              syncedRecords: newSynced,
              status: newProgress >= 100 ? 'completed' : 'syncing',
              lastSyncAt: newProgress >= 100 ? new Date() : resource.lastSyncAt,
              estimatedTimeLeft:
                newProgress >= 100
                  ? undefined
                  : Math.max(0, (resource.estimatedTimeLeft || 60) - 3),
            }
          }
          return resource
        })
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [isGlobalSyncing])

  // Calculate overall stats
  const stats: SyncStats = resources.reduce(
    (acc, r) => ({
      totalResources: acc.totalResources + 1,
      completedResources: acc.completedResources + (r.status === 'completed' ? 1 : 0),
      totalRecords: acc.totalRecords + r.totalRecords,
      syncedRecords: acc.syncedRecords + r.syncedRecords,
      errorCount: acc.errorCount + r.errorCount,
    }),
    { totalResources: 0, completedResources: 0, totalRecords: 0, syncedRecords: 0, errorCount: 0 }
  )

  const overallProgress = Math.round((stats.syncedRecords / stats.totalRecords) * 100)

  const handleStartSync = () => {
    setIsGlobalSyncing(true)
    setResources((prev) =>
      prev.map((r) => ({
        ...r,
        status: r.status === 'idle' || r.status === 'error' ? 'syncing' : r.status,
      }))
    )
  }

  const handlePauseSync = () => {
    setIsGlobalSyncing(false)
    setResources((prev) =>
      prev.map((r) => ({
        ...r,
        status: r.status === 'syncing' ? 'paused' : r.status,
      }))
    )
  }

  const handleResyncResource = (resourceId: string) => {
    setResources((prev) =>
      prev.map((r) =>
        r.id === resourceId
          ? { ...r, status: 'syncing', progress: 0, syncedRecords: 0, errorCount: 0 }
          : r
      )
    )
    if (!isGlobalSyncing) setIsGlobalSyncing(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Sync Dashboard</h1>
          <p className="text-text-secondary">Monitor state reporting data synchronization</p>
        </div>
        <div className="flex items-center gap-3">
          {isGlobalSyncing ? (
            <Button variant="outline" onClick={handlePauseSync}>
              <Pause className="w-4 h-4 mr-2" />
              Pause Sync
            </Button>
          ) : (
            <Button onClick={handleStartSync}>
              <Play className="w-4 h-4 mr-2" />
              Start Sync
            </Button>
          )}
        </div>
      </div>

      {/* Overall Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div
                className={`
                  p-4 rounded-2xl
                  ${isGlobalSyncing ? 'bg-teal-500/10 animate-pulse' : 'bg-surface-tertiary'}
                `}
              >
                <Activity
                  className={`w-8 h-8 ${isGlobalSyncing ? 'text-teal-500' : 'text-text-tertiary'}`}
                />
              </div>
              <div>
                <p className="text-sm text-text-tertiary">Overall Sync Progress</p>
                <p className="text-3xl font-bold text-text-primary">{overallProgress}%</p>
              </div>
            </div>
            <div className="flex items-center gap-8 text-center">
              <div>
                <p className="text-2xl font-bold text-text-primary">{stats.syncedRecords.toLocaleString()}</p>
                <p className="text-sm text-text-tertiary">Records Synced</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{stats.totalRecords.toLocaleString()}</p>
                <p className="text-sm text-text-tertiary">Total Records</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${stats.errorCount > 0 ? 'text-rust-500' : 'text-aqua-500'}`}>
                  {stats.errorCount}
                </p>
                <p className="text-sm text-text-tertiary">Errors</p>
              </div>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="relative h-4 bg-surface-tertiary rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
            {isGlobalSyncing && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resource-Level Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            onResync={() => handleResyncResource(resource.id)}
          />
        ))}
      </div>

      {/* Sync Log Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-text-primary">Recent Sync Activity</h3>
            <Button variant="ghost" size="sm">
              View Full Log
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border-primary">
            {[
              { time: '2 min ago', message: 'Synced 150 student records', type: 'success' },
              { time: '5 min ago', message: 'Section "Grade 5A" sync completed', type: 'success' },
              { time: '8 min ago', message: 'Failed to sync fee record #1234 - Invalid amount', type: 'error' },
              { time: '12 min ago', message: 'Started attendance sync for December 2024', type: 'info' },
            ].map((log, index) => (
              <div key={index} className="px-6 py-3 flex items-center gap-4">
                <div
                  className={`
                    w-2 h-2 rounded-full
                    ${log.type === 'success' ? 'bg-aqua-500' : log.type === 'error' ? 'bg-rust-500' : 'bg-teal-500'}
                  `}
                />
                <span className="text-sm text-text-tertiary">{log.time}</span>
                <span className="text-sm text-text-primary">{log.message}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// RESOURCE CARD COMPONENT
// ============================================================================

interface ResourceCardProps {
  resource: SyncResource
  onResync: () => void
}

function ResourceCard({ resource, onResync }: ResourceCardProps) {
  const Icon = resource.icon

  const getStatusColor = (status: SyncStatus) => {
    switch (status) {
      case 'completed':
        return 'text-aqua-500'
      case 'syncing':
        return 'text-teal-500'
      case 'error':
        return 'text-rust-500'
      case 'paused':
        return 'text-golden-500'
      default:
        return 'text-text-tertiary'
    }
  }

  const getStatusIcon = (status: SyncStatus) => {
    switch (status) {
      case 'completed':
        return CheckCircle
      case 'syncing':
        return RefreshCw
      case 'error':
        return XCircle
      case 'paused':
        return Pause
      default:
        return Clock
    }
  }

  const StatusIcon = getStatusIcon(resource.status)

  return (
    <Card className={resource.status === 'error' ? 'border-rust-500/50' : ''}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-surface-tertiary">
              <Icon className="w-5 h-5 text-text-secondary" />
            </div>
            <div>
              <p className="font-medium text-text-primary">{resource.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <StatusIcon
                  className={`w-3 h-3 ${getStatusColor(resource.status)} ${
                    resource.status === 'syncing' ? 'animate-spin' : ''
                  }`}
                />
                <span className={`text-xs capitalize ${getStatusColor(resource.status)}`}>
                  {resource.status}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onResync}
            className="p-2 rounded-lg hover:bg-surface-tertiary transition-colors text-text-tertiary hover:text-text-primary"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-tertiary">
              {resource.syncedRecords.toLocaleString()} / {resource.totalRecords.toLocaleString()}
            </span>
            <span className="font-medium text-text-primary">{Math.round(resource.progress)}%</span>
          </div>
          <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
            <motion.div
              className={`
                h-full rounded-full
                ${
                  resource.status === 'error'
                    ? 'bg-rust-500'
                    : resource.status === 'completed'
                    ? 'bg-aqua-500'
                    : 'bg-gradient-to-r from-teal-500 to-cyan-500'
                }
              `}
              initial={{ width: 0 }}
              animate={{ width: `${resource.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-primary text-sm">
          {resource.errorCount > 0 && (
            <div className="flex items-center gap-1 text-rust-500">
              <AlertTriangle className="w-4 h-4" />
              <span>{resource.errorCount} errors</span>
            </div>
          )}
          {resource.lastSyncAt && (
            <span className="text-text-tertiary ml-auto">
              Last: {formatTimeAgo(resource.lastSyncAt)}
            </span>
          )}
          {resource.estimatedTimeLeft !== undefined && (
            <span className="text-text-tertiary ml-auto">
              ~{resource.estimatedTimeLeft}s left
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// HELPERS
// ============================================================================

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default SyncDashboard

