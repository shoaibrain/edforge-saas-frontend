import { useCallback, useMemo } from 'react'
import {
  normalizeLocaleCode,
  useTranslation,
  type LocaleCode,
} from '@edforge/i18n'
import type { DataTableExportFormat, DataTableLabels } from '@edforge/ui'

const DATE_FALLBACK = '—'

function humanizeEnum(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export function useAcademicsI18n() {
  const { t, i18n } = useTranslation('academics')
  const locale = normalizeLocaleCode(i18n.language) as LocaleCode

  const formatNumber = useCallback(
    (value: number) => new Intl.NumberFormat(locale).format(value),
    [locale],
  )

  const formatDate = useCallback(
    (
      value: string | Date | null | undefined,
      options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      },
    ) => {
      if (!value) return DATE_FALLBACK
      const date = value instanceof Date ? value : new Date(value)
      if (Number.isNaN(date.getTime())) return DATE_FALLBACK
      return new Intl.DateTimeFormat(locale, options).format(date)
    },
    [locale],
  )

  const formatDateTime = useCallback(
    (value: string | Date | null | undefined) =>
      formatDate(value, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [formatDate],
  )

  const enumLabel = useCallback(
    (keyPrefix: string, value: string | null | undefined) => {
      if (!value) return DATE_FALLBACK
      return t(`${keyPrefix}.${value}`, { defaultValue: humanizeEnum(value) })
    },
    [t],
  )

  const dataTableLabels = useMemo<DataTableLabels>(
    () => ({
      errorTitle: t('dataTable.errorTitle'),
      errorDescription: t('dataTable.errorDescription'),
      retry: t('dataTable.retry'),
      clearSearch: t('dataTable.clearSearch'),
      clearFilters: t('dataTable.clearFilters'),
      clearActiveFilters: (count) => t('dataTable.clearActiveFilters', { count }),
      clearSelection: t('dataTable.clearSelection'),
      selectedRows: (count) => t('dataTable.selectedRows', { count }),
      paginationShowing: (start, end, total) =>
        t('dataTable.paginationShowing', { start, end, total }),
      rowsPerPage: (size) => t('dataTable.rowsPerPage', { size }),
      previousPage: t('dataTable.previousPage'),
      nextPage: t('dataTable.nextPage'),
      loadingPage: t('dataTable.loadingPage'),
      rowDensity: t('dataTable.rowDensity'),
      comfortableDensity: t('dataTable.comfortableDensity'),
      comfortableDensityTitle: t('dataTable.comfortableDensityTitle'),
      compactDensity: t('dataTable.compactDensity'),
      compactDensityTitle: t('dataTable.compactDensityTitle'),
      viewOptions: t('dataTable.viewOptions'),
      toggleColumns: t('dataTable.toggleColumns'),
      export: t('dataTable.export'),
      exportFormat: (format: DataTableExportFormat) =>
        t(`dataTable.exportFormats.${format}`),
      xlsxUnavailable: t('dataTable.xlsxUnavailable'),
      filterAriaLabel: (title) => t('dataTable.filterAriaLabel', { title }),
      clearFilter: t('dataTable.clearFilter'),
    }),
    [t],
  )

  return {
    t,
    i18n,
    locale,
    dataTableLabels,
    formatNumber,
    formatDate,
    formatDateTime,
    enumLabel,
  }
}
