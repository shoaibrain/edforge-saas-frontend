/**
 * Admin Invoice Management Page
 *
 * List, filter, generate, issue, and cancel invoices.
 * Supports bulk selection with bulk-issue action and overdue status display.
 * Route: /finance/billing/invoices
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Button,
  TanstackDataTable,
  AttentionCorner,
  AttentionCornerPill,
  AttentionCornerShade,
  SelectionContextBar,
  useSignalAcks,
  type Signal,
  type SelectionAction,
  createSelectColumn,
  createActionsColumn,
  PageHeader,
  StatBand,
  type StatMetric,
  Select,
  type ColumnDef,
} from '@edforge/ui'
import { EntityIdDisplay, UuidBadge } from '@edforge/archetype'
import {
  Plus,
  FileStack,
  FileText,
  Loader2,
  Check,
  X,
  Eye,
  Download,
  Send,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import type { RowSelectionState } from '@tanstack/react-table'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from '@edforge/i18n'
import { useSchoolGradeOptions } from '../../../hooks/useSchoolGradeOptions'
import { useAppStore } from '../../../stores/app.store'
import {
  useInvoicesInfinite,
  useDashboardSummary,
  buildServerPaginationProps,
  useGenerateInvoice,
  useIssueInvoice,
  useCancelInvoice,
  useBulkIssueInvoices,
  useDownloadInvoicePdf,
  useFeeStructures,
  useAcademicYears,
} from '@edforge/finance-services'
import type { Invoice } from '@edforge/types'
import { useCurrency } from '@edforge/types/use-currency'
import { useFinanceSettings } from '../../../layouts/FinanceLayout'
import { formatDateDual } from '../../../utils/format-date'
import { StudentSearchInput } from '../../../components/billing/StudentSearchInput'
import { BulkSendInvoiceReminderDrawer } from '../../../components/billing/BulkSendInvoiceReminderDrawer'
import { BulkPdfExportDrawer } from '../../../components/billing/BulkPdfExportDrawer'
import { FinanceStatusChip } from '../../../components/shared'

type InvoiceStatusFilter = '' | 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled'

/** Statuses the dues reminder applies to — paid/draft/cancelled are skipped. */
const REMINDABLE_STATUSES: Invoice['status'][] = ['overdue', 'issued', 'partially_paid']

/** Calculate how many days overdue an invoice is */
function getOverdueDays(dueDate: string | undefined): number {
  if (!dueDate) return 0
  const due = new Date(dueDate)
  const now = new Date()
  const diffMs = now.getTime() - due.getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

/**
 * Per-row Download PDF icon button (M1.6).
 *
 * Lives as its own component (not inline JSX) so each row gets its OWN
 * `useDownloadInvoicePdf` hook instance — `mutation.isPending` is then
 * naturally scoped per-row. Inline JSX with a single hoisted mutation
 * would make clicking row N's button disable EVERY row's button.
 *
 * Style mirrors the surrounding View/Issue/Cancel icon buttons so the
 * actions column reads as a coherent group.
 */
function InvoiceDownloadIconButton({
  schoolId,
  invoiceId,
  invoiceNumber,
}: {
  schoolId: string
  invoiceId: string
  invoiceNumber?: string | null
}) {
  const downloadInvoice = useDownloadInvoicePdf()
  const { t } = useTranslation('payments')
  const label = t('actions.downloadPdf')
  return (
    <button
      type="button"
      onClick={() =>
        downloadInvoice.mutate({
          schoolId,
          invoiceId,
          invoiceNumber: invoiceNumber ?? undefined,
        })
      }
      disabled={downloadInvoice.isPending}
      className="p-1.5 rounded-md hover:bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-secondary))] disabled:opacity-50 disabled:cursor-not-allowed"
      title={label}
      aria-label={label}
    >
      {downloadInvoice.isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" data-testid={`invoice-download-spinner-${invoiceId}`} />
      ) : (
        <Download className="w-4 h-4" data-testid={`invoice-download-icon-${invoiceId}`} />
      )}
    </button>
  )
}

