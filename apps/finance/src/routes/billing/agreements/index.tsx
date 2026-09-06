/**
 * Agreements List Page (FB-2.8)
 *
 * Route: /finance/agreements (finance router basepath `/finance`).
 * Server-paginated list of family-billing agreements with a status preset
 * filter, mirroring the invoices index. Rows navigate to the detail page;
 * the header action opens the create wizard.
 *
 * Nav visibility is gated by billing:manage (shell sidebar, M0 ABAC); the
 * backend 403 surfaces as an empty/error list here — this page does not
 * in-page-gate, matching the invoices convention.
 */

import { useMemo, useState } from 'react'
import {
  TanstackDataTable,
  PageHeader,
  StatBand,
  type StatMetric,
  type ColumnDef,
} from '@edforge/ui'
import { UuidBadge } from '@edforge/archetype'
import { Plus, FileSignature } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from '@edforge/i18n'
import type { Agreement, AgreementStatus } from '@edforge/types'
import {
  useAgreements,
  buildServerPaginationProps,
} from '@edforge/finance-services'
import { useAppStore } from '../../../stores/app.store'
import { useFinanceSettings } from '../../../layouts/FinanceLayout'
import { formatDateDual } from '../../../utils/format-date'
import { FinanceStatusChip } from '../../../components/shared'

type AgreementStatusFilter = '' | AgreementStatus

export default function AgreementsListPage() {
  const { t } = useTranslation('payments')
  const navigate = useNavigate()
  const schoolId = useAppStore((s) => s.activeSchoolId)
  const settings = useFinanceSettings()

  const [statusFilter, setStatusFilter] = useState<AgreementStatusFilter>('')

  const filters = useMemo(
    () => (statusFilter ? { status: statusFilter } : {}),
    [statusFilter],
  )

  const {
    items: agreements,
    isLoading,
    hasMore,
    loadMore,
    isFetchingNextPage,
    totalLoaded,
  } = useAgreements(schoolId ?? '', filters)

  const { serverPagination, isFetching } = buildServerPaginationProps({
    hasMore,
    loadMore,
    isFetchingNextPage,
  })

  const countSuffix = hasMore ? '+' : ''

  const kpi = useMemo(() => {
    const activeCount = agreements.filter((a) => a.status === 'active').length
    const draftCount = agreements.filter((a) => a.status === 'draft').length
    const studentsCovered = new Set(
      agreements.flatMap((a) => a.studentIds),
    ).size
    return { activeCount, draftCount, studentsCovered }
  }, [agreements])

  const columns = useMemo<ColumnDef<Agreement, unknown>[]>(
    () => [
      {
        accessorKey: 'title',
        header: t('agreement.list.title'),
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-[rgb(var(--text-primary))]">
              {row.original.title}
            </div>
            <div className="text-2xs text-[rgb(var(--text-tertiary))]">
              <UuidBadge value={row.original.id} />
            </div>
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'status',
        header: t('agreement.list.type'),
        id: 'agreementType',
        accessorFn: (row) => row.agreementType,
        cell: ({ row }) => (
          <span className="text-[rgb(var(--text-secondary))]">
            {t(`agreement.type.${row.original.agreementType}`)}
          </span>
        ),
        enableSorting: true,
      },
      {
        id: 'students',
        header: t('agreement.list.students'),
        accessorFn: (row) => row.studentIds.length,
        cell: ({ row }) => (
          <span className="text-[rgb(var(--text-secondary))]">
            {t('agreement.list.studentCount', {
              count: row.original.studentIds.length,
            })}
          </span>
        ),
        meta: { align: 'center' as const },
        enableSorting: true,
      },
      {
        id: 'effective',
        header: t('agreement.list.effective'),
        accessorFn: (row) => row.effectiveFrom,
        cell: ({ row }) => (
          <span className="text-[rgb(var(--text-secondary))]">
            {t('agreement.effectivePeriod', {
              from: formatDateDual(row.original.effectiveFrom, settings),
              to: formatDateDual(row.original.effectiveTo, settings),
            })}
          </span>
        ),
        enableSorting: true,
      },
      {
        id: 'coveredFeeTypes',
        header: t('agreement.list.coveredFeeTypes'),
        accessorFn: (row) => row.coveredFeeTypes.join(', '),
        cell: ({ row }) => (
          <span className="text-xs text-[rgb(var(--text-tertiary))]">
            {row.original.coveredFeeTypes.join(', ') || '—'}
          </span>
        ),
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: t('invoices.status'),
        cell: ({ row }) => <FinanceStatusChip status={row.original.status} />,
        meta: { align: 'center' as const },
        enableSorting: true,
      },
    ],
    [t, settings],
  )

  if (!schoolId) {
    return (
      <div className="p-6 text-center text-sm text-[rgb(var(--text-tertiary))]">
        {t('agreement.selectSchool')}
      </div>
    )
  }

  const STATUS_PRESETS = [
    { label: t('agreement.presets.all'), value: '' },
    { label: t('agreement.presets.draft'), value: 'draft' },
    { label: t('agreement.presets.active'), value: 'active' },
    { label: t('agreement.presets.cancelled'), value: 'cancelled' },
    { label: t('agreement.presets.expired'), value: 'expired' },
  ]

  const metrics: StatMetric[] = [
    {
      label: t('agreement.stats.total'),
      value: `${totalLoaded}${countSuffix}`,
      iconSignature: 'finance',
      state: 'normal',
      primary: true,
    },
    {
      label: t('agreement.stats.active'),
      value: `${kpi.activeCount}${countSuffix}`,
      iconSignature: 'overview',
      state: 'normal',
    },
    {
      label: t('agreement.stats.draft'),
      value: `${kpi.draftCount}${countSuffix}`,
      iconSignature: 'finance_receipt',
      state: 'normal',
    },
    {
      label: t('agreement.stats.students'),
      value: `${kpi.studentsCovered}${countSuffix}`,
      iconSignature: 'fees',
      state: 'normal',
    },
  ]

  return (
    <div className="p-6 space-y-5">
      <h1 className="sr-only">{t('agreement.title')}</h1>

      <PageHeader
        mode="pagebar"
        actions={[
          {
            label: t('agreement.create'),
            icon: <Plus className="h-3.5 w-3.5" />,
            primary: true,
            onClick: () => navigate({ to: '/agreements/create' }),
          },
        ]}
      />

      <StatBand metrics={metrics} ariaLabel={t('agreement.stats.total')} />

      <TanstackDataTable<Agreement>
        className="min-h-96"
        columns={columns}
        data={agreements}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        isFetching={isFetching}
        tableId="finance.agreements"
        enableSorting={true}
        pagination={{ pageSize: 20 }}
        pageSizes={[10, 20, 50]}
        defaultSort={[{ id: 'effective', desc: true }]}
        serverPagination={serverPagination}
        searchPlaceholder={t('agreement.list.searchPlaceholder')}
        presets={STATUS_PRESETS}
        activePreset={statusFilter}
        onPresetChange={(v) => setStatusFilter(v as AgreementStatusFilter)}
        onRowClick={(row) =>
          navigate({
            to: '/agreements/$agreementId',
            params: { agreementId: row.id },
          })
        }
        emptyState={{
          icon: (
            <FileSignature className="w-10 h-10 text-[rgb(var(--text-tertiary))] opacity-40" />
          ),
          title: t('agreement.empty'),
          description: t('agreement.list.emptyDescription'),
          action: {
            label: t('agreement.create'),
            onClick: () => navigate({ to: '/agreements/create' }),
          },
        }}
        maxHeight="calc(100vh - 24rem)"
      />
    </div>
  )
}
