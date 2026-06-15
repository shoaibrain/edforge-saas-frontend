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
import { StatCard, WidgetErrorBoundaryV2, ContextBar } from '@edforge/ui'
import { useCurrency } from '@edforge/types/use-currency'
import { useFinanceSettings } from '../layouts/FinanceLayout'

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
  formatShort,
}: {
  totalInvoiced: number
  collectionRate: number
  overdueCount: number
  isLoading: boolean
  formatShort: (amount: number) => string
}) {
  if (isLoading) {
    return (
      <div className="h-5 w-3/5 rounded-lg v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
    )
  }

  if (totalInvoiced === 0) return null

  const parts: string[] = [
    `${formatShort(totalInvoiced)} invoiced`,
    `${collectionRate.toFixed(1)}% collected`,
  ]
  if (overdueCount > 0) {
    parts.push(`${overdueCount} invoice${overdueCount !== 1 ? 's' : ''} overdue`)
  } else {
    parts.push('no overdue')
  }

  return (
    <p className="text-xs leading-relaxed text-[rgb(var(--text-tertiary))]">
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
      // allow-presentation-style: card padding (18px) is off the 4px scale
      className="rounded-xl border flex flex-col items-center justify-center py-8 bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary)/0.35)]"
      style={{ padding: 18 }}
    >
      <Inbox className="w-7 h-7 mb-2 opacity-35 text-[rgb(var(--text-tertiary))]" />
      <h3 className="text-xs font-medium mb-0.5 text-[rgb(var(--text-tertiary))]">
        {title}
      </h3>
      <p className="text-xs text-[rgb(var(--text-disabled))]">
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
          <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-30 text-[rgb(var(--text-tertiary))]" />
          <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Select a School</h2>
          <p className="text-sm mt-1 text-[rgb(var(--text-tertiary))]">
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
  const settings = useFinanceSettings()
  const { formatCompact, formatShort } = useCurrency(settings)

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
    <div className="p-6 space-y-5" style={{ minHeight: '100vh' }}>
      {/* Context Bar (operating context, not a page title — the shell breadcrumb
          carries "Finance") + Insight Strip */}
      <h1 className="sr-only">Finance</h1>
      <ContextBar
        meta={
          <span>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        }
        description={
          <InsightStrip
            totalInvoiced={kpi.totalInvoiced}
            collectionRate={kpi.collectionRate}
            overdueCount={overdueCount}
            isLoading={isLoading}
            formatShort={formatShort}
          />
        }
        actions={
          <>
            <button
              onClick={() => navigate({ to: '/invoices/bulk-generate' })}
              aria-label="Bulk invoice generation"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[7px] border transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus))]/40 bg-[rgb(var(--background-tertiary))] border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-secondary))]"
            >
              <FileStack className="w-3.5 h-3.5" />
              Bulk invoice
            </button>
            <button
              onClick={() => navigate({ to: '/payments/record' })}
              aria-label="Record a payment"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[7px] transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus))]/40 bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))]"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Record payment
            </button>
          </>
        }
      />

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
            value={formatCompact(kpi.totalInvoiced)}
            icon={DollarSign}
            accentColor="rgba(29, 158, 117, 0.12)"
            iconColor="#1D9E75"
            barColor="#1D9E75"
            tag={tagPill(`${kpi.totalInvoiceCount} invoices`, '#1D9E75')}
            loading={isLoading}
          />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <StatCard
            label="Collected"
            value={formatCompact(kpi.totalCollected)}
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
            value={formatCompact(kpi.outstanding)}
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
            value={formatCompact(kpi.overdue)}
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

      {/* 2-col: Billing Health (primary) + Collection Performance */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="grid gap-4 grid-cols-1 md:grid-cols-[1fr_1.2fr]"
      >
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