export default function InvoicesPage() {
  const { t } = useTranslation('payments')
  const navigate = useNavigate()
  const schoolId = useAppStore((s) => s.activeSchoolId)
  const settings = useFinanceSettings()
  const { format, formatCompact } = useCurrency(settings)

  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>('')
  // Sprint B.4 — grade filter routes the backend through GSI14.
  const [gradeFilter, setGradeFilter] = useState('')
  const [showGenerateForm, setShowGenerateForm] = useState(false)

  // Row selection state (controlled by DataTable)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [showBulkIssueConfirm, setShowBulkIssueConfirm] = useState(false)
  const [bulkReminderTarget, setBulkReminderTarget] = useState<Invoice[] | null>(null)
  // Sprint F.5 — bulk PDF export target (selected invoice rows, so the
  // drawer's preflight manifest can aggregate without refetching);
  // null = drawer closed.
  const [bulkPdfExportTarget, setBulkPdfExportTarget] = useState<Invoice[] | null>(null)

  // Cancel dialog state
  const [cancelTarget, setCancelTarget] = useState<{ id: string; invoiceNumber: string } | null>(null)

  // Sprint B-tail: list page opts into the Unknown-grade chip so operators
  // can audit rows the A.5 backfill flagged `gradeLevelResolutionStatus:
  // 'unresolved'` (absent from GSI14; invisible to regular grade chips).
  const { options: gradeOptions } = useSchoolGradeOptions(schoolId ?? null, {
    includeUnknownOption: true,
  })

  const invoiceFilters = useMemo(
    () => ({
      ...(statusFilter && { status: statusFilter as Invoice['status'] }),
      ...(gradeFilter && { gradeLevel: gradeFilter }),
    }),
    [statusFilter, gradeFilter],
  )

  const {
    items: invoices,
    isLoading,
    hasMore,
    loadMore,
    isFetchingNextPage,
    totalLoaded,
  } = useInvoicesInfinite(schoolId ?? '', invoiceFilters)

  const { data: dashboard } = useDashboardSummary(schoolId ?? '')

  const { serverPagination, isFetching } = buildServerPaginationProps({
    hasMore,
    loadMore,
    isFetchingNextPage,
  })

  const issueMutation = useIssueInvoice(schoolId ?? '')
  const cancelMutation = useCancelInvoice(schoolId ?? '')
  const bulkIssueMutation = useBulkIssueInvoices(schoolId ?? '')

  const countSuffix = hasMore ? '+' : ''
  const kpi = useMemo(() => {
    const summary = dashboard
    const overdueCount = summary?.invoicesByStatus?.overdue ?? 0
    const draftCount = summary?.invoicesByStatus?.draft ?? 0
    const paidCount = summary?.invoicesByStatus?.paid ?? 0
    return {
      totalInvoiced: summary?.totalInvoiced ?? 0,
      totalCollected: summary?.totalCollected ?? 0,
      outstanding: summary?.outstanding ?? 0,
      overdue: summary?.overdue ?? 0,
      overdueCount,
      draftCount,
      paidCount,
      collectionRate: summary?.collectionRate ?? 0,
    }
  }, [dashboard])

  // Selected draft invoice IDs for bulk issue
  const selectedDraftIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((id) => rowSelection[id])
      .filter((id) => {
        const inv = invoices.find((i) => i.id === id)
        return inv?.status === 'draft'
      })
  }, [rowSelection, invoices])

  const handleIssue = async (invoiceId: string) => {
    try {
      await issueMutation.mutateAsync(invoiceId)
      toast.success(t('invoices.issueSuccess'))
    } catch {
      toast.error(t('invoices.issueFailed'))
    }
  }

  const openCancelDialog = (invoiceId: string) => {
    const inv = invoices.find((i) => i.id === invoiceId)
    setCancelTarget({
      id: invoiceId,
      invoiceNumber: inv?.invoiceNumber || invoiceId.slice(0, 8),
    })
  }

  const handleConfirmCancel = async (reason: string) => {
    if (!cancelTarget) return
    try {
      await cancelMutation.mutateAsync({ invoiceId: cancelTarget.id, reason })
      toast.success(t('invoices.cancelSuccess'))
      setCancelTarget(null)
    } catch {
      toast.error(t('invoices.cancelFailed'))
    }
  }

  const handleBulkIssue = async () => {
    try {
      const result = await bulkIssueMutation.mutateAsync({ invoiceIds: selectedDraftIds })
      const issued = result.issued ?? selectedDraftIds.length
      const skipped = result.skipped ?? 0
      toast.success(
        skipped > 0
          ? t('invoices.bulkIssueSuccessWithSkipped', { count: issued, skipped })
          : t('invoices.bulkIssueSuccess', { count: issued }),
      )
      setRowSelection({})
      setShowBulkIssueConfirm(false)
    } catch {
      toast.error(t('invoices.bulkIssueFailed'))
      setShowBulkIssueConfirm(false)
    }
  }

  // -- Column definitions --
  const columns = useMemo<ColumnDef<Invoice, unknown>[]>(
    () => [
      createSelectColumn<Invoice>(),
      {
        accessorKey: 'invoiceNumber',
        header: t('invoices.invoiceNumber'),
        cell: ({ row }) => (
          <span className="font-medium text-[rgb(var(--text-primary))]">
            <EntityIdDisplay entity="invoice" data={row.original} variant="inline" />
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'studentName',
        header: t('receipt.studentName'),
        cell: ({ row }) => {
          const invoice = row.original
          return invoice.studentName ? (
            <span className="text-[rgb(var(--text-secondary))]">{invoice.studentName}</span>
          ) : (
            <span className="text-[rgb(var(--text-tertiary))] text-xs">
              <UuidBadge value={invoice.studentId ?? ''} />
            </span>
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: 'grandTotal',
        header: t('lineItems.amount'),
        cell: ({ row }) => (
          <span className="font-medium text-[rgb(var(--text-primary))]">
            {format(row.original.grandTotal, { decimals: 0 })}
          </span>
        ),
        meta: { align: 'right' as const },
        enableSorting: true,
      },
      {
        accessorKey: 'dueDate',
        header: t('invoices.dueDate'),
        cell: ({ row }) => {
          const invoice = row.original
          const overdueDays = invoice.status === 'overdue' ? getOverdueDays(invoice.dueDate) : 0
          return (
            <div className="flex items-center gap-1.5 text-[rgb(var(--text-secondary))]">
              <span>{invoice.dueDate ? formatDateDual(invoice.dueDate, settings) : '-'}</span>
              {invoice.status === 'overdue' && overdueDays > 0 && (
                <span className="inline-flex items-center gap-0.5 text-xs text-[rgb(var(--state-danger-fg))] dark:text-[rgb(var(--state-danger-fg))]">
                  <Clock className="w-3 h-3" />
                  {t('invoices.overdueByDays', { count: overdueDays })}
                </span>
              )}
            </div>
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: 'status',
        header: t('invoices.status'),
        cell: ({ row }) => <FinanceStatusChip status={row.original.status} />,
        meta: { align: 'center' as const },
        enableSorting: true,
      },
      createActionsColumn<Invoice>({
        // Bumped from 120 → 150 to fit the new Download button (M1.6)
        // alongside View / Issue / Cancel without wrapping.
        size: 150,
        cell: ({ row }) => {
          const invoice = row.original
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => navigate({ to: '/invoices/$invoiceId', params: { invoiceId: invoice.id } })}
                className="p-1.5 rounded-md hover:bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-secondary))]"
                title={t('actions.viewInvoice')}
                aria-label={t('actions.viewInvoice')}
              >
                <Eye className="w-4 h-4" />
              </button>
              {/*
                M1.6 — Download PDF per-row action. Always rendered
                (draft invoices download fine — operators sometimes
                send drafts as quotes). Schools without an active
                schoolId hit the same disabled state as the rest of
                the table because `useInvoices` wouldn't have data
                either, so the cell never renders without one.
              */}
              {schoolId && (
                <InvoiceDownloadIconButton
                  schoolId={schoolId}
                  invoiceId={invoice.id}
                  invoiceNumber={invoice.invoiceNumber}
                />
              )}
              {invoice.status === 'draft' && (
                <>
                  <button
                    onClick={() => handleIssue(invoice.id)}
                    disabled={issueMutation.isPending}
                    className="p-1.5 rounded-md hover:bg-[rgb(var(--state-success-bg)/0.18)] text-[rgb(var(--state-success-fg))] dark:hover:bg-[rgb(var(--state-success-bg)/0.18)] "
                    title={t('invoices.issue')}
                    aria-label={t('invoices.issue')}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openCancelDialog(invoice.id)}
                    disabled={cancelMutation.isPending}
                    className="p-1.5 rounded-md hover:bg-[rgb(var(--state-danger-bg)/0.18)] text-[rgb(var(--state-danger-fg))] dark:hover:bg-[rgb(var(--state-danger-bg)/0.18)] dark:text-[rgb(var(--state-danger-fg))]"
                    title={t('actions.cancel')}
                    aria-label={t('actions.cancel')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
              {(invoice.status === 'issued' || invoice.status === 'overdue') && (
                <button
                  onClick={() => openCancelDialog(invoice.id)}
                  disabled={cancelMutation.isPending}
                  className="p-1.5 rounded-md hover:bg-[rgb(var(--state-danger-bg)/0.18)] text-[rgb(var(--state-danger-fg))] dark:hover:bg-[rgb(var(--state-danger-bg)/0.18)] dark:text-[rgb(var(--state-danger-fg))]"
                  title={t('actions.cancel')}
                  aria-label={t('actions.cancel')}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )
        },
      }),
    ],
    [navigate, issueMutation.isPending, cancelMutation.isPending, t, format, settings, schoolId]
  )

  // ── ⑧ Attention Corner signals — page-scoped, from the dashboard summary
  // already fetched (auto-resolve as invoices are issued/collected). Fixes
  // deep-link into this page's own status presets.
  const { acked, ack, unack } = useSignalAcks()
  const signals: Signal[] = useMemo(() => {
    const list: Signal[] = []
    if (kpi.overdueCount > 0) {
      list.push({
        id: 'invoices.overdue',
        severity: 'critical',
        domain: t('headerZone.domains.finance'),
        icon: <Clock className="h-4 w-4" aria-hidden="true" />,
        title: t('invoices.signals.overdueTitle', {
          amount: formatCompact(kpi.overdue),
          count: kpi.overdueCount,
        }),
        description: t('invoices.signals.overdueSub'),
        fix: { label: t('invoices.signals.viewOverdue'), onAction: () => setStatusFilter('overdue') },
      })
    }
    if (kpi.draftCount > 0) {
      list.push({
        id: 'invoices.drafts-ready',
        severity: 'info',
        domain: t('headerZone.domains.finance'),
        icon: <FileText className="h-4 w-4" aria-hidden="true" />,
        title: t('invoices.signals.draftsTitle', { count: kpi.draftCount }),
        description: t('invoices.signals.draftsSub'),
        fix: { label: t('invoices.signals.viewDrafts'), onAction: () => setStatusFilter('draft') },
      })
    }
    return list
  }, [kpi, t, formatCompact])

  // ── ⑨ Selection Context Bar — state-aware money matrix (retires the pill).
  // Issue applies only to selected DRAFTS; Send reminder only to Overdue /
  // Issued / Partially Paid; Download PDF (ZIP) to everything. Confirm
  // handlers receive the applicable ids and feed the existing drawers/confirm.
  const selectedInvoices = useMemo(() => {
    const ids = new Set(Object.keys(rowSelection).filter((id) => rowSelection[id]))
    return invoices.filter((i) => ids.has(i.id))
  }, [rowSelection, invoices])

  const selectionActions = useMemo<SelectionAction[]>(() => {
    const byId = new Map(selectedInvoices.map((i) => [i.id, i]))
    const rowsFor = (ids: string[]) => ids.map((id) => byId.get(id)).filter((i): i is Invoice => !!i)
    const draftIds = selectedInvoices.filter((i) => i.status === 'draft').map((i) => i.id)
    const remindableIds = selectedInvoices
      .filter((i) => REMINDABLE_STATUSES.includes(i.status))
      .map((i) => i.id)
    return [
      {
        id: 'issue',
        label: t('invoices.issue'),
        icon: <Send className="h-3.5 w-3.5" />,
        applicableIds: draftIds,
        disabledReason: t('invoices.selection.noDrafts'),
        onAction: () => setShowBulkIssueConfirm(true),
      },
      {
        id: 'send-reminder',
        label: t('invoices.sendReminder'),
        icon: <Clock className="h-3.5 w-3.5" />,
        applicableIds: remindableIds,
        disabledReason: t('invoices.selection.noneRemindable'),
        onAction: (ids) => setBulkReminderTarget(rowsFor(ids)),
      },
      {
        id: 'pdf-export',
        label: t('invoices.bulkPdfExport.menuLabel'),
        icon: <Download className="h-3.5 w-3.5" />,
        applicableIds: selectedInvoices.map((i) => i.id),
        onAction: (ids) => setBulkPdfExportTarget(rowsFor(Array.from(new Set(ids)))),
      },
    ]
  }, [selectedInvoices, t])

  if (!schoolId) {
    return (
      <div className="p-6 text-center text-sm text-[rgb(var(--text-tertiary))]">
        {t('invoices.selectSchool')}
      </div>
    )
  }

  const STATUS_FILTER_OPTIONS = [
    { label: t('feeStructure.filters.all'), value: '' },
    { label: t('status.draft'), value: 'draft' },
    { label: t('status.issued'), value: 'issued' },
    { label: t('status.partially_paid'), value: 'partially_paid' },
    { label: t('status.paid'), value: 'paid' },
    { label: t('status.overdue'), value: 'overdue' },
    { label: t('status.cancelled'), value: 'cancelled' },
  ]


  // ── StatBand metrics (calm; attention only via state) ────────────────────
  const metrics: StatMetric[] = [
    {
      label: t('overview.kpi.totalInvoiced'),
      value: formatCompact(kpi.totalInvoiced),
      iconSignature: 'finance',
      state: 'normal',
      primary: true,
      sub: t('invoices.loadedInvoices', { count: `${totalLoaded}${countSuffix}` }),
    },
    {
      label: t('overview.kpi.collected'),
      value: formatCompact(kpi.totalCollected),
      iconSignature: 'finance',
      state: 'normal',
      sub: t('invoices.paidCount', { count: kpi.paidCount }),
    },
    {
      label: t('overview.kpi.outstanding'),
      value: formatCompact(kpi.outstanding),
      iconSignature: 'finance_receipt',
      state: 'normal',
      sub: t('invoices.loadedCount', { count: `${totalLoaded}${countSuffix}` }),
    },
    kpi.overdueCount > 0
      ? {
          label: t('overview.kpi.overdue'),
          value: formatCompact(kpi.overdue),
          iconSignature: 'atrisk',
          state: 'critical',
          pill: {
            tone: 'critical',
            text: t('overview.insight.invoiceOverdue', { count: kpi.overdueCount }),
          },
        }
      : {
          label: t('overview.kpi.overdue'),
          value: formatCompact(kpi.overdue),
          iconSignature: 'atrisk',
          state: 'normal',
        },
  ]



  const singleInvoice = selectedInvoices.length === 1 ? selectedInvoices[0] : null
  const selectionBar = (
    <SelectionContextBar
      selectedCount={selectedInvoices.length}
      totalCount={invoices.length}
      onClear={() => setRowSelection({})}
      onSelectAll={() =>
        setRowSelection(Object.fromEntries(invoices.map((i) => [i.id, true])))
      }
      actions={selectionActions}
      aria-label={t('headerZone.selection.aria')}
      labels={{
        selected: (count) => t('headerZone.selection.selected', { count }),
        selectAll: (total) => t('headerZone.selection.selectAll', { count: total }),
        clear: t('headerZone.selection.clear'),
      }}
      peek={
        singleInvoice ? (
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">
              {singleInvoice.invoiceNumber}
            </div>
            <div className="truncate text-2xs text-[rgb(var(--text-tertiary))]">
              {STATUS_FILTER_OPTIONS.find((o) => o.value === singleInvoice.status)?.label ?? singleInvoice.status}
            </div>
          </div>
        ) : undefined
      }
    />
  )

  return (
    <div className="p-6 space-y-5">
      {/* Screen-reader page heading (breadcrumb names the page visually) */}
      <h1 className="sr-only">{t('invoices.title')}</h1>

      {/* ---- ⑧ Header zone — attention pill left, actions right ---- */}
      <AttentionCorner
        signals={signals}
        acked={acked}
        onAck={ack}
        onUnack={unack}
        labels={{
          needAttention: t('headerZone.needAttention'),
          allClear: t('headerZone.allClear'),
          region: t('headerZone.region'),
          minimize: t('headerZone.minimize'),
          acknowledge: t('headerZone.acknowledge'),
          acknowledged: t('headerZone.acknowledged'),
          acknowledgedHint: t('headerZone.acknowledgedHint'),
          dismiss: t('headerZone.dismiss'),
          emptyTitle: t('headerZone.emptyTitle'),
        }}
      >
        {/* One space-y child: the shade's gap lives inside its animated height */}
        <div>
          <PageHeader
            mode="pagebar"
            attention={<AttentionCornerPill />}
            actions={[
              {
                label: t('bulkGenerate.title'),
                icon: <FileStack className="h-3.5 w-3.5" />,
                onClick: () => navigate({ to: '/invoices/bulk-generate' }),
              },
              {
                label: t('invoices.generateInvoice'),
                icon: <Plus className="h-3.5 w-3.5" />,
                primary: true,
                onClick: () => setShowGenerateForm(true),
              },
            ]}
          />
          <AttentionCornerShade className="pt-5" />
        </div>
      </AttentionCorner>

      {/* ---- StatBand — KPI summary (Overdue → critical pill) ---- */}
      <StatBand metrics={metrics} ariaLabel={t('invoices.kpi.region')} />

      {/* DataTable */}
      {Object.keys(rowSelection).some((id) => rowSelection[id]) && hasMore && (
        <p className="text-xs text-[rgb(var(--text-tertiary))]">
          {t('invoices.loadedSelectionOnly', {
            count: `${totalLoaded}${countSuffix}`,
          })}
        </p>
      )}

      <TanstackDataTable<Invoice>
        className="min-h-96"
        columns={columns}
        data={invoices}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        isFetching={isFetching}
        // Status presets + Grade facet drive the server's GSI-backed pagination
        // (`useInvoicesInfinite`) via the unified toolbar's `presets`/`primaryFilter`
        // slots — NOT the client-side `facets` prop, which would double-filter and
        // break the infinite-load contract. Search stays the built-in client filter.
        tableId="finance.invoices"
        enableRowSelection={true}
        enableColumnVisibility
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        enableSorting={true}
        pagination={{ pageSize: 20 }}
        pageSizes={[10, 20, 50]}
        defaultSort={[{ id: 'dueDate', desc: false }]}
        serverPagination={serverPagination}
        searchPlaceholder={t('invoices.searchPlaceholder')}
        presets={STATUS_FILTER_OPTIONS}
        activePreset={statusFilter}
        onPresetChange={(v) => setStatusFilter(v as InvoiceStatusFilter)}
        primaryFilter={
          <Select
            size="sm"
            className="w-40"
            value={gradeFilter}
            onChange={(v) => setGradeFilter(v ?? '')}
            options={gradeOptions}
            buttonClassName="border-[rgb(var(--border-primary)/0.35)]"
          />
        }
        selectionBar={selectionBar}
        exportOptions={{ filename: 'invoices', formats: ['csv'] }}
        emptyState={{
          icon: <FileText className="w-10 h-10 text-[rgb(var(--text-tertiary))] opacity-40" />,
          title: t('invoices.noInvoices'),
          description: t('invoices.generateFirstInvoice'),
          action: {
            label: t('invoices.generateInvoice'),
            onClick: () => setShowGenerateForm(true),
          },
        }}
        maxHeight="calc(100vh - 24rem)"
      />

      {/* Generate Invoice Modal */}
      {showGenerateForm && (
        <GenerateInvoiceModal
          schoolId={schoolId}
          onClose={() => setShowGenerateForm(false)}
        />
      )}

      {/* Bulk Send Reminder Drawer (#236 — D2) */}
      <BulkSendInvoiceReminderDrawer
        open={!!bulkReminderTarget}
        invoices={bulkReminderTarget ?? []}
        schoolId={schoolId}
        onClose={() => setBulkReminderTarget(null)}
        onComplete={() => setRowSelection({})}
      />

      {/* Sprint F.5 — Bulk PDF Export Drawer (right-side sibling of
          BulkSendInvoiceReminderDrawer + BulkSendReceiptsDrawer et al) */}
      {bulkPdfExportTarget && (
        <BulkPdfExportDrawer
          open={!!bulkPdfExportTarget}
          onClose={() => setBulkPdfExportTarget(null)}
          onComplete={() => setRowSelection({})}
          schoolId={schoolId ?? ''}
          invoices={bulkPdfExportTarget}
        />
      )}

      {/* Bulk Issue Confirmation Modal */}
      <AnimatePresence>
        {showBulkIssueConfirm && (
          <BulkIssueConfirmModal
            count={selectedDraftIds.length}
            isPending={bulkIssueMutation.isPending}
            onConfirm={handleBulkIssue}
            onCancel={() => setShowBulkIssueConfirm(false)}
          />
        )}
      </AnimatePresence>

      {/* Cancel Invoice Dialog */}
      <AnimatePresence>
        {cancelTarget && (
          <CancelInvoiceDialog
            invoiceNumber={cancelTarget.invoiceNumber}
            isPending={cancelMutation.isPending}
            onConfirm={handleConfirmCancel}
            onClose={() => setCancelTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// CANCEL INVOICE DIALOG
// ============================================================================

function CancelInvoiceDialog({
  invoiceNumber,
  isPending,
  onConfirm,
  onClose,
}: {
  invoiceNumber: string
  isPending: boolean
  onConfirm: (reason: string) => void
  onClose: () => void
}) {
  const { t } = useTranslation('payments')
  const [reason, setReason] = useState('')

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) onClose()
    },
    [isPending, onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(var(--background-overlay)/0.40)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[rgb(var(--background-primary))] rounded-xl shadow-xl w-full max-w-sm p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-invoice-title"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-full bg-[rgb(var(--state-danger-bg)/0.18)] ">
            <AlertTriangle className="w-5 h-5 text-[rgb(var(--state-danger-fg))] dark:text-[rgb(var(--state-danger-fg))]" />
          </div>
          <div>
            <h3 id="cancel-invoice-title" className="text-base font-semibold text-[rgb(var(--text-primary))]">
              {t('invoices.cancelTitle', { invoiceNumber })}
            </h3>
            <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">
              {t('invoices.cancelDescriptionPrefix')}{' '}
              <span className="font-semibold text-[rgb(var(--state-danger-fg))] dark:text-[rgb(var(--state-danger-fg))]">
                {t('invoices.irreversible')}
              </span>
              . {t('invoices.cancelDescriptionSuffix')}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
            {t('invoices.cancelReason')}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('invoices.cancelReasonPlaceholder')}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] resize-none focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            {t('invoices.keepInvoice')}
          </Button>
          <Button
            onClick={() => onConfirm(reason.trim())}
            disabled={isPending || !reason.trim()}
            className="bg-[rgb(var(--action-danger-bg))] hover:brightness-95 text-[rgb(var(--action-primary-fg))]"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <X className="w-4 h-4 mr-1.5" />
            )}
            {t('invoices.cancelInvoice')}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

// ============================================================================
// BULK ISSUE CONFIRMATION MODAL
// ============================================================================

function BulkIssueConfirmModal({
  count,
  isPending,
  onConfirm,
  onCancel,
}: {
  count: number
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const { t } = useTranslation('payments')
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isPending, onCancel])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(var(--background-overlay)/0.40)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[rgb(var(--background-primary))] rounded-xl shadow-xl w-full max-w-sm p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-issue-title"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-full bg-[rgb(var(--state-info-bg)/0.18)] ">
            <Send className="w-5 h-5 text-[rgb(var(--state-info-fg))] dark:text-[rgb(var(--state-info-fg))]" />
          </div>
          <div>
            <h3 id="bulk-issue-title" className="text-base font-semibold text-[rgb(var(--text-primary))]">
              {t('invoices.bulkIssueTitle', { count })}
            </h3>
            <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">
              {t('invoices.bulkIssueDescription')}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isPending}>
            {t('actions.cancel')}
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <Check className="w-4 h-4 mr-1.5" />
            )}
            {t('invoices.issueCountInvoices', { count })}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

// ============================================================================
// GENERATE INVOICE MODAL
// ============================================================================

function GenerateInvoiceModal({
  schoolId,
  onClose,
}: {
  schoolId: string
  onClose: () => void
}) {
  const { t } = useTranslation('payments')
  const finSettings = useFinanceSettings()
  const { format: formatCurr } = useCurrency(finSettings)
  const generateMutation = useGenerateInvoice(schoolId)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !generateMutation.isPending) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, generateMutation.isPending])

  const { data: feeStructureData } = useFeeStructures(schoolId)
  const { data: academicYearsData } = useAcademicYears(schoolId)
  const feeStructures = Array.isArray(feeStructureData) ? feeStructureData : []

  // Filter to active/planning years, sorted most recent first
  const academicYears = useMemo(() => {
    const raw = Array.isArray(academicYearsData) ? academicYearsData : []
    return raw
      .filter((y) => y.status === 'active' || y.status === 'planning')
      .sort((a, b) => b.startDate.localeCompare(a.startDate))
  }, [academicYearsData])

  const [selectedStudent, setSelectedStudent] = useState<{ studentId: string; studentName: string } | null>(null)
  const [selectedFees, setSelectedFees] = useState<string[]>([])
  const [dueDate, setDueDate] = useState('')
  const [academicYear, setAcademicYear] = useState('')

  // Auto-select current academic year
  useEffect(() => {
    if (!academicYear && academicYears.length > 0) {
      const current = academicYears.find((y) => y.isCurrent)
      setAcademicYear(current?.name ?? academicYears[0].name)
    }
  }, [academicYears, academicYear])
  const [billingPeriod, setBillingPeriod] = useState('')
  const [notes, setNotes] = useState('')

  const selectedFeeStructures = feeStructures.filter((f: any) => selectedFees.includes(f.id))
  const subtotal = selectedFeeStructures.reduce((sum: number, f: any) => sum + (f.amount || 0), 0)
  const taxTotal = selectedFeeStructures.reduce(
    (sum: number, f: any) => sum + ((f.amount || 0) * (f.taxRate || 0)) / 100,
    0
  )
  const grandTotal = subtotal + taxTotal

  const handleSubmit = async () => {
    if (!selectedStudent || selectedFees.length === 0 || !dueDate || !academicYear) {
      toast.error(t('invoices.requiredFields'))
      return
    }
    try {
      await generateMutation.mutateAsync({
        studentId: selectedStudent.studentId,
        feeStructureIds: selectedFees,
        dueDate,
        academicYear,
        billingPeriod: billingPeriod || undefined,
        notes: notes || undefined,
      })
      toast.success(t('invoices.generated'))
      onClose()
    } catch {
      toast.error(t('invoices.generateFailed'))
    }
  }

  const toggleFee = (feeId: string) => {
    setSelectedFees((prev) =>
      prev.includes(feeId) ? prev.filter((id) => id !== feeId) : [...prev, feeId]
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(var(--background-overlay)/0.40)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[rgb(var(--background-primary))] rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="generate-invoice-title"
      >
        <h2 id="generate-invoice-title" className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-4">
          {t('invoices.generateInvoice')}
        </h2>

        <div className="space-y-4">
          {/* Student */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
              {t('invoices.studentRequired')}
            </label>
            <StudentSearchInput
              schoolId={schoolId}
              value={selectedStudent}
              onChange={setSelectedStudent}
            />
          </div>

          {/* Fee Structures */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
              {t('invoices.feeStructuresRequired')}
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-[rgb(var(--border-primary))] rounded-lg p-2">
              {feeStructures.length === 0 ? (
                <p className="text-xs text-[rgb(var(--text-tertiary))] p-2">
                  {t('feeStructure.noFeeStructures')}
                </p>
              ) : (
                feeStructures.map((fee: any) => (
                  <label
                    key={fee.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[rgb(var(--background-secondary))] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFees.includes(fee.id)}
                      onChange={() => toggleFee(fee.id)}
                      className="rounded border-[rgb(var(--border-primary))]"
                    />
                    <span className="flex-1 text-sm text-[rgb(var(--text-primary))]">{fee.name}</span>
                    <span className="text-sm font-medium text-[rgb(var(--text-secondary))]">
                      {formatCurr(fee.amount)}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Academic Year + Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <Select
              label={t('feeStructure.fields.academicYear')}
              required
              value={academicYear}
              onChange={(v) => setAcademicYear(v ?? '')}
              placeholder={t('invoices.selectAcademicYear')}
              options={academicYears.map((y) => ({
                value: y.name,
                label: `${y.name}${y.isCurrent ? ` (${t('feeStructure.academicYearStatus.current')})` : ''}`,
              }))}
            />
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
                {t('invoices.dueDateRequired')}
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))]"
              />
            </div>
          </div>

          {/* Billing Period */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
              {t('invoices.billingPeriod')}
            </label>
            <input
              type="text"
              value={billingPeriod}
              onChange={(e) => setBillingPeriod(e.target.value)}
              placeholder={t('invoices.billingPeriodPlaceholder')}
              className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
              {t('invoices.notes')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] resize-none"
            />
          </div>

          {/* Totals Preview */}
          {selectedFees.length > 0 && (
            <div className="bg-[rgb(var(--background-secondary))] rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-sm text-[rgb(var(--text-secondary))]">
                <span>{t('summary.subtotal')}</span>
                <span>{formatCurr(subtotal)}</span>
              </div>
              {taxTotal > 0 && (
                <div className="flex justify-between text-sm text-[rgb(var(--text-secondary))]">
                  <span>{t('summary.taxTotal')}</span>
                  <span>{formatCurr(taxTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold text-[rgb(var(--text-primary))] border-t border-[rgb(var(--border-primary))] pt-1">
                <span>{t('summary.grandTotal')}</span>
                <span>{formatCurr(grandTotal)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            {t('actions.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : null}
            {t('invoices.generateInvoice')}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
