/**
 * Intelligent Error Aggregator
 *
 * Summarizes large blocks of cascading errors into "Actionable Insight" cards.
 * Groups 1000+ similar errors into single clickable items to prevent alert fatigue.
 *
 * Features:
 * - Error grouping by type, resource, and field
 * - Actionable insight cards with fix suggestions
 * - Bulk resolution options
 * - Error drill-down with sample records
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  Check,
  FileWarning,
  Database,
  User,
  Calendar,
  RefreshCw,
  Eye,
  EyeOff,
  Filter,
} from 'lucide-react'
import { Button, Card, CardContent } from '@edforge/ui'

// ============================================================================
// TYPES
// ============================================================================

interface SyncError {
  id: string
  resourceType: string
  recordId: string
  field: string
  errorType: 'validation' | 'reference' | 'format' | 'required' | 'duplicate'
  message: string
  timestamp: Date
  resolved: boolean
}

interface ErrorGroup {
  id: string
  errorType: string
  resourceType: string
  field: string
  count: number
  sampleMessage: string
  suggestion: string
  errors: SyncError[]
  resolved: boolean
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_ERRORS: SyncError[] = [
  // Student ID null errors
  ...Array.from({ length: 47 }, (_, i) => ({
    id: `err-sid-${i}`,
    resourceType: 'Student',
    recordId: `STU-${1000 + i}`,
    field: 'studentUniqueId',
    errorType: 'required' as const,
    message: 'Student ID is null',
    timestamp: new Date(Date.now() - Math.random() * 3600000),
    resolved: false,
  })),
  // Invalid date format errors
  ...Array.from({ length: 23 }, (_, i) => ({
    id: `err-date-${i}`,
    resourceType: 'Attendance',
    recordId: `ATT-${2000 + i}`,
    field: 'eventDate',
    errorType: 'format' as const,
    message: 'Invalid date format. Expected YYYY-MM-DD',
    timestamp: new Date(Date.now() - Math.random() * 3600000),
    resolved: false,
  })),
  // Missing teacher reference
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `err-ref-${i}`,
    resourceType: 'Section',
    recordId: `SEC-${3000 + i}`,
    field: 'staffUniqueId',
    errorType: 'reference' as const,
    message: 'Referenced teacher not found in Ed-Fi ODS',
    timestamp: new Date(Date.now() - Math.random() * 3600000),
    resolved: false,
  })),
  // Duplicate student entries
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `err-dup-${i}`,
    resourceType: 'Student',
    recordId: `STU-${4000 + i}`,
    field: 'studentUniqueId',
    errorType: 'duplicate' as const,
    message: 'Duplicate student entry detected',
    timestamp: new Date(Date.now() - Math.random() * 3600000),
    resolved: false,
  })),
  // Validation errors
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `err-val-${i}`,
    resourceType: 'StudentFees',
    recordId: `FEE-${5000 + i}`,
    field: 'amount',
    errorType: 'validation' as const,
    message: 'Amount must be greater than 0',
    timestamp: new Date(Date.now() - Math.random() * 3600000),
    resolved: false,
  })),
]

const SUGGESTIONS: Record<string, string> = {
  'required-studentUniqueId': 'Run the "Generate Missing IDs" script in the Data Quality module to auto-populate missing student IDs.',
  'format-eventDate': 'Use the Date Format Converter in Settings > Data Import to fix date formats.',
  'reference-staffUniqueId': 'Sync the Staff module first, then retry Section sync. Teachers must exist before assigning to sections.',
  'duplicate-studentUniqueId': 'Review the duplicate records and merge or archive as needed in People > Students > Duplicates.',
  'validation-amount': 'Update fee records with invalid amounts in Finance > Student Fees.',
}

// ============================================================================
// ERROR AGGREGATOR COMPONENT
// ============================================================================

export function ErrorAggregator() {
  const [errors, setErrors] = useState<SyncError[]>(MOCK_ERRORS)
  const [selectedGroup, setSelectedGroup] = useState<ErrorGroup | null>(null)
  const [showResolved, setShowResolved] = useState(false)
  const [resourceFilter, setResourceFilter] = useState<string | null>(null)

  // Group errors intelligently
  const errorGroups = useMemo(() => {
    const grouped = new Map<string, ErrorGroup>()

    errors
      .filter((e) => showResolved || !e.resolved)
      .filter((e) => !resourceFilter || e.resourceType === resourceFilter)
      .forEach((error) => {
        const key = `${error.errorType}-${error.field}`
        const existing = grouped.get(key)

        if (existing) {
          existing.count++
          existing.errors.push(error)
        } else {
          grouped.set(key, {
            id: key,
            errorType: error.errorType,
            resourceType: error.resourceType,
            field: error.field,
            count: 1,
            sampleMessage: error.message,
            suggestion: SUGGESTIONS[key] || 'Contact support for assistance with this error type.',
            errors: [error],
            resolved: false,
          })
        }
      })

    return Array.from(grouped.values()).sort((a, b) => b.count - a.count)
  }, [errors, showResolved, resourceFilter])

  // Get unique resource types for filter
  const resourceTypes = useMemo(() => {
    return [...new Set(errors.map((e) => e.resourceType))]
  }, [errors])

  // Stats
  const stats = useMemo(() => {
    const total = errors.length
    const resolved = errors.filter((e) => e.resolved).length
    const pending = total - resolved
    return { total, resolved, pending }
  }, [errors])

  const handleResolveGroup = (group: ErrorGroup) => {
    setErrors((prev) =>
      prev.map((e) =>
        group.errors.some((ge) => ge.id === e.id) ? { ...e, resolved: true } : e
      )
    )
    setSelectedGroup(null)
  }

  const handleResolveSingle = (errorId: string) => {
    setErrors((prev) =>
      prev.map((e) => (e.id === errorId ? { ...e, resolved: true } : e))
    )
  }

  const getErrorTypeColor = (type: string) => {
    switch (type) {
      case 'required':
        return 'rust'
      case 'reference':
        return 'golden'
      case 'format':
        return 'caramel'
      case 'duplicate':
        return 'vanilla'
      case 'validation':
        return 'teal'
      default:
        return 'text'
    }
  }

  const getErrorTypeIcon = (type: string) => {
    switch (type) {
      case 'required':
        return FileWarning
      case 'reference':
        return Database
      case 'format':
        return Calendar
      case 'duplicate':
        return User
      default:
        return AlertTriangle
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Error Aggregator</h1>
          <p className="text-text-secondary">
            {stats.pending} pending errors grouped into {errorGroups.length} actionable insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowResolved(!showResolved)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl transition-all
              ${showResolved ? 'bg-surface-tertiary text-text-primary' : 'bg-surface-secondary text-text-tertiary'}
            `}
          >
            {showResolved ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {showResolved ? 'Showing Resolved' : 'Hiding Resolved'}
          </button>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry All
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-rust-500/10">
              <AlertTriangle className="w-6 h-6 text-rust-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{stats.pending}</p>
              <p className="text-sm text-text-tertiary">Pending Errors</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-aqua-500/10">
              <Check className="w-6 h-6 text-aqua-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{stats.resolved}</p>
              <p className="text-sm text-text-tertiary">Resolved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-teal-500/10">
              <Lightbulb className="w-6 h-6 text-teal-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{errorGroups.length}</p>
              <p className="text-sm text-text-tertiary">Actionable Insights</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-text-tertiary flex-shrink-0" />
        <button
          onClick={() => setResourceFilter(null)}
          className={`
            px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all
            ${!resourceFilter ? 'bg-teal-500/10 text-teal-600 dark:text-cyan-400' : 'text-text-tertiary hover:bg-surface-tertiary'}
          `}
        >
          All Resources
        </button>
        {resourceTypes.map((type) => (
          <button
            key={type}
            onClick={() => setResourceFilter(type)}
            className={`
              px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all
              ${resourceFilter === type ? 'bg-teal-500/10 text-teal-600 dark:text-cyan-400' : 'text-text-tertiary hover:bg-surface-tertiary'}
            `}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Error Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {errorGroups.map((group) => (
          <ErrorGroupCard
            key={group.id}
            group={group}
            color={getErrorTypeColor(group.errorType)}
            Icon={getErrorTypeIcon(group.errorType)}
            isExpanded={selectedGroup?.id === group.id}
            onToggle={() => setSelectedGroup(selectedGroup?.id === group.id ? null : group)}
            onResolve={() => handleResolveGroup(group)}
            onResolveSingle={handleResolveSingle}
          />
        ))}
      </div>

      {errorGroups.length === 0 && (
        <div className="text-center py-12">
          <Check className="w-16 h-16 text-aqua-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">All Clear!</h3>
          <p className="text-text-secondary">No pending errors to display.</p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// ERROR GROUP CARD COMPONENT
// ============================================================================

interface ErrorGroupCardProps {
  group: ErrorGroup
  color: string
  Icon: React.ComponentType<{ className?: string }>
  isExpanded: boolean
  onToggle: () => void
  onResolve: () => void
  onResolveSingle: (id: string) => void
}

function ErrorGroupCard({
  group,
  color,
  Icon,
  isExpanded,
  onToggle,
  onResolve,
  onResolveSingle,
}: ErrorGroupCardProps) {
  return (
    <Card className={isExpanded ? 'lg:col-span-2' : ''}>
      <CardContent className="p-0">
        {/* Header */}
        <button
          onClick={onToggle}
          className="w-full p-5 flex items-center justify-between hover:bg-surface-tertiary transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-${color}-500/10`}>
              <Icon className={`w-6 h-6 text-${color}-500`} />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-text-primary">{group.sampleMessage}</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${color}-500/20 text-${color}-600`}>
                  {group.count} errors
                </span>
              </div>
              <p className="text-sm text-text-tertiary">
                {group.resourceType} • {group.field}
              </p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-text-tertiary" />
          ) : (
            <ChevronRight className="w-5 h-5 text-text-tertiary" />
          )}
        </button>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Suggestion Card */}
              <div className="mx-5 mb-4 p-4 rounded-xl bg-teal-500/10 border border-teal-500/20">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-teal-600 dark:text-cyan-400 mb-1">
                      Suggested Fix
                    </p>
                    <p className="text-sm text-teal-700 dark:text-teal-300">
                      {group.suggestion}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sample Records */}
              <div className="px-5 pb-4">
                <p className="text-sm font-medium text-text-tertiary mb-2">
                  Sample Records ({Math.min(5, group.errors.length)} of {group.count})
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {group.errors.slice(0, 5).map((error) => (
                    <div
                      key={error.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-surface-tertiary"
                    >
                      <div>
                        <code className="text-sm text-text-primary">{error.recordId}</code>
                        <p className="text-xs text-text-tertiary">{error.message}</p>
                      </div>
                      <button
                        onClick={() => onResolveSingle(error.id)}
                        className="p-1.5 rounded-lg hover:bg-surface-elevated text-text-tertiary hover:text-aqua-500 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 pb-5 flex items-center justify-end gap-3">
                <Button variant="outline" onClick={onToggle}>
                  Close
                </Button>
                <Button onClick={onResolve}>
                  <Check className="w-4 h-4 mr-2" />
                  Mark All as Resolved
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

export default ErrorAggregator

