/**
 * ComplianceAlertsWidget
 * 
 * Shows compliance-related alerts for Special Programs (IEPs, 504 Plans).
 * Features:
 * - Overdue IEP reviews
 * - Upcoming 504 plan reviews
 * - Links to Special Programs module
 * - Role-based visibility (admins and special education staff)
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from '@tanstack/react-router'
import {
  AlertTriangle,
  Clock,
  ChevronRight,
  ShieldCheck,
  FileText,
  ArrowUpRight,
  MoreHorizontal,
} from 'lucide-react'
import { WidgetSection } from '../WidgetSection'
import { useDynamicPage } from '../DynamicPageContext'
import { usePermission } from '@edforge/abac'

// ============================================================================
// TYPES
// ============================================================================

export interface ComplianceAlert {
  id: string
  type: 'iep' | '504'
  studentName: string
  studentId: string
  dueDate: Date | string
  status: 'overdue' | 'due-soon' | 'upcoming'
  daysRemaining: number
  reviewType: 'annual' | 'triennial' | 'initial' | 'amendment'
}

// ============================================================================
// MOCK DATA
// ============================================================================

const today = new Date()

const MOCK_COMPLIANCE_ALERTS: ComplianceAlert[] = [
  {
    id: 'ca1',
    type: 'iep',
    studentName: 'Emma Rodriguez',
    studentId: 'STU-2024-001',
    dueDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    status: 'overdue',
    daysRemaining: -5,
    reviewType: 'annual',
  },
  {
    id: 'ca2',
    type: 'iep',
    studentName: 'James Chen',
    studentId: 'STU-2024-042',
    dueDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    status: 'overdue',
    daysRemaining: -2,
    reviewType: 'triennial',
  },
  {
    id: 'ca3',
    type: '504',
    studentName: 'Sofia Martinez',
    studentId: 'STU-2024-078',
    dueDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    status: 'due-soon',
    daysRemaining: 3,
    reviewType: 'annual',
  },
  {
    id: 'ca4',
    type: 'iep',
    studentName: 'Michael Johnson',
    studentId: 'STU-2024-103',
    dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    status: 'due-soon',
    daysRemaining: 7,
    reviewType: 'annual',
  },
  {
    id: 'ca5',
    type: '504',
    studentName: 'Olivia Williams',
    studentId: 'STU-2024-156',
    dueDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    status: 'upcoming',
    daysRemaining: 14,
    reviewType: 'initial',
  },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getStatusColor(status: ComplianceAlert['status']): string {
  switch (status) {
    case 'overdue':
      return 'text-rose-500 bg-rose-500/10'
    case 'due-soon':
      return 'text-amber-500 bg-amber-500/10'
    case 'upcoming':
      return 'text-emerald-500 bg-emerald-500/10'
    default:
      return 'text-[rgb(var(--text-tertiary))]'
  }
}

function getStatusLabel(status: ComplianceAlert['status'], days: number): string {
  switch (status) {
    case 'overdue':
      return `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} overdue`
    case 'due-soon':
      return `Due in ${days} day${days !== 1 ? 's' : ''}`
    case 'upcoming':
      return `In ${days} days`
    default:
      return ''
  }
}

function getTypeIcon(type: ComplianceAlert['type']) {
  return type === 'iep' ? FileText : ShieldCheck
}

function getTypeLabel(type: ComplianceAlert['type']): string {
  return type === 'iep' ? 'IEP Review' : '504 Plan Review'
}

// ============================================================================
// COMPONENTS
// ============================================================================

function AlertItem({ alert }: { alert: ComplianceAlert }) {
  const Icon = getTypeIcon(alert.type)
  const statusColor = getStatusColor(alert.status)
  const statusLabel = getStatusLabel(alert.status, alert.daysRemaining)

  return (
    <Link
      to="/special-programs/$"
      params={{ _splat: alert.type === 'iep' ? 'ieps' : '504-plans' }}
      className="group flex items-start gap-3 py-2.5 px-3 -mx-3 rounded-lg hover:bg-[rgb(var(--surface-hover))] transition-colors"
    >
      {/* Type Icon */}
      <div className={`p-2 rounded-lg ${alert.type === 'iep' ? 'bg-violet-500/10' : 'bg-teal-500/10'}`}>
        <Icon className={`w-4 h-4 ${alert.type === 'iep' ? 'text-violet-500' : 'text-teal-500'}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
            {alert.studentName}
          </h4>
          <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-[rgb(var(--text-tertiary))]">
          <span>{getTypeLabel(alert.type)}</span>
          <span>•</span>
          <span className="capitalize">{alert.reviewType}</span>
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-4 h-4 text-[rgb(var(--text-tertiary))] opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-3 py-6 px-4 text-[rgb(var(--text-tertiary))]"
    >
      <ShieldCheck className="w-8 h-8 opacity-20" />
      <div>
        <h4 className="text-sm font-medium text-[rgb(var(--text-secondary))]">All caught up!</h4>
        <p className="text-xs">No compliance alerts at this time.</p>
      </div>
    </motion.div>
  )
}

function SummaryStats({ alerts }: { alerts: ComplianceAlert[] }) {
  const overdue = alerts.filter(a => a.status === 'overdue').length
  const dueSoon = alerts.filter(a => a.status === 'due-soon').length

  if (overdue === 0 && dueSoon === 0) return null

  return (
    <div className="flex items-center gap-4 mb-4 pb-4 border-b border-[rgb(var(--border-secondary))]">
      {overdue > 0 && (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/10">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <div className="text-lg font-semibold text-rose-500">{overdue}</div>
            <div className="text-xs text-[rgb(var(--text-tertiary))]">Overdue</div>
          </div>
        </div>
      )}
      {dueSoon > 0 && (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10">
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div className="text-lg font-semibold text-amber-500">{dueSoon}</div>
            <div className="text-xs text-[rgb(var(--text-tertiary))]">Due Soon</div>
          </div>
        </div>
      )}
    </div>
  )
}

function HeaderActions({ onHideWidget }: { onHideWidget?: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex items-center gap-1">
      <Link
        to="/special-programs/$"
        params={{ _splat: '' }}
        className="p-1.5 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-tertiary))] transition-colors"
        title="Go to Special Programs"
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

// ============================================================================
// MAIN WIDGET
// ============================================================================

export function ComplianceAlertsWidget({
  alerts = MOCK_COMPLIANCE_ALERTS,
  maxItems = 5,
}: {
  alerts?: ComplianceAlert[]
  maxItems?: number
}) {
  const { toggleWidget } = useDynamicPage()
  const canViewSpecialPrograms = usePermission('view', 'special-programs')

  // Only show to users who have access to special programs
  if (!canViewSpecialPrograms) {
    return null
  }

  // Sort alerts: overdue first, then by days remaining
  const sortedAlerts = [...alerts].sort((a, b) => {
    if (a.status === 'overdue' && b.status !== 'overdue') return -1
    if (a.status !== 'overdue' && b.status === 'overdue') return 1
    return a.daysRemaining - b.daysRemaining
  })

  const displayAlerts = sortedAlerts.slice(0, maxItems)
  const hasMore = sortedAlerts.length > maxItems

  return (
    <WidgetSection
      widgetId="compliance-alerts"
      label="Compliance Alerts"
      icon={AlertTriangle}
      overflowVisible={true}
      headerActions={<HeaderActions onHideWidget={() => toggleWidget('compliance-alerts')} />}
    >
      {displayAlerts.length === 0 ? (
        <EmptyState />
      ) : (
        <div>
          <SummaryStats alerts={alerts} />
          <div className="space-y-1">
            {displayAlerts.map(alert => (
              <AlertItem key={alert.id} alert={alert} />
            ))}
          </div>
          {hasMore && (
            <Link
              to="/special-programs/$"
              params={{ _splat: '' }}
              className="mt-4 flex items-center justify-center gap-2 py-2 text-sm text-[rgb(var(--brand-primary))] hover:text-[rgb(var(--brand-primary-hover))] transition-colors"
            >
              <span>View all {sortedAlerts.length} alerts</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}
    </WidgetSection>
  )
}

