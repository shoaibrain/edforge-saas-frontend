/**
 * useFinanceOverviewV2 — Data hook for the V2 Finance Overview
 *
 * Wraps existing finance-services hooks and structures all data
 * needed by the V2 page components.
 */

import { useState, useMemo } from 'react'
import {
  useDashboardSummary,
  useFeeStructures,
  useExportInvoicesCsv,
} from '@edforge/finance-services'
import { toast } from 'sonner'
import { useTranslation } from '@edforge/i18n'
import type { DashboardSummary } from '@edforge/types'

// ============================================================================
// TYPES
// ============================================================================

export interface FinanceV2Filters {
  from?: string
  to?: string
  academicYear?: string
}

export interface FinanceV2Data {
  // Raw summary
  summary: DashboardSummary | null
  isLoading: boolean
  isError: boolean

  // KPIs
  kpi: {
    totalInvoiced: number
    totalCollected: number
    outstanding: number
    overdue: number
    collectionRate: number
    totalInvoiceCount: number
    currentMonthPaymentCount: number
    outstandingInvoiceCount: number
  }

  // Invoice status breakdown
  invoicesByStatus: Record<string, number>
  totalInvoiceCount: number

  // Payment methods breakdown
  paymentsByGateway: Record<string, number>
  totalPaymentCount: number

  // Fee type breakdown (the fixed version)
  byFeeType: Array<{
    feeType: string
    invoiceCount: number
    totalAmount: number
    collectedAmount: number
  }>

  // Aging report
  agingReport: Array<{
    label: string
    minDays: number
    maxDays: number | null
    count: number
    amount: number
  }>

  // Recent activity
  recentPayments: Array<{
    id: string
    amount: number
    gateway: string
    status: string
    receiptNumber?: string
    paidAt?: string
    createdAt: string
  }>
  recentInvoices: Array<{
    id: string
    invoiceNumber: string
    studentName: string
    grandTotal: number
    amountDue: number
    status: string
    issuedDate: string
    createdAt: string
  }>

  // Filters
  filters: FinanceV2Filters
  setFromDate: (v: string) => void
  setToDate: (v: string) => void
  setAcademicYear: (v: string) => void
  clearFilters: () => void
  hasActiveFilters: boolean

  // Academic years for filter dropdown
  academicYears: string[]

  // Family-billing (FB-5.5) — agreement-coverage rollup (null until agreements exist).
  agreementCoverage: DashboardSummary['agreementCoverage'] | null

  // Export
  handleExportCSV: () => void
  isExporting: boolean
}

// ============================================================================
// HOOK
// ============================================================================

export function useFinanceOverviewV2(schoolId: string): FinanceV2Data {
  const { t } = useTranslation('payments')
  // Filter state
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [academicYear, setAcademicYear] = useState('')

  const filters = useMemo(() => {
    const f: FinanceV2Filters = {}
    if (fromDate) f.from = fromDate
    if (toDate) f.to = toDate
    if (academicYear) f.academicYear = academicYear
    return Object.keys(f).length > 0 ? f : undefined
  }, [fromDate, toDate, academicYear])

  // Data queries
  const { data: summary, isLoading, isError } = useDashboardSummary(schoolId, filters as any)
  const { data: feeStructures } = useFeeStructures(schoolId)
  const exportCsvMutation = useExportInvoicesCsv()

  // Academic years from fee structures
  const academicYears = useMemo(() => {
    if (!feeStructures) return []
    const years = new Set(
      (feeStructures as any[]).map((f: any) => f.academicYear).filter(Boolean)
    )
    return [...years].sort().reverse() as string[]
  }, [feeStructures])

  // Typed summary
  const s = summary as DashboardSummary | undefined

  // Derived data
  const invoicesByStatus = s?.invoicesByStatus ?? {}
  const totalInvoiceCount = Object.values(invoicesByStatus).reduce((a, b) => a + b, 0)

  const paymentsByGateway = s?.paymentsByGateway ?? {}
  const totalPaymentCount = Object.values(paymentsByGateway).reduce((a, b) => a + b, 0)

  const byFeeType = s?.byFeeType ?? []
  const agingReport = s?.agingReport ?? []
  const recentPayments = s?.recentPayments ?? []
  const recentInvoices = s?.recentInvoices ?? []

  // KPI derivations
  const outstandingInvoiceCount =
    (invoicesByStatus['overdue'] ?? 0) +
    (invoicesByStatus['issued'] ?? 0) +
    (invoicesByStatus['partially_paid'] ?? 0)
  const currentMonthPaymentCount = s?.monthlyCollections?.[0]?.paymentCount ?? totalPaymentCount

  // Export handler
  const handleExportCSV = () => {
    exportCsvMutation.mutate(schoolId, {
      onSuccess: () => toast.success(t('overview.export.success')),
      onError: () => toast.error(t('overview.export.failed')),
    })
  }

  return {
    summary: s ?? null,
    isLoading,
    isError,
    kpi: {
      totalInvoiced: s?.totalInvoiced ?? 0,
      totalCollected: s?.totalCollected ?? 0,
      outstanding: s?.outstanding ?? 0,
      overdue: s?.overdue ?? 0,
      collectionRate: s?.collectionRate ?? 0,
      totalInvoiceCount,
      currentMonthPaymentCount,
      outstandingInvoiceCount,
    },
    invoicesByStatus,
    totalInvoiceCount,
    paymentsByGateway,
    totalPaymentCount,
    byFeeType,
    agingReport,
    recentPayments,
    recentInvoices,
    filters: { from: fromDate, to: toDate, academicYear } as FinanceV2Filters,
    setFromDate,
    setToDate,
    setAcademicYear,
    clearFilters: () => { setFromDate(''); setToDate(''); setAcademicYear('') },
    hasActiveFilters: !!(fromDate || toDate || academicYear),
    academicYears,
    agreementCoverage: s?.agreementCoverage ?? null,
    handleExportCSV,
    isExporting: exportCsvMutation.isPending,
  }
}
