/**
 * Finance Overview Page — V2
 *
 * Redesigned finance overview with V2 design tokens, animated KPI tiles,
 * collection performance, billing health (unified status + aging), and recent activity.
 */

import { useNavigate } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'framer-motion'
import {
  DollarSign,
  TrendingUp,
  Receipt,
  AlertTriangle,
  FileStack,
  CreditCard,
  Inbox,
} from 'lucide-react'
import { StatCard, WidgetErrorBoundaryV2 } from '@edforge/ui'
import { formatNPRCompact, formatNPRShort } from '@edforge/types'

// Helper to build tag pill props for StatCard
function tagPill(text: string, hex: string): { text: string; color: string; bg: string } {
  return { text, color: hex, bg: `${hex}18` }
}
import { useAppStore } from '../stores/app.store'
import { useFinanceOverviewV2 } from '../hooks/useFinanceOverviewV2'
import { FilterRow } from '../components/overview-v2/FilterRow'
import { OverdueAlertBanner } from '../components/overview-v2/OverdueAlertBanner'
import { CollectionPerformanceCard } from '../components/overview-v2/CollectionPerformanceCard'
import { BillingHealthCard } from '../components/overview-v2/BillingHealthCard'
import { RecentPaymentsCard } from '../components/overview-v2/RecentPaymentsCard'
import { RecentInvoicesCard } from '../components/overview-v2/RecentInvoicesCard'

// ============================================================================
// ANIMATION
// ============================================================================

function useMotionVariants() {
  const prefersReduced = useReducedMotion()
  if (prefersReduced) {
    return {
      stagger: { hidden: {}, visible: {} },
      fadeInUp: { hidden: {}, visible: {} },
    }
  }
  return {
    stagger: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
    },
    fadeInUp: {
      hidden: { opacity: 0, y: 14 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
    },
  }
}

// ============================================================================
// INSIGHT STRIP (E-01)
// ============================================================================

function InsightStrip({
  totalInvoiced,
  collectionRate,
  overdueCount,
  isLoading,
}: {
  totalInvoiced: number
  collectionRate: number
  overdueCount: number
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div
        className="h-5 rounded-lg v2-skeleton-pulse"
        style={{ background: 'var(--v2-bg-elevated)', width: '60%' }}
      />
    )
  }

  if (totalInvoiced === 0) return null

  const parts: string[] = [
    `${formatNPRShort(totalInvoiced)} invoiced`,
    `${collectionRate.toFixed(1)}% collected`,
  ]
  if (overdueCount > 0) {
    parts.push(`${overdueCount} invoice${overdueCount !== 1 ? 's' : ''} overdue`)
  } else {
    parts.push('no overdue')
  }

  return (
    <p className="text-[11px] leading-relaxed" style={{ color: 'var(--v2-text-hint)' }}>
      {parts.join(' · ')}
    </p>
  )
}

// ============================================================================
// EMPTY STATE (E-05)
// ============================================================================

function EmptyRecentSection({ title, message }: { title: string; message: string }) {
  return (
    <div
      className="rounded-xl border flex flex-col items-center justify-center py-8"
      style={{
        background: 'var(--v2-bg-surface)',
        borderColor: 'var(--v2-border-default)',
        padding: 18,
      }}
    >
      <Inbox className="w-7 h-7 mb-2" style={{ color: 'var(--v2-text-hint)', opacity: 0.35 }} />
      <h3 className="text-[12px] font-medium mb-0.5" style={{ color: 'var(--v2-text-hint)' }}>
        {title}
      </h3>
      <p className="text-[11px]" style={{ color: 'var(--v2-text-faint)' }}>
        {message}
      </p>
    </div>
  )
}

// ============================================================================
// PAGE
// ============================================================================

export function Overview() {
  const schoolId = useAppStore((s) => s.activeSchoolId)

  // No-school guard
  if (!schoolId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: 'var(--v2-text-hint)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--v2-text-primary)' }}>Select a School</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--v2-text-hint)' }}>
            Choose a school from the top navigation to view financial data.
          </p>
        </div>
      </div>
    )
  }

  return <FinanceOverviewContent schoolId={schoolId} />
}

function FinanceOverviewContent({ schoolId }: { schoolId: string }) {
  const navigate = useNavigate()
  const data = useFinanceOverviewV2(schoolId)
  const { stagger, fadeInUp } = useMotionVariants()

  const {
    kpi,
    isLoading,
    invoicesByStatus,
    totalInvoiceCount,
    paymentsByGateway,
    totalPaymentCount,
    byFeeType,
    agingReport,
    recentPayments,
    recentInvoices,
    filters,
    setFromDate,
    setToDate,
    setAcademicYear,
    clearFilters,
    hasActiveFilters,
    academicYears,
    handleExportCSV,
    isExporting,
  } = data

  const overdueCount = invoicesByStatus['overdue'] ?? 0

  return (
    <div data-v2 className="p-6 space-y-5" style={{ minHeight: '100vh' }}>
      {/* Compact Header + Insight Strip */}
      <div className="space-y-1">
        <div className="flex items-center justify-between" style={{ height: 44 }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-[7px] flex items-center justify-center"
              style={{ background: 'rgba(29, 158, 117, 0.12)' }}
            >
              <DollarSign className="w-4 h-4" style={{ color: 'var(--v2-brand-primary)' }} />
            </div>
            <h1 className="text-[14px] font-semibold" style={{ color: 'var(--v2-text-primary)' }}>
              Finance
            </h1>
            <span className="text-[11px]" style={{ color: 'var(--v2-text-ghost)' }}>|</span>
            <span className="text-[11px]" style={{ color: 'var(--v2-text-faint)' }}>
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate({ to: '/invoices/bulk-generate' })}
              aria-label="Bulk invoice generation"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-[7px] border transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--v2-brand-primary)]/40"
              style={{
                background: 'var(--v2-bg-elevated)',
                borderColor: 'var(--v2-border-default)',
                color: 'var(--v2-text-secondary)',
              }}
            >
              <FileStack className="w-3.5 h-3.5" />
              Bulk invoice
            </button>
            <button
              onClick={() => navigate({ to: '/payments/record' })}
              aria-label="Record a payment"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-[7px] transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--v2-brand-primary)]/40"
              style={{
                background: 'var(--v2-brand-primary)',
                color: '#fff',
              }}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Record payment
            </button>
          </div>
        </div>

        {/* E-01: Contextual insight strip */}
        <InsightStrip
          totalInvoiced={kpi.totalInvoiced}
          collectionRate={kpi.collectionRate}
          overdueCount={overdueCount}
          isLoading={isLoading}
        />
      </div>

      {/* Filters & Export (with E-04 quick-select pills) */}
      <FilterRow
        fromDate={filters.from || ''}
        toDate={filters.to || ''}
        academicYear={filters.academicYear || ''}
        academicYears={academicYears}
        hasActiveFilters={hasActiveFilters}
        isExporting={isExporting}
        onFromChange={setFromDate}
        onToChange={setToDate}
        onAcademicYearChange={setAcademicYear}
        onClear={clearFilters}
        onExport={handleExportCSV}
      />

      {/* Overdue Alert */}
      <WidgetErrorBoundaryV2>
        <OverdueAlertBanner
          overdue={kpi.overdue}
          overdueCount={overdueCount}
          collectionRate={kpi.collectionRate}
          draftCount={invoicesByStatus['draft'] ?? 0}
          agingReport={agingReport}
        />
      </WidgetErrorBoundaryV2>

      {/* KPI Grid (4 tiles) */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="grid gap-3 grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={fadeInUp}>
          <StatCard
            label="Total Invoiced"
            value={formatNPRCompact(kpi.totalInvoiced)}
            icon={DollarSign}
            accentColor="rgba(29, 158, 117, 0.12)"
            iconColor="var(--v2-brand-primary)"
            barColor="var(--v2-brand-primary)"
            tag={tagPill(`${kpi.totalInvoiceCount} invoices`, 'var(--v2-brand-primary)')}
            loading={isLoading}
          />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <StatCard
            label="Collected"
            value={formatNPRCompact(kpi.totalCollected)}
            icon={TrendingUp}
            accentColor="rgba(29, 158, 117, 0.12)"
            iconColor="#1D9E75"
            barColor="#1D9E75"
            tag={tagPill(`${kpi.currentMonthPaymentCount} payments`, '#1D9E75')}
            hint="this month"
            loading={isLoading}
          />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <StatCard
            label="Outstanding"
            value={formatNPRCompact(kpi.outstanding)}
            icon={Receipt}
            accentColor="rgba(239, 159, 39, 0.12)"
            iconColor="#EF9F27"
            barColor="#EF9F27"
            tag={tagPill(`${kpi.outstandingInvoiceCount} awaiting`, '#EF9F27')}
            loading={isLoading}
          />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <StatCard
            label="Overdue"
            value={formatNPRCompact(kpi.overdue)}
            icon={AlertTriangle}
            accentColor="rgba(226, 75, 74, 0.12)"
            iconColor="#E24B4A"
            barColor="#E24B4A"
            tag={tagPill(`${overdueCount} invoices`, '#E24B4A')}
            loading={isLoading}
            valueColor={kpi.overdue > 0 ? '#E24B4A' : undefined}
          />
        </motion.div>
      </motion.div>

      {/* 2-col: Collection Performance + Billing Health (merged status + aging) */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="grid gap-4 grid-cols-1 md:grid-cols-[1.2fr_1fr]"
      >
        <motion.div variants={fadeInUp}>
          <WidgetErrorBoundaryV2>
            <CollectionPerformanceCard
              totalInvoiced={kpi.totalInvoiced}
              totalCollected={kpi.totalCollected}
              outstanding={kpi.outstanding}
              overdue={kpi.overdue}
              collectionRate={kpi.collectionRate}
              byFeeType={byFeeType}
              isLoading={isLoading}
            />
          </WidgetErrorBoundaryV2>
        </motion.div>
        <motion.div variants={fadeInUp}>
          <WidgetErrorBoundaryV2>
            <BillingHealthCard
              invoicesByStatus={invoicesByStatus}
              totalInvoiceCount={totalInvoiceCount}
              paymentsByGateway={paymentsByGateway}
              totalPaymentCount={totalPaymentCount}
              agingReport={agingReport}
              isLoading={isLoading}
            />
          </WidgetErrorBoundaryV2>
        </motion.div>
      </motion.div>

      {/* 2-col: Recent Payments + Recent Invoices */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="grid gap-4 grid-cols-1 md:grid-cols-2"
      >
        <motion.div variants={fadeInUp}>
          <WidgetErrorBoundaryV2>
            {!isLoading && recentPayments.length === 0 ? (
              <EmptyRecentSection
                title="No payments yet"
                message="Payments will appear here once students start paying."
              />
            ) : (
              <RecentPaymentsCard payments={recentPayments} isLoading={isLoading} />
            )}
          </WidgetErrorBoundaryV2>
        </motion.div>
        <motion.div variants={fadeInUp}>
          <WidgetErrorBoundaryV2>
            {!isLoading && recentInvoices.length === 0 ? (
              <EmptyRecentSection
                title="No invoices yet"
                message="Create invoices to start tracking billing activity."
              />
            ) : (
              <RecentInvoicesCard invoices={recentInvoices} isLoading={isLoading} />
            )}
          </WidgetErrorBoundaryV2>
        </motion.div>
      </motion.div>
    </div>
  )
}
